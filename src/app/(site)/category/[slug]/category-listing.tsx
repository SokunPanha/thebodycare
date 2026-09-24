import type { Route } from "next";

import { CoverArt } from "@/components/art";
import { Container, Pagination } from "@/components/layout";
import { PostIndex, type Page, type PostListing } from "@/features/posts";
import type { Category } from "@/features/taxonomy";

// Shared by /category/[slug] and /category/[slug]/page/[page].
export function CategoryListing({
  category,
  page,
}: {
  category: Category;
  page: Page<PostListing>;
}) {
  return (
    <Container className="pt-8">
      <header className="grid items-center gap-6 overflow-hidden rounded border border-line bg-surface md:grid-cols-[1fr_1fr]">
        <div className="p-6 md:p-8">
          <p className="eyebrow">Topic</p>
          <h1 className="mt-2 text-2xl md:text-3xl">{category.name}</h1>
          <p className="mt-3 text-lg text-ink-muted">{category.description}</p>
          <p className="tabular mt-2 text-xs text-ink-muted">
            {page.total} {page.total === 1 ? "article" : "articles"}
          </p>
        </div>
        <CoverArt
          seed={category.slug}
          category={category.slug}
          ratio="fill"
          className="hidden md:block md:h-full md:min-h-56"
        />
      </header>
      <div className="mt-8 max-w-(--measure)">
        <PostIndex posts={page.items} showCategory={false} />
        <Pagination
          page={page.page}
          pageCount={page.pageCount}
          hrefFor={(n) =>
            (n === 1
              ? `/category/${category.slug}`
              : `/category/${category.slug}/page/${n}`) as Route
          }
        />
      </div>
    </Container>
  );
}
