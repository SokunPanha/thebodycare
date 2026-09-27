import { describe, expect, it, vi } from "vitest";

import { baseDraft, loadFixtures } from "../../../../tests/fixtures/scope/load";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/ai/gemini", () => ({ generateJson: vi.fn() }));

const { deterministicViolations, guardScope } = await import("./guard-scope");

// TESTING.md §1 — the parts that need no model. The classifier's half is tests/live/.

const violations = loadFixtures("violations");
const valid = loadFixtures("valid");
// Caught without a model call; the rest (V2–V5, V7, V10) need the classifier.
const DETERMINISTIC = [
  "names-medication",
  "supplement-protocol",
  "missing-seek-care",
  "no-sources",
];

describe("scope guard — deterministic layer", () => {
  it.each(violations.filter((f) => DETERMINISTIC.includes(f.name)))(
    "rejects $name with reason $reason, without calling the model",
    async (f) => {
      const classify = vi.fn();
      const result = await guardScope(f.draft, { classify });
      expect(result.ok).toBe(false);
      expect(result.reason).toBe(f.reason);
      expect(classify).not.toHaveBeenCalled();
    },
  );

  it.each(valid)("never flags the must-pass trap $name (false positives fail the build)", (f) => {
    expect(deterministicViolations(f.draft)).toEqual([]);
  });

  it("passes the clean base article", () => {
    expect(deterministicViolations(baseDraft())).toEqual([]);
  });

  it("ignores drug names in source titles — sources may name drugs, prose may not (P5)", () => {
    const f = valid.find((v) => v.name === "cites-drug-study")!;
    expect(f.draft.sources.some((s) => /metformin/i.test(s.title))).toBe(true);
    expect(deterministicViolations(f.draft)).toEqual([]);
  });

  it("doesn't mistake 'insulin resistance' or 'sleep medicine' for medication", () => {
    const draft = baseDraft();
    draft.sections[0]!.body +=
      " Insulin resistance and sleep medicine research both touch on this.";
    expect(deterministicViolations(draft)).toEqual([]);
  });
});

describe("scope guard — classifier layer", () => {
  it("uses the classifier's verdict when the deterministic layer finds nothing", async () => {
    const f = violations.find((v) => v.name === "subtle-dosage")!;
    const classify = vi.fn().mockResolvedValue({
      verdict: {
        verdict: "fail",
        violations: [{ rule: "dosage", excerpt: "a teaspoon … three times a day" }],
      },
      costUsd: 0.001,
    });
    const result = await guardScope(f.draft, { classify });
    expect(classify).toHaveBeenCalledOnce();
    expect(result).toMatchObject({ ok: false, reason: "dosage", costUsd: 0.001 });
  });

  it("passes when the classifier passes", async () => {
    const classify = vi
      .fn()
      .mockResolvedValue({ verdict: { verdict: "pass", violations: [] }, costUsd: 0 });
    expect(await guardScope(baseDraft(), { classify })).toMatchObject({ ok: true, reason: null });
  });
});
