import Link from "next/link";

import { CoverArt } from "@/components/art";

import type { CategoryWithCount } from "../queries";

// One card per category, each wearing its own motif — the cover language, introduced.
export function TopicGrid({ categories }: { categories: CategoryWithCount[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {categories.map((category) => (
        <li key={category.slug}>
          <Link
            href={`/category/${category.slug}`}
            className="group flex h-full items-center gap-4 rounded border border-line bg-surface p-3 text-ink no-underline hover:border-line-strong hover:text-ink hover:shadow-sm"
          >
            <CoverArt
              seed={category.slug}
              category={category.slug}
              ratio="1/1"
              className="w-16 shrink-0 rounded-sm"
            />
            <div className="min-w-0">
              <p className="font-display text-lg font-semibold group-hover:text-primary">
                {category.name}
              </p>
              <p className="tabular text-xs text-ink-muted">
                {category.post_count} {category.post_count === 1 ? "article" : "articles"}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
