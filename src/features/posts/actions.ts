"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireStaff } from "@/features/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { readingTime } from "@/lib/utils/reading-time";

import { postEditSchema } from "./schema";

// Admin writes. Every action calls requireStaff() itself: a server action is a public POST
// endpoint, and the admin layout's guard never runs for it.

export type ActionState = { error: string | null };
export type EditState = ActionState & { fieldErrors?: Record<string, string[]> };

const idSchema = z.uuid();

/** Published content changed: every page may list it (home, category, related). */
function revalidateSite() {
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
