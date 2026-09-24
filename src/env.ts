import { z } from "zod";

/**
 * Every environment variable the app reads, validated once at boot.
 * Imported by next.config.ts, so a missing or malformed value fails `pnpm build`
 * instead of surfacing as an empty review queue a week later. (STRUCTURE.md §5)
 */

// Browser-safe. Anything here ships in the client bundle.
const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  // Canonical origin for metadata, sitemap and OG URLs. No trailing slash.
  NEXT_PUBLIC_SITE_URL: z.url().transform((url) => url.replace(/\/$/, "")),
});

const serverSchema = z.object({
  // Bypasses RLS. Read ONLY by lib/supabase/admin.ts — rule 4, enforced by lint.
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  GEMINI_API_KEY: z.string().min(1),

  // Generation — tuned in the first month, so config not code. (PLAN.md §3)
  GENERATION_POSTS_PER_DAY: z.coerce.number().int().min(0).max(8).default(2),
  GENERATION_AUTO_PUBLISH: z.stringbool().default(false),
  // Cosine similarity above which a candidate is a duplicate. Guesses until ~50 real drafts.
  DEDUPE_TOPIC_THRESHOLD: z.coerce.number().min(0).max(1).default(0.86),
  DEDUPE_BODY_THRESHOLD: z.coerce.number().min(0).max(1).default(0.9),
  // Checked before every model call, not after.
  GENERATION_DAILY_COST_CAP_USD: z.coerce.number().positive().default(1.5),

  // Guards /api/cron/generate. Vercel cron sends it as a bearer token.
  CRON_SECRET: z.string().min(32),

  // Later — optional until the newsletter ships.
  RESEND_API_KEY: z.string().min(1).optional(),
});

const isServer = typeof window === "undefined";

// NEXT_PUBLIC_* are inlined at build time only when referenced literally, so the
// browser needs this explicit object rather than `process.env` itself.
const clientRuntime = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
};

const parsed = isServer
  ? serverSchema.extend(clientSchema.shape).safeParse(process.env)
  : clientSchema.safeParse(clientRuntime);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(`Invalid environment variables:\n${issues}\n\nSee .env.example.`);
}

type Env = z.infer<typeof serverSchema> & z.infer<typeof clientSchema>;

/**
 * In the browser only the NEXT_PUBLIC_ keys exist; reading a server key there
 * throws instead of silently returning undefined.
 */
export const env = new Proxy(parsed.data as Env, {
  get(target, key) {
    if (!isServer && typeof key === "string" && !key.startsWith("NEXT_PUBLIC_")) {
      throw new Error(`Server-only env var "${key}" was read in the browser.`);
    }
    return Reflect.get(target, key);
  },
});
