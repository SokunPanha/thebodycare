"use client";

import { useRef, useState, useTransition } from "react";

import { previewMarkdown } from "../../actions";

/**
 * A markdown textarea with a Preview tab. Preview renders on the server through the same pipeline
 * as the live site, so it can't drift from what readers see. The textarea stays mounted (hidden)
 * while previewing, so the form still submits its value.
 */
export function MarkdownField({
  id,
  defaultValue,
  rows,
  className,
}: {
  id: string;
  defaultValue: string;
  rows: number;
  className: string;
}) {
  const textarea = useRef<HTMLTextAreaElement>(null);
  const [html, setHtml] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const showPreview = () =>
    startTransition(async () => {
      setHtml(await previewMarkdown(textarea.current?.value ?? ""));
    });

  const tab = (active: boolean) =>
    `px-3 py-1 text-sm font-semibold ${active ? "border-b-2 border-primary text-ink" : "text-ink-muted hover:text-ink"}`;

  return (
    <div>
      <div
        role="tablist"
        aria-label={`${id} mode`}
        className="mt-1 flex gap-1 border-b border-line"
      >
        <button
          type="button"
          role="tab"
          aria-selected={html === null}
          onClick={() => setHtml(null)}
          className={tab(html === null)}
        >
          Write
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={html !== null}
          onClick={showPreview}
          className={tab(html !== null)}
        >
          {pending ? "Rendering…" : "Preview"}
        </button>
      </div>
      <div hidden={html !== null}>
        <textarea
          ref={textarea}
          id={id}
          name={id}
          rows={rows}
          defaultValue={defaultValue}
          className={className}
        />
      </div>
      {html !== null && (
        <div
          className="prose mt-2 min-h-24 rounded-sm border border-line bg-surface px-4 py-3"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
    </div>
  );
}
