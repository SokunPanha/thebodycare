import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { deletePosts, insertPost, status } from "./local-supabase";

// M2.8 — the public read functions, run for real against the local database as `anon`.

vi.mock("server-only", () => ({}));

let posts: typeof import("@/features/posts");
let taxonomy: typeof import("@/features/taxonomy");
let published: { id: string; slug: string };
let inReview: { id: string; slug: string };

beforeAll(async () => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", status.API_URL);
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", status.ANON_KEY);
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", status.SERVICE_ROLE_KEY);
  vi.stubEnv("GEMINI_API_KEY", "test");
  vi.stubEnv("CRON_SECRET", "x".repeat(32));
  posts = await import("@/features/posts");
  taxonomy = await import("@/features/taxonomy");

  published = await insertPost("published");
  inReview = await insertPost("in_review");
});

afterAll(async () => {
  vi.unstubAllEnvs();
  await deletePosts([published.id, inReview.id]);
});

describe("posts queries", () => {
  it("getPostBySlug returns a published post with category and sources", async () => {
    const post = await posts.getPostBySlug(published.slug);
    expect(post?.id).toBe(published.id);
    expect(post?.category.slug).toBe("sleep");
    expect(post?.sources).toHaveLength(1);
    expect(post?.sources[0]?.publisher).toBe("NHS");
  });

  it("getPostBySlug returns null for an unpublished or missing post", async () => {
    expect(await posts.getPostBySlug(inReview.slug)).toBeNull();
    expect(await posts.getPostBySlug("does-not-exist")).toBeNull();
  });

  it("listPublished returns listing rows with a source count, newest first", async () => {
    const page = await posts.listPublished();
    const ids = page.items.map((item) => item.id);
    expect(ids).toContain(published.id);
    expect(ids).not.toContain(inReview.id);
    const row = page.items.find((item) => item.id === published.id);
    expect(row?.sources[0]?.count).toBe(1);
    expect(page.total).toBeGreaterThanOrEqual(1);
  });

  it("listByCategory filters by category and paginates", async () => {
    const sleep = await taxonomy.getCategoryBySlug("sleep");
    const food = await taxonomy.getCategoryBySlug("food");
    expect(sleep && food).toBeTruthy();

    const inSleep = await posts.listByCategory(sleep!.id, { pageSize: 1 });
    expect(inSleep.items).toHaveLength(1);
    expect(inSleep.pageCount).toBe(inSleep.total);

    const pastEnd = await posts.listByCategory(sleep!.id, { page: 9999 });
    expect(pastEnd.items).toEqual([]);
    expect(pastEnd.total).toBe(inSleep.total);
    expect(pastEnd.page).toBeGreaterThan(pastEnd.pageCount);

    const inFood = await posts.listByCategory(food!.id);
    expect(inFood.items.map((item) => item.id)).not.toContain(published.id);
  });
});

describe("taxonomy queries", () => {
  it("lists the 7 categories in nav order", async () => {
    const categories = await taxonomy.listCategories();
    expect(categories.map((c) => c.slug)).toEqual([
      "sleep",
      "digestion",
      "movement",
      "food",
      "mind",
      "everyday-body",
      "prevention",
    ]);
  });

  it("returns null for an unknown category", async () => {
    expect(await taxonomy.getCategoryBySlug("symptoms")).toBeNull();
  });
});
