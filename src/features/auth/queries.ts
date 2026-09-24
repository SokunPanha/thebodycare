import "server-only";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { createSessionClient } from "@/lib/supabase/server";

export type Staff = {
  id: string;
  email: string;
  display_name: string | null;
  role: "admin" | "editor";
};

/**
 * The signed-in user, if they are staff (admin or editor). Null for everyone else.
 *
 * auth.getUser() verifies the token with the auth server rather than trusting the cookie, so a
 * forged or revoked session fails here. Memoised per request: the layout and a page can both call it.
 */
export const getCurrentStaff = cache(async (): Promise<Staff | null> => {
  const supabase = await createSessionClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("display_name, role")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw error;
  if (!profile || (profile.role !== "admin" && profile.role !== "editor")) return null;

  return { id: user.id, email: user.email, display_name: profile.display_name, role: profile.role };
});

/**
 * The authorisation check for every admin page and server action — each must call it itself;
 * a layout-level call does not stop a page's content being streamed (see (admin)/admin/layout.tsx). Anyone who isn't staff —
 * signed out or a plain reader — gets a 404: no redirect loop, and no hint that /admin exists.
 * (MVP.md M5.1)
 */
export async function requireStaff(): Promise<Staff> {
  const staff = await getCurrentStaff();
  if (!staff) notFound();
  return staff;
}

/**
 * Metadata for admin routes. A static `metadata` export renders even when the page 404s, so the
 * title alone would reveal that /admin exists. Non-staff get the 404 page's own title instead.
 */
export async function staffMetadata(title: string): Promise<Metadata> {
  const robots = { index: false, follow: false };
  if (!(await getCurrentStaff())) return { robots };
  return { title: `${title} · Admin`, robots };
}
