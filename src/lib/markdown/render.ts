import type { Element, Root } from "hast";
import { toString } from "hast-util-to-string";
import type { Heading as MdHeading, Root as MdRoot } from "mdast";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { visit } from "unist-util-visit";

// Markdown → HTML for article bodies. Bodies are AI-drafted, so this pipeline trusts nothing:
// raw HTML in the source is dropped (remark-rehype's default), never passed through.

export type TocHeading = { id: string; text: string; depth: 2 | 3 };
export type RenderedMarkdown = { html: string; headings: TocHeading[] };

/** The page's <h1> is the post title, so body headings start at h2 and stop at h3. */
function remarkClampHeadings() {
  return (tree: MdRoot) => {
    visit(tree, "heading", (node: MdHeading) => {
      node.depth = Math.min(Math.max(node.depth, 2), 3) as MdHeading["depth"];
    });
  };
}

/** Collects h2/h3 for the table of contents, after rehype-slug has assigned ids. */
function rehypeCollectHeadings(headings: TocHeading[]) {
  return () => (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "h2" && node.tagName !== "h3") return;
      const id = node.properties.id;
      if (typeof id !== "string") return;
      headings.push({ id, text: toString(node), depth: node.tagName === "h2" ? 2 : 3 });
    });
  };
}

// http(s), mailto, site-relative paths and in-page anchors. Anything else — javascript:, data:,
// vbscript: — loses its href and renders as plain text.
const SAFE_HREF = /^(https?:\/\/|mailto:|\/(?!\/)|#)/i;

/**
 * External links open in place (no target=_blank — readers keep their back button) but carry
 * rel="noopener nofollow" so AI-cited URLs don't pass ranking signal by default.
 */
function rehypeLinks() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "a") return;
      const href = node.properties.href;
      if (typeof href !== "string" || !SAFE_HREF.test(href)) {
        delete node.properties.href;
        return;
      }
      if (/^https?:\/\//i.test(href)) node.properties.rel = ["noopener", "nofollow"];
    });
  };
}

/** Wide tables scroll inside themselves so the page never scrolls sideways. (DESIGN.md §9) */
function rehypeWrapTables() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element, index, parent) => {
      if (node.tagName !== "table" || !parent || index === undefined) return;
      parent.children[index] = {
        type: "element",
        tagName: "div",
        properties: {
          className: ["table-scroll"],
          tabIndex: 0,
          role: "region",
          ariaLabel: "Table",
        },
        children: [node],
      };
    });
  };
}

export async function renderMarkdown(markdown: string): Promise<RenderedMarkdown> {
  const headings: TocHeading[] = [];
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkClampHeadings)
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypeCollectHeadings(headings))
    .use(rehypeLinks)
    .use(rehypeWrapTables)
    .use(rehypeStringify)
    .process(markdown);

  return { html: String(file), headings };
}
