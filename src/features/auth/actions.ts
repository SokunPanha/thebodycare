"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { createSessionClient } from "@/lib/supabase/server";

const signInSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export type SignInState = { error: string | null; email: string };

export async function signIn(_previous: SignInState, formData: FormData): Promise<SignInState> {
  const input = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  const email = typeof formData.get("email") === "string" ? String(formData.get("email")) : "";

  // One message for every failure, so the form can't be used to discover which emails exist.
  const failed = { error: "That email and password don't match an account.", email };
  if (!input.success) return failed;

  const supabase = await createSessionClient();
  const { error } = await supabase.auth.signInWithPassword(input.data);
  if (error) return failed;

  // A reader who signs in still gets the /admin 404 — authorisation is requireStaff()'s job.
  redirect("/admin");
}

export async function signOut() {
  const supabase = await createSessionClient();
  await supabase.auth.signOut();
  redirect("/");
}
