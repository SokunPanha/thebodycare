import type { Route } from "next";

import { Container, Pagination } from "@/components/layout";
import { categoryTint, tintBg } from "@/config/categories";
import { PostCard, type Page, type PostListing } from "@/features/posts";
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
      <header className={`rounded-xl p-8 md:p-12 ${tintBg[categoryTint(category.slug)]}`}>
        <p className="eyebrow">Topic</p>
        <h1 className="mt-2 text-3xl md:text-4xl">{category.name}</h1>
        <p className="mt-3 max-w-2xl text-lg text-ink-muted">{category.description}</p>
        <p className="tabular mt-4 text-sm font-semibold">
          {page.total} {page.total === 1 ? "article" : "articles"}
        </p>
      </header>

      {page.items.length === 0 ? (
        <p className="mt-10 rounded-lg bg-surface p-10 text-center text-ink-muted">
          Nothing published here yet.
        </p>
      ) : (
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {page.items.map((post) => (
            <li key={post.id}>
              <PostCard post={post} />
            </li>
          ))}
        </ul>
      )}
      <Pagination
        page={page.page}
        pageCount={page.pageCount}
        hrefFor={(n) =>
          (n === 1 ? `/category/${category.slug}` : `/category/${category.slug}/page/${n}`) as Route
        }
      />
    </Container>
  );
}
