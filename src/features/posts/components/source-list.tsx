import type { PostWithSources } from "../queries";

export function SourceList({ sources }: { sources: PostWithSources["sources"] }) {
  if (sources.length === 0) return null;

  return (
    <section aria-labelledby="sources" className="rounded-lg bg-surface p-6 shadow-sm">
      <h2 id="sources" className="text-lg">
        Sources
      </h2>
      <ol className="mt-4 list-decimal space-y-3 pl-6 text-sm marker:text-ink-muted">
        {sources.map((source) => (
          <li key={source.id}>
            <a href={source.url} rel="noopener" className="break-words">
              {source.title}
            </a>
            <span className="text-ink-muted"> — {source.publisher}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
