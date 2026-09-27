import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { deletePosts, insertPost, service } from "./local-supabase";

// Done-conditions for M2.3, 2.4 and 2.6: cosine query returns, unique constraint holds, seed loads.

const DIMENSIONS = 768;

/** A unit vector along one axis, blended slightly toward another — controllable similarity. */
function vector(axis: number, blendAxis = axis, blend = 0) {
  const v = new Array<number>(DIMENSIONS).fill(0);
  v[axis] = 1 - blend;
  v[blendAxis] = (v[blendAxis] ?? 0) + blend;
  return `[${v.join(",")}]`;
}

describe("seed", () => {
  it("loads 7 categories and 203 matrix cells", async () => {
    // Every cell, whatever its status: once the pipeline has run locally, cells move from open
    // to queued / drafted / exhausted — that's the matrix working, not a broken seed.
    const db = service();
    const { count: categories } = await db
      .from("categories")
      .select("*", { count: "exact", head: true });
    const { count: cells } = await db
      .from("topic_matrix")
      .select("*", { count: "exact", head: true });
    expect(categories).toBe(7);
    expect(cells).toBe(203);
  });
});

describe("topic_matrix", () => {
  it("rejects a duplicate subtopic × angle × audience × format", async () => {
    const db = service();
    const { data: cell } = await db.from("topic_matrix").select("*").limit(1).single();
    expect(cell).not.toBeNull();
    const { error } = await db.from("topic_matrix").insert({
      category_id: cell!.category_id,
      subtopic: cell!.subtopic,
      angle: cell!.angle,
      audience: cell!.audience,
      format: cell!.format,
      target_query: "a different query that is otherwise unique",
    });
    expect(error?.code).toBe("23505");
  });

  it("rejects an unknown angle", async () => {
    const db = service();
    const { data: category } = await db.from("categories").select("id").limit(1).single();
    const { error } = await db.from("topic_matrix").insert({
      category_id: category!.id,
      subtopic: "x",
      angle: "cure-it-fast",
      audience: "adults",
      format: "explainer",
      target_query: "an unknown angle query",
    });
    expect(error?.code).toBe("23514");
  });
});

describe("posts constraints", () => {
  it("rejects a post without when_to_seek_care content", async () => {
    const db = service();
    const { data: category } = await db.from("categories").select("id").limit(1).single();
    const { error } = await db.from("posts").insert({
      slug: "no-seek-care",
      title: "No seek care",
      excerpt: "x",
      key_points: ["a", "b", "c"],
      body_md: "x",
      when_to_seek_care: "   ",
      category_id: category!.id,
    });
    expect(error?.code).toBe("23514");
  });

  it("rejects a title over 70 characters", async () => {
    const db = service();
    const { data: category } = await db.from("categories").select("id").limit(1).single();
    const { error } = await db.from("posts").insert({
      slug: "long-title",
      title: "x".repeat(71),
      excerpt: "x",
      key_points: ["a", "b", "c"],
      body_md: "x",
      when_to_seek_care: "x",
      category_id: category!.id,
    });
    expect(error?.code).toBe("23514");
  });
});

describe("pgvector", () => {
  const ids: string[] = [];

  beforeAll(async () => {
    const db = service();
    const posts = await Promise.all([
      insertPost("published"),
      insertPost("published"),
      insertPost("published"),
      insertPost("in_review"),
    ]);
    ids.push(...posts.map((post) => post.id));
    // target on axis 700; near neighbour mostly 700; far neighbour on 701; draft identical. High
    // axes: the dev seed's sample posts use one-hot vectors on the first dozen, which outranked these.
    const embeddings = [vector(700), vector(700, 701, 0.2), vector(701), vector(700)];
    const { error } = await db.from("post_embeddings").insert(
      posts.map((post, i) => ({
        post_id: post.id,
        embedding: embeddings[i]!,
        content_hash: `hash-${i}`,
        model: "test",
      })),
    );
    if (error) throw error;
  });

  afterAll(() => deletePosts(ids));

  it("returns published neighbours by cosine similarity, excluding drafts and itself", async () => {
    const { data, error } = await service().rpc("related_posts", {
      target_post_id: ids[0]!,
      match_count: 10,
    });
    expect(error).toBeNull();
    const ours = data!.filter((row) => ids.includes(row.post_id));
    expect(ours.map((row) => row.post_id)).toEqual([ids[1], ids[2]]);
    expect(ours[0]!.similarity).toBeGreaterThan(0.9);
    expect(ours[1]!.similarity).toBeLessThan(0.1);
  });

  it("rejects a vector of the wrong dimension", async () => {
    const { error } = await service()
      .from("post_embeddings")
      .update({ embedding: "[1,2,3]" })
      .eq("post_id", ids[0]!);
    expect(error).not.toBeNull();
  });
});
