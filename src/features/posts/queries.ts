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
  author:profiles!posts_author_id_fkey ( display_name, credentials ),
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

// PostgREST answers an offset past the last row with 416 / PGRST103 rather than an empty list.
// A page past the end is the caller's 404, not a server error.
function isPastLastPage(error: { code?: string } | null) {
  return error?.code === "PGRST103";
}

async function countPublished(categoryId?: string) {
  let query = createPublicClient()
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("status", "published");
  if (categoryId) query = query.eq("category_id", categoryId);
  const { count, error } = await query;
  if (error) throw error;
  return count;
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
  if (isPastLastPage(error)) return toPage([], await countPublished(), page, pageSize);
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
  if (isPastLastPage(error)) return toPage([], await countPublished(categoryId), page, pageSize);
  if (error) throw error;
  return toPage(data, count, page, pageSize);
}

/** Every published slug — for generateStaticParams. */
export async function listPublishedSlugs(): Promise<string[]> {
  const { data, error } = await createPublicClient()
    .from("posts")
    .select("slug")
    .eq("status", "published");
  if (error) throw error;
  return data.map((row) => row.slug);
}

/**
 * The nearest published posts by embedding (pgvector), topped up with the latest posts in the
 * same category when a post has no embedding yet or too few neighbours.
 */
export async function listRelatedPosts(
  post: { id: string; category_id: string },
  count = 3,
): Promise<PostListing[]> {
  const db = createPublicClient();

  const { data: neighbours, error: rpcError } = await db.rpc("related_posts", {
    target_post_id: post.id,
    match_count: count,
  });
  if (rpcError) throw rpcError;

  const ids = neighbours.map((row) => row.post_id);
  const related: PostListing[] = [];

  if (ids.length > 0) {
    const { data, error } = await listingQuery().in("id", ids);
    if (error) throw error;
    // Keep similarity order, not recency order.
    related.push(...ids.flatMap((id) => data.filter((row) => row.id === id)));
  }

  if (related.length < count) {
    const { data, error } = await listingQuery()
      .eq("category_id", post.category_id)
      .not("id", "in", `(${[post.id, ...related.map((row) => row.id)].join(",")})`)
      .limit(count - related.length);
    if (error) throw error;
    related.push(...data);
  }

  return related;
}
