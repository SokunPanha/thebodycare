import "server-only";

import { createHash } from "node:crypto";

import { generationConfig } from "@/config/generation";
import { saveCover } from "@/features/posts";
import { embeddingCost, groundingCost } from "@/lib/ai/costs";
import { embed, toVector } from "@/lib/ai/embed";
import { generateCoverImage, isImageGenerationConfigured } from "@/lib/ai/image";
import { embeddingModel, imageModels, textModels } from "@/lib/ai/models";
import { readingTime } from "@/lib/utils/reading-time";
import { slugify } from "@/lib/utils/slug";

import { COVER_PROMPT_VERSION, coverImageAlt, coverImagePrompt } from "./prompts/v2/cover-image";
import { DRAFT_PROMPT_VERSION, type DraftBrief } from "./prompts/v1/draft-article";
import {
  cellPriority,
  claimCell,
  exactDuplicate,
  finishRun,
  insertTopic,
  logCoverRun,
  nearestContent,
  persistDraft,
  rejectTopic,
  relatedPublished,
  releaseCell,
  spendTodayUsd,
  startRun,
  type ClaimedCell,
  type PipelineDb,
} from "./queries";
import type { SourcedDraft } from "./schema";
import { decideSemantic, describeRejection, type DedupVerdict } from "./steps/check-duplicate";
import { checkPage, collectSources, type PageCheck } from "./steps/collect-sources";
import { bodyMarkdown, draftWithGemini, withKnownLinks, type Drafter } from "./steps/draft-article";
import { guardScope, type GuardResult } from "./steps/guard-scope";

// The generation pipeline (MVP.md M4.10): one call = up to `postsPerDay` drafts, each landing in
// the review queue (or published, if GENERATION_AUTO_PUBLISH). Every external dependency is
// injectable — TESTING.md §4 runs this real pipeline against a fake model.

export type PipelineDeps = {
  draft: Drafter;
  guard: (draft: SourcedDraft) => Promise<GuardResult>;
  embed: (texts: string[]) => Promise<number[][]>;
  checkPage: PageCheck;
  /** Returns null when covers aren't configured. */
  cover: ((prompt: string) => Promise<Buffer>) | null;
};

export const defaultDeps = (): PipelineDeps => ({
  draft: draftWithGemini,
  guard: (draft) => guardScope(draft),
  embed,
  checkPage,
  cover: isImageGenerationConfigured() ? generateCoverImage : null,
});

export type PipelineOptions = {
  posts?: number;
  autoPublish?: boolean;
  dailyCapUsd?: number;
  topicThreshold?: number;
  bodyThreshold?: number;
  /** Stop starting new articles after this many ms (the cron has a 300s function limit). */
  budgetMs?: number;
};

export type ArticleOutcome =
  | {
      status: "success";
      runId: string;
      postId: string;
      slug: string;
      costUsd: number;
      cover: boolean;
    }
  | { status: "rejected"; runId: string; step: string; reason: string; costUsd: number }
  | { status: "failed"; runId: string; step: string; error: string; costUsd: number }
  | { status: "skipped"; reason: string };

class Stop extends Error {
  constructor(
    readonly outcome: "rejected" | "failed" | "skipped",
    readonly step: string,
    message: string,
  ) {
    super(message);
  }
}

/** Tracks one article's spend, and refuses any call that would start past the daily cap. */
class Meter {
  spent = 0;
  tokensIn = 0;
  tokensOut = 0;
  constructor(
    private readonly spentBefore: number,
    private readonly cap: number,
  ) {}
  /** Called BEFORE every model call (MVP.md §5: "checked before every call, not after"). */
  assert(step: string) {
    if (this.spentBefore + this.spent >= this.cap) {
      throw new Stop("skipped", step, `Daily cost cap reached ($${this.cap.toFixed(2)}).`);
    }
  }
  add(costUsd: number, tokensIn = 0, tokensOut = 0) {
    this.spent += costUsd;
    this.tokensIn += tokensIn;
    this.tokensOut += tokensOut;
  }
}

const topicText = (cell: ClaimedCell) =>
  `${cell.target_query}. ${cell.subtopic} — ${cell.angle.replaceAll("-", " ")}, for ${cell.audience}.`;

export async function runPipeline(
  db: PipelineDb,
  deps: PipelineDeps = defaultDeps(),
  options: PipelineOptions = {},
): Promise<ArticleOutcome[]> {
  const {
    posts = generationConfig.postsPerDay,
    autoPublish = generationConfig.autoPublish,
    dailyCapUsd = generationConfig.dailyCostCapUsd,
    topicThreshold = generationConfig.dedupe.topicThreshold,
    bodyThreshold = generationConfig.dedupe.bodyThreshold,
    budgetMs = 240_000,
  } = options;
  const started = Date.now();
  const outcomes: ArticleOutcome[] = [];

  for (let i = 0; i < posts; i++) {
    if (Date.now() - started > budgetMs) {
      outcomes.push({ status: "skipped", reason: "Out of time for this run." });
      break;
    }
    const outcome = await runOne(db, deps, {
      autoPublish,
      dailyCapUsd,
      topicThreshold,
      bodyThreshold,
    });
    outcomes.push(outcome);
    // A lock, an exhausted matrix or a spent budget won't clear within this run.
    if (outcome.status === "skipped") break;
  }
  return outcomes;
}

async function runOne(
  db: PipelineDb,
  deps: PipelineDeps,
  o: { autoPublish: boolean; dailyCapUsd: number; topicThreshold: number; bodyThreshold: number },
): Promise<ArticleOutcome> {
  const spentBefore = await spendTodayUsd(db);
  if (spentBefore >= o.dailyCapUsd) {
    return { status: "skipped", reason: `Daily cost cap reached ($${o.dailyCapUsd.toFixed(2)}).` };
  }

  const runId = await startRun(db, textModels.draft, DRAFT_PROMPT_VERSION);
  if (!runId) return { status: "skipped", reason: "Another generation run is in progress." };

  const meter = new Meter(spentBefore, o.dailyCapUsd);
  const runStarted = Date.now();
  let step = "select-topic";
  let cell: ClaimedCell | null = null;
  let topicId: string | null = null;

  const close = async (
    status: "success" | "rejected" | "failed" | "skipped",
    extra: Record<string, unknown> = {},
  ) =>
    finishRun(db, runId, {
      status,
      tokens_in: meter.tokensIn,
      tokens_out: meter.tokensOut,
      cost_usd: Number(meter.spent.toFixed(6)),
      duration_ms: Date.now() - runStarted,
      ...(topicId ? { topic_id: topicId } : {}),
      ...extra,
    });

  try {
    // 1. Topic — the best open matrix cell, claimed atomically (M4.5).
    cell = await claimCell(db);
    if (!cell) throw new Stop("skipped", step, "No open cells left in the topic matrix.");

    // 2. Gate 1 — exact title/slug.
    step = "check-duplicate";
    const exact = await exactDuplicate(db, cell.target_query, slugify(cell.target_query));

    // 3. Gate 2 — semantic topic.
    meter.assert(step);
    const [topicVector] = await deps.embed([topicText(cell)]);
    meter.add(embeddingCost(topicText(cell).length));
    const topicEmbedding = toVector(topicVector!);
    topicId = await insertTopic(db, {
      matrix_id: cell.id,
      topic: cell.target_query,
      target_keyword: cell.target_query,
      embedding: topicEmbedding,
    });
    const topicVerdict: DedupVerdict = exact
      ? { ok: false, reason: exact, nearest: null, score: null }
      : decideSemantic(
          // The new topic row itself is in the queue now — exclude it.
          (await nearestContent(db, topicEmbedding, true)).filter((n) => n.id !== topicId),
          o.topicThreshold,
          "semantic_topic",
        );
    if (!topicVerdict.ok) {
      await rejectTopic(
        db,
        topicId,
        describeRejection(topicVerdict),
        topicVerdict.score ?? undefined,
      );
      await releaseCell(db, cell.id, "exhausted"); // already covered — don't pick it again
      await close("rejected", { step });
      return { status: "rejected", runId, step, reason: topicVerdict.reason, costUsd: meter.spent };
    }

    // 4. Draft, grounded (M4.7), with related posts to link to (M4.12).
    step = "draft-article";
    const related = await relatedPublished(db, topicEmbedding, 4);
    const brief: DraftBrief = {
      category: cell.category_name,
      subtopic: cell.subtopic,
      angle: cell.angle,
      audience: cell.audience,
      format: cell.format,
      targetQuery: cell.target_query,
      related: related.map((p) => ({ title: p.title, slug: p.slug })),
    };
    const allowedSlugs = new Set(related.map((p) => p.slug));

    const draftOnce = async (avoid?: DraftBrief["avoid"]) => {
      meter.assert(step);
      const result = await deps.draft({ ...brief, avoid });
      meter.add(
        result.costUsd +
          groundingCost(
            Math.max(1, result.searchQueries),
            generationConfig.groundingCostPerQueryUsd,
          ),
        result.tokensIn,
        result.tokensOut,
      );
      step = "collect-sources";
      const sources = await collectSources(result.response, { check: deps.checkPage });
      const draft: SourcedDraft = { ...withKnownLinks(result.draft, allowedSlugs), sources };
      step = "check-duplicate";
      meter.assert(step);
      const body = bodyMarkdown(draft);
      const [bodyVector] = await deps.embed([body]);
      meter.add(embeddingCost(body.length));
      const bodyEmbedding = toVector(bodyVector!);
      // Gate 3 compares against articles only — the topic queue holds topics, not bodies.
      const verdict = decideSemantic(
        await nearestContent(db, bodyEmbedding, false),
        o.bodyThreshold,
        "semantic_body",
      );
      return { draft, body, bodyEmbedding, verdict };
    };

    // 5. Gate 3 — semantic body. One rewrite with the near-duplicate as "don't overlap", then
    // reject (PLAN.md §7, TESTING.md D8).
    let attempt = await draftOnce();
    if (!attempt.verdict.ok && attempt.verdict.nearest) {
      step = "draft-article";
      const n = attempt.verdict.nearest;
      attempt = await draftOnce({ title: n.title, excerpt: n.excerpt ?? "" });
    }
    if (!attempt.verdict.ok) {
      await rejectTopic(
        db,
        topicId,
        describeRejection(attempt.verdict),
        attempt.verdict.score ?? undefined,
      );
      await releaseCell(db, cell.id, "exhausted");
      await close("rejected", { step: "check-duplicate" });
      return {
        status: "rejected",
        runId,
        step: "check-duplicate",
        reason: "semantic_body",
        costUsd: meter.spent,
      };
    }

    // 6. Scope guard (M4.8).
    step = "guard-scope";
    meter.assert(step);
    const guard = await deps.guard(attempt.draft);
    meter.add(guard.costUsd);
    if (!guard.ok) {
      const reason =
        `Scope guard: ${guard.reason} — ${guard.verdict.violations[0]?.excerpt ?? ""}`.slice(
          0,
          500,
        );
      await rejectTopic(db, topicId, reason);
      // Leave the cell in play but further back: a different draft may pass; a repeat offender sinks.
      await releaseCell(db, cell.id, "open", Math.min(5, (await cellPriority(db, cell.id)) + 1));
      await close("rejected", { step, scope_verdict: guard.verdict });
      return {
        status: "rejected",
        runId,
        step,
        reason: guard.reason ?? "scope",
        costUsd: meter.spent,
      };
    }

    // 7. Finalize (M4.9) — everything in one transaction.
    step = "finalize";
    const draft = attempt.draft;
    const { post_id: postId, slug } = await persistDraft(db, {
      run_id: runId,
      topic_id: topicId,
      matrix_id: cell.id,
      category_id: cell.category_id,
      status: o.autoPublish ? "published" : "in_review",
      slug: slugify(draft.title),
      title: draft.title,
      excerpt: draft.excerpt,
      key_points: draft.key_points,
      body_md: attempt.body,
      when_to_seek_care: draft.when_to_seek_care,
      faq: draft.faq,
      seo_title: draft.seo.title,
      seo_description: draft.seo.description,
      reading_time_min: readingTime(attempt.body),
      sources: draft.sources,
      embedding: attempt.bodyEmbedding,
      content_hash: createHash("sha256").update(attempt.body).digest("hex"),
      embedding_model: embeddingModel.id,
      dedup_score: topicVerdict.nearest?.similarity ?? null,
      scope_verdict: guard.verdict,
    });
    await close("success", { step: null, post_id: postId });

    // 8. Cover — non-fatal: a failure leaves the placeholder and a failed cover run to retry.
    const cover = await attachCover(db, deps, postId, draft, cell.category_name, meter);
    return { status: "success", runId, postId, slug, costUsd: meter.spent, cover };
  } catch (error) {
    const stop = error instanceof Stop ? error : null;
    const message = error instanceof Error ? error.message : String(error);
    const status = stop?.outcome ?? "failed";
    if (topicId)
      await rejectTopic(
        db,
        topicId,
        `${status === "skipped" ? "Skipped" : "Failed"} at ${step}: ${message}`.slice(0, 500),
      ).catch(() => {});
    if (cell) await releaseCell(db, cell.id, "open").catch(() => {});
    await close(status === "rejected" ? "rejected" : status, {
      step,
      error: message.slice(0, 1000),
    }).catch(() => {});
    return status === "skipped"
      ? { status: "skipped", reason: message }
      : { status: "failed", runId, step, error: message, costUsd: meter.spent };
  }
}

async function attachCover(
  db: PipelineDb,
  deps: PipelineDeps,
  postId: string,
  draft: SourcedDraft,
  category: string,
  meter: Meter,
): Promise<boolean> {
  if (!deps.cover) return false;
  const started = Date.now();
  const run = {
    post_id: postId,
    model: imageModels.cover.model,
    prompt_version: COVER_PROMPT_VERSION,
    step: "cover",
  };
  try {
    meter.assert("cover");
    const bytes = await deps.cover(
      coverImagePrompt({ title: draft.title, excerpt: draft.excerpt, category }),
    );
    const saved = await saveCover(db, postId, bytes, {
      alt: coverImageAlt(draft.title),
      source: "ai",
    });
    if (saved.error) throw new Error(saved.error);
    await logCoverRun(db, {
      ...run,
      status: "success",
      cost_usd: generationConfig.coverCostUsd,
      duration_ms: Date.now() - started,
      finished_at: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    await logCoverRun(db, {
      ...run,
      status: "failed",
      error: (error instanceof Error ? error.message : String(error)).slice(0, 1000),
      duration_ms: Date.now() - started,
    });
    return false;
  }
}
