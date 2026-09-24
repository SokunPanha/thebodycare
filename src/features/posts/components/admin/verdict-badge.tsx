import type { ScopeVerdict } from "../../schema";

// No coral here: coral means "when to seek care" and nothing else (DESIGN.md §1). A failed
// verdict is marked by inverse ink and the word FAIL, not by colour.
export function VerdictBadge({ verdict }: { verdict: ScopeVerdict | null }) {
  const base =
    "tabular inline-block rounded-sm px-2 py-0.5 text-2xs font-bold tracking-(--tracking-eyebrow) uppercase";
  if (!verdict)
    return <span className={`${base} border border-line text-ink-muted`}>No check</span>;
  if (verdict.verdict === "fail") return <span className={`${base} bg-ink text-ground`}>Fail</span>;
  return <span className={`${base} bg-primary-wash text-primary`}>Pass</span>;
}
