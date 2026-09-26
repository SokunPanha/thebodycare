"use client";

import { startTransition, useActionState, useEffect, useRef } from "react";

import type { CoverState } from "../../actions";

type Action = (previous: CoverState, formData: FormData) => Promise<CoverState>;
const initial: CoverState = { error: null };

const button =
  "rounded border border-line-strong px-4 py-2 text-sm font-semibold disabled:opacity-60";

/**
 * Cover controls for one post. `preview` is rendered on the server (PostCover), so the editor
 * shows exactly what the site will.
 */
export function CoverEditor({
  preview,
  hasCover,
  source,
  aiEnabled,
  generate,
  upload,
  remove,
}: {
  preview: React.ReactNode;
  hasCover: boolean;
  source: "ai" | "upload" | null;
  aiEnabled: boolean;
  generate: Action;
  upload: Action;
  remove: Action;
}) {
  const [generateState, generateAction, generating] = useActionState(generate, initial);
  const [uploadState, uploadAction, uploading] = useActionState(upload, initial);
  const [removeState, removeAction, removing] = useActionState(remove, initial);
  const busy = generating || uploading || removing;

  // React resets a <form action> after every submit — on a rejected upload that would wipe the
  // alt text the editor just typed. Submitting by hand keeps it; clear only after success.
  const uploadForm = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (uploadState.done) uploadForm.current?.reset();
  }, [uploadState]);
  const submitUpload = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => uploadAction(formData));
  };
  const error = generateState.error ?? uploadState.error ?? removeState.error;

  return (
    <section aria-labelledby="cover" className="max-w-(--measure) space-y-4">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="cover" className="text-lg">
          Cover
        </h2>
        <p className="text-xs text-ink-muted">
          {hasCover
            ? source === "ai"
              ? "AI-generated · credited on the article"
              : "Uploaded"
            : "No cover yet — generated art is shown instead"}
        </p>
      </div>

      <div className="overflow-hidden rounded border border-line">{preview}</div>

      <div className="flex flex-wrap items-center gap-3">
        <form action={generateAction}>
          <button
            type="submit"
            disabled={busy || !aiEnabled}
            className="rounded bg-primary px-4 py-2 text-sm font-semibold text-on-primary hover:bg-primary-hover disabled:opacity-60"
          >
            {generating
              ? "Generating… (up to a minute)"
              : hasCover
                ? "Regenerate with AI"
                : "Generate with AI"}
          </button>
        </form>
        {hasCover && (
          <form action={removeAction}>
            <button type="submit" disabled={busy} className={button}>
              {removing ? "Removing…" : "Remove cover"}
            </button>
          </form>
        )}
      </div>
      {!aiEnabled && (
        <p className="text-xs text-ink-muted">
          AI covers are off until WAVESPEED_API_KEY is set. You can still upload one.
        </p>
      )}

      <form
        ref={uploadForm}
        onSubmit={submitUpload}
        className="space-y-3 rounded border border-line bg-surface p-4"
      >
        <p className="text-sm font-semibold">Or upload your own</p>
        <div>
          <label htmlFor="cover-file" className="text-sm">
            Image — JPEG, PNG, WebP or AVIF, at least 1200px wide, up to 5 MB
          </label>
          <input
            id="cover-file"
            name="cover"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="mt-1 block w-full text-sm"
          />
        </div>
        <div>
          <label htmlFor="cover-alt" className="text-sm">
            Alt text — what the image shows
          </label>
          <input
            id="cover-alt"
            name="alt"
            className="mt-1 block w-full rounded-sm border border-line-strong bg-surface px-3 py-2 text-sm"
          />
        </div>
        <button type="submit" disabled={busy} className={button}>
          {uploading ? "Uploading…" : "Upload cover"}
        </button>
      </form>

      {error && (
        <p role="alert" className="text-sm font-semibold">
          {error}
        </p>
      )}
    </section>
  );
}
