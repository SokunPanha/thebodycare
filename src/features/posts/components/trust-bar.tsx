import { Fragment } from "react";

import { formatDate } from "@/lib/utils/format-date";

import type { PostWithSources } from "../queries";

type Person = { display_name: string | null; credentials: string | null } | null;

function name(person: Person) {
  if (!person?.display_name) return null;
  return person.credentials ? `${person.display_name}, ${person.credentials}` : person.display_name;
}

/**
 * Who stands behind the piece. It must never imply a review that didn't happen: "reviewed by"
 * appears only when a named reviewer exists. No per-article AI label (owner's decision,
 * 2026-09-27); the site-wide disclosure is on /medical-disclaimer. (EDITORIAL.md §7, LEGAL.md §8)
 */
function attribution(post: PostWithSources): string | null {
  const reviewer = name(post.reviewer);
  const author = name(post.author);
  switch (post.source) {
    case "ai_reviewed":
      return reviewer ? `Reviewed by ${reviewer}` : null;
    case "ai":
      return null;
    case "human":
      if (author && reviewer) return `By ${author} · reviewed by ${reviewer}`;
      return author ? `By ${author}` : "Written by our editors";
  }
}

// Quiet by design: findable, not loud. Hairline above and below. (DESIGN.md §7)
export function TrustBar({ post }: { post: PostWithSources }) {
  const date = post.reviewed_at
    ? `Last reviewed ${formatDate(post.reviewed_at)}`
    : post.published_at
      ? `Published ${formatDate(post.published_at)}`
      : null;

  const parts = [
    date,
    `${post.reading_time_min} min read`,
    `${post.sources.length} ${post.sources.length === 1 ? "source" : "sources"}`,
    attribution(post),
  ].filter(Boolean);

  // Inline text rather than flex: when it wraps, separators stay attached to their neighbours.
  return (
    <p className="tabular rounded-lg bg-surface px-5 py-4 text-xs text-ink-muted shadow-sm">
      {parts.map((part, i) => (
        <Fragment key={part}>
          {i > 0 && <span aria-hidden="true"> · </span>}
          <span className="whitespace-nowrap">{part}</span>
        </Fragment>
      ))}
    </p>
  );
}
