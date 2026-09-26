import "server-only";

import { z } from "zod";

import { env } from "@/env";

import { ImageGenerationError } from "./image-errors";
import { imageModels } from "./models";

// MiniMax image-01 hosted on WaveSpeed — the same backend ../Youtube Automation runs in production
// (stages/images.py: _wavespeed_generate). Asynchronous: create a prediction, poll it, download.

const BASE = "https://api.wavespeed.ai/api/v3";
const POLL_INTERVAL_MS = 2_000;
const POLL_TIMEOUT_MS = 120_000;

// WaveSpeed sizes are "W*H". 16:9 matches the article cover and crops cleanly to the 16:10 cards.
const SIZES = { "16:9": "1344*768", "1:1": "1024*1024", "4:3": "1152*896" } as const;
export type WavespeedAspect = keyof typeof SIZES;

// Parsed, not trusted (CLAUDE.md non-negotiable 5).
const createSchema = z.object({
  data: z.object({ id: z.string().min(1) }).optional(),
  id: z.string().optional(),
  message: z.string().optional(),
});
const resultSchema = z.object({
  data: z.object({
    status: z.string(),
    outputs: z.array(z.string()).nullish(),
    error: z.string().nullish(),
  }),
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** A failed prediction whose reason is a content refusal — deterministic, not worth retrying. */
const isRejection = (text: string) => /nsfw|sensitive|policy|moderat|blocked|violat/i.test(text);

async function createPrediction(prompt: string, aspect: WavespeedAspect, seed?: number) {
  let response: Response;
  try {
    response = await fetch(`${BASE}/${imageModels.cover.wavespeed}/text-to-image`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.WAVESPEED_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: prompt.slice(0, 1500),
        size: SIZES[aspect],
        num_images: 1,
        ...(seed === undefined ? {} : { seed }),
      }),
      signal: AbortSignal.timeout(30_000),
    });
  } catch (error) {
    throw new ImageGenerationError(`WaveSpeed request failed: ${String(error)}`, null, true);
  }

  const body = createSchema.safeParse(await response.json().catch(() => ({})));
  const id = body.success ? (body.data.data?.id ?? body.data.id) : undefined;
  if (response.ok && id) return id;

  const message = (body.success && body.data.message) || `HTTP ${response.status}`;
  // "Concurrency limit" is WaveSpeed's busy signal, not a balance problem, even when the message
  // suggests topping up to raise it.
  const concurrency = /concurrency/i.test(message);
  if (!concurrency && /insufficient|not enough|balance/i.test(message)) {
    throw new ImageGenerationError(
      `WaveSpeed balance is too low: ${message}`,
      response.status,
      false,
    );
  }
  if (response.status === 401 || response.status === 403) {
    throw new ImageGenerationError(
      "WaveSpeed rejected the API key — check WAVESPEED_API_KEY (an unfunded account can also return 401).",
      response.status,
      false,
    );
  }
  const transient = concurrency || response.status === 429 || response.status >= 500;
  throw new ImageGenerationError(
    concurrency
      ? "WaveSpeed is busy (concurrency limit) — try again in a moment."
      : `WaveSpeed: ${message}`,
    response.status,
    transient,
  );
}

type Poll = { intervalMs: number; timeoutMs: number };

async function awaitResult(id: string, poll: Poll): Promise<string> {
  const deadline = Date.now() + poll.timeoutMs;
  while (Date.now() < deadline) {
    await sleep(poll.intervalMs);
    let response: Response;
    try {
      response = await fetch(`${BASE}/predictions/${id}/result`, {
        headers: { Authorization: `Bearer ${env.WAVESPEED_API_KEY}` },
        signal: AbortSignal.timeout(30_000),
      });
    } catch {
      continue; // a network blip on our side isn't a verdict — the prediction is still running
    }
    if ([400, 401, 403, 404, 422].includes(response.status)) {
      throw new ImageGenerationError(
        `WaveSpeed result lookup failed (HTTP ${response.status}).`,
        response.status,
        false,
      );
    }
    if (!response.ok) continue;

    const parsed = resultSchema.safeParse(await response.json().catch(() => null));
    if (!parsed.success) continue;
    const { status, outputs, error } = parsed.data.data;

    if (status === "completed") {
      const url = outputs?.[0];
      if (!url)
        throw new ImageGenerationError("WaveSpeed returned no image (filtered).", null, false);
      return url;
    }
    if (status === "failed") {
      const reason = error ?? "unknown reason";
      throw new ImageGenerationError(
        isRejection(reason)
          ? "The image service refused this prompt as sensitive. Try again, or upload a cover."
          : `WaveSpeed prediction failed: ${reason}`,
        null,
        !isRejection(reason),
      );
    }
    // "created" / "processing" — keep polling
  }
  throw new ImageGenerationError("WaveSpeed timed out waiting for the image.", null, true);
}

export async function generateWavespeedImage({
  prompt,
  aspect = "16:9",
  seed,
  poll = { intervalMs: POLL_INTERVAL_MS, timeoutMs: POLL_TIMEOUT_MS },
}: {
  prompt: string;
  aspect?: WavespeedAspect;
  seed?: number;
  /** Tests shorten these; production uses the defaults. */
  poll?: Poll;
}): Promise<Buffer> {
  if (!env.WAVESPEED_API_KEY) {
    throw new ImageGenerationError("WAVESPEED_API_KEY is not set.", null, false);
  }

  // Creating a prediction retries transient failures (network, busy, 5xx) — nothing has been
  // paid for yet, so a retry is free. Permanent ones (bad key, no balance) throw straight away.
  let id: string | undefined;
  for (let attempt = 1; !id; attempt++) {
    try {
      id = await createPrediction(prompt, aspect, seed);
    } catch (error) {
      if (!(error instanceof ImageGenerationError) || !error.transient || attempt >= 3) throw error;
      await sleep(poll.intervalMs * 1_500 * attempt);
    }
  }

  const url = await awaitResult(id, poll);

  // The image exists and has been paid for — retry the download rather than lose it to a blip.
  for (let attempt = 1; ; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(60_000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      if (attempt >= 3) {
        throw new ImageGenerationError(
          `Couldn't download the finished image: ${String(error)}`,
          null,
          true,
        );
      }
      await sleep(poll.intervalMs * attempt);
    }
  }
}
