import Link from "next/link";

import { siteConfig } from "@/config/site";

import { Container } from "./container";
import { LogoMark, SearchIcon } from "./icons";
import { SearchForm } from "./search-form";
import { TopicsMenu } from "./topics-menu";

type NavCategory = { slug: string; name: string };

const FIRST_AID = "/category/symptoms";

/**
 * One row at every width, pinned while you scroll: brand, Topics dropdown, First aid, About — and
 * the search box from 768px (an icon below that). Topics live in the dropdown so adding one never
 * overflows the row.
 */
export function SiteHeader({ categories }: { categories: NavCategory[] }) {
  const firstAid = categories.some((c) => `/category/${c.slug}` === FIRST_AID);
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-ground/85 backdrop-blur-md">
      <Container className="relative flex h-[4.5rem] items-center gap-2 md:gap-4">
        <Link
          href="/"
          className="mr-2 flex shrink-0 items-center gap-2.5 font-display text-xl font-semibold tracking-(--tracking-display) text-ink no-underline hover:text-ink"
        >
          <LogoMark className="size-8" />
          <span className="hidden sm:inline">{siteConfig.name}</span>
        </Link>

        <nav aria-label="Main" className="flex items-center gap-1">
          <TopicsMenu categories={categories} />
          {firstAid && (
            <Link
              href={FIRST_AID}
              className="rounded-full px-3.5 py-2 text-sm font-medium whitespace-nowrap text-ink-muted no-underline hover:bg-surface hover:text-ink"
            >
              First aid
            </Link>
          )}
          <Link
            href="/about"
            className="hidden rounded-full px-3.5 py-2 text-sm font-medium text-ink-muted no-underline hover:bg-surface hover:text-ink md:block"
          >
            About
          </Link>
        </nav>

        <div className="ml-auto">
          <div className="hidden w-64 md:block">
            <SearchForm />
          </div>
          <Link
            href="/search"
            aria-label="Search"
            className="flex size-10 items-center justify-center rounded-full bg-surface text-ink-muted shadow-sm hover:text-ink md:hidden"
          >
            <SearchIcon className="size-5" />
          </Link>
        </div>
      </Container>
    </header>
  );
}
