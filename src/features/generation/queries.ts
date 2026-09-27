import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

// The pipeline's database access (rule 3). It runs from the cron route with the service-role
// client, which is created there and passed in — never imported here (rule 4).

export type PipelineDb = SupabaseClient<Database>;

type Result<T> = { data: T; error: { message: string } | null };

/** Writes: throw on error, nothing to return. */
function check(result: { error: { message: string } | null }, what: string) {
  if (result.error) throw new Error(`${what}: ${result.error.message}`);
}

/** Reads: throw on error or on missing data. */
function must<T>(result: Result<T>, what: string): NonNullable<T> {
  check(result, what);
  if (result.data == null) throw new Error(`${what}: no data`);
  return result.data as NonNullable<T>;
}

export async function startRun(db: PipelineDb, model: string, promptVersion: string) {
  // null means another run holds the lock (TESTING.md G10).
  const result = await db.rpc("start_generation_run", {
    p_model: model,
    p_prompt_version: promptVersion,
  });
  check(result, "start_generation_run");
  return (result.data as string | null) ?? null;
}

export async function finishRun(
  db: PipelineDb,
  runId: string,
  values: Partial<Database["public"]["Tables"]["generation_runs"]["Update"]>,
) {
  check(
    await db
      .from("generation_runs")
      .update({ ...values, finished_at: new Date().toISOString() })
      .eq("id", runId),
    "finishRun",
  );
}

export async function spendTodayUsd(db: PipelineDb): Promise<number> {
  return Number(must(await db.rpc("spend_today_usd"), "spend_today_usd") ?? 0);
}

export async function claimCell(db: PipelineDb) {
  return must(await db.rpc("claim_next_topic_cell"), "claim_next_topic_cell")[0] ?? null;
}
export type ClaimedCell = NonNullable<Awaited<ReturnType<typeof claimCell>>>;

export async function releaseCell(
  db: PipelineDb,
  cellId: string,
  status: "open" | "exhausted",
  priority?: number,
) {
  check(
    await db
      .from("topic_matrix")
      .update({ status, ...(priority ? { priority } : {}) })
      .eq("id", cellId),
    "releaseCell",
  );
}

export async function cellPriority(db: PipelineDb, cellId: string): Promise<number> {
  return must(
    await db.from("topic_matrix").select("priority").eq("id", cellId).single(),
    "cellPriority",
  ).priority;
}

export async function insertTopic(
  db: PipelineDb,
  values: { matrix_id: string; topic: string; target_keyword: string; embedding: string },
) {
  return must(
    await db
      .from("topic_queue")
      .insert({ ...values, status: "generating" })
      .select("id")
      .single(),
    "insertTopic",
  ).id;
}

export async function rejectTopic(
  db: PipelineDb,
  topicId: string,
  reason: string,
  dedupScore?: number,
) {
  check(
    await db
      .from("topic_queue")
      .update({
        status: "rejected",
        reject_reason: reason,
        ...(dedupScore === undefined ? {} : { dedup_score: dedupScore }),
      })
      .eq("id", topicId),
    "rejectTopic",
  );
}

export async function exactDuplicate(db: PipelineDb, title: string, slug: string) {
  // null is the common, good answer: no duplicate.
  const result = await db.rpc("exact_duplicate", { p_title: title, p_slug: slug });
  check(result, "exact_duplicate");
  return (result.data as "exact_title" | "exact_slug" | null) ?? null;
}

export type Neighbour = {
  kind: string;
  id: string;
  title: string;
  excerpt: string | null;
  slug: string | null;
  similarity: number;
};

export async function nearestContent(
  db: PipelineDb,
  embedding: string,
  includeTopics: boolean,
): Promise<Neighbour[]> {
  return must(
    await db.rpc("nearest_content", {
      query_embedding: embedding,
      match_count: 5,
      include_topics: includeTopics,
    }),
    "nearest_content",
  ) as Neighbour[];
}

/** Published neighbours only — candidates for internal links (M4.12). */
export async function relatedPublished(db: PipelineDb, embedding: string, count = 5) {
  const matches = must(
    await db.rpc("match_posts", { query_embedding: embedding, match_count: count }),
    "match_posts",
  );
  if (matches.length === 0) return [];
  const posts = must(
    await db
      .from("posts")
      .select("id, title, slug")
      .in(
        "id",
        matches.map((m) => m.post_id),
      ),
    "relatedPublished",
  );
  return matches.flatMap((m) => posts.filter((p) => p.id === m.post_id));
}

export async function persistDraft(db: PipelineDb, payload: Record<string, unknown>) {
  const rows = must(await db.rpc("persist_draft", { p: payload as never }), "persist_draft");
  return rows[0]!;
}

/** Cover generation is logged as its own run row (step 'cover'), linked to the post. */
export async function logCoverRun(
  db: PipelineDb,
  values: Database["public"]["Tables"]["generation_runs"]["Insert"],
) {
  check(await db.from("generation_runs").insert(values), "logCoverRun");
}
