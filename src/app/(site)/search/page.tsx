import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";

import { Container, Pagination, SearchForm } from "@/components/layout";
import { PostIndex, searchPosts } from "@/features/posts";
import { listCategories } from "@/features/taxonomy";

// Results pages shouldn't be indexed (thin, infinite URL space) — but their links should be
// followed.
export const metadata: Metadata = {
  title: "Search",
  robots: { index: false, follow: true },
  alternates: { canonical: "/search" },
};

function href(query: string, page = 1): Route {
  const params = new URLSearchParams({ q: query });
  if (page > 1) params.set("page", String(page));
  return `/search?${params}` as Route;
}

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim().slice(0, 200) : "";
  const page = Math.max(1, Number.parseInt(String(params.page ?? "1"), 10) || 1);
  const [results, categories] = await Promise.all([
    searchPosts(query, { page }),
    query ? Promise.resolve([]) : listCategories(),
  ]);

  return (
    <Container className="pt-12">
      <div className="max-w-(--measure)">
        <h1 className="text-2xl md:text-3xl">{query ? "Search results" : "Search"}</h1>
        <div className="mt-6">
          <SearchForm defaultValue={query} size="lg" autoFocus={!query} />
        </div>

        {query ? (
          <>
            <p className="tabular mt-6 text-sm text-ink-muted" role="status">
              {results.total === 0
                ? `No articles match “${query}”.`
                : `${results.total} ${results.total === 1 ? "article matches" : "articles match"} “${query}”`}
            </p>
            {results.total === 0 ? (
              <div className="mt-6 space-y-2 text-sm">
                <p>Try fewer or simpler words, or check the spelling.</p>
                <p>
                  Or browse <Link href="/">the latest articles</Link>.
                </p>
              </div>
            ) : (
              <div className="mt-4">
                <PostIndex posts={results.items} />
                <Pagination
                  page={results.page}
                  pageCount={results.pageCount}
                  hrefFor={(n) => href(query, n)}
                />
              </div>
            )}
          </>
        ) : (
          <div className="mt-8 space-y-8">
            <section aria-labelledby="browse">
              <h2 id="browse" className="eyebrow">
                Browse a topic
              </h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {categories.map((category) => (
                  <li key={category.slug}>
                    <Link
                      href={`/category/${category.slug}`}
                      className="inline-block rounded-full border border-line-strong px-4 py-1.5 text-sm font-semibold text-ink no-underline hover:border-primary hover:text-primary"
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}
      </div>
    </Container>
  );
}
