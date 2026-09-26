import { siteConfig } from "@/config/site";

// Structured data. (MVP.md M6.2) Honest in the same way the trust bar is: `reviewedBy` appears
// only when a named person reviewed the article, and AI-drafted posts are authored by the
// publication, never attributed to a person who didn't write them.

type Thing = Record<string, unknown>;

const absolute = (path: string) => new URL(path, siteConfig.url).toString();

/** Drops undefined/null/empty-array values so the output never carries `"x": undefined`. */
function clean<T extends Thing>(object: T): T {
  return Object.fromEntries(
    Object.entries(object).filter(
      ([, value]) =>
        value !== undefined && value !== null && !(Array.isArray(value) && value.length === 0),
    ),
  ) as T;
}

export function organization(): Thing {
  return {
    "@type": "Organization",
    "@id": absolute("/#organization"),
    name: siteConfig.name,
    url: siteConfig.url,
    logo: { "@type": "ImageObject", url: absolute("/brand/logo.png"), width: 512, height: 512 },
  };
}

/** The home page: the site, its publisher, and its search — eligible for a sitelinks search box. */
export function websiteGraph(): Thing {
  return {
    "@context": "https://schema.org",
    "@graph": [
      organization(),
      {
        "@type": "WebSite",
        "@id": absolute("/#website"),
        name: siteConfig.name,
        url: siteConfig.url,
        description: siteConfig.description,
        publisher: { "@id": absolute("/#organization") },
        inLanguage: "en",
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${absolute("/search")}?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };
}

type Person = { display_name: string | null; credentials: string | null } | null;

export type ArticleInput = {
  slug: string;
  title: string;
  excerpt: string;
  source: "human" | "ai" | "ai_reviewed";
  published_at: string | null;
  updated_at: string;
  reviewed_at: string | null;
  author: Person;
  reviewer: Person;
  category: { slug: string; name: string };
  sources: { url: string; title: string; publisher: string }[];
  faq: { question: string; answer: string }[];
  image: string;
};

function person(p: Person): Thing | undefined {
  if (!p?.display_name) return undefined;
  return clean({ "@type": "Person", name: p.display_name, jobTitle: p.credentials ?? undefined });
}

/** Article + MedicalWebPage + BreadcrumbList (+ FAQPage when the article has questions). */
export function articleGraph(post: ArticleInput): Thing {
  const url = absolute(`/posts/${post.slug}`);
  const categoryUrl = absolute(`/category/${post.category.slug}`);
  const reviewer = post.source === "ai" ? undefined : person(post.reviewer);
  const author =
    post.source === "human"
      ? (person(post.author) ?? { "@id": absolute("/#organization") })
      : { "@id": absolute("/#organization") };

  const graph: Thing[] = [
    organization(),
    clean({
      "@type": "MedicalWebPage",
      "@id": `${url}#webpage`,
      url,
      name: post.title,
      description: post.excerpt,
      inLanguage: "en",
      isPartOf: { "@id": absolute("/#website") },
      breadcrumb: { "@id": `${url}#breadcrumb` },
      mainEntity: { "@id": `${url}#article` },
      lastReviewed: reviewer ? (post.reviewed_at ?? undefined) : undefined,
      reviewedBy: reviewer,
      audience: { "@type": "PeopleAudience", audienceType: "Patient" },
    }),
    clean({
      "@type": "Article",
      "@id": `${url}#article`,
      headline: post.title,
      description: post.excerpt,
      image: [post.image],
      datePublished: post.published_at ?? undefined,
      dateModified: post.updated_at,
      author,
      publisher: { "@id": absolute("/#organization") },
      articleSection: post.category.name,
      mainEntityOfPage: { "@id": `${url}#webpage` },
      citation: post.sources.map((source) => ({
        "@type": "CreativeWork",
        name: source.title,
        url: source.url,
        publisher: { "@type": "Organization", name: source.publisher },
      })),
    }),
    {
      "@type": "BreadcrumbList",
      "@id": `${url}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
        { "@type": "ListItem", position: 2, name: post.category.name, item: categoryUrl },
        { "@type": "ListItem", position: 3, name: post.title, item: url },
      ],
    },
  ];

  if (post.faq.length > 0) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      mainEntity: post.faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
}

/**
 * Serialises for a <script type="application/ld+json">. `<` is escaped so a title containing
 * "</script>" can't close the tag and inject markup (Next.js JSON-LD guide).
 */
export function serializeJsonLd(data: Thing): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
