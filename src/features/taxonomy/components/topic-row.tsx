import Link from "next/link";

import { categoryTint, tintBg } from "@/config/categories";

import type { CategoryWithCount } from "../queries";
import { TopicIcon } from "./topic-icon";

/**
 * The home page's compact topic strip: a tinted icon and a name per topic. Four across on phones,
 * all eight in one row on wide screens. Counts are left off — "0 articles" reads as empty.
 */
export function TopicRow({ categories }: { categories: CategoryWithCount[] }) {
  return (
    <ul className="grid grid-cols-4 gap-x-2 gap-y-6 lg:grid-cols-8">
      {categories.map((category) => (
        <li key={category.slug}>
          <Link
            href={`/category/${category.slug}`}
            className="group flex flex-col items-center gap-3 text-center text-ink no-underline hover:text-primary"
          >
            <span
              className={`flex size-16 items-center justify-center rounded-full shadow-sm transition-transform group-hover:-translate-y-0.5 md:size-20 ${tintBg[categoryTint(category.slug)]}`}
            >
              <TopicIcon slug={category.slug} className="size-7 md:size-8" />
            </span>
            <span className="text-xs leading-(--leading-ui) font-semibold md:text-sm">
              {category.name}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
