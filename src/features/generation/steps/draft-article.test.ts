import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/ai/gemini", () => ({ generateJson: vi.fn() }));
const { bodyMarkdown, keepKnownLinks } = await import("./draft-article");

describe("keepKnownLinks (M4.12)", () => {
  it("keeps links to the related posts the brief offered, unwraps the rest", () => {
    const md = "See [sleep cycles](/posts/sleep-cycles) and [made up](/posts/not-a-real-post).";
    expect(keepKnownLinks(md, new Set(["sleep-cycles"]))).toBe(
      "See [sleep cycles](/posts/sleep-cycles) and made up.",
    );
  });
  it("leaves external links alone", () => {
    const md = "The [NHS](https://www.nhs.uk) says so.";
    expect(keepKnownLinks(md, new Set())).toBe(md);
  });
});

describe("bodyMarkdown", () => {
  it("turns sections into ## headings", () => {
    const draft = {
      sections: [
        { heading: "One ", body: " First." },
        { heading: "Two", body: "Second." },
      ],
    };
    expect(bodyMarkdown(draft as never)).toBe("## One\n\nFirst.\n\n## Two\n\nSecond.");
  });
});
