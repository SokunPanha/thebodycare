import Link from "next/link";

import type { PostListing } from "../queries";
import { PostMeta } from "./post-meta";

// One row of the dense index. The whole row is a single link target. (DESIGN.md §7)
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
        className="-mx-4 block rounded px-4 py-6 text-ink no-underline hover:bg-primary-wash hover:text-ink md:-mx-6 md:px-6"
      >
        {showCategory && <p className="eyebrow">{post.category.name}</p>}
        <h3 className="mt-1 text-lg">{post.title}</h3>
        <p className="mt-1 line-clamp-2 max-w-(--measure) text-sm text-ink-muted">{post.excerpt}</p>
        <div className="mt-2">
          <PostMeta
            readingTime={post.reading_time_min}
            sourceCount={post.sources[0]?.count ?? 0}
            date={post.published_at}
          />
        </div>
      </Link>
    </article>
  );
}
