import "server-only";

import type { QueryData } from "@supabase/supabase-js";

import { createPublicClient } from "@/lib/supabase/server";

// Reads for the public site. The anon client means RLS guarantees published-only —
// the explicit status filters below make intent clear and let the partial index be used.

export const POSTS_PAGE_SIZE = 20;

// Listing rows: enough for the dense index (DESIGN.md §7), no body.
const listingSelect = `
  id, slug, title, excerpt, reading_time_min, published_at,
  category:categories!inner ( slug, name ),
  sources:post_sources ( count )
` as const;

const postSelect = `
  *,
  category:categories!inner ( slug, name ),
  reviewer:profiles!posts_reviewer_id_fkey ( display_name, credentials ),
  sources:post_sources ( id, url, title, publisher, sort_order )
` as const;

function listingQuery() {
  return createPublicClient()
    .from("posts")
    .select(listingSelect, { count: "exact" })
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .order("id");
}

function postQuery() {
  return createPublicClient()
    .from("posts")
    .select(postSelect)
    .eq("status", "published")
    .order("sort_order", { referencedTable: "post_sources" });
}

export type PostListing = QueryData<ReturnType<typeof listingQuery>>[number];
export type PostWithSources = NonNullable<QueryData<ReturnType<typeof postQuery>>[number]>;

export type Page<T> = { items: T[]; total: number; page: number; pageCount: number };

function range(page: number, pageSize: number) {
  const from = (Math.max(1, page) - 1) * pageSize;
  return [from, from + pageSize - 1] as const;
}

function toPage<T>(items: T[] | null, total: number | null, page: number, pageSize: number) {
  const count = total ?? 0;
  return {
    items: items ?? [],
    total: count,
    page,
    pageCount: Math.max(1, Math.ceil(count / pageSize)),
  } satisfies Page<T>;
}

export async function getPostBySlug(slug: string): Promise<PostWithSources | null> {
  const { data, error } = await postQuery().eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data;
}

export async function listPublished({
  page = 1,
  pageSize = POSTS_PAGE_SIZE,
}: { page?: number; pageSize?: number } = {}): Promise<Page<PostListing>> {
  const { data, count, error } = await listingQuery().range(...range(page, pageSize));
  if (error) throw error;
  return toPage(data, count, page, pageSize);
}

export async function listByCategory(
  categoryId: string,
  { page = 1, pageSize = POSTS_PAGE_SIZE }: { page?: number; pageSize?: number } = {},
): Promise<Page<PostListing>> {
  const { data, count, error } = await listingQuery()
    .eq("category_id", categoryId)
    .range(...range(page, pageSize));
  if (error) throw error;
  return toPage(data, count, page, pageSize);
}
