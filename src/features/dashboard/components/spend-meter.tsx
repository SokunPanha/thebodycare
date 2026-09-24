import { formatUsd } from "./format";

/**
 * Today's spend against the daily cap. Fill and track are two steps of one ramp. Reaching the cap
 * is marked by the fill turning ink and a text label — never by colour alone, and never coral,
 * which is reserved for "when to seek care". (DESIGN.md §1)
 */
export function SpendMeter({ spent, cap }: { spent: number; cap: number }) {
  const ratio = cap > 0 ? Math.min(spent / cap, 1) : 0;
  const atCap = spent >= cap;

  return (
    <div className="rounded border border-line bg-surface p-4">
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-sm text-ink-muted">Generation spend today</p>
        <p className="text-xs text-ink-muted">UTC day</p>
      </div>
      <p className="mt-1 text-2xl font-semibold tracking-normal">
        {formatUsd(spent)}{" "}
        <span className="text-sm font-normal text-ink-muted">of {formatUsd(cap)} cap</span>
      </p>
      <div
        role="meter"
        aria-label="Spend against daily cap"
        aria-valuemin={0}
        aria-valuemax={cap}
        aria-valuenow={spent}
        aria-valuetext={`${formatUsd(spent)} of ${formatUsd(cap)}`}
        className="mt-3 h-2 overflow-hidden rounded-full bg-primary-wash"
      >
        <div
          className={`h-full rounded-full ${atCap ? "bg-ink" : "bg-primary"}`}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
      {atCap && (
        <p className="mt-2 text-xs font-semibold">
          Cap reached — generation pauses until tomorrow (UTC).
        </p>
      )}
    </div>
  );
}
