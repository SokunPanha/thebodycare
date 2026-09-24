import "server-only";

import { createClient } from "@supabase/supabase-js";

import { env } from "@/env";

import type { Database } from "./database.types";

/**
 * ⚠ SERVICE ROLE — bypasses every RLS policy. (CLAUDE.md non-negotiable 4)
 *
 * The only reader of SUPABASE_SERVICE_ROLE_KEY. Import only from app/api/** and actions.ts;
 * lint enforces both. Leaking this client into a browser bundle exposes the whole database.
 */
export function createAdminClient() {
  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
