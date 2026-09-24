import Link from "next/link";

import type { PostListing } from "../queries";
import { PostCover } from "./post-cover";
import { PostMeta } from "./post-meta";

// A grid card: generated cover, then the text. The whole card is one link target.
export function PostCard({ post }: { post: PostListing }) {
  return (
    <article className="h-full">
      <Link
        href={`/posts/${post.slug}`}
        className="group flex h-full flex-col overflow-hidden rounded border border-line bg-surface text-ink no-underline hover:border-line-strong hover:text-ink hover:shadow-md"
      >
        <PostCover
          post={post}
          ratio="16/10"
          sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
          decorative
        />
        <div className="flex flex-1 flex-col p-5">
          <p className="eyebrow">{post.category.name}</p>
          <h3 className="mt-2 text-lg group-hover:text-primary">{post.title}</h3>
          <p className="mt-2 line-clamp-3 text-sm text-ink-muted">{post.excerpt}</p>
          <div className="mt-auto pt-4">
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
