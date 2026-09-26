// Every AI model ID in the project, and nowhere else. (CLAUDE.md "Gotchas")
// Verify against the provider's docs before changing — never from memory.

export const imageModels = {
  /**
   * Cover images: MiniMax `image-01`. Direct ID verified 2026-09-25 against
   * https://platform.minimax.io/docs/api-reference/image-generation-t2i; the WaveSpeed path is the
   * one ../Youtube Automation runs in production (WAVESPEED_MODEL=minimax/image-01).
   */
  cover: { model: "image-01", wavespeed: "minimax/image-01" },
} as const;

// Text + embedding models (Gemini) land here in M4.
