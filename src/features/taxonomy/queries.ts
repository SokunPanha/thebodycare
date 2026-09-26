import "server-only";

import type { QueryData } from "@supabase/supabase-js";
import { z } from "zod";

import { requireStaff } from "@/features/auth";
import { createPublicClient, createSessionClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

export type Category = Tables<"categories">;

export async function listCategories(): Promise<Category[]> {
  const { data, error } = await createPublicClient()
    .from("categories")
    .select("*")
    .order("sort_order");
  if (error) throw error;
  return data;
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const { data, error } = await createPublicClient()
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export type CategoryWithCount = Category & { post_count: number };

/** Categories with their number of published posts, for the home page's topic cards. */
export async function listCategoriesWithCounts(): Promise<CategoryWithCount[]> {
  const { data, error } = await createPublicClient()
    .from("categories")
    .select("*, posts ( count )")
    .eq("posts.status", "published")
    .order("sort_order");
  if (error) throw error;
  return data.map(({ posts, ...category }) => ({ ...category, post_count: posts[0]?.count ?? 0 }));
}

// ---------------------------------------------------------------------------
// Admin: the topic matrix. Staff only; each read calls requireStaff() itself.
// ---------------------------------------------------------------------------

export const MATRIX_STATUSES = ["open", "queued", "drafted", "published", "exhausted"] as const;
export type MatrixStatus = (typeof MATRIX_STATUSES)[number];

const counts = z.record(z.string(), z.number());
const coverageSchema = z.array(
  z.object({
    category_id: z.string(),
    category_slug: z.string(),
    category_name: z.string(),
    by_status: counts,
    by_format: counts,
    total: z.coerce.number(),
  }),
);
export type CategoryCoverage = z.infer<typeof coverageSchema>[number];

export async function getMatrixCoverage(): Promise<CategoryCoverage[]> {
  await requireStaff();
  const supabase = await createSessionClient();
  const { data, error } = await supabase.rpc("topic_matrix_coverage");
  if (error) throw error;
  return coverageSchema.parse(data);
}

const CELLS_PAGE_SIZE = 50;

function cellsQuery(supabase: Awaited<ReturnType<typeof createSessionClient>>) {
  return (
    supabase
      .from("topic_matrix")
      .select(
        "id, subtopic, angle, audience, format, target_query, status, priority, category:categories!inner ( slug, name )",
        { count: "exact" },
      )
      // Not by status: a retired cell would jump to another page from under the cursor. Stable order;
      // the status filter narrows instead.
      .order("priority")
      .order("target_query")
  );
}

export type MatrixCell = QueryData<ReturnType<typeof cellsQuery>>[number];

export async function listMatrixCells({
  categorySlug,
  status,
  page = 1,
}: { categorySlug?: string; status?: MatrixStatus; page?: number } = {}) {
  await requireStaff();
  let query = cellsQuery(await createSessionClient());
  if (categorySlug) query = query.eq("category.slug", categorySlug);
  if (status) query = query.eq("status", status);
  const from = (Math.max(1, page) - 1) * CELLS_PAGE_SIZE;
  const { data, count, error } = await query.range(from, from + CELLS_PAGE_SIZE - 1);
  // Past the last page: PostgREST answers 416 (PGRST103) instead of an empty list.
  if (error?.code === "PGRST103") return { items: [], total: 0, page, pageCount: 1 };
  if (error) throw error;
  const total = count ?? 0;
  return { items: data, total, page, pageCount: Math.max(1, Math.ceil(total / CELLS_PAGE_SIZE)) };
}
