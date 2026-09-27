import Link from "next/link";

import { siteConfig } from "@/config/site";

import { Container } from "./container";
import { LogoMark, SearchIcon } from "./icons";
import { SearchForm } from "./search-form";
import { TopicsMenu } from "./topics-menu";

type NavCategory = { slug: string; name: string };

/**
 * One row at every width, pinned while you scroll: brand, the Topics dropdown (every topic, plus
 * About at its foot), and the search box from 768px (an icon below that). Nothing else in the row,
 * so no link appears twice and adding a topic never overflows it.
 */
export function SiteHeader({ categories }: { categories: NavCategory[] }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-ground/85 backdrop-blur-md">
      <Container className="relative flex h-[4.5rem] items-center gap-2 md:gap-4">
        <Link
          href="/"
          className="mr-2 flex shrink-0 items-center gap-2.5 font-display text-xl font-semibold tracking-(--tracking-display) text-ink no-underline hover:text-ink"
        >
          <LogoMark className="size-8" />
          {siteConfig.name}
        </Link>

        <nav aria-label="Main">
          <TopicsMenu categories={categories} />
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
