/**
 * Deterministic pseudo-random numbers from a string seed. The same seed always yields the same
 * sequence — on the server, in the browser, and across deploys — so a post's generated cover
 * never changes between renders.
 */

/** FNV-1a: a string → 32-bit unsigned integer. */
function hash(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export type Random = {
  /** [0, 1) */
  next: () => number;
  /** [min, max) */
  range: (min: number, max: number) => number;
  /** integer in [min, max] */
  int: (min: number, max: number) => number;
  pick: <T>(items: readonly T[]) => T;
};

/** mulberry32 — small, fast, and well distributed enough for generative art. */
export function seededRandom(seed: string): Random {
  let state = hash(seed);
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const range = (min: number, max: number) => min + next() * (max - min);
  return {
    next,
    range,
    int: (min, max) => Math.floor(range(min, max + 1)),
    pick: (items) => items[Math.floor(next() * items.length)]!,
  };
}
