import type { TocHeading } from "@/lib/markdown/render";

// h2s only — h3s make a sidebar TOC too long to scan.
export function TableOfContents({
  headings,
  className = "",
}: {
  headings: TocHeading[];
  className?: string;
}) {
  const sections = headings.filter((heading) => heading.depth === 2);
  if (sections.length < 2) return null;

  return (
    <nav aria-label="In this article" className={className}>
      <p className="eyebrow">In this article</p>
      <ol className="mt-3 space-y-2 border-l border-line text-sm">
        {sections.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              className="-ml-px block border-l border-transparent pl-4 text-ink-muted no-underline hover:border-primary hover:text-primary"
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
