import "server-only";

import { env } from "@/env";

import { generateMinimaxImage } from "./minimax";
import { generateWavespeedImage } from "./wavespeed";

export { ImageGenerationError } from "./image-errors";

/** Which service will draw covers: WaveSpeed if its key is set, else MiniMax directly, else none. */
export function imageProvider(): "wavespeed" | "minimax" | null {
  if (env.WAVESPEED_API_KEY) return "wavespeed";
  if (env.MINIMAX_API_KEY) return "minimax";
  return null;
}

export function isImageGenerationConfigured() {
  return imageProvider() !== null;
}

/** A 16:9 cover image (MiniMax image-01), from whichever provider is configured. */
export async function generateCoverImage(prompt: string): Promise<Buffer> {
  return imageProvider() === "wavespeed"
    ? generateWavespeedImage({ prompt, aspect: "16:9" })
    : generateMinimaxImage({ prompt, aspectRatio: "16:9" });
}
