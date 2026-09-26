"use client";

import { useActionState } from "react";

import type { BulkCoverState } from "../../actions";

const initial: BulkCoverState = { error: null };

export function BulkCoverButton({
  missing,
  aiEnabled,
  action,
}: {
  missing: number;
  aiEnabled: boolean;
  action: (previous: BulkCoverState) => Promise<BulkCoverState>;
}) {
  const [state, formAction, pending] = useActionState(action, initial);
  if (missing === 0 && !state.done) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg bg-surface p-4 shadow-sm">
      <p className="text-sm">
        <span className="font-semibold">{missing}</span>{" "}
        {missing === 1 ? "post needs" : "posts need"} a cover photo.
      </p>
      <form action={formAction}>
        <button
          type="submit"
          disabled={pending || !aiEnabled || missing === 0}
          className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary hover:bg-primary-hover disabled:opacity-60"
        >
          {pending ? "Generating… (about 30s per image)" : "Generate missing covers (5 at a time)"}
        </button>
      </form>
      {!aiEnabled && (
        <p className="text-xs text-ink-muted">Needs WAVESPEED_API_KEY in the environment.</p>
      )}
      {state.done !== undefined && (
        <p role="status" className="text-sm">
          Added {state.done} {state.done === 1 ? "cover" : "covers"}.
        </p>
      )}
      {state.error && <p className="w-full text-sm font-semibold">{state.error}</p>}
    </div>
  );
}
