import Link from "next/link";

import { Container } from "@/components/layout";
import { requireStaff, signOut } from "@/features/auth";

// ⚠ This check is NOT enough on its own. Next renders layouts and pages in parallel, so a page
// under a layout that calls notFound() still renders, and its output is streamed into the 404
// response. Verified: without a page-level check, a reader's /admin 404 carried the page's content.
//
// Rule: every admin page, and every admin server action, calls requireStaff() itself.
// It is memoised per request, so the repeat calls are free.
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const staff = await requireStaff();

  return (
    <>
      <header className="border-b border-line bg-surface">
        <Container className="flex items-center justify-between gap-4 py-3">
          <nav aria-label="Admin" className="flex items-center gap-6 text-sm font-semibold">
            <Link href="/admin" className="text-ink no-underline">
              Admin
            </Link>
            <Link href="/admin/review" className="text-ink-muted no-underline hover:text-ink">
              Review queue
            </Link>
            <Link href="/admin/posts" className="text-ink-muted no-underline hover:text-ink">
              Posts
            </Link>
          </nav>
          <div className="flex items-center gap-4 text-sm text-ink-muted">
            <span>
              {staff.display_name ?? staff.email} · {staff.role}
            </span>
            <form action={signOut}>
              <button type="submit" className="font-semibold text-primary hover:text-primary-hover">
                Sign out
              </button>
            </form>
          </div>
        </Container>
      </header>
      <main id="main">
        <Container className="py-8">{children}</Container>
      </main>
    </>
  );
}
