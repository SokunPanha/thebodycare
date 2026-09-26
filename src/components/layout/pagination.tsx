import Link from "next/link";
import type { Route } from "next";

// Previous / page x of y / next. Path-based pages (/page/2), so every page is static and has its
// own canonical URL.
export function Pagination({
  page,
  pageCount,
  hrefFor,
}: {
  page: number;
  pageCount: number;
  hrefFor: (page: number) => Route;
}) {
  if (pageCount <= 1) return null;

  const link =
    "rounded-full bg-surface px-5 py-2.5 text-sm font-semibold no-underline shadow-sm hover:shadow-md";

  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-between gap-4">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} rel="prev" className={link}>
          ← Newer
        </Link>
      ) : (
        <span />
      )}
      <p className="tabular text-sm text-ink-muted">
        Page {page} of {pageCount}
      </p>
      {page < pageCount ? (
        <Link href={hrefFor(page + 1)} rel="next" className={link}>
          Older →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
