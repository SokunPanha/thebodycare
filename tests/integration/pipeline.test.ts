import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { solidPng } from "../helpers/png";
import { anon, service, status as supabase } from "./local-supabase";

// TESTING.md §4 — the real pipeline against the local database, with the model faked at the
// boundary (draft, guard, embeddings, page checks, covers). No Gemini calls.

vi.mock("server-only", () => ({}));

type Pipeline = typeof import("@/features/generation");
let pipeline: Pipeline;

const base = JSON.parse(readFileSync("tests/fixtures/scope/base-draft.json", "utf8"));
const { sources: _sources, ...baseDraft } = base;

/** A dense pseudo-random unit-ish vector from a string — distinct text, distinct vector. */
function vectorFor(text: string): number[] {
  const out: number[] = [];
  let seed = createHash("sha256").update(text).digest().readUInt32LE(0);
  for (let i = 0; i < 768; i++) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    out.push(seed / 2 ** 32 - 0.5);
  }
  return out;
}

const redirect = (n: number) =>
  `https://vertexaisearch.cloud.google.com/grounding-api-redirect/${n}`;
const groundedResponse = {
  candidates: [
    {
      groundingMetadata: {
        webSearchQueries: ["q1", "q2"],
        groundingChunks: [
          { web: { uri: redirect(1), domain: "nhs.uk" } },
          { web: { uri: redirect(2), domain: "mayoclinic.org" } },
          { web: { uri: redirect(3), domain: "cdc.gov" } },
          { web: { uri: redirect(4), domain: "facebook.com" } },
        ],
        groundingSupports: [{ groundingChunkIndices: [0, 1, 2] }],
      },
    },
  ],
};
const pages: Record<string, string> = {
  [redirect(1)]: "https://www.nhs.uk/conditions/bloating/",
  [redirect(2)]: "https://www.mayoclinic.org/bloating",
  [redirect(3)]: "https://www.cdc.gov/digestive",
};

let titleCounter = 0;
function fakeDeps(overrides: Partial<import("@/features/generation").PipelineDeps> = {}) {
  return {
    draft: vi.fn(async () => ({
      draft: {
        ...structuredClone(baseDraft),
        title: `Pipeline test article ${Date.now()}-${titleCounter++}`,
      },
      response: groundedResponse as never,
      costUsd: 0.002,
      tokensIn: 1000,
      tokensOut: 500,
      searchQueries: 2,
    })),
    guard: vi.fn(async () => ({
      ok: true,
      reason: null,
      verdict: { verdict: "pass" as const, violations: [] },
      costUsd: 0.0005,
    })),
    embed: vi.fn(async (texts: string[]) => texts.map((t) => vectorFor(t + Math.random()))),
    checkPage: vi.fn(async (url: string) => ({
      url: pages[url] ?? url,
      status: pages[url] ? 200 : 0,
      title: "A page - Publisher",
    })),
    cover: null,
    ...overrides,
  };
}

const opts = {
  posts: 1,
  autoPublish: false,
  dailyCapUsd: 5,
  topicThreshold: 0.86,
  bodyThreshold: 0.9,
};

let matrixSnapshot: { id: string; status: string; priority: number }[] = [];
const started = new Date().toISOString();
const db = () => service();

beforeAll(async () => {
  for (const [k, v] of Object.entries({
    NEXT_PUBLIC_SUPABASE_URL: supabase.API_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: supabase.ANON_KEY,
    NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
    SUPABASE_SERVICE_ROLE_KEY: supabase.SERVICE_ROLE_KEY,
    CRON_SECRET: "c".repeat(40),
    GENERATION_COVER_COST_USD: "0.0035",
  })) {
    vi.stubEnv(k, v);
  }
  pipeline = await import("@/features/generation");
  const { data } = await db().from("topic_matrix").select("id, status, priority");
  matrixSnapshot = data!;
});

beforeEach(async () => {
  // Clean slate for spend and the run lock: only this suite's runs.
  await db().from("generation_runs").delete().gte("created_at", started);
});

afterAll(async () => {
  const d = db();
  const { data: runs } = await d
    .from("generation_runs")
    .select("post_id")
    .gte("created_at", started);
  const postIds = (runs ?? []).map((r) => r.post_id).filter(Boolean) as string[];
  await d.from("generation_runs").delete().gte("created_at", started);
  if (postIds.length) await d.from("posts").delete().in("id", postIds);
  await d.from("topic_queue").delete().gte("created_at", started);
  for (const cell of matrixSnapshot) {
    await d
      .from("topic_matrix")
      .update({ status: cell.status as never, priority: cell.priority })
      .eq("id", cell.id);
  }
  vi.unstubAllEnvs();
});

/** This suite's article runs — cover runs (step "cover") excluded. Filtered in JS: a successful
 *  run's step is NULL, and SQL NULL comparisons made the server-side filter miss it. */
async function onlyRun() {
  const { data } = await db().from("generation_runs").select("*").gte("created_at", started);
  return (data ?? []).filter((run) => run.step !== "cover");
}

describe("pipeline", () => {
  it("G1: happy path — an in_review post with sources, an embedding, and a success run", async () => {
    const [outcome] = await pipeline.runPipeline(db(), fakeDeps(), opts);
    expect(outcome).toMatchObject({ status: "success" });
    if (!outcome || outcome.status !== "success") throw new Error("expected a successful run");

    const { data: post } = await db()
      .from("posts")
      .select("*, post_sources(url, publisher), post_embeddings(model)")
      .eq("id", outcome.postId)
      .single();
    expect(post!.status).toBe("in_review");
    expect(post!.source).toBe("ai");
    expect(post!.body_md).toContain("## What bloating is");
    expect(post!.post_sources.map((s: { url: string }) => s.url).sort()).toEqual([
      "https://www.cdc.gov/digestive",
      "https://www.mayoclinic.org/bloating",
      "https://www.nhs.uk/conditions/bloating/",
    ]); // facebook.com filtered out
    expect(post!.post_embeddings).toMatchObject({ model: "gemini-embedding-001" });

    const [run] = await onlyRun();
    expect(run).toMatchObject({
      status: "success",
      post_id: outcome.postId,
      prompt_version: "v2/draft-article",
    });
    expect(Number(run!.cost_usd)).toBeGreaterThan(0.002); // draft + guard + grounding + embeddings
    expect(run!.tokens_in).toBe(1000);
    expect(run!.scope_verdict).toMatchObject({ verdict: "pass" });

    const { data: topic } = await db()
      .from("topic_queue")
      .select("status, matrix_id")
      .eq("id", run!.topic_id!)
      .single();
    expect(topic!.status).toBe("drafted");
    const { data: cell } = await db()
      .from("topic_matrix")
      .select("status")
      .eq("id", topic!.matrix_id!)
      .single();
    expect(cell!.status).toBe("drafted");
  });

  it("G1b: generates and attaches a cover, logged as its own run", async () => {
    const cover = vi.fn(async () => solidPng(1344, 768));
    const [outcome] = await pipeline.runPipeline(db(), fakeDeps({ cover }), opts);
    expect(outcome).toMatchObject({ status: "success", cover: true });
    const { data: post } = await db()
      .from("posts")
      .select("cover_path, cover_source")
      .eq("id", (outcome as { postId: string }).postId)
      .single();
    expect(post).toMatchObject({ cover_source: "ai" });
    const { data: coverRuns } = await db()
      .from("generation_runs")
      .select("status, cost_usd")
      .eq("step", "cover")
      .gte("created_at", started);
    expect(coverRuns).toEqual([{ status: "success", cost_usd: 0.0035 }]);
    await db().storage.from("covers").remove([post!.cover_path!]);
  });

  it("G2: a malformed model response fails the run and leaves no post behind", async () => {
    const zodError = Object.assign(new Error("Expected string, received number"), {
      name: "ZodError",
    });
    const deps = fakeDeps({
      draft: vi.fn(async () => {
        throw zodError;
      }),
    });
    const before = (await db().from("posts").select("id", { count: "exact", head: true })).count;
    const [outcome] = await pipeline.runPipeline(db(), deps, opts);
    expect(outcome).toMatchObject({ status: "failed", step: "draft-article" });
    expect((await db().from("posts").select("id", { count: "exact", head: true })).count).toBe(
      before,
    );
    const [run] = await onlyRun();
    expect(run).toMatchObject({ status: "failed", step: "draft-article", post_id: null });
    expect(run!.error).toMatch(/Expected string/);
  });

  it("G4: with the daily cap already spent, exits before any model call", async () => {
    await db()
      .from("generation_runs")
      .insert({ model: "test", prompt_version: "test", status: "success", cost_usd: 5 });
    const deps = fakeDeps();
    const [outcome] = await pipeline.runPipeline(db(), deps, opts);
    expect(outcome).toMatchObject({ status: "skipped", reason: expect.stringMatching(/cost cap/) });
    expect(deps.draft).not.toHaveBeenCalled();
    expect(deps.embed).not.toHaveBeenCalled();
  });

  it("G4b: stops mid-article if the next call would start past the cap", async () => {
    const deps = fakeDeps({
      draft: vi.fn(async () => ({ ...(await fakeDeps().draft({} as never)), costUsd: 10 })),
    });
    const [outcome] = await pipeline.runPipeline(db(), deps, opts);
    expect(outcome).toMatchObject({ status: "skipped", reason: expect.stringMatching(/cost cap/) });
    expect(deps.guard).not.toHaveBeenCalled();
  });

  it("G5 / D10: a near-duplicate topic is rejected with a reason, no post, cell retired", async () => {
    // Make the new topic's embedding identical to an existing article's.
    const { data: existing } = await db()
      .from("post_embeddings")
      .select("post_id, embedding, posts!inner(status)")
      .neq("posts.status", "archived")
      .limit(1)
      .single();
    const same = JSON.parse(existing!.embedding as unknown as string) as number[];
    const deps = fakeDeps({ embed: vi.fn(async (texts: string[]) => texts.map(() => same)) });
    const [outcome] = await pipeline.runPipeline(db(), deps, opts);
    expect(outcome).toMatchObject({
      status: "rejected",
      step: "check-duplicate",
      reason: "semantic_topic",
    });
    expect(deps.draft).not.toHaveBeenCalled();
    const [run] = await onlyRun();
    const { data: topic } = await db()
      .from("topic_queue")
      .select("status, reject_reason, dedup_score, matrix_id")
      .eq("id", run!.topic_id!)
      .single();
    expect(topic!.status).toBe("rejected");
    expect(topic!.reject_reason).toMatch(/too close to/);
    expect(topic!.dedup_score).toBeCloseTo(1, 3);
    const { data: cell } = await db()
      .from("topic_matrix")
      .select("status")
      .eq("id", topic!.matrix_id!)
      .single();
    expect(cell!.status).toBe("exhausted");
  });

  it("D8: a converged body gets exactly one rewrite, then is rejected", async () => {
    const { data: existing } = await db()
      .from("post_embeddings")
      .select("embedding, posts!inner(status)")
      .neq("posts.status", "archived")
      .limit(1)
      .single();
    const same = JSON.parse(existing!.embedding as unknown as string) as number[];
    // Topic embeddings are unique; body embeddings collide with an existing article.
    const embed = vi.fn(async (texts: string[]) =>
      texts.map((t) => (t.startsWith("## ") ? same : vectorFor(t + Math.random()))),
    );
    const deps = fakeDeps({ embed });
    const [outcome] = await pipeline.runPipeline(db(), deps, opts);
    expect(outcome).toMatchObject({ status: "rejected", reason: "semantic_body" });
    expect(deps.draft).toHaveBeenCalledTimes(2);
    expect((deps.draft as ReturnType<typeof vi.fn>).mock.calls[1]![0]).toMatchObject({
      avoid: expect.objectContaining({ title: expect.any(String) }),
    });
  });

  it("G6: a scope-guard rejection records the reason and lowers the cell's priority", async () => {
    const guard = vi.fn(async () => ({
      ok: false,
      reason: "dosage" as const,
      verdict: {
        verdict: "fail" as const,
        violations: [{ rule: "dosage" as const, excerpt: "a teaspoon three times a day" }],
      },
      costUsd: 0.0005,
    }));
    const [outcome] = await pipeline.runPipeline(db(), fakeDeps({ guard }), opts);
    expect(outcome).toMatchObject({ status: "rejected", step: "guard-scope", reason: "dosage" });
    const [run] = await onlyRun();
    expect(run!.scope_verdict).toMatchObject({ verdict: "fail" });
    const { data: topic } = await db()
      .from("topic_queue")
      .select("reject_reason, matrix_id")
      .eq("id", run!.topic_id!)
      .single();
    expect(topic!.reject_reason).toMatch(/dosage — a teaspoon/);
    const before = matrixSnapshot.find((c) => c.id === topic!.matrix_id)!;
    const { data: cell } = await db()
      .from("topic_matrix")
      .select("status, priority")
      .eq("id", topic!.matrix_id!)
      .single();
    expect(cell).toEqual({ status: "open", priority: Math.min(5, before.priority + 1) });
  });

  it("G7: with auto-publish on, the post goes live with published_at set", async () => {
    const [outcome] = await pipeline.runPipeline(db(), fakeDeps(), { ...opts, autoPublish: true });
    const { data: post } = await db()
      .from("posts")
      .select("status, published_at")
      .eq("id", (outcome as { postId: string }).postId)
      .single();
    expect(post!.status).toBe("published");
    expect(post!.published_at).not.toBeNull();
  });

  it("G8: with auto-publish off, the draft is invisible to anon", async () => {
    const [outcome] = await pipeline.runPipeline(db(), fakeDeps(), opts);
    const { data } = await anon()
      .from("posts")
      .select("id")
      .eq("id", (outcome as { postId: string }).postId);
    expect(data).toEqual([]);
  });

  it("G10: while another run holds the lock, a second run exits without claiming a topic", async () => {
    await db()
      .from("generation_runs")
      .insert({ model: "test", prompt_version: "test", status: "running" });
    const deps = fakeDeps();
    const [outcome] = await pipeline.runPipeline(db(), deps, opts);
    expect(outcome).toMatchObject({
      status: "skipped",
      reason: expect.stringMatching(/in progress/),
    });
    expect(deps.embed).not.toHaveBeenCalled();
  });

  it("G10b: a run stuck 'running' for over 15 minutes is abandoned, not a permanent block", async () => {
    await db()
      .from("generation_runs")
      .insert({
        model: "test",
        prompt_version: "test",
        status: "running",
        created_at: new Date(Date.now() - 20 * 60_000).toISOString(),
      });
    const [outcome] = await pipeline.runPipeline(db(), fakeDeps(), opts);
    expect(outcome).toMatchObject({ status: "success" });
    const { data } = await db().from("generation_runs").select("status, error").eq("model", "test");
    expect(data![0]).toMatchObject({ status: "failed", error: expect.stringMatching(/Abandoned/) });
  });
});
