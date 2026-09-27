import { timingSafeEqual } from "node:crypto";

import { revalidateTag } from "next/cache";

import { generationConfig } from "@/config/generation";
import { env } from "@/env";
import { runPipeline } from "@/features/generation";
import { createAdminClient } from "@/lib/supabase/admin";
import { CONTENT_TAG } from "@/lib/supabase/server";

// The pipeline entrypoint (MVP.md M4.10). Vercel Cron calls this with
// `Authorization: Bearer <CRON_SECRET>`; anything else gets a 401 and nothing runs (TESTING G9).

// One call drafts GENERATION_POSTS_PER_DAY articles, ~1–2 minutes each with a cover.
export const maxDuration = 300;
export const dynamic = "force-dynamic";

function authorised(request: Request): boolean {
  const header = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${env.CRON_SECRET}`;
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: Request) {
  if (!authorised(request)) return new Response("Unauthorized", { status: 401 });

  const outcomes = await runPipeline(createAdminClient());

  // Only published posts change public pages; in_review drafts don't.
  if (generationConfig.autoPublish && outcomes.some((o) => o.status === "success")) {
    revalidateTag(CONTENT_TAG, "max");
  }

  // healthchecks.io: ping only when the run did its job — a missed or failed ping emails you
  // (OPERATIONS.md §2). A skip (lock held, cap reached, matrix empty) still counts as healthy.
  const failed = outcomes.some((o) => o.status === "failed");
  if (env.HEALTHCHECK_URL) {
    await fetch(failed ? `${env.HEALTHCHECK_URL}/fail` : env.HEALTHCHECK_URL, {
      method: "POST",
      body: JSON.stringify(outcomes).slice(0, 10_000),
      signal: AbortSignal.timeout(10_000),
    }).catch(() => {});
  }

  return Response.json({ outcomes }, { status: failed ? 500 : 200 });
}
