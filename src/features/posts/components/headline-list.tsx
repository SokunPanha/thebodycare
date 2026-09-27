import Link from "next/link";

import type { PostListing } from "../queries";
import { PostCover } from "./post-cover";

/**
 * The top-stories sidebar: small square photo, topic, headline, read time. Rows are separated by
 * hairlines, the way a front page lists its latest. Each row is one link target.
 */
export function HeadlineList({ posts }: { posts: PostListing[] }) {
  return (
    <ol className="divide-y divide-line">
      {posts.map((post) => (
        <li key={post.id}>
          <Link
            href={`/posts/${post.slug}`}
            className="group flex items-start gap-4 py-4 text-ink no-underline first:pt-0 hover:text-ink"
          >
            <PostCover
              post={post}
              ratio="1/1"
              sizes="96px"
              className="w-20 shrink-0 rounded-md sm:w-24"
              decorative
            />
            <div className="min-w-0">
              <p className="text-2xs font-semibold tracking-wide text-primary uppercase">
                {post.category.name}
              </p>
              <h3 className="mt-1 line-clamp-3 font-display text-base leading-(--leading-ui) font-semibold group-hover:text-primary">
                {post.title}
              </h3>
              <p className="tabular mt-1 text-xs text-ink-muted">
                {post.reading_time_min} min read
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ol>
  );
}
