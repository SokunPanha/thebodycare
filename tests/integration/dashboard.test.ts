import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { anon, service, signedInAs } from "./local-supabase";

// M5.5's done-condition: "Numbers match the DB". Each figure from dashboard_stats() is checked
// against an independent count of the same rows.

type Stats = {
  posts_by_status: Record<string, number>;
  runs_last_7d: Record<string, number>;
  spend_today_usd: number;
  spend_30d_usd: number;
  matrix_by_status: Record<string, number>;
};

let editor: Awaited<ReturnType<typeof signedInAs>>;
let reader: Awaited<ReturnType<typeof signedInAs>>;
const runIds: string[] = [];
const MODEL = "dashboard-test";

async function stats(): Promise<Stats> {
  const { data, error } = await editor.client.rpc("dashboard_stats");
  if (error) throw error;
  return data as unknown as Stats;
}

beforeAll(async () => {
  [editor, reader] = await Promise.all([signedInAs("editor"), signedInAs("reader")]);
});

afterAll(async () => {
  await service().from("generation_runs").delete().in("id", runIds);
  await Promise.all([editor.cleanup(), reader.cleanup()]);
});

describe("dashboard_stats", () => {
  it("counts posts by status exactly as the posts table does", async () => {
    const db = service();
    const result = await stats();
    for (const status of ["draft", "in_review", "published", "archived"] as const) {
      const { count } = await db
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("status", status);
      expect(result.posts_by_status[status] ?? 0, status).toBe(count);
    }
  });

  it("counts matrix cells by status", async () => {
    const { count } = await service()
      .from("topic_matrix")
      .select("*", { count: "exact", head: true })
      .eq("status", "open");
    expect((await stats()).matrix_by_status.open).toBe(count);
  });

  it("sums spend today and over 30 days, and ignores older runs", async () => {
    const before = await stats();
    const db = service();
    const now = Date.now();
    const { data, error } = await db
      .from("generation_runs")
      .insert(
        [
          { model: MODEL, prompt_version: "v1", status: "success", cost_usd: 0.25 },
          { model: MODEL, prompt_version: "v1", status: "failed", cost_usd: 0.1 },
          // 10 days ago: in the 30-day total, not today's, not the 7-day run counts.
          {
            model: MODEL,
            prompt_version: "v1",
            status: "success",
            cost_usd: 1,
            created_at: new Date(now - 10 * 86_400_000).toISOString(),
          },
          // 40 days ago: in nothing.
          {
            model: MODEL,
            prompt_version: "v1",
            status: "success",
            cost_usd: 5,
            created_at: new Date(now - 40 * 86_400_000).toISOString(),
          },
        ],
        // Rows omit created_at unevenly; without this PostgREST sends null instead of the default.
        { defaultToNull: false },
      )
      .select("id");
    if (error) throw error;
    runIds.push(...data.map((row) => row.id));

    const after = await stats();
    expect(Number(after.spend_today_usd) - Number(before.spend_today_usd)).toBeCloseTo(0.35, 6);
    expect(Number(after.spend_30d_usd) - Number(before.spend_30d_usd)).toBeCloseTo(1.35, 6);
    expect((after.runs_last_7d.success ?? 0) - (before.runs_last_7d.success ?? 0)).toBe(1);
    expect((after.runs_last_7d.failed ?? 0) - (before.runs_last_7d.failed ?? 0)).toBe(1);
  });

  it("refuses readers and anon", async () => {
    const { error: readerError } = await reader.client.rpc("dashboard_stats");
    expect(readerError?.code).toBe("42501");
    const { error: anonError } = await anon().rpc("dashboard_stats");
    expect(anonError).not.toBeNull();
  });
});
