// What each model call cost, for generation_runs.cost_usd and the daily cap. (PLAN.md §8, §12)

type Price = { inputPerMillion: number; outputPerMillion: number };

// Prefix-matched (as ../Youtube Automation's core/costs.py does), so dated or -preview suffixes
// still resolve. gemini-3.7-flash: $0.75 / $3.75 per 1M — introductory until 31 Dec 2026, then
// $1.50 / $7.50 (PLAN.md §8, verified 2026-09-24).
const TEXT_PRICES: [prefix: string, price: Price][] = [
  ["gemini-3.7-flash", { inputPerMillion: 0.75, outputPerMillion: 3.75 }],
];
// Embeddings are fractions of a cent per article; this rate is an estimate, not verified.
const EMBEDDING_PRICE_PER_MILLION_TOKENS = 0.15;

export type Usage = {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  thoughtsTokenCount?: number;
};

export function textCost(model: string, usage: Usage | undefined): number {
  const price = TEXT_PRICES.find(([prefix]) => model.startsWith(prefix))?.[1];
  if (!price) throw new Error(`No price for model ${model} — add it to lib/ai/costs.ts`);
  const input = usage?.promptTokenCount ?? 0;
  // Thought tokens bill as output, and can't be switched off on this model.
  const output = (usage?.candidatesTokenCount ?? 0) + (usage?.thoughtsTokenCount ?? 0);
  return (input * price.inputPerMillion + output * price.outputPerMillion) / 1_000_000;
}

/** Search grounding: billed per query the model actually ran (see env.ts for the rate's status). */
export function groundingCost(queries: number, perQueryUsd: number): number {
  return queries * perQueryUsd;
}

/** Roughly 4 characters per token. */
export function embeddingCost(characters: number): number {
  return (characters / 4 / 1_000_000) * EMBEDDING_PRICE_PER_MILLION_TOKENS;
}
