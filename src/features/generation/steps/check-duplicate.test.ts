import { describe, expect, it } from "vitest";

import { decideSemantic } from "./check-duplicate";

// TESTING.md §2 — the decision half. The database half is tests/integration/dedup.test.ts.
const n = (similarity: number) => ({
  kind: "post",
  id: "p",
  title: "Existing",
  excerpt: null,
  slug: "existing",
  similarity,
});

describe("decideSemantic", () => {
  it("D5: rejects a similarity exactly at the threshold — the boundary is inclusive", () => {
    expect(decideSemantic([n(0.86)], 0.86, "semantic_topic")).toMatchObject({
      ok: false,
      reason: "semantic_topic",
      score: 0.86,
    });
  });
  it("D6: passes a similarity 0.001 below the threshold", () => {
    expect(decideSemantic([n(0.859)], 0.86, "semantic_topic")).toMatchObject({ ok: true });
  });
  it("D9: passes with an empty corpus — no crash on no neighbours", () => {
    expect(decideSemantic([], 0.86, "semantic_topic")).toEqual({ ok: true, nearest: null });
  });
  it("judges by the nearest neighbour, whatever order they arrive in", () => {
    const verdict = decideSemantic([n(0.5), n(0.95), n(0.7)], 0.9, "semantic_body");
    expect(verdict).toMatchObject({ ok: false, reason: "semantic_body", score: 0.95 });
  });
});
