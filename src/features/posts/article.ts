import "server-only";

import { cache } from "react";

import { renderMarkdown, type TocHeading } from "@/lib/markdown/render";
import { articleGraph } from "@/lib/seo/json-ld";
import { coverUrl } from "@/lib/supabase/storage";
import { siteConfig } from "@/config/site";

import type { FaqItem } from "./components/faq-list";
import {
  getPostBySlug,
  getPostForStaff,
  listRelatedPosts,
  type PostListing,
  type PostWithSources,
  type StaffPost,
} from "./queries";
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

async function buildArticle(post: PostWithSources, related: PostListing[]): Promise<Article> {
  const [body, seekCare] = await Promise.all([
    renderMarkdown(post.body_md),
    renderMarkdown(post.when_to_seek_care),
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

/** Everything the article page renders, with markdown already turned into HTML. */
export async function getArticle(slug: string): Promise<Article | null> {
  const post = await getPublishedPost(slug);
  if (!post) return null;
  return buildArticle(post, await listRelatedPosts(post));
}

/**
 * A post of any status, rendered exactly as readers would see it — the review screen's preview.
 * Staff only (getPostForStaff checks).
 */
export async function getReviewArticle(
  id: string,
): Promise<{ post: StaffPost; article: Article } | null> {
  const post = await getPostForStaff(id);
  if (!post) return null;
  return { post, article: await buildArticle(post, []) };
}

/** The post's social card URL, versioned so an edit gets past platform caches. */
export function articleOgImage(post: { slug: string; updated_at: string }) {
  return `/og/posts/${post.slug}?v=${new Date(post.updated_at).getTime()}`;
}

/** Structured data for an article page — the cover photo when there is one, else the social card. */
export function articleJsonLd({ post, faq }: Article) {
  return articleGraph({
    ...post,
    faq,
    image: post.cover_path
      ? coverUrl(post.cover_path)
      : new URL(articleOgImage(post), siteConfig.url).toString(),
  });
}
