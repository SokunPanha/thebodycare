import "server-only";

import { z } from "zod";

import { env } from "@/env";

import { imageModels } from "./models";

// MiniMax text-to-image. https://platform.minimax.io/docs/api-reference/image-generation-t2i

export type AspectRatio = "1:1" | "16:9" | "4:3" | "3:2" | "2:3" | "3:4" | "9:16" | "21:9";

// Parsed, not trusted (CLAUDE.md non-negotiable 5 applies to every model response).
const responseSchema = z.object({
  data: z.object({ image_base64: z.array(z.string().min(1)).min(1) }).nullish(),
  base_resp: z.object({ status_code: z.number(), status_msg: z.string().optional() }),
});

/**
 * Transient failures are worth one retry later; permanent ones aren't — retrying a bad key or an
 * empty balance just burns time. (Same split as ../Youtube Automation's gemini_text.py.)
 */
export class ImageGenerationError extends Error {
  constructor(
    message: string,
    readonly code: number | null,
    readonly transient: boolean,
  ) {
    super(message);
    this.name = "ImageGenerationError";
  }
}

const TRANSIENT = new Set([1000, 1001, 1002, 1013]); // unknown, timeout, rate limit, internal
const REASONS: Record<number, string> = {
  1002: "MiniMax rate limit reached — try again shortly.",
  1004: "MiniMax rejected the API key — check MINIMAX_API_KEY.",
  1008: "MiniMax account balance is too low.",
  1026: "MiniMax flagged the prompt as sensitive. Try a different angle or upload a cover.",
};

export function isImageGenerationConfigured() {
  return Boolean(env.MINIMAX_API_KEY);
}

export async function generateImage({
  prompt,
  aspectRatio = "3:2",
  seed,
}: {
  prompt: string;
  aspectRatio?: AspectRatio;
  seed?: number;
}): Promise<Buffer> {
  if (!env.MINIMAX_API_KEY) {
    throw new ImageGenerationError("MINIMAX_API_KEY is not set.", null, false);
  }

  let response: Response;
  try {
    response = await fetch(`${env.MINIMAX_API_BASE}/v1/image_generation`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.MINIMAX_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: imageModels.cover.model,
        prompt: prompt.slice(0, 1500), // API limit
        aspect_ratio: aspectRatio,
        // base64, not url: MiniMax URLs expire after 24 hours; we store the bytes ourselves.
        response_format: "base64",
        n: 1,
        prompt_optimizer: false,
        ...(seed === undefined ? {} : { seed }),
      }),
      signal: AbortSignal.timeout(90_000),
    });
  } catch (error) {
    throw new ImageGenerationError(`MiniMax request failed: ${String(error)}`, null, true);
  }

  if (!response.ok) {
    throw new ImageGenerationError(
      `MiniMax HTTP ${response.status}`,
      response.status,
      response.status >= 500 || response.status === 429,
    );
  }

  const parsed = responseSchema.safeParse(await response.json().catch(() => null));
  if (!parsed.success) {
    throw new ImageGenerationError("MiniMax returned an unexpected response shape.", null, false);
  }

  const { base_resp: status, data } = parsed.data;
  if (status.status_code !== 0 || !data) {
    const code = status.status_code;
    throw new ImageGenerationError(
      REASONS[code] ?? `MiniMax error ${code}: ${status.status_msg ?? "unknown"}`,
      code,
      TRANSIENT.has(code),
    );
  }

  return Buffer.from(data.image_base64[0]!, "base64");
}
