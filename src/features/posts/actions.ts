"use server";

import { randomUUID } from "node:crypto";

import { imageSize } from "image-size";
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

const COVER_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
};
const MIN_COVER_WIDTH = 1200;

export type CoverState = { error: string | null; done?: boolean };

/**
 * Stores bytes as the post's cover: upload → point the post at it → delete the old file.
 * The new file is uploaded first and the old one deleted last, so a failure at any step leaves
 * the post with a working cover — never a broken one.
 */
async function storeCover(
  postId: string,
  bytes: Buffer,
  { alt, source, minWidth = 0 }: { alt: string; source: "ai" | "upload"; minWidth?: number },
): Promise<CoverState> {
  let size: ReturnType<typeof imageSize>;
  try {
    size = imageSize(bytes);
  } catch {
    return { error: "That file isn't a readable image." };
  }
  const contentType = size.type ? COVER_TYPES[size.type] : undefined;
  if (!contentType || !size.width || !size.height) {
    return { error: "Use a JPEG, PNG, WebP or AVIF image." };
  }
  if (size.width < minWidth) {
    return { error: `Covers need to be at least ${minWidth}px wide (this is ${size.width}px).` };
  }

  const supabase = await createSessionClient();
  const { data: post, error: readError } = await supabase
    .from("posts")
    .select("cover_path, status")
    .eq("id", postId)
    .single();
  if (readError) return { error: readError.message };

  const path = `${postId}/${randomUUID()}.${size.type}`;
  const storage = supabase.storage.from(COVERS_BUCKET);
  const { error: uploadError } = await storage.upload(path, bytes, {
    contentType,
    cacheControl: "31536000", // a path is never reused, so the file can be cached forever
    upsert: false,
  });
  if (uploadError) return { error: uploadError.message };

  const { error: updateError } = await supabase
    .from("posts")
    .update({
      cover_path: path,
      cover_alt: alt,
      cover_width: size.width,
      cover_height: size.height,
      cover_source: source,
    })
    .eq("id", postId);
  if (updateError) {
    await storage.remove([path]);
    return { error: updateError.message };
  }

  if (post.cover_path) await storage.remove([post.cover_path]);
  if (post.status === "published") revalidateSite();
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

export type BulkCoverState = { error: string | null; done?: number; failed?: number };

// Each image takes 10–30s; five per click stays inside one server function's time limit.
const COVERS_PER_BATCH = 5;

/** Fills in covers for posts that don't have one, newest first, a batch at a time. */
export async function generateMissingCovers(_previous: BulkCoverState): Promise<BulkCoverState> {
  await requireStaff();
  if (!isImageGenerationConfigured()) {
    return {
      error:
        "Image generation isn't set up — add WAVESPEED_API_KEY (or MINIMAX_API_KEY) to the environment.",
    };
  }

  const supabase = await createSessionClient();
  const { data: posts, error } = await supabase
    .from("posts")
    .select("id")
    .is("cover_path", null)
    .neq("status", "archived")
    .order("created_at", { ascending: false })
    .limit(COVERS_PER_BATCH);
  if (error) return { error: error.message };

  let done = 0;
  const failures: string[] = [];
  // One at a time: parallel requests would trip MiniMax's rate limit (status 1002).
  for (const post of posts) {
    const result = await createAiCover(post.id);
    if (result.error) failures.push(result.error);
    else done++;
  }
  return {
    error: failures.length
      ? `${failures.length} failed: ${[...new Set(failures)].join(" ")}`
      : null,
    done,
    failed: failures.length,
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
