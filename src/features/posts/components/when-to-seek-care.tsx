/**
 * The only coral on the page, and the one block that never collapses and never holds an ad.
 * Identified by its heading, not its colour. (DESIGN.md §7, §9)
 * `html` is the rendered when_to_seek_care markdown, produced by lib/markdown.
 */
export function WhenToSeekCare({ html }: { html: string }) {
  return (
    <section
      aria-labelledby="when-to-seek-care"
      className="rounded border-l-3 border-accent bg-accent-wash p-6"
    >
      <h2
        id="when-to-seek-care"
        className="font-sans text-2xs font-bold tracking-(--tracking-eyebrow) text-accent-ink uppercase"
      >
        When to seek care
      </h2>
      <div className="prose mt-3" dangerouslySetInnerHTML={{ __html: html }} />
    </section>
  );
}
