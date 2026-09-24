import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { solidPng } from "../helpers/png";
import { anon, deletePosts, insertPost, service, signedInAs, status } from "./local-supabase";

// Migration 0008: the covers bucket and the posts cover columns.

let editor: Awaited<ReturnType<typeof signedInAs>>;
let reader: Awaited<ReturnType<typeof signedInAs>>;
const paths: string[] = [];
const png = solidPng(1200, 750);

beforeAll(async () => {
  [editor, reader] = await Promise.all([signedInAs("editor"), signedInAs("reader")]);
});

afterAll(async () => {
  if (paths.length) await service().storage.from("covers").remove(paths);
  await Promise.all([editor.cleanup(), reader.cleanup()]);
});

const upload = (client: ReturnType<typeof anon>, path: string) =>
  client.storage.from("covers").upload(path, png, { contentType: "image/png" });

describe("covers bucket", () => {
  it("lets staff upload, and anyone fetch the public URL", async () => {
    const path = `test/${randomUUID()}.png`;
    const { error } = await upload(editor.client, path);
    expect(error).toBeNull();
    paths.push(path);

    const response = await fetch(`${status.API_URL}/storage/v1/object/public/covers/${path}`);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
  });

  it("refuses uploads from readers and anon", async () => {
    const { error: readerError } = await upload(reader.client, `test/${randomUUID()}.png`);
    expect(readerError).not.toBeNull();
    const { error: anonError } = await upload(anon(), `test/${randomUUID()}.png`);
    expect(anonError).not.toBeNull();
  });

  it("can't be listed by anon", async () => {
    const { data } = await anon().storage.from("covers").list("test");
    expect(data ?? []).toEqual([]);
  });

  it("lets staff delete a cover", async () => {
    const path = `test/${randomUUID()}.png`;
    await upload(editor.client, path);
    const { data, error } = await editor.client.storage.from("covers").remove([path]);
    expect(error).toBeNull();
    expect(data).toHaveLength(1); // actually removed, not silently skipped
  });

  it("rejects non-image files", async () => {
    const { error } = await editor.client.storage
      .from("covers")
      .upload(`test/${randomUUID()}.html`, "<script>", { contentType: "text/html" });
    expect(error).not.toBeNull();
  });
});

describe("posts cover columns", () => {
  it("refuse a cover without alt text, size and source", async () => {
    const post = await insertPost("draft");
    try {
      const { error } = await service()
        .from("posts")
        .update({ cover_path: "x/y.png", cover_alt: " " })
        .eq("id", post.id);
      expect(error?.code).toBe("23514");
    } finally {
      await deletePosts([post.id]);
    }
  });
});
