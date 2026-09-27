import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { anon, deletePosts, insertPost, service, signedInAs } from "./local-supabase";

// TESTING.md §3. These protect the database from a single misplaced policy.
// R4–R6 cover subscribers and comments, which are outside the MVP (MVP.md §1).

let published: { id: string; slug: string };
let inReview: { id: string; slug: string };
let reader: Awaited<ReturnType<typeof signedInAs>>;
let editor: Awaited<ReturnType<typeof signedInAs>>;
let admin: Awaited<ReturnType<typeof signedInAs>>;

beforeAll(async () => {
  published = await insertPost("published");
  inReview = await insertPost("in_review");
  [reader, editor, admin] = await Promise.all([
    signedInAs("reader"),
    signedInAs("editor"),
    signedInAs("admin"),
  ]);
  const { error } = await service()
    .from("generation_runs")
    .insert({ model: "test-model", prompt_version: "v1", status: "success", post_id: inReview.id });
  if (error) throw error;
});

afterAll(async () => {
  await deletePosts([published.id, inReview.id]);
  await Promise.all([reader.cleanup(), editor.cleanup(), admin.cleanup()]);
});

describe("anon", () => {
  it("R1: reads a published post", async () => {
    const { data, error } = await anon().from("posts").select("id").eq("id", published.id);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });

  it("R2: gets an empty result, not an error, for an in_review post", async () => {
    const { data, error } = await anon().from("posts").select("id").eq("id", inReview.id);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("sees sources only for published posts", async () => {
    const { data } = await anon()
      .from("post_sources")
      .select("post_id")
      .in("post_id", [published.id, inReview.id]);
    expect(data?.map((row) => row.post_id)).toEqual([published.id]);
  });

  it("R3: cannot insert a post", async () => {
    const { error } = await anon()
      .from("posts")
      .insert({
        slug: "anon-insert",
        title: "Nope",
        excerpt: "Nope",
        key_points: ["a", "b", "c"],
        body_md: "Nope",
        when_to_seek_care: "Nope",
        category_id: "00000000-0000-0000-0000-000000000000",
      });
    expect(error?.code).toBe("42501");
  });

  it("cannot update or delete a published post", async () => {
    await anon().from("posts").update({ title: "Defaced" }).eq("id", published.id);
    await anon().from("posts").delete().eq("id", published.id);
    const { data } = await service().from("posts").select("title").eq("id", published.id).single();
    expect(data?.title).toBe("Test published post");
  });

  it("R8: reads nothing from generation_runs", async () => {
    const { data, error } = await anon().from("generation_runs").select("id");
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("reads nothing from the pipeline and analytics tables", async () => {
    for (const table of ["topic_matrix", "topic_queue", "post_performance"] as const) {
      const { data } = await anon().from(table).select("*").limit(1);
      expect(data, table).toEqual([]);
    }
  });

  it("reads categories", async () => {
    const { data } = await anon().from("categories").select("slug");
    expect(data).toHaveLength(8);
  });

  it("cannot call the role helpers over the API", async () => {
    // private schema is not exposed; only public RPCs exist.
    const { error } = await anon()
      .schema("private" as "public")
      .rpc("is_admin" as never);
    expect(error).not.toBeNull();
  });
});

describe("reader (signed in, no role)", () => {
  it("cannot see an in_review post", async () => {
    const { data } = await reader.client.from("posts").select("id").eq("id", inReview.id);
    expect(data).toEqual([]);
  });

  it("cannot insert a post", async () => {
    const { error } = await reader.client.from("posts").insert({
      slug: "reader-insert",
      title: "Nope",
      excerpt: "Nope",
      key_points: ["a", "b", "c"],
      body_md: "Nope",
      when_to_seek_care: "Nope",
      category_id: "00000000-0000-0000-0000-000000000000",
    });
    expect(error?.code).toBe("42501");
  });

  it("cannot promote themselves to admin", async () => {
    await reader.client.from("profiles").update({ role: "admin" }).eq("id", reader.userId);
    const { data } = await service()
      .from("profiles")
      .select("role")
      .eq("id", reader.userId)
      .single();
    expect(data?.role).toBe("reader");
  });

  it("reads nothing from generation_runs", async () => {
    const { data } = await reader.client.from("generation_runs").select("id");
    expect(data).toEqual([]);
  });
});

describe("staff", () => {
  it("R7: admin reads an in_review post", async () => {
    const { data } = await admin.client.from("posts").select("id").eq("id", inReview.id);
    expect(data).toHaveLength(1);
  });

  it("editor reads an in_review post and generation_runs", async () => {
    const { data: post } = await editor.client.from("posts").select("id").eq("id", inReview.id);
    expect(post).toHaveLength(1);
    const { data: runs } = await editor.client
      .from("generation_runs")
      .select("id")
      .eq("post_id", inReview.id);
    expect(runs).toHaveLength(1);
  });

  it("admin approves a post: in_review → published", async () => {
    const { error } = await admin.client
      .from("posts")
      .update({ status: "published", published_at: new Date().toISOString() })
      .eq("id", inReview.id);
    expect(error).toBeNull();
    const { data } = await anon().from("posts").select("id").eq("id", inReview.id);
    expect(data).toHaveLength(1);
  });

  it("editor cannot delete a post; admin can't be bypassed by role changes", async () => {
    await editor.client.from("posts").delete().eq("id", published.id);
    const { data } = await service().from("posts").select("id").eq("id", published.id);
    expect(data).toHaveLength(1);

    await editor.client.from("profiles").update({ role: "admin" }).eq("id", editor.userId);
    const { data: profile } = await service()
      .from("profiles")
      .select("role")
      .eq("id", editor.userId)
      .single();
    expect(profile?.role).toBe("editor");
  });
});
