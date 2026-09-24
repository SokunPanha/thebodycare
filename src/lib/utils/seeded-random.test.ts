import { describe, expect, it } from "vitest";

import { seededRandom } from "./seeded-random";

describe("seededRandom", () => {
  it("is deterministic for a seed", () => {
    const a = seededRandom("why-you-wake-at-3am");
    const b = seededRandom("why-you-wake-at-3am");
    expect(Array.from({ length: 20 }, a.next)).toEqual(Array.from({ length: 20 }, b.next));
  });

  it("differs between seeds", () => {
    expect(seededRandom("a").next()).not.toBe(seededRandom("b").next());
  });

  it("stays within bounds", () => {
    const random = seededRandom("bounds");
    for (let i = 0; i < 1000; i++) {
      const n = random.next();
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(1);
      const k = random.int(2, 5);
      expect(k).toBeGreaterThanOrEqual(2);
      expect(k).toBeLessThanOrEqual(5);
    }
  });
});
