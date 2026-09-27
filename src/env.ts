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

// `KEY=` in a .env file means "not set", not "set to an empty string".
const optionalSecret = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().min(1).optional(),
);

const serverSchema = z.object({
  // Bypasses RLS. Read ONLY by lib/supabase/admin.ts — rule 4, enforced by lint.
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // Gemini runs on Vertex AI (a service account), because AI Studio keys on the free tier can't
  // use Google Search grounding — which drafting depends on. (docs/spike/results/2026-09-27)
  // Optional so the public site builds without them; the pipeline fails loudly if they're missing.
  GOOGLE_CLOUD_PROJECT: optionalSecret,
  GOOGLE_CLOUD_LOCATION: z.string().min(1).default("global"),
  // Local: a path to the JSON key (kept in the gitignored .secrets/). Hosted: the JSON itself.
  GEMINI_SERVICE_ACCOUNT_FILE: optionalSecret,
  GEMINI_SERVICE_ACCOUNT_JSON: optionalSecret,
  // AI Studio key — not used by the pipeline (no grounding on the free tier); kept for tooling.
  GEMINI_API_KEY: optionalSecret,

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

  // Cover images — MiniMax image-01, via WaveSpeed (preferred, same as ../Youtube Automation) or
  // MiniMax directly. Both optional: without either, posts show a placeholder and staff can still
  // upload covers. MiniMax China-platform accounts use MINIMAX_API_BASE=https://api.minimaxi.com.
  WAVESPEED_API_KEY: optionalSecret,
  MINIMAX_API_KEY: optionalSecret,
  MINIMAX_API_BASE: z.url().default("https://api.minimax.io"),
  // What one cover costs, for the dashboard and the daily cap. MiniMax image-01 on WaveSpeed bills
  // $0.0035/image (confirmed in ../Youtube Automation/backend/core/costs.py, Jun 2026).
  GENERATION_COVER_COST_USD: z.coerce.number().min(0).default(0),
  // Google Search grounding, per search query. UNVERIFIED — Google's pricing page wouldn't load
  // on 2026-09-27; third-party sources say $14/1,000 queries on Gemini 3 ($35/1,000 prompts on
  // 2.x). Erring high is the safe direction for a spending cap. Check the Cloud billing report.
  GENERATION_GROUNDING_COST_PER_QUERY_USD: z.coerce.number().min(0).default(0.014),
  // Optional: healthchecks.io ping URL. Pinged after each successful cron run; a missed ping
  // emails you. (OPERATIONS.md §2)
  HEALTHCHECK_URL: z.url().optional(),

  // Review notifications — one email per cron run listing drafts awaiting review. Optional:
  // without SMTP_USER/SMTP_PASSWORD nothing is sent. Gmail needs an App Password, not the login.
  SMTP_HOST: z.string().min(1).default("smtp.gmail.com"),
  SMTP_PORT: z.coerce.number().int().positive().default(465),
  SMTP_USER: optionalSecret,
  // Gmail shows App Passwords in groups of four ("abcd efgh …"); the spaces aren't part of it.
  SMTP_PASSWORD: z.preprocess(
    (value) => (typeof value === "string" ? value.replace(/\s+/g, "") || undefined : value),
    z.string().min(1).optional(),
  ),
  // Comma-separated. Defaults to SMTP_USER — you email yourself.
  REVIEW_NOTIFY_TO: optionalSecret,

  // Later — optional until the newsletter ships.
  RESEND_API_KEY: optionalSecret,
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
