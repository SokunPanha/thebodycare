// Every AI model ID in the project, and nowhere else. (CLAUDE.md "Gotchas")
// Verify against the provider before changing — never from memory.

/**
 * Text. `gemini-3.7-flash` — confirmed available on this project's Vertex endpoint 2026-09-27, and
 * the spike ran on it (docs/spike/results/2026-09-27). `gemini-3.8-flash` exists; staying one
 * release behind is deliberate (PLAN.md §8). Thinking can't be turned off on this model and thought
 * tokens bill as output — never set a small maxOutputTokens.
 */
export const textModels = {
  draft: "gemini-3.7-flash",
  guard: "gemini-3.7-flash",
} as const;

/**
 * Embeddings. `gemini-embedding-001` at 768 dimensions (the pgvector columns' size, migration
 * 0002) — verified on Vertex 2026-09-27. `gemini-embedding-2` returned an unexpected shape.
 */
export const embeddingModel = { id: "gemini-embedding-001", dimensions: 768 } as const;

export const imageModels = {
  /**
   * Cover images: MiniMax `image-01`. Direct ID verified 2026-09-25 against
   * https://platform.minimax.io/docs/api-reference/image-generation-t2i; the WaveSpeed path is the
   * one ../Youtube Automation runs in production (WAVESPEED_MODEL=minimax/image-01).
   */
  cover: { model: "image-01", wavespeed: "minimax/image-01" },
} as const;
