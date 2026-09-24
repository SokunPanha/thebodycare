import Link from "next/link";

import type { ReviewQueueItem } from "../../queries";
import { scopeVerdictSchema } from "../../schema";
import { VerdictBadge } from "./verdict-badge";

function waiting(days: number) {
  if (days === 0) return "today";
  return days === 1 ? "1 day" : `${days} days`;
}

/** Oldest first. Every column is something you'd check before opening the draft. */
export function ReviewQueue({ items }: { items: ReviewQueueItem[] }) {
  if (items.length === 0) {
    return <p className="border-y border-line py-12 text-ink-muted">Nothing waiting for review.</p>;
  }

  return (
    <div className="overflow-x-auto rounded border border-line">
      <table className="tabular w-full text-left text-sm">
        <thead className="bg-surface-subtle text-xs text-ink-muted">
          <tr>
            <th scope="col" className="px-4 py-2 font-semibold">
              Draft
            </th>
            <th scope="col" className="px-4 py-2 font-semibold">
              Waiting
            </th>
            <th scope="col" className="px-4 py-2 font-semibold">
              Scope
            </th>
            <th scope="col" className="px-4 py-2 font-semibold">
              Nearest match
            </th>
            <th scope="col" className="px-4 py-2 font-semibold">
              Sources
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {items.map((item) => {
            const run = item.runs[0];
            const verdict = scopeVerdictSchema.safeParse(run?.scope_verdict);
            const sourceCount = item.sources[0]?.count ?? 0;
            const dedup = run?.topic?.dedup_score;
            return (
              <tr key={item.id} className="bg-surface hover:bg-primary-wash">
                <td className="px-4 py-3">
                  <Link href={`/admin/review/${item.id}`} className="font-semibold text-ink">
                    {item.title}
                  </Link>
                  <p className="text-xs text-ink-muted">
                    {item.category.name} · {item.source === "human" ? "Human" : "AI"}
                  </p>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{waiting(item.waiting_days)}</td>
                <td className="px-4 py-3">
                  <VerdictBadge verdict={verdict.success ? verdict.data : null} />
                </td>
                <td className="px-4 py-3">{dedup == null ? "—" : dedup.toFixed(2)}</td>
                <td className="px-4 py-3">
                  {sourceCount}
                  {sourceCount < 3 && <span className="ml-1 font-semibold">· needs 3</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
