import { describe, expect, it } from "vitest";

import { renderMarkdown } from "./render";

describe("renderMarkdown", () => {
  it("renders headings with ids and collects them for the TOC", async () => {
    const { html, headings } = await renderMarkdown("## Why it happens\n\ntext\n\n### At night\n");
    expect(html).toContain('<h2 id="why-it-happens">Why it happens</h2>');
    expect(headings).toEqual([
      { id: "why-it-happens", text: "Why it happens", depth: 2 },
      { id: "at-night", text: "At night", depth: 3 },
    ]);
  });

  it("clamps h1 to h2 and h4+ to h3 — the title is the page's only h1", async () => {
    const { html } = await renderMarkdown("# Top\n\n#### Deep");
    expect(html).toContain("<h2");
    expect(html).toContain("<h3");
    expect(html).not.toMatch(/<h[14]/);
  });

  it("drops raw HTML instead of passing it through", async () => {
    const { html } = await renderMarkdown('Hi <script>alert(1)</script> <img src=x onerror="x">');
    expect(html).not.toContain("<script");
    expect(html).not.toContain("onerror");
  });

  it("renders GFM tables inside a scroll wrapper", async () => {
    const { html } = await renderMarkdown("| a | b |\n|---|---|\n| 1 | 2 |");
    expect(html).toMatch(/<div class="table-scroll"[^>]*><table>/);
  });

  it("marks external links nofollow and leaves internal links alone", async () => {
    const { html } = await renderMarkdown("[nhs](https://www.nhs.uk) [ours](/posts/x)");
    expect(html).toContain('<a href="https://www.nhs.uk" rel="noopener nofollow">');
    expect(html).toContain('<a href="/posts/x">');
  });

  it("renders lists, emphasis and blockquotes", async () => {
    const { html } = await renderMarkdown("- **one**\n- two\n\n> quoted");
    expect(html).toContain("<strong>one</strong>");
    expect(html).toContain("<blockquote>");
  });

  it("strips unsafe link protocols", async () => {
    for (const href of [
      "javascript:alert(1)",
      "JAVASCRIPT:alert(1)",
      "data:text/html,x",
      "//evil.test",
    ]) {
      const { html } = await renderMarkdown(`[x](${href})`);
      expect(html, href).toBe("<p><a>x</a></p>");
    }
  });
});
