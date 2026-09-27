import Link from "next/link";

import type { PostListing } from "../queries";

/**
 * "Need help now?" — quick links into Symptoms & First Aid, and the emergency line. The emergency
 * line is the seek-care semantic, so it's the one place on the home page that uses coral.
 * (DESIGN.md §2: coral means "get care", nowhere else.)
 */
export function FirstAidBand({ posts, topicSlug }: { posts: PostListing[]; topicSlug: string }) {
  return (
    <section
      aria-labelledby="first-aid"
      className="grid gap-6 rounded-xl bg-tint-sky p-6 md:grid-cols-[1fr_auto] md:items-center md:p-10"
    >
      <div>
        <h2 id="first-aid" className="text-2xl">
          Need help now?
        </h2>
        <p className="mt-2 max-w-2xl text-ink-muted">
          Plain first-aid steps for everyday injuries and sudden symptoms — and the signs that mean
          it&rsquo;s time to get help.
        </p>
        {posts.length > 0 && (
          <ul className="mt-5 flex flex-wrap gap-2">
            {posts.map((post) => (
              <li key={post.id}>
                <Link
                  href={`/posts/${post.slug}`}
                  className="inline-block rounded-full bg-surface px-4 py-2 text-sm font-medium text-ink no-underline shadow-sm hover:text-primary"
                >
                  {post.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-5 flex items-start gap-2 text-sm font-semibold text-accent-ink">
          <svg viewBox="0 0 20 20" aria-hidden="true" className="mt-0.5 size-5 shrink-0">
            <circle cx="10" cy="10" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
            <path
              d="M10 5.5v5.5M10 14v.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          In an emergency, call your local emergency number (such as 911, 999 or 112) straight away.
        </p>
      </div>
      <Link
        href={`/category/${topicSlug}`}
        className="justify-self-start rounded-full bg-primary px-6 py-3 text-sm font-semibold text-on-primary no-underline shadow-sm hover:bg-primary-hover hover:text-on-primary md:justify-self-end"
      >
        All first-aid guides →
      </Link>
    </section>
  );
}
