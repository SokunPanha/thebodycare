import Link from "next/link";

import { categoryTint, tintBg } from "@/config/categories";

import type { CategoryWithCount } from "../queries";

// One soft-tinted tile per topic: name, what it covers, how many articles.
export function TopicGrid({ categories }: { categories: CategoryWithCount[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {categories.map((category) => (
        <li key={category.slug}>
          <Link
            href={`/category/${category.slug}`}
            className={`group flex h-full flex-col rounded-lg p-6 text-ink no-underline hover:-translate-y-0.5 hover:text-ink hover:shadow-md ${tintBg[categoryTint(category.slug)]}`}
          >
            <p className="font-display text-xl font-semibold tracking-(--tracking-display)">
              {category.name}
            </p>
            <p className="mt-2 text-sm text-ink-muted">{category.description}</p>
            <p className="tabular mt-auto flex items-center justify-between pt-6 text-sm font-semibold">
              <span>
                {category.post_count} {category.post_count === 1 ? "article" : "articles"}
              </span>
              <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
