import Link from "next/link";

import type { PostListing } from "../queries";
import { PostCover } from "./post-cover";
import { PostMeta } from "./post-meta";
import { TopicPill } from "./topic-pill";

// A list row: rounded thumbnail + text. The whole row is one link target.
export function PostRow({
  post,
  showCategory = true,
}: {
  post: PostListing;
  showCategory?: boolean;
}) {
  return (
    <article>
      <Link
        href={`/posts/${post.slug}`}
        className="group flex gap-4 rounded-lg p-3 text-ink no-underline hover:bg-surface hover:text-ink hover:shadow-sm sm:gap-6"
      >
        <PostCover
          post={post}
          ratio="1/1"
          sizes="128px"
          className="w-24 shrink-0 self-start rounded sm:w-32"
          decorative
        />
        <div className="min-w-0 py-1">
          {showCategory && <TopicPill category={post.category} />}
          <h3 className="mt-2 text-lg group-hover:text-primary">{post.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{post.excerpt}</p>
          <div className="mt-2">
            <PostMeta
              readingTime={post.reading_time_min}
              sourceCount={post.sources[0]?.count ?? 0}
              date={post.published_at}
            />
          </div>
        </div>
      </Link>
    </article>
  );
}
