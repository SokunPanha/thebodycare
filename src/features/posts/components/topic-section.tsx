import Link from "next/link";

import { categoryTint, tintBg } from "@/config/categories";

import type { PostListing } from "../queries";
import { PostCard } from "./post-card";

/** A home-page row for one topic: its name, "See all", and its latest cards. */
export function TopicSection({
  topic,
  posts,
}: {
  topic: { slug: string; name: string };
  posts: PostListing[];
}) {
  const id = `topic-${topic.slug}`;
  return (
    <section aria-labelledby={id}>
      <div className="flex items-center gap-4 border-b border-line pb-3">
        <span
          aria-hidden="true"
          className={`size-3 rounded-full ${tintBg[categoryTint(topic.slug)]} ring-1 ring-line-strong`}
        />
        <h2 id={id} className="text-xl">
          {topic.name}
        </h2>
        <Link
          href={`/category/${topic.slug}`}
          className="ml-auto text-sm font-semibold whitespace-nowrap no-underline"
        >
          See all <span aria-hidden="true">→</span>
        </Link>
      </div>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}
