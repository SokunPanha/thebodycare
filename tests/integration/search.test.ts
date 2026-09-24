import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { anon, deletePosts, service } from "./local-supabase";

// search_posts() — migration 0009.

const ids: string[] = [];

async function post(
  slug: string,
  fields: { title: string; excerpt: string; body_md: string },
  status: "published" | "in_review" = "published",
) {
  const db = service();
  const { data: category } = await db.from("categories").select("id").eq("slug", "sleep").single();
  const { data, error } = await db
    .from("posts")
    .insert({
      slug,
      ...fields,
      key_points: ["a", "b", "c"],
      when_to_seek_care: "x",
      category_id: category!.id,
      status,
      published_at: status === "published" ? new Date().toISOString() : null,
    })
    .select("id")
    .single();
  if (error) throw error;
  ids.push(data.id);
  return data.id;
}

let inTitle: string;
let inBody: string;
let draft: string;

beforeAll(async () => {
  inTitle = await post("search-test-title", {
    title: "Zymurgical sleep habits",
    excerpt: "About rest.",
    body_md: "Nothing relevant.",
  });
  inBody = await post("search-test-body", {
    title: "An unrelated headline",
    excerpt: "About rest.",
    body_md: "A passing mention of zymurgical things.",
  });
  draft = await post(
    "search-test-draft",
    { title: "Zymurgical draft", excerpt: "x", body_md: "x" },
    "in_review",
  );
});

afterAll(() => deletePosts(ids));

const search = async (query: string) => {
  const { data, error } = await anon().rpc("search_posts", { query });
  if (error) throw error;
  return data;
};

describe("search_posts", () => {
  it("finds published posts and ranks a title match above a body match", async () => {
    const results = await search("zymurgical");
    expect(results.map((row) => row.post_id)).toEqual([inTitle, inBody]);
    expect(results[0]!.total).toBe(2);
  });

  it("never returns drafts", async () => {
    const results = await search("zymurgical draft");
    expect(results.map((row) => row.post_id)).not.toContain(draft);
  });

  it("stems: 'habit' finds 'habits'", async () => {
    expect((await search("zymurgical habit")).map((row) => row.post_id)).toContain(inTitle);
  });

  it("honours -exclusions", async () => {
    expect((await search("zymurgical -passing")).map((row) => row.post_id)).toEqual([inTitle]);
  });

  it("does not error on junk or empty input", async () => {
    for (const query of ["", "   ", "&&&|||!!!", "'; drop table posts; --", "a".repeat(5000)]) {
      await expect(search(query), JSON.stringify(query.slice(0, 20))).resolves.toBeInstanceOf(
        Array,
      );
    }
  });
});
