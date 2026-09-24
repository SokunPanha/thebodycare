import { createBrowserClient } from "@supabase/ssr";

import { env } from "@/env";

import type { Database } from "./database.types";

// Anon key + the user's session cookie. RLS applies. Used for client-side auth flows only.
export function createClient() {
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
