/**
 * The only coral on the page, and the one block that never collapses and never holds an ad.
 * Identified by its heading, not its colour. (DESIGN.md §7, §9)
 * `html` is the rendered when_to_seek_care markdown, produced by lib/markdown.
 */
export function WhenToSeekCare({ html }: { html: string }) {
  return (
    <section
      aria-labelledby="when-to-seek-care"
      className="rounded-lg border-2 border-accent bg-accent-wash p-6 md:p-8"
    >
      <h2 id="when-to-seek-care" className="flex items-center gap-2 text-lg text-accent-ink">
        <svg viewBox="0 0 20 20" aria-hidden="true" className="size-5 shrink-0">
          <circle cx="10" cy="10" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
          <path
            d="M10 5.5v5.5M10 14v.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        When to seek care
      </h2>
      <div className="prose mt-3" dangerouslySetInnerHTML={{ __html: html }} />
    </section>
  );
}
