import Link from "next/link";
import type { Route } from "next";

/**
 * label · value · context. Values use proportional figures and the body sans at semibold —
 * tabular figures are for aligned columns, not standalone numbers.
 */
export function StatTile({
  label,
  value,
  context,
  href,
}: {
  label: string;
  value: string;
  context?: string;
  href?: Route;
}) {
  const body = (
    <>
      <p className="text-sm text-ink-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-normal">{value}</p>
      {context && <p className="mt-1 text-xs text-ink-muted">{context}</p>}
    </>
  );
  const box = "block rounded border border-line bg-surface p-4";
  return href ? (
    <Link
      href={href}
      className={`${box} text-ink no-underline hover:bg-primary-wash hover:text-ink`}
    >
      {body}
    </Link>
  ) : (
    <div className={box}>{body}</div>
  );
}
