import Link from "next/link";

import { siteConfig } from "@/config/site";

import { Container } from "./container";

type NavCategory = { slug: string; name: string };

export function SiteHeader({ categories }: { categories: NavCategory[] }) {
  return (
    <header className="border-b border-line bg-surface">
      <Container className="flex items-center justify-between gap-4 py-4">
        <Link
          href="/"
          className="font-display text-xl font-semibold tracking-(--tracking-display) text-ink no-underline hover:text-ink"
        >
          {siteConfig.name}
        </Link>
        <Link
          href="/about"
          className="text-sm font-medium text-ink-muted no-underline hover:text-ink"
        >
          About
        </Link>
      </Container>
      <Container>
        {/* Scrolls sideways on its own at phone width; the page never does. */}
        <nav aria-label="Topics" className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
          <ul className="flex gap-6 pb-3 whitespace-nowrap">
            {categories.map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/category/${category.slug}`}
                  className="text-sm font-medium text-ink-muted no-underline hover:text-primary"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
    </header>
  );
}
