import "server-only";

import { z } from "zod";

import { requireStaff } from "@/features/auth";
import { createSessionClient } from "@/lib/supabase/server";

const counts = z.record(z.string(), z.number()).default({});

// dashboard_stats() returns jsonb; parse it rather than trusting the shape. (migration 0007)
const statsSchema = z.object({
  posts_by_status: counts,
  oldest_in_review_at: z.string().nullable(),
  published_last_7d: z.number(),
  runs_last_7d: counts,
  spend_today_usd: z.coerce.number(),
  spend_30d_usd: z.coerce.number(),
  matrix_by_status: counts,
  posts_due_for_review: z.number(),
});

export type DashboardStats = z.infer<typeof statsSchema> & { oldest_in_review_days: number | null };

export async function getDashboardStats(): Promise<DashboardStats> {
  await requireStaff();
  const supabase = await createSessionClient();
  const { data, error } = await supabase.rpc("dashboard_stats");
  if (error) throw error;
  const stats = statsSchema.parse(data);
  const oldest = stats.oldest_in_review_at;
  return {
    ...stats,
    oldest_in_review_days: oldest
      ? Math.floor((Date.now() - new Date(oldest).getTime()) / 86_400_000)
      : null,
  };
}

export async function listRecentRuns(limit = 10) {
  await requireStaff();
  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("generation_runs")
    .select(
      "id, status, step, model, prompt_version, cost_usd, error, created_at, post:posts ( id, title )",
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

export type RecentRun = Awaited<ReturnType<typeof listRecentRuns>>[number];
