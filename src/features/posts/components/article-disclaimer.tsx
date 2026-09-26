import Link from "next/link";

// Fixed copy on every article — never model-generated. (EDITORIAL.md §5)
export function ArticleDisclaimer() {
  return (
    <aside
      aria-label="Disclaimer"
      className="rounded-lg bg-surface-subtle p-5 text-xs text-ink-muted"
    >
      This article is for general education and isn&rsquo;t medical advice. It can&rsquo;t diagnose
      you or tell you what treatment is right for you. If you&rsquo;re worried about a symptom, or
      it is getting worse, speak to a doctor, pharmacist or other qualified health professional. In
      an emergency, call your local emergency number.{" "}
      <Link href="/medical-disclaimer">Full medical disclaimer</Link>.
    </aside>
  );
}
