import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { anon, deletePosts, insertPost, service, signedInAs } from "./local-supabase";

// approve_post / reject_post (migration 0006). The core product loop: draft → human → published.

let reader: Awaited<ReturnType<typeof signedInAs>>;
let editor: Awaited<ReturnType<typeof signedInAs>>;
const postIds: string[] = [];
const cellIds: string[] = [];
const topicIds: string[] = [];

/** An AI draft wired to a topic_queue row and a matrix cell through a generation run. */
async function aiDraft({ sourceCount = 3 } = {}) {
  const db = service();
  const post = await insertPost("in_review", { sourceCount, source: "ai" });
  postIds.push(post.id);
  const { data: cell } = await db
    .from("topic_matrix")
    .select("id")
    .eq("status", "open")
    .limit(1)
    .single();
  await db.from("topic_matrix").update({ status: "drafted" }).eq("id", cell!.id);
  const { data: topic } = await db
    .from("topic_queue")
    .insert({ matrix_id: cell!.id, topic: "t", target_keyword: "k", status: "drafted" })
    .select("id")
    .single();
  await db
    .from("generation_runs")
    .insert({ topic_id: topic!.id, post_id: post.id, model: "m", prompt_version: "v1" });
  cellIds.push(cell!.id);
  topicIds.push(topic!.id);
  return { post, cellId: cell!.id, topicId: topic!.id };
}

beforeAll(async () => {
  [reader, editor] = await Promise.all([signedInAs("reader"), signedInAs("editor")]);
});

afterAll(async () => {
  // Leave the shared matrix exactly as seeded — other suites count open cells.
  const db = service();
  await db.from("generation_runs").delete().in("topic_id", topicIds);
  await db.from("topic_queue").delete().in("id", topicIds);
  await db.from("topic_matrix").update({ status: "open" }).in("id", cellIds);
  await deletePosts(postIds);
  await Promise.all([reader.cleanup(), editor.cleanup()]);
});

describe("approve_post", () => {
  it("publishes, credits the reviewer, and marks the topic and cell published", async () => {
    const { post, cellId, topicId } = await aiDraft();
    const { data, error } = await editor.client.rpc("approve_post", { p_post_id: post.id });
    expect(error).toBeNull();
    expect(data?.[0]?.slug).toBe(post.slug);

    const db = service();
    const { data: row } = await db.from("posts").select("*").eq("id", post.id).single();
    expect(row?.status).toBe("published");
    expect(row?.published_at).not.toBeNull();
    expect(row?.reviewer_id).toBe(editor.userId);
    expect(row?.reviewed_at).not.toBeNull();
    expect(row?.source).toBe("ai_reviewed");
    expect(new Date(row!.next_review_at!).getTime()).toBeGreaterThan(Date.now() + 300 * 86_400_000);

    const { data: topic } = await db
      .from("topic_queue")
      .select("status")
      .eq("id", topicId)
      .single();
    const { data: cell } = await db.from("topic_matrix").select("status").eq("id", cellId).single();
    expect(topic?.status).toBe("published");
    expect(cell?.status).toBe("published");

    // …and it is now public.
    const { data: visible } = await anon().from("posts").select("id").eq("id", post.id);
    expect(visible).toHaveLength(1);
  });

  it("refuses a draft with fewer than 3 sources", async () => {
    const { post } = await aiDraft({ sourceCount: 2 });
    const { error } = await editor.client.rpc("approve_post", { p_post_id: post.id });
    expect(error?.message).toMatch(/at least 3 sources/);
    const { data } = await service().from("posts").select("status").eq("id", post.id).single();
    expect(data?.status).toBe("in_review");
  });

  it("refuses a post that isn't in review", async () => {
    const post = await insertPost("draft", { sourceCount: 3 });
    postIds.push(post.id);
    const { error } = await editor.client.rpc("approve_post", { p_post_id: post.id });
    expect(error?.message).toMatch(/Only posts in review/);
  });

  it("refuses a reader and anon", async () => {
    const { post } = await aiDraft();
    const { error: readerError } = await reader.client.rpc("approve_post", { p_post_id: post.id });
    expect(readerError?.code).toBe("42501");
    const { error: anonError } = await anon().rpc("approve_post", { p_post_id: post.id });
    expect(anonError).not.toBeNull();
    const { data } = await service().from("posts").select("status").eq("id", post.id).single();
    expect(data?.status).toBe("in_review");
  });
});

describe("reject_post", () => {
  it("archives the post and records the reason on the post and the topic", async () => {
    const { post, topicId } = await aiDraft();
    const { error } = await editor.client.rpc("reject_post", {
      p_post_id: post.id,
      p_reason: "  Recommends a supplement dose  ",
    });
    expect(error).toBeNull();

    const db = service();
    const { data: row } = await db
      .from("posts")
      .select("status, review_note")
      .eq("id", post.id)
      .single();
    expect(row).toEqual({ status: "archived", review_note: "Recommends a supplement dose" });
    const { data: topic } = await db
      .from("topic_queue")
      .select("status, reject_reason")
      .eq("id", topicId)
      .single();
    expect(topic).toEqual({ status: "rejected", reject_reason: "Recommends a supplement dose" });

    const { data: visible } = await anon().from("posts").select("id").eq("id", post.id);
    expect(visible).toEqual([]);
  });

  it("requires a reason", async () => {
    const { post } = await aiDraft();
    const { error } = await editor.client.rpc("reject_post", {
      p_post_id: post.id,
      p_reason: "   ",
    });
    expect(error?.message).toMatch(/reason is required/);
  });

  it("refuses a reader", async () => {
    const { post } = await aiDraft();
    const { error } = await reader.client.rpc("reject_post", { p_post_id: post.id, p_reason: "x" });
    expect(error?.code).toBe("42501");
  });
});

describe("publish_unreviewed (0013)", () => {
  it("publishes the listed drafts with no reviewer, and marks their topic and cell published", async () => {
    const a = await aiDraft();
    const b = await aiDraft();
    const { data, error } = await editor.client.rpc("publish_unreviewed", {
      p_post_ids: [a.post.id, b.post.id],
    });
    expect(error).toBeNull();
    expect(data).toBe(2);

    const db = service();
    const { data: rows } = await db
      .from("posts")
      .select("status, source, reviewer_id, reviewed_at, published_at")
      .in("id", [a.post.id, b.post.id]);
    for (const row of rows!) {
      // No "Reviewed by": nobody read it. (EDITORIAL.md §7)
      expect(row).toMatchObject({
        status: "published",
        source: "ai",
        reviewer_id: null,
        reviewed_at: null,
      });
      expect(row.published_at).not.toBeNull();
    }
    const { data: cell } = await db
      .from("topic_matrix")
      .select("status")
      .eq("id", a.cellId)
      .single();
    const { data: topic } = await db
      .from("topic_queue")
      .select("status")
      .eq("id", a.topicId)
      .single();
    expect(cell?.status).toBe("published");
    expect(topic?.status).toBe("published");
  });

  it("skips drafts it wasn't given, and drafts with fewer than 3 sources", async () => {
    const listed = await aiDraft({ sourceCount: 2 });
    const unlisted = await aiDraft();
    const { data } = await editor.client.rpc("publish_unreviewed", {
      p_post_ids: [listed.post.id],
    });
    expect(data).toBe(0);
    const { data: rows } = await service()
      .from("posts")
      .select("status")
      .in("id", [listed.post.id, unlisted.post.id]);
    expect(rows!.every((r) => r.status === "in_review")).toBe(true);
  });

  it("refuses a reader", async () => {
    const { post } = await aiDraft();
    const { error } = await reader.client.rpc("publish_unreviewed", { p_post_ids: [post.id] });
    expect(error?.code).toBe("42501");
  });
});
