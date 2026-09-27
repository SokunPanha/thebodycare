import { readFileSync } from "node:fs";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { deletePosts, insertPost, service } from "./local-supabase";

// TESTING.md §2 against the database, with REAL embeddings (gemini-embedding-001 @768) committed
// as fixtures — no live API calls, deterministic, free in CI.

const fixture = JSON.parse(readFileSync("tests/fixtures/dedup/embeddings.json", "utf8")) as {
  texts: Record<string, string>;
  vectors: Record<string, number[]>;
};
const vec = (key: string) => `[${fixture.vectors[key]!.join(",")}]`;
const ids: string[] = [];

async function publishedWith(key: string, title: string) {
  const post = await insertPost("published", { sourceCount: 3 });
  ids.push(post.id);
  const db = service();
  await db.from("posts").update({ title }).eq("id", post.id);
  await db
    .from("post_embeddings")
    .insert({ post_id: post.id, embedding: vec(key), content_hash: key, model: "fixture" });
  return post;
}

const nearest = async (key: string, includeTopics = false) => {
  const { data, error } = await service().rpc("nearest_content", {
    query_embedding: vec(key),
    match_count: 5,
    include_topics: includeTopics,
  });
  if (error) throw error;
  return data!;
};

let morning: { id: string; slug: string };

beforeAll(async () => {
  morning = await publishedWith("morningWalks", fixture.texts.morningWalks!);
  await publishedWith("bodyNapsA", "How short naps restore alertness");
});
afterAll(() => deletePosts(ids));

describe("gate 1 — exact_duplicate", () => {
  it("D1: an identical title is exact_title, whatever the case and spacing", async () => {
    const { data } = await service().rpc("exact_duplicate", {
      p_title: "  10 BENEFITS of morning walks ",
      p_slug: "anything-new",
    });
    expect(data).toBe("exact_title");
  });
  it("D2: the same slug under a different title is exact_slug", async () => {
    const { data } = await service().rpc("exact_duplicate", {
      p_title: "A brand new title",
      p_slug: morning.slug,
    });
    expect(data).toBe("exact_slug");
  });
  it("a new title and slug pass", async () => {
    const { data } = await service().rpc("exact_duplicate", {
      p_title: "Something else entirely",
      p_slug: "something-else-entirely",
    });
    expect(data).toBeNull();
  });
});

describe("gates 2–3 — nearest_content with real embeddings", () => {
  it("D3: 'Why Walking Each Morning Helps' sits above the 0.86 topic threshold of 'Morning Walks'", async () => {
    const top = (await nearest("walkingEachMorning")).find((n) => n.id === morning.id)!;
    expect(top.similarity).toBeGreaterThanOrEqual(0.86);
  });
  it("D4: 'Walking after meals' vs 'Sleep and screen time' stays below it", async () => {
    // Stand-in: compare the two fixture vectors directly through the database's cosine.
    const post = await publishedWith("sleepScreenTime", fixture.texts.sleepScreenTime!);
    const match = (await nearest("walkingAfterMeals")).find((n) => n.id === post.id)!;
    expect(match.similarity).toBeLessThan(0.86);
  });
  it("D7: two converged nap bodies sit above the 0.90 body threshold", async () => {
    const top = (await nearest("bodyNapsB"))[0]!;
    expect(top.title).toBe("How short naps restore alertness");
    expect(top.similarity).toBeGreaterThanOrEqual(0.9);
  });
  it("never offers archived posts as neighbours", async () => {
    const archived = await publishedWith("walkingEachMorning", "Archived walking piece");
    await service().from("posts").update({ status: "archived" }).eq("id", archived.id);
    expect((await nearest("walkingEachMorning")).map((n) => n.id)).not.toContain(archived.id);
  });
});
