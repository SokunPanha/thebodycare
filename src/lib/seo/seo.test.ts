import { beforeAll, describe, expect, it, vi } from "vitest";

// TESTING.md §6: valid schema.org shape; no undefined in output; title/canonical/OG present.

let jsonLd: typeof import("./json-ld");
let metadata: typeof import("./metadata");

beforeAll(async () => {
  for (const [key, value] of Object.entries({
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
    NEXT_PUBLIC_SITE_URL: "https://thebodycue.com",
    SUPABASE_SERVICE_ROLE_KEY: "service",
    GEMINI_API_KEY: "gemini",
    CRON_SECRET: "x".repeat(32),
  })) {
    vi.stubEnv(key, value);
  }
  jsonLd = await import("./json-ld");
  metadata = await import("./metadata");
});

const base = {
  slug: "why-you-wake-at-3am",
  title: "Why you keep waking at 3am",
  excerpt: "Usually harmless.",
  published_at: "2026-09-20T00:00:00Z",
  updated_at: "2026-09-21T00:00:00Z",
  reviewed_at: "2026-09-20T00:00:00Z",
  author: null,
  reviewer: { display_name: "Dana Reviewer", credentials: "RN" },
  category: { slug: "sleep", name: "Sleep" },
  sources: [
    { url: "https://www.nhs.uk/conditions/insomnia/", title: "Insomnia", publisher: "NHS" },
  ],
  faq: [{ question: "Is it normal?", answer: "Usually." }],
  image: "https://thebodycue.com/og/posts/why-you-wake-at-3am?v=1",
};

type Node = Record<string, unknown>;
const byType = (graph: Node, type: string) =>
  (graph["@graph"] as Node[]).find((node) => node["@type"] === type)!;

function hasUndefined(value: unknown): boolean {
  if (value === undefined) return true;
  if (Array.isArray(value)) return value.some(hasUndefined);
  if (value && typeof value === "object") return Object.values(value).some(hasUndefined);
  return false;
}

describe("articleGraph", () => {
  it("builds Article, MedicalWebPage, BreadcrumbList and FAQPage with absolute URLs", () => {
    const graph = jsonLd.articleGraph({ ...base, source: "ai_reviewed" });
    expect(graph["@context"]).toBe("https://schema.org");
    const article = byType(graph, "Article");
    expect(article.headline).toBe(base.title);
    expect(article.datePublished).toBe(base.published_at);
    expect(article["@id"]).toBe("https://thebodycue.com/posts/why-you-wake-at-3am#article");
    expect((article.citation as Node[])[0]).toMatchObject({ url: base.sources[0]!.url });
    expect(byType(graph, "BreadcrumbList").itemListElement).toHaveLength(3);
    expect((byType(graph, "FAQPage").mainEntity as Node[])[0]).toMatchObject({
      name: "Is it normal?",
    });
  });

  it("credits a reviewer only when one actually reviewed it", () => {
    const reviewed = byType(
      jsonLd.articleGraph({ ...base, source: "ai_reviewed" }),
      "MedicalWebPage",
    );
    expect(reviewed.reviewedBy).toMatchObject({
      "@type": "Person",
      name: "Dana Reviewer",
      jobTitle: "RN",
    });
    expect(reviewed.lastReviewed).toBe(base.reviewed_at);

    const unreviewed = byType(jsonLd.articleGraph({ ...base, source: "ai" }), "MedicalWebPage");
    expect(unreviewed).not.toHaveProperty("reviewedBy");
    expect(unreviewed).not.toHaveProperty("lastReviewed");
  });

  it("attributes AI-drafted posts to the publication, not a person", () => {
    const article = byType(jsonLd.articleGraph({ ...base, source: "ai_reviewed" }), "Article");
    expect(article.author).toEqual({ "@id": "https://thebodycue.com/#organization" });
  });

  it("names a human author when there is one", () => {
    const article = byType(
      jsonLd.articleGraph({
        ...base,
        source: "human",
        author: { display_name: "Sam Writer", credentials: null },
      }),
      "Article",
    );
    expect(article.author).toEqual({ "@type": "Person", name: "Sam Writer" });
  });

  it("omits FAQPage when there are no questions, and never emits undefined", () => {
    for (const source of ["ai", "ai_reviewed", "human"] as const) {
      const graph = jsonLd.articleGraph({
        ...base,
        faq: [],
        sources: [],
        reviewer: null,
        published_at: null,
        source,
      });
      expect((graph["@graph"] as Node[]).some((node) => node["@type"] === "FAQPage")).toBe(false);
      expect(hasUndefined(graph), source).toBe(false);
      expect(JSON.stringify(graph)).not.toContain("null");
    }
  });
});

describe("serializeJsonLd", () => {
  it("escapes < so a title can't close the script tag", () => {
    const out = jsonLd.serializeJsonLd({ name: "</script><script>alert(1)</script>" });
    expect(out).not.toContain("<");
    expect(JSON.parse(out)).toEqual({ name: "</script><script>alert(1)</script>" });
  });
});

describe("websiteGraph", () => {
  it("declares a search action pointing at /search", () => {
    const site = byType(jsonLd.websiteGraph(), "WebSite");
    expect(site.potentialAction).toMatchObject({
      target: { urlTemplate: "https://thebodycue.com/search?q={search_term_string}" },
    });
  });
});

describe("pageMetadata", () => {
  it("sets title, canonical, OG and Twitter", () => {
    const meta = metadata.pageMetadata({
      title: "Sleep",
      description: "About sleep",
      path: "/category/sleep",
    });
    expect(meta.title).toBe("Sleep");
    expect(meta.alternates?.canonical).toBe("/category/sleep");
    expect(meta.openGraph).toMatchObject({
      url: "https://thebodycue.com/category/sleep",
      siteName: "The Body Cue",
      type: "website",
    });
    expect(meta.twitter).toMatchObject({ card: "summary_large_image", images: ["/og/default"] });
    expect(meta.openGraph).toMatchObject({
      images: [{ url: "/og/default", width: 1200, height: 630 }],
    });
    expect(meta.robots).toBeUndefined();
  });

  it("adds article times and noindex when asked", () => {
    const meta = metadata.pageMetadata({
      title: "T",
      description: "D",
      path: "/posts/t",
      type: "article",
      publishedTime: "2026-09-20T00:00:00Z",
      noindex: true,
    });
    expect(meta.openGraph).toMatchObject({
      type: "article",
      publishedTime: "2026-09-20T00:00:00Z",
    });
    expect(meta.robots).toEqual({ index: false, follow: true });
    expect(hasUndefined(meta)).toBe(false);
  });
});
