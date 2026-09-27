import { describe, expect, it } from "vitest";

import { slugify } from "./slug";

// TESTING.md §6. The -2 collision suffix is public.unique_post_slug() — tested in integration.
describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Why You Wake at 3am")).toBe("why-you-wake-at-3am");
  });
  it("drops punctuation and apostrophes", () => {
    expect(slugify("It's 3am — & You're Awake?!")).toBe("its-3am-youre-awake");
  });
  it("folds accents and handles unicode", () => {
    expect(slugify("Café naïve señor")).toBe("cafe-naive-senor");
    expect(slugify("睡眠 sleep")).toBe("sleep");
  });
  it("caps long titles at a word boundary", () => {
    const slug = slugify("word ".repeat(40));
    expect(slug.length).toBeLessThanOrEqual(80);
    expect(slug.endsWith("-")).toBe(false);
    expect(slug.split("-").every((part) => part === "word")).toBe(true);
  });
  it("never returns an empty slug", () => {
    expect(slugify("")).toBe("post");
    expect(slugify("!!!")).toBe("post");
  });
});
