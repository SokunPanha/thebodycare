import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { deletePosts, service } from "./local-supabase";

// Migration 0012: every language-specific row carries a locale; search, dedup and related posts
// stay within one language; existing callers default to English.

const DIMENSIONS = 768;
const axis = (i: number) => {
  const v = new Array<number>(DIMENSIONS).fill(0);
  v[i] = 1;
  return `[${v.join(",")}]`;
};
const tag = randomUUID().slice(0, 8);

describe("locales (0012)", () => {
  const ids: string[] = [];
  let group: string;
  let categoryId: string;

  beforeAll(async () => {
    const db = service();
    await db
      .from("locales")
      .upsert({ code: "km", name: "Khmer", native_name: "ខ្មែរ", enabled: false, sort_order: 2 });
    const { data: category } = await db
      .from("categories")
      .select("id")
      .eq("slug", "sleep")
      .single();
    categoryId = category!.id;

    const base = {
      excerpt: "A test standfirst.",
      key_points: ["One", "Two", "Three"],
      when_to_seek_care: "- If it lasts more than three weeks.",
      category_id: categoryId,
      status: "published" as const,
      source: "human" as const,
      published_at: new Date().toISOString(),
    };
    const { data: en, error } = await db
      .from("posts")
      .insert({
        ...base,
        slug: `locale-en-${tag}`,
        title: `Sleeping badly zq${tag}`,
        body_md: "Body.",
      })
      .select("id, translation_group_id")
      .single();
    if (error) throw error;
    group = en.translation_group_id;
    const { data: km, error: kmError } = await db
      .from("posts")
      .insert({
        ...base,
        slug: `locale-km-${tag}`,
        title: `ដំណេក zq${tag}`,
        body_md: "Body.",
        locale: "km",
        translation_group_id: group,
      })
      .select("id")
      .single();
    if (kmError) throw kmError;
    ids.push(en.id, km.id);

    // Both on the same axis: identical meaning, different language.
    const { error: embError } = await db
      .from("post_embeddings")
      .insert(
        ids.map((post_id) => ({ post_id, embedding: axis(733), content_hash: "h", model: "test" })),
      );
    if (embError) throw embError;
  });

  afterAll(async () => {
    await deletePosts(ids);
    const db = service();
    await db.from("topic_matrix").delete().eq("locale", "km");
    await db.from("locales").delete().eq("code", "km");
  });

  it("defaults existing rows and new inserts to English", async () => {
    const { data } = await service().from("posts").select("locale").eq("id", ids[0]!).single();
    expect(data!.locale).toBe("en");
  });

  it("allows one post per locale in a translation group", async () => {
    const { error } = await service()
      .from("posts")
      .insert({
        slug: `locale-dup-${tag}`,
        title: "Duplicate translation",
        excerpt: "x",
        key_points: ["One", "Two", "Three"],
        body_md: "Body.",
        when_to_seek_care: "- x",
        category_id: categoryId,
        status: "draft",
        source: "human",
        locale: "km",
        translation_group_id: group,
      });
    expect(error?.code).toBe("23505");
  });

  it("searches with the locale's own rules, and only in that locale", async () => {
    const db = service();
    // English stemming: "sleeps" finds "Sleeping".
    const en = await db.rpc("search_posts", { query: `sleeps zq${tag}` });
    expect(en.data!.map((r) => r.post_id)).toEqual([ids[0]]);
    // Khmer has no stemmer — exact-word match — and never returns the English post.
    const km = await db.rpc("search_posts", { query: `zq${tag}`, p_locale: "km" });
    expect(km.data!.map((r) => r.post_id)).toEqual([ids[1]]);
  });

  it("never treats a translation as a duplicate (dedup stays in one language)", async () => {
    const { data } = await service().rpc("nearest_content", {
      query_embedding: axis(733),
      match_count: 5,
      include_topics: false,
    });
    const ours = data!.filter((row) => ids.includes(row.id));
    expect(ours.map((row) => row.id)).toEqual([ids[0]]);
  });

  it("relates posts within their own language", async () => {
    const { data } = await service().rpc("related_posts", {
      target_post_id: ids[1]!,
      match_count: 10,
    });
    expect(data!.map((row) => row.post_id)).not.toContain(ids[0]);
  });

  it("never claims a cell in a language that isn't enabled yet", async () => {
    const db = service();
    const { data: cell, error } = await db
      .from("topic_matrix")
      .insert({
        category_id: categoryId,
        subtopic: `km test ${tag}`,
        angle: "what-helps",
        audience: "adults",
        format: "explainer",
        target_query: `km query ${tag}`,
        priority: 1,
        performance_score: 1_000_000,
        locale: "km",
      })
      .select("id")
      .single();
    if (error) throw error;

    const { data: claimed } = await db.rpc("claim_next_topic_cell");
    try {
      expect(claimed![0]?.id).not.toBe(cell.id);
      expect(claimed![0]?.locale).toBe("en");
    } finally {
      if (claimed![0]) {
        await db.from("topic_matrix").update({ status: "open" }).eq("id", claimed![0].id);
      }
    }
  });
});
