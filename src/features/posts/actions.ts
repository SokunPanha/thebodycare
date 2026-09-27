"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireStaff } from "@/features/auth";
import { generationConfig } from "@/config/generation";
import { COVER_PROMPT_VERSION, coverImageAlt, coverImagePrompt } from "@/features/generation";
import {
  generateCoverImage,
  ImageGenerationError,
  isImageGenerationConfigured,
} from "@/lib/ai/image";
import { imageModels } from "@/lib/ai/models";
import { renderMarkdown } from "@/lib/markdown/render";
import { createAdminClient } from "@/lib/supabase/admin";
import { CONTENT_TAG, createSessionClient } from "@/lib/supabase/server";
import { COVERS_BUCKET } from "@/lib/supabase/storage";
import { readingTime } from "@/lib/utils/reading-time";

import { saveCover } from "./queries";
import { postEditSchema } from "./schema";

// Admin writes. Every action calls requireStaff() itself: a server action is a public POST
// endpoint, and the admin layout's guard never runs for it.

export type ActionState = { error: string | null };
export type EditState = ActionState & { fieldErrors?: Record<string, string[]> };

const idSchema = z.uuid();

/**
 * Published content changed: every page may list it (home, category, related, search, sitemaps).
 * Both are needed — the tag expires the cached *data*, the path the cached *pages*.
 */
function revalidateSite() {
  updateTag(CONTENT_TAG);
  revalidatePath("/", "layout");
}

export async function approvePost(postId: string, _previous: ActionState): Promise<ActionState> {
  await requireStaff();
  const id = idSchema.parse(postId);

  const supabase = await createSessionClient();
  const { data, error } = await supabase.rpc("approve_post", { p_post_id: id });
  // approve_post raises readable messages for rule failures (e.g. "Needs at least 3 sources").
  if (error) return { error: error.message };

  revalidateSite();
  redirect(`/admin/review?published=${encodeURIComponent(data[0]?.slug ?? "")}`);
}

/**
 * "Publish all" — every AI draft in the queue with 3+ sources goes live WITHOUT a reviewer: no
 * "Reviewed by", because nobody read them (owner's decision, 2026-09-27; EDITORIAL.md §7).
 */
export async function publishAllUnreviewed(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireStaff();
  // Exactly the drafts the editor saw on the page — not whatever arrived since.
  const ids = z.array(idSchema).min(1).max(100).safeParse(formData.getAll("id"));
  if (!ids.success) return { error: "Nothing to publish — reload the queue." };

  const supabase = await createSessionClient();
  const { data, error } = await supabase.rpc("publish_unreviewed", { p_post_ids: ids.data });
  if (error) return { error: error.message };

  revalidateSite();
  redirect(`/admin/review?publishedAll=${data}`);
}

export async function rejectPost(
  postId: string,
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireStaff();
  const id = idSchema.parse(postId);
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) return { error: "Say why — it's recorded against the topic." };

  const supabase = await createSessionClient();
  const { error } = await supabase.rpc("reject_post", { p_post_id: id, p_reason: reason });
  if (error) return { error: error.message };

  redirect("/admin/review?rejected=1");
}

export async function updatePost(
  postId: string,
  _previous: EditState,
  formData: FormData,
): Promise<EditState> {
  await requireStaff();
  const id = idSchema.parse(postId);

  const input = postEditSchema.safeParse(Object.fromEntries(formData));
  if (!input.success) {
    return {
      error: "Fix the highlighted fields.",
      fieldErrors: z.flattenError(input.error).fieldErrors,
    };
  }

  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("posts")
    .update({ ...input.data, reading_time_min: readingTime(input.data.body_md) })
    .eq("id", id)
    .select("status")
    .single();
  if (error) return { error: error.message };

  if (data.status === "published") {
    revalidateSite();
    redirect(`/admin/posts/${id}/edit?saved=1`);
  }
  redirect(`/admin/review/${id}`);
}

/**
 * Renders markdown through the same pipeline as the live site, for the editor's Preview tab —
 * so what the editor previews is exactly what readers will get.
 */
export async function previewMarkdown(markdown: string): Promise<string> {
  await requireStaff();
  const source = z.string().max(200_000).parse(markdown);
  return (await renderMarkdown(source)).html;
}

// ---------------------------------------------------------------------------
// Covers
// ---------------------------------------------------------------------------

const MIN_COVER_WIDTH = 1200;

export type CoverState = { error: string | null; done?: boolean };

/** Saves a cover as the signed-in editor (RLS applies), then refreshes the pages that show it. */
async function storeCover(
  postId: string,
  bytes: Buffer,
  options: { alt: string; source: "ai" | "upload"; minWidth?: number },
): Promise<CoverState> {
  const result = await saveCover(await createSessionClient(), postId, bytes, options);
  if (result.error) return { error: result.error };
  if (result.status === "published") revalidateSite();
  revalidatePath(`/admin/posts/${postId}/edit`);
  revalidatePath(`/admin/review/${postId}`);
  return { error: null, done: true };
}

export async function uploadCover(
  postId: string,
  _previous: CoverState,
  formData: FormData,
): Promise<CoverState> {
  await requireStaff();
  const id = idSchema.parse(postId);

  const file = formData.get("cover");
  const alt = String(formData.get("alt") ?? "").trim();
  if (!(file instanceof File) || file.size === 0) return { error: "Choose an image to upload." };
  if (!alt) return { error: "Describe the image for people who can't see it." };
  if (file.size > 5 * 1024 * 1024) return { error: "Images must be 5 MB or smaller." };

  return storeCover(id, Buffer.from(await file.arrayBuffer()), {
    alt,
    source: "upload",
    minWidth: MIN_COVER_WIDTH,
  });
}

/** Generates and stores an AI cover for one post. Callers have already checked staff. */
async function createAiCover(id: string): Promise<CoverState> {
  const supabase = await createSessionClient();
  const { data: post, error } = await supabase
    .from("posts")
    .select("title, excerpt, category:categories!inner ( name )")
    .eq("id", id)
    .single();
  if (error) return { error: error.message };

  const started = Date.now();
  // Runs are pipeline tables: staff can read them but only the service role writes. (0005)
  const runs = createAdminClient().from("generation_runs");
  const run = {
    post_id: id,
    model: imageModels.cover.model,
    prompt_version: COVER_PROMPT_VERSION,
    step: "cover",
  };

  let bytes: Buffer;
  try {
    bytes = await generateCoverImage(
      coverImagePrompt({ title: post.title, excerpt: post.excerpt, category: post.category.name }),
    );
  } catch (cause) {
    const message =
      cause instanceof ImageGenerationError ? cause.message : "Image generation failed.";
    await runs.insert({
      ...run,
      status: "failed",
      error: message,
      duration_ms: Date.now() - started,
    });
    return { error: message };
  }

  await runs.insert({
    ...run,
    status: "success",
    cost_usd: generationConfig.coverCostUsd,
    duration_ms: Date.now() - started,
    finished_at: new Date().toISOString(),
  });

  return storeCover(id, bytes, { alt: coverImageAlt(post.title), source: "ai" });
}

/** Generates a cover with MiniMax from the post's title and standfirst. Logged as a run. */
export async function generateAiCover(postId: string, _previous: CoverState): Promise<CoverState> {
  await requireStaff();
  const id = idSchema.parse(postId);
  if (!isImageGenerationConfigured()) {
    return {
      error:
        "Image generation isn't set up — add WAVESPEED_API_KEY (or MINIMAX_API_KEY) to the environment.",
    };
  }
  return createAiCover(id);
}

export type NextCoverResult = { remaining: number; title?: string; error?: string };

/**
 * Generates the cover for the newest post that lacks one — one per call, so each call fits inside
 * a server function's time limit however slow the image service is. The admin page calls it in a
 * loop and shows progress. Returns how many posts still need a cover afterwards.
 */
export async function generateNextMissingCover(): Promise<NextCoverResult> {
  await requireStaff();
  if (!isImageGenerationConfigured()) {
    return {
      remaining: 0,
      error: "Image generation isn't set up — add WAVESPEED_API_KEY to the environment.",
    };
  }

  const supabase = await createSessionClient();
  const missing = () =>
    supabase
      .from("posts")
      .select("id, title", { count: "exact" })
      .is("cover_path", null)
      .neq("status", "archived")
      .order("created_at", { ascending: false })
      .limit(1);

  const { data, count, error } = await missing();
  if (error) return { remaining: 0, error: error.message };
  const post = data[0];
  if (!post) return { remaining: 0 };

  const result = await createAiCover(post.id);
  const after = await missing();
  return {
    remaining: after.count ?? Math.max(0, (count ?? 1) - 1),
    title: post.title,
    ...(result.error ? { error: result.error } : {}),
  };
}

export async function removeCover(postId: string, _previous: CoverState): Promise<CoverState> {
  await requireStaff();
  const id = idSchema.parse(postId);
  const supabase = await createSessionClient();

  const { data: post, error } = await supabase
    .from("posts")
    .select("cover_path, status")
    .eq("id", id)
    .single();
  if (error) return { error: error.message };
  if (!post.cover_path) return { error: null, done: true };

  const { error: updateError } = await supabase
    .from("posts")
    .update({
      cover_path: null,
      cover_alt: null,
      cover_width: null,
      cover_height: null,
      cover_source: null,
    })
    .eq("id", id);
  if (updateError) return { error: updateError.message };

  await supabase.storage.from(COVERS_BUCKET).remove([post.cover_path]);
  if (post.status === "published") revalidateSite();
  revalidatePath(`/admin/posts/${id}/edit`);
  return { error: null, done: true };
}
