import "server-only";

import { createPublicClient } from "@/lib/supabase/server";
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
