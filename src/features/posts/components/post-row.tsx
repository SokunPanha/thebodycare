import Link from "next/link";

import type { PostListing } from "../queries";
import { PostCover } from "./post-cover";
import { PostMeta } from "./post-meta";

// One row of the dense index: thumbnail + text. The whole row is a single link target.
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
        className="group -mx-4 flex gap-4 rounded px-4 py-5 text-ink no-underline hover:bg-primary-wash hover:text-ink sm:gap-6 md:-mx-6 md:px-6"
      >
        <PostCover
          post={post}
          ratio="1/1"
          sizes="112px"
          className="w-20 shrink-0 self-start rounded-sm sm:w-28"
          decorative
        />
        <div className="min-w-0">
          {showCategory && <p className="eyebrow">{post.category.name}</p>}
          <h3 className="mt-1 text-lg group-hover:text-primary">{post.title}</h3>
          <p className="mt-1 line-clamp-2 max-w-(--measure) text-sm text-ink-muted">
            {post.excerpt}
          </p>
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
