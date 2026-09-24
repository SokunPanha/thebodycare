import type { DashboardStats, RecentRun } from "../queries";
import { formatCount, formatUsd } from "./format";
import { RecentRuns } from "./recent-runs";
import { SpendMeter } from "./spend-meter";
import { StatTile } from "./stat-tile";

const RUN_STATUSES = ["success", "rejected", "failed", "skipped"] as const;

export function DashboardView({
  stats,
  runs,
  costCapUsd,
  postsPerDay,
}: {
  stats: DashboardStats;
  runs: RecentRun[];
  costCapUsd: number;
  postsPerDay: number;
}) {
  const posts = stats.posts_by_status;
  const openCells = stats.matrix_by_status.open ?? 0;
  const runwayDays = postsPerDay > 0 ? Math.floor(openCells / postsPerDay) : null;
  const oldest = stats.oldest_in_review_days;

  return (
    <div className="space-y-10">
      <section aria-labelledby="at-a-glance">
        <h2 id="at-a-glance" className="sr-only">
          At a glance
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label="Waiting for review"
            value={formatCount(posts.in_review ?? 0)}
            context={
              oldest === null
                ? "Queue is empty"
                : `Oldest waiting ${oldest === 0 ? "since today" : `${oldest} ${oldest === 1 ? "day" : "days"}`}`
            }
            href="/admin/review"
          />
          <StatTile
            label="Published"
            value={formatCount(posts.published ?? 0)}
            context={`${stats.published_last_7d} in the last 7 days`}
            href="/admin/posts?status=published"
          />
          <StatTile
            label="Open topic cells"
            value={formatCount(openCells)}
            context={
              runwayDays === null
                ? "Generation paused"
                : `About ${runwayDays} days at ${postsPerDay}/day`
            }
          />
          <StatTile
            label="Due for re-review"
            value={formatCount(stats.posts_due_for_review)}
            context="Published posts past their review date"
          />
        </div>
      </section>

      <section aria-labelledby="generation" className="grid gap-4 lg:grid-cols-2">
        <h2 id="generation" className="sr-only">
          Generation
        </h2>
        <SpendMeter spent={stats.spend_today_usd} cap={costCapUsd} />
        <div className="rounded border border-line bg-surface p-4">
          <div className="flex items-baseline justify-between gap-4">
            <p className="text-sm text-ink-muted">Runs, last 7 days</p>
            <p className="text-xs text-ink-muted">
              {formatUsd(stats.spend_30d_usd)} spent in 30 days
            </p>
          </div>
          <dl className="mt-3 grid grid-cols-4 gap-2">
            {RUN_STATUSES.map((status) => (
              <div key={status}>
                <dt className="text-xs text-ink-muted capitalize">{status}</dt>
                <dd className="text-xl font-semibold">{stats.runs_last_7d[status] ?? 0}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section aria-labelledby="recent-runs">
        <h2 id="recent-runs" className="text-lg">
          Recent runs
        </h2>
        <div className="mt-3">
          <RecentRuns runs={runs} />
        </div>
      </section>
    </div>
  );
}
