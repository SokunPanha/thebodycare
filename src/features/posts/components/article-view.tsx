import Link from "next/link";

import type { Article } from "../article";
import { ArticleDisclaimer } from "./article-disclaimer";
import { FaqList } from "./faq-list";
import { KeyPoints } from "./key-points";
import { PostCover } from "./post-cover";
import { RelatedPosts } from "./related-posts";
import { SourceList } from "./source-list";
import { TableOfContents } from "./table-of-contents";
import { TopicPill } from "./topic-pill";
import { TrustBar } from "./trust-bar";
import { WhenToSeekCare } from "./when-to-seek-care";

/**
 * Topic → headline → standfirst → cover → trust bar → key points → body → FAQ → when to seek care
 * → sources → disclaimer → related. From 1024px the table of contents sits in a sticky rail.
 */
export function ArticleView({ article }: { article: Article }) {
  const { post } = article;

  return (
    <>
      <div className="reading-progress" aria-hidden="true" />

      <header className="mx-auto max-w-3xl pt-10 text-center md:pt-14">
        <Link href={`/category/${post.category.slug}`} className="no-underline">
          <TopicPill category={post.category} />
        </Link>
        <h1 className="mt-5 text-3xl md:text-4xl">{post.title}</h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-pretty text-ink-muted">{post.excerpt}</p>
      </header>

      {/* Only a real photo earns this much space; without one the article opens on its text. */}
      {post.cover_path && (
        <figure className="mx-auto mt-10 max-w-5xl">
          <PostCover
            post={post}
            ratio="16/9"
            sizes="(min-width: 1024px) 1024px, 100vw"
            className="rounded-xl shadow-md"
            eager
          />
        </figure>
      )}

      <div className="mx-auto mt-10 max-w-5xl lg:grid lg:grid-cols-[minmax(0,var(--measure))_var(--rail)] lg:justify-between lg:gap-12">
        <article className="min-w-0 space-y-8">
          <TrustBar post={post} />
          <KeyPoints points={post.key_points} />
          <TableOfContents
            headings={article.headings}
            className="rounded-lg bg-surface p-5 shadow-sm lg:hidden"
          />
          <div className="prose" dangerouslySetInnerHTML={{ __html: article.bodyHtml }} />
          <FaqList items={article.faq} />
          <WhenToSeekCare html={article.seekCareHtml} />
          <SourceList sources={post.sources} />
          <ArticleDisclaimer />
        </article>

        <aside className="hidden lg:block">
          <TableOfContents
            headings={article.headings}
            className="sticky top-8 rounded-lg bg-surface p-5 shadow-sm xl:top-28"
          />
        </aside>
      </div>

      <div className="mx-auto mt-20 max-w-5xl">
        <RelatedPosts posts={article.related} />
      </div>
    </>
  );
}
