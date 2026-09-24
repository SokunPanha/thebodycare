import "server-only";

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import { env } from "@/env";

import type { Database } from "./database.types";

/**
 * Request-scoped client that carries the signed-in user's session. RLS applies as that user.
 * Reading cookies opts the route into dynamic rendering — use it for admin and auth only.
 */
export async function createSessionClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component, where cookies are read-only. The proxy refreshes
            // the session instead, so this is safe to ignore.
          }
        },
      },
    },
  );
}

/**
 * Cookieless anon client for public reads. RLS applies as `anon`, so it only ever sees published
 * content — and because it touches no request state, public pages stay static/ISR.
 */
export function createPublicClient() {
  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
