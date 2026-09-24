import type { Route } from "next";

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
    <Container className="pt-12">
      <header className="max-w-(--measure)">
        <p className="eyebrow">Topic</p>
        <h1 className="mt-2 text-2xl md:text-3xl">{category.name}</h1>
        <p className="mt-3 text-lg text-ink-muted">{category.description}</p>
        <p className="tabular mt-2 text-xs text-ink-muted">
          {page.total} {page.total === 1 ? "article" : "articles"}
        </p>
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
