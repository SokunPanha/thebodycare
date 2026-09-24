import Link from "next/link";

import type { Article } from "../article";
import { ArticleDisclaimer } from "./article-disclaimer";
import { FaqList } from "./faq-list";
import { KeyPoints } from "./key-points";
import { PostCover } from "./post-cover";
import { RelatedPosts } from "./related-posts";
import { SourceList } from "./source-list";
import { TableOfContents } from "./table-of-contents";
import { TrustBar } from "./trust-bar";
import { WhenToSeekCare } from "./when-to-seek-care";

/**
 * Eyebrow → headline → standfirst → trust bar → key points → body → when to seek care →
 * sources → disclaimer → related. (MVP.md §1)
 * Below 1024px: one 65ch column with the TOC inline. From 1024px: 65ch + a 280px sticky rail.
 */
export function ArticleView({ article }: { article: Article }) {
  const { post } = article;

  return (
    <>
      <div className="reading-progress" aria-hidden="true" />
      <div className="lg:grid lg:grid-cols-[minmax(0,var(--measure))_var(--rail)] lg:justify-between lg:gap-16">
        <article className="max-w-(--measure) min-w-0 pt-12">
          <header>
            <figure className="mb-8">
              <PostCover
                post={post}
                ratio="4/1"
                sizes="(min-width: 1024px) 720px, 100vw"
                className="rounded"
                eager
              />
              {post.cover_source === "ai" && (
                <figcaption className="mt-2 text-xs text-ink-muted">Image: AI-generated</figcaption>
              )}
            </figure>
            <Link href={`/category/${post.category.slug}`} className="eyebrow no-underline">
              {post.category.name}
            </Link>
            <h1 className="mt-3 text-2xl md:text-3xl">{post.title}</h1>
            <p className="mt-4 text-lg text-pretty text-ink-muted">{post.excerpt}</p>
            <div className="mt-6">
              <TrustBar post={post} />
            </div>
          </header>

          <div className="mt-8 space-y-8">
            <KeyPoints points={post.key_points} />
            <TableOfContents headings={article.headings} className="lg:hidden" />
            <div className="prose" dangerouslySetInnerHTML={{ __html: article.bodyHtml }} />
            <FaqList items={article.faq} />
            <WhenToSeekCare html={article.seekCareHtml} />
            <SourceList sources={post.sources} />
            <ArticleDisclaimer />
          </div>
        </article>

        <aside className="hidden lg:block">
          <TableOfContents headings={article.headings} className="sticky top-8 pt-12 xl:top-24" />
        </aside>
      </div>

      <div className="mt-16 max-w-(--measure)">
        <RelatedPosts posts={article.related} />
      </div>
    </>
  );
}
