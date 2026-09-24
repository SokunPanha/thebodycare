import { execSync } from "node:child_process";
import { randomUUID } from "node:crypto";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

// Integration tests run against the local stack from `pnpm db:start` — never a hosted project.
// Keys come from the CLI, so there's nothing to configure and no way to point this at production.

type Status = { API_URL: string; ANON_KEY: string; SERVICE_ROLE_KEY: string };

function readStatus(): Status {
  try {
    const raw = execSync("pnpm exec supabase status -o json", {
      stdio: ["ignore", "pipe", "pipe"],
    });
    const json = raw.toString();
    return JSON.parse(json.slice(json.indexOf("{"))) as Status;
  } catch {
    throw new Error("Local Supabase is not running. Start it with `pnpm db:start`.");
  }
}

export const status = readStatus();
if (!/^http:\/\/(127\.0\.0\.1|localhost)/.test(status.API_URL)) {
  throw new Error(`Refusing to run integration tests against ${status.API_URL}`);
}

const options = { auth: { persistSession: false, autoRefreshToken: false } };

export type Client = SupabaseClient<Database>;

export const anon = (): Client => createClient<Database>(status.API_URL, status.ANON_KEY, options);
export const service = (): Client =>
  createClient<Database>(status.API_URL, status.SERVICE_ROLE_KEY, options);

/** Creates a confirmed user with the given role and returns a client signed in as them. */
export async function signedInAs(role: Database["public"]["Enums"]["user_role"]) {
  const email = `test-${role}-${randomUUID()}@example.test`;
  const password = randomUUID();
  const admin = service();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  const userId = data.user.id;

  if (role !== "reader") {
    const { error: roleError } = await admin.from("profiles").update({ role }).eq("id", userId);
    if (roleError) throw roleError;
  }

  const client = anon();
  const { error: signInError } = await client.auth.signInWithPassword({ email, password });
  if (signInError) throw signInError;

  return {
    client,
    userId,
    cleanup: async () => {
      await admin.auth.admin.deleteUser(userId);
    },
  };
}

/** Inserts a valid post via the service role. Returns its id. */
export async function insertPost(status: Database["public"]["Enums"]["post_status"]) {
  const admin = service();
  const { data: category, error: categoryError } = await admin
    .from("categories")
    .select("id")
    .eq("slug", "sleep")
    .single();
  if (categoryError) throw categoryError;

  const slug = `test-${status.replace("_", "-")}-${randomUUID()}`;
  const { data, error } = await admin
    .from("posts")
    .insert({
      slug,
      title: `Test ${status} post`,
      excerpt: "A test standfirst.",
      key_points: ["One", "Two", "Three"],
      body_md: "Body.",
      when_to_seek_care: "- If it lasts more than three weeks.",
      category_id: category.id,
      status,
      published_at: status === "published" ? new Date().toISOString() : null,
    })
    .select("id, slug")
    .single();
  if (error) throw error;

  const { error: sourceError } = await admin.from("post_sources").insert({
    post_id: data.id,
    url: "https://www.nhs.uk/",
    title: "NHS",
    publisher: "NHS",
  });
  if (sourceError) throw sourceError;

  return data;
}

export async function deletePosts(ids: string[]) {
  await service().from("posts").delete().in("id", ids);
}
