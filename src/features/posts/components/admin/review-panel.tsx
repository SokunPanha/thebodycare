import type { StaffPost } from "../../queries";
import { scopeVerdictSchema } from "../../schema";
import { VerdictBadge } from "./verdict-badge";

/** What the reviewer needs to know about how this draft was made, before reading it. */
export function ReviewPanel({ post }: { post: StaffPost }) {
  const run = post.runs[0];
  const parsed = scopeVerdictSchema.safeParse(run?.scope_verdict);
  const verdict = parsed.success ? parsed.data : null;

  const rows: [string, React.ReactNode][] = [
    ["Status", post.status.replace("_", " ")],
    ["Made by", post.source === "human" ? "Human" : "AI"],
    ["Scope check", <VerdictBadge key="v" verdict={verdict} />],
    ["Nearest existing match", run?.topic?.dedup_score?.toFixed(2) ?? "—"],
    ["Target query", run?.topic?.target_keyword ?? "—"],
    ["Model · prompt", run ? `${run.model} · ${run.prompt_version}` : "—"],
    ["Sources", `${post.sources.length}${post.sources.length < 3 ? " — needs at least 3" : ""}`],
  ];

  return (
    <div className="space-y-4">
      <dl className="tabular grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-ink-muted">{label}</dt>
            <dd className="font-medium">{value}</dd>
          </div>
        ))}
      </dl>

      {verdict && verdict.violations.length > 0 && (
        <div className="rounded border border-line-strong p-4 text-sm">
          <p className="font-semibold">Scope guard flagged</p>
          <ul className="mt-2 space-y-2">
            {verdict.violations.map((violation, i) => (
              <li key={i}>
                <span className="font-semibold">{violation.rule}</span> — &ldquo;{violation.excerpt}
                &rdquo;
                {violation.explanation && (
                  <span className="text-ink-muted"> {violation.explanation}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {post.review_note && (
        <p className="text-sm">
          <span className="font-semibold">Review note:</span> {post.review_note}
        </p>
      )}
    </div>
  );
}
