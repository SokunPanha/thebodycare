import Link from "next/link";

import type { CategoryCoverage } from "../queries";
import { MATRIX_STATUSES } from "../queries";

// TOPIC-MATRIX.md §3: the seed is 54% explainer; the target is under 40%.
const EXPLAINER_TARGET = 0.4;
// A category with less than this much runway gets flagged — about a month's notice to add cells.
const LOW_RUNWAY_DAYS = 30;

function Tile({ label, value, context }: { label: string; value: string; context: string }) {
  return (
    <div className="rounded border border-line bg-surface p-4">
      <p className="text-sm text-ink-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-normal">{value}</p>
      <p className="mt-1 text-xs text-ink-muted">{context}</p>
    </div>
  );
}

/**
 * How much the pipeline has left to write, overall and per category. Runway assumes posts are
 * spread evenly across categories — the selector (M4) balances them.
 */
export function MatrixCoverage({
  coverage,
  postsPerDay,
}: {
  coverage: CategoryCoverage[];
  postsPerDay: number;
}) {
  const open = coverage.reduce((sum, c) => sum + (c.by_status.open ?? 0), 0);
  const total = coverage.reduce((sum, c) => sum + c.total, 0);
  const explainers = coverage.reduce((sum, c) => sum + (c.by_format.explainer ?? 0), 0);
  const explainerShare = total ? explainers / total : 0;
  const runwayDays = postsPerDay > 0 ? Math.floor(open / postsPerDay) : null;
  const perCategoryRate = postsPerDay / Math.max(coverage.length, 1);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Tile
          label="Open cells"
          value={open.toLocaleString("en-US")}
          context={`of ${total.toLocaleString("en-US")} in the matrix`}
        />
        <Tile
          label="Runway"
          value={runwayDays === null ? "—" : `${runwayDays} days`}
          context={
            runwayDays === null
              ? "Generation is paused"
              : `At ${postsPerDay}/day · ~100 new cells a month keeps pace`
          }
        />
        <Tile
          label="Explainer share"
          value={`${Math.round(explainerShare * 100)}%`}
          context={
            explainerShare > EXPLAINER_TARGET
              ? `Above the ${EXPLAINER_TARGET * 100}% target — add comparisons, timelines, checklists`
              : `Within the ${EXPLAINER_TARGET * 100}% target`
          }
        />
      </div>

      <div className="overflow-x-auto rounded border border-line">
        <table className="tabular w-full text-left text-sm">
          <thead className="bg-surface-subtle text-xs text-ink-muted">
            <tr>
              <th scope="col" className="px-4 py-2 font-semibold">
                Category
              </th>
              {MATRIX_STATUSES.map((status) => (
                <th
                  key={status}
                  scope="col"
                  className="px-4 py-2 text-right font-semibold capitalize"
                >
                  {status}
                </th>
              ))}
              <th scope="col" className="px-4 py-2 text-right font-semibold">
                Runway
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line bg-surface">
            {coverage.map((category) => {
              const categoryOpen = category.by_status.open ?? 0;
              const days = perCategoryRate > 0 ? Math.floor(categoryOpen / perCategoryRate) : null;
              const low = days !== null && days < LOW_RUNWAY_DAYS;
              return (
                <tr key={category.category_id}>
                  <th scope="row" className="px-4 py-2 font-semibold">
                    <Link href={`/admin/topics?category=${category.category_slug}`}>
                      {category.category_name}
                    </Link>
                  </th>
                  {MATRIX_STATUSES.map((status) => (
                    <td key={status} className="px-4 py-2 text-right">
                      {category.by_status[status] ?? 0}
                    </td>
                  ))}
                  <td className="px-4 py-2 text-right whitespace-nowrap">
                    {days === null ? "—" : `${days} days`}
                    {low && <span className="ml-2 font-semibold">· running low</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
