import { describe, expect, it, vi } from "vitest";

import { loadFixtures } from "../fixtures/scope/load";

// TESTING.md §1, end to end: every fixture through the real guard, classifier included.
// Calls Gemini on Vertex (~16 requests, a few cents). Run with `pnpm test:live`.

vi.mock("server-only", () => ({}));
const { guardScope } = await import("@/features/generation");

describe("scope guard (live Gemini)", () => {
  it.each(loadFixtures("violations"))("rejects $name with reason $reason", async (f) => {
    const result = await guardScope(f.draft);
    expect(result.ok, JSON.stringify(result.verdict)).toBe(false);
    expect(result.reason, JSON.stringify(result.verdict)).toBe(f.reason);
  });

  it.each(loadFixtures("valid"))("passes $name", async (f) => {
    const result = await guardScope(f.draft);
    expect(result.ok, JSON.stringify(result.verdict)).toBe(true); // false positives fail the build
  });
});
