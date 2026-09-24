import Link from "next/link";

import type { RecentRun } from "../queries";
import { formatUsd } from "./format";

const time = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

export function RecentRuns({ runs }: { runs: RecentRun[] }) {
  if (runs.length === 0) {
    return (
      <p className="border-y border-line py-8 text-sm text-ink-muted">
        No generation runs yet. They appear here once the pipeline (M4) is running.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded border border-line">
      <table className="tabular w-full text-left text-sm">
        <thead className="bg-surface-subtle text-xs text-ink-muted">
          <tr>
            <th scope="col" className="px-4 py-2 font-semibold">
              When (UTC)
            </th>
            <th scope="col" className="px-4 py-2 font-semibold">
              Result
            </th>
            <th scope="col" className="px-4 py-2 font-semibold">
              Post / reason
            </th>
            <th scope="col" className="px-4 py-2 font-semibold">
              Model · prompt
            </th>
            <th scope="col" className="px-4 py-2 text-right font-semibold">
              Cost
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line bg-surface">
          {runs.map((run) => (
            <tr key={run.id}>
              <td className="px-4 py-2 whitespace-nowrap">
                {time.format(new Date(run.created_at))}
              </td>
              <td className="px-4 py-2">
                <span className={run.status === "failed" ? "font-semibold" : undefined}>
                  {run.status}
                </span>
                {run.step && <span className="text-ink-muted"> at {run.step}</span>}
              </td>
              <td className="max-w-80 truncate px-4 py-2">
                {run.post ? (
                  <Link href={`/admin/review/${run.post.id}`}>{run.post.title}</Link>
                ) : (
                  <span className="text-ink-muted">{run.error ?? "—"}</span>
                )}
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-ink-muted">
                {run.model} · {run.prompt_version}
              </td>
              <td className="px-4 py-2 text-right">{formatUsd(Number(run.cost_usd))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
