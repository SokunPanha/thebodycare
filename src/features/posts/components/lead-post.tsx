import Link from "next/link";

import type { PostListing } from "../queries";
import { PostMeta } from "./post-meta";

// The home page's newest post. Type alone carries it — there is no cover. (DESIGN.md §6)
export function LeadPost({ post }: { post: PostListing }) {
  return (
    <article className="max-w-(--measure)">
      <p className="eyebrow">{post.category.name}</p>
      <h2 className="mt-2 text-2xl md:text-3xl">
        <Link href={`/posts/${post.slug}`} className="text-ink no-underline hover:text-primary">
          {post.title}
        </Link>
      </h2>
      <p className="mt-3 text-lg text-pretty text-ink-muted">{post.excerpt}</p>
      <div className="mt-4">
        <PostMeta
          readingTime={post.reading_time_min}
          sourceCount={post.sources[0]?.count ?? 0}
          date={post.published_at}
        />
      </div>
    </article>
  );
}
