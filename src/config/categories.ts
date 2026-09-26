// Each topic's soft tint — used on topic tiles, category headers and cover placeholders.
// Decorative only: a category is always also named in text. (DESIGN.md §2)

export type Tint = "sage" | "peach" | "sky" | "lilac" | "butter";

const tints: Record<string, Tint> = {
  sleep: "lilac",
  digestion: "peach",
  movement: "sage",
  food: "butter",
  mind: "sky",
  "everyday-body": "peach",
  prevention: "sage",
};

export function categoryTint(slug: string): Tint {
  return tints[slug] ?? "sage";
}

// Full class names, so Tailwind can see them. (No string-built class names.)
export const tintBg: Record<Tint, string> = {
  sage: "bg-tint-sage",
  peach: "bg-tint-peach",
  sky: "bg-tint-sky",
  lilac: "bg-tint-lilac",
  butter: "bg-tint-butter",
};

/** A second tint for the placeholder gradient's other corner. */
export const tintPartner: Record<Tint, Tint> = {
  sage: "sky",
  peach: "butter",
  sky: "lilac",
  lilac: "peach",
  butter: "sage",
};
