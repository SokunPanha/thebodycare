"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavCategory = { slug: string; name: string };

/** The topic links, marking the one you're in. Client-side only to read the current path. */
export function TopicNav({
  categories,
  className = "",
}: {
  categories: NavCategory[];
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label="Topics" className={className}>
      <ul className="flex gap-0.5 whitespace-nowrap">
        {categories.map((category) => {
          const href = `/category/${category.slug}` as const;
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={category.slug}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`block rounded-full px-3 py-2 text-sm font-medium no-underline ${
                  active
                    ? "bg-surface text-primary shadow-sm"
                    : "text-ink-muted hover:bg-surface hover:text-ink"
                }`}
              >
                {category.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
