import Link from "next/link";

import type { PostListing } from "../queries";
import { PostCover } from "./post-cover";
import { TopicPill } from "./topic-pill";

/**
 * A large card with the headline laid over the photo. With a photo, text is white on a dark
 * scrim; while a post still shows its placeholder, text stays ink on the light tint.
 */
export function FeatureCard({
  post,
  eager,
  className = "",
  size = "lg",
}: {
  post: PostListing;
  eager?: boolean;
  className?: string;
  size?: "lg" | "xl";
}) {
  const hasPhoto = Boolean(post.cover_path);
  return (
    <article className={className}>
      <Link
        href={`/posts/${post.slug}`}
        className="group relative block h-full min-h-80 overflow-hidden rounded-xl text-ink no-underline shadow-md hover:shadow-lg"
      >
        <PostCover
          post={post}
          ratio="fill"
          sizes="(min-width: 1024px) 640px, 100vw"
          className="absolute inset-0 h-full w-full transition-transform duration-500 group-hover:scale-[1.03]"
          eager={eager}
          decorative
        />
        {hasPhoto && <div className="absolute inset-0" style={{ background: "var(--scrim)" }} />}
        <div className="relative flex h-full min-h-80 flex-col justify-end gap-3 p-6 md:p-8">
          <TopicPill category={post.category} className="self-start" />
          <h3
            className={`${size === "xl" ? "text-2xl md:text-3xl" : "text-xl md:text-2xl"} ${
              hasPhoto ? "text-on-photo" : "text-ink group-hover:text-primary"
            }`}
          >
            {post.title}
          </h3>
          <p
            className={`line-clamp-2 max-w-xl text-sm ${hasPhoto ? "text-on-photo/85" : "text-ink-muted"}`}
          >
            {post.excerpt}
          </p>
        </div>
      </Link>
    </article>
  );
}
