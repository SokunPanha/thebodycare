import type { Neighbour } from "../queries";

// Dedup decisions (PLAN.md §7, TESTING.md §2). Pure: the database finds the neighbours
// (public.nearest_content), this decides. The boundary is INCLUSIVE — a similarity exactly at the
// threshold is a duplicate (TESTING.md D5); an off-by-one here silently changes the whole content
// strategy, and would be invisible in manual testing.

export type DedupVerdict =
  | { ok: true; nearest: Neighbour | null }
  | {
      ok: false;
      reason: "exact_title" | "exact_slug" | "semantic_topic" | "semantic_body";
      nearest: Neighbour | null;
      score: number | null;
    };

export function decideSemantic(
  neighbours: Neighbour[],
  threshold: number,
  reason: "semantic_topic" | "semantic_body",
): DedupVerdict {
  const nearest = neighbours.reduce<Neighbour | null>(
    (best, n) => (best === null || n.similarity > best.similarity ? n : best),
    null,
  );
  if (nearest && nearest.similarity >= threshold) {
    return { ok: false, reason, nearest, score: nearest.similarity };
  }
  return { ok: true, nearest };
}

export function describeRejection(verdict: Extract<DedupVerdict, { ok: false }>): string {
  const what = verdict.nearest ? `"${verdict.nearest.title}"` : "existing content";
  switch (verdict.reason) {
    case "exact_title":
      return "An article or queued topic already has this exact title.";
    case "exact_slug":
      return "An article already uses this URL.";
    case "semantic_topic":
      return `Topic too close to ${what} (similarity ${verdict.score?.toFixed(3)}).`;
    case "semantic_body":
      return `Draft too close to ${what} (similarity ${verdict.score?.toFixed(3)}) even after one rewrite.`;
  }
}
