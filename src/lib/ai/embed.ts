import "server-only";

import { gemini } from "./gemini";
import { embeddingModel } from "./models";

/**
 * 768-dimension embeddings for dedup and related posts. SEMANTIC_SIMILARITY task type: every
 * comparison is text-to-text of the same kind (topic↔topic, body↔body).
 */
export async function embed(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const response = await gemini().models.embedContent({
    model: embeddingModel.id,
    contents: texts,
    config: { outputDimensionality: embeddingModel.dimensions, taskType: "SEMANTIC_SIMILARITY" },
  });
  const vectors = response.embeddings?.map((e) => e.values ?? []) ?? [];
  if (
    vectors.length !== texts.length ||
    vectors.some((v) => v.length !== embeddingModel.dimensions)
  ) {
    throw new Error(
      `Embedding shape mismatch: expected ${texts.length}×${embeddingModel.dimensions}`,
    );
  }
  return vectors;
}

/** pgvector's text format. */
export const toVector = (values: number[]) => `[${values.join(",")}]`;
