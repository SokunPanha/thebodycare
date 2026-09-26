import type { Route } from "next";
import Link from "next/link";

import { Pagination } from "@/components/layout";
import { generationConfig } from "@/config/generation";
import { requireStaff, staffMetadata } from "@/features/auth";
import {
  getMatrixCoverage,
  listMatrixCells,
  MATRIX_STATUSES,
  MatrixCells,
  MatrixCoverage,
  type MatrixStatus,
} from "@/features/taxonomy";

export const generateMetadata = () => staffMetadata("Topics");

type Filters = { category?: string; status?: MatrixStatus };

function href({ category, status }: Filters, page = 1): Route {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (status) params.set("status", status);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return (query ? `/admin/topics?${query}` : "/admin/topics") as Route;
}

function Chip({ to, active, children }: { to: Route; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={to}
      aria-current={active ? "page" : undefined}
      className={`rounded-full border px-3 py-1 text-sm font-semibold no-underline ${
        active ? "border-primary bg-primary-wash text-primary" : "border-line-strong text-ink-muted"
      }`}
    >
      {children}
    </Link>
  );
}

export default async function TopicsPage({ searchParams }: PageProps<"/admin/topics">) {
  const staff = await requireStaff(); // page-level guard — see ../layout.tsx
  const params = await searchParams;
  const coverage = await getMatrixCoverage();

  const category = coverage.find((c) => c.category_slug === params.category)?.category_slug;
  const status = MATRIX_STATUSES.find((s) => s === params.status);
  const page = Math.max(1, Number.parseInt(String(params.page ?? "1"), 10) || 1);
  const cells = await listMatrixCells({ categorySlug: category, status, page });

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl">Topic matrix</h1>
        <p className="mt-1 text-sm text-ink-muted">
          What the pipeline writes next. Add cells in <code>supabase/seed/topic-matrix.csv</code> —
          see <code>docs/TOPIC-MATRIX.md</code> §5 for the selection rules.
        </p>
      </div>

      <MatrixCoverage coverage={coverage} postsPerDay={generationConfig.postsPerDay} />

      <section aria-labelledby="cells" className="space-y-4">
        <h2 id="cells" className="text-lg">
          Cells <span className="tabular text-sm font-normal text-ink-muted">· {cells.total}</span>
        </h2>
        <nav aria-label="Filter by category" className="flex flex-wrap gap-2">
          <Chip to={href({ status })} active={!category}>
            All topics
          </Chip>
          {coverage.map((c) => (
            <Chip
              key={c.category_slug}
              to={href({ category: c.category_slug, status })}
              active={category === c.category_slug}
            >
              {c.category_name}
            </Chip>
          ))}
        </nav>
        <nav aria-label="Filter by status" className="flex flex-wrap gap-2">
          <Chip to={href({ category })} active={!status}>
            Any status
          </Chip>
          {MATRIX_STATUSES.map((s) => (
            <Chip key={s} to={href({ category, status: s })} active={status === s}>
              <span className="capitalize">{s}</span>
            </Chip>
          ))}
        </nav>
        {staff.role !== "admin" && (
          <p className="text-sm text-ink-muted">
            Only admins can change priorities or retire cells.
          </p>
        )}
        <MatrixCells cells={cells.items} canEdit={staff.role === "admin"} />
        <Pagination
          page={cells.page}
          pageCount={cells.pageCount}
          hrefFor={(n) => href({ category, status }, n)}
        />
      </section>
    </div>
  );
}
