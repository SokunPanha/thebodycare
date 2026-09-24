import Link from "next/link";

import { siteConfig } from "@/config/site";

import { Container } from "./container";
import { LogoMark, SearchIcon } from "./icons";
import { SearchForm } from "./search-form";
import { TopicNav } from "./topic-nav";

type NavCategory = { slug: string; name: string };

/**
 * ≥1280px: one row — brand, topics, search box, About — pinned while you scroll.
 * Below: brand + search icon + About, then topics on their own row (scrolling sideways on phones).
 * All seven topics plus a search box only fit in one row from 1280px — measured, not guessed.
 * Not pinned below that, where every line of reading space counts.
 */
export function SiteHeader({ categories }: { categories: NavCategory[] }) {
  return (
    <header className="border-b border-line bg-surface xl:sticky xl:top-0 xl:z-40 xl:bg-surface/90 xl:backdrop-blur">
      <Container className="flex h-16 items-center gap-4">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5 font-display text-xl font-semibold tracking-(--tracking-display) text-ink no-underline hover:text-ink"
        >
          <LogoMark className="size-8" />
          {siteConfig.name}
        </Link>

        <TopicNav
          categories={categories}
          className="hidden min-w-0 flex-1 overflow-x-auto xl:block"
        />

        <div className="ml-auto flex items-center gap-2 xl:ml-0">
          <div className="hidden w-44 xl:block">
            <SearchForm />
          </div>
          <Link
            href="/search"
            aria-label="Search"
            className="flex size-10 items-center justify-center rounded-full text-ink-muted hover:bg-surface-subtle hover:text-ink xl:hidden"
          >
            <SearchIcon className="size-5" />
          </Link>
          <Link
            href="/about"
            className="rounded-full px-3 py-1.5 text-sm font-medium text-ink-muted no-underline hover:bg-surface-subtle hover:text-ink"
          >
            About
          </Link>
        </div>
      </Container>

      <Container className="xl:hidden">
        <TopicNav
          categories={categories}
          className="-mx-4 overflow-x-auto px-4 pb-3 md:mx-0 md:px-0"
        />
      </Container>
    </header>
  );
}
