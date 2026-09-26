import Link from "next/link";

import type { PostListing } from "../queries";
import { PostCover } from "./post-cover";
import { PostMeta } from "./post-meta";
import { TopicPill } from "./topic-pill";

// Photo on top, text below, soft lift on hover. The whole card is one link target.
export function PostCard({ post }: { post: PostListing }) {
  return (
    <article className="h-full">
      <Link
        href={`/posts/${post.slug}`}
        className="group flex h-full flex-col overflow-hidden rounded-lg bg-surface text-ink no-underline shadow-sm hover:-translate-y-0.5 hover:text-ink hover:shadow-md"
      >
        <PostCover
          post={post}
          ratio="16/10"
          sizes="(min-width: 1024px) 300px, (min-width: 640px) 50vw, 100vw"
          decorative
        />
        <div className="flex flex-1 flex-col gap-3 p-5">
          <TopicPill category={post.category} className="self-start" />
          <h3 className="text-lg group-hover:text-primary">{post.title}</h3>
          <p className="line-clamp-2 text-sm text-ink-muted">{post.excerpt}</p>
          <div className="mt-auto pt-1">
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
