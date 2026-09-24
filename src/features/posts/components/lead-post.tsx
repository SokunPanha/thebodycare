import Link from "next/link";

import type { PostListing } from "../queries";
import { PostCover } from "./post-cover";
import { PostMeta } from "./post-meta";

// The home page's newest post: large cover beside large type. One link target.
export function LeadPost({ post }: { post: PostListing }) {
  return (
    <article>
      <Link
        href={`/posts/${post.slug}`}
        className="group grid overflow-hidden rounded border border-line bg-surface text-ink no-underline hover:border-line-strong hover:text-ink hover:shadow-md md:grid-cols-[3fr_2fr]"
      >
        <PostCover
          post={post}
          ratio="fill"
          sizes="(min-width: 768px) 60vw, 100vw"
          className="aspect-[16/10] md:aspect-auto md:h-full md:min-h-80"
          eager
          decorative
        />
        <div className="flex flex-col justify-center p-6 md:p-8">
          <p className="eyebrow">Latest · {post.category.name}</p>
          <h2 className="mt-3 text-2xl group-hover:text-primary lg:text-3xl">{post.title}</h2>
          <p className="mt-3 text-base text-pretty text-ink-muted">{post.excerpt}</p>
          <div className="mt-5 flex items-center justify-between gap-4">
            <PostMeta
              readingTime={post.reading_time_min}
              sourceCount={post.sources[0]?.count ?? 0}
              date={post.published_at}
            />
            <span className="text-sm font-semibold text-primary">Read →</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
