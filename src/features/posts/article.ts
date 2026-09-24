import "server-only";

import { cache } from "react";

import { renderMarkdown, type TocHeading } from "@/lib/markdown/render";

import type { FaqItem } from "./components/faq-list";
import { getPostBySlug, listRelatedPosts, type PostListing, type PostWithSources } from "./queries";
import { faqSchema } from "./schema";

export type Article = {
  post: PostWithSources;
  bodyHtml: string;
  headings: TocHeading[];
  seekCareHtml: string;
  faq: FaqItem[];
  related: PostListing[];
};

/** Deduplicated per request: generateMetadata and the page share one database read. */
export const getPublishedPost = cache(getPostBySlug);

/** Everything the article page renders, with markdown already turned into HTML. */
export async function getArticle(slug: string): Promise<Article | null> {
  const post = await getPublishedPost(slug);
  if (!post) return null;

  const [body, seekCare, related] = await Promise.all([
    renderMarkdown(post.body_md),
    renderMarkdown(post.when_to_seek_care),
    listRelatedPosts(post),
  ]);

  const faq = faqSchema.safeParse(post.faq);

  return {
    post,
    bodyHtml: body.html,
    headings: body.headings,
    seekCareHtml: seekCare.html,
    // A malformed faq drops the section rather than breaking the article.
    faq: faq.success ? faq.data : [],
    related,
  };
}
