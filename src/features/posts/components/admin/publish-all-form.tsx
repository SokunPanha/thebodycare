"use client";

import { useActionState, useState } from "react";

import type { ActionState } from "../../actions";

const initial: ActionState = { error: null };

/**
 * Publish every ready AI draft at once, unreviewed. The checkbox is the confirmation — no browser
 * dialog — and it says exactly what the reader will (and won't) see.
 */
export function PublishAllForm({
  postIds,
  action,
}: {
  /** The ready drafts shown in the queue — only these are published. */
  postIds: string[];
  action: (previous: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const count = postIds.length;
  const [state, formAction, pending] = useActionState(action, initial);
  const [confirmed, setConfirmed] = useState(false);

  return (
    <form action={formAction} className="space-y-3 rounded border border-line bg-surface p-4">
      {postIds.map((id) => (
        <input key={id} type="hidden" name="id" value={id} />
      ))}
      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(event) => setConfirmed(event.target.checked)}
          className="mt-1 size-4 shrink-0"
        />
        <span>
          Publish all {count} ready AI {count === 1 ? "draft" : "drafts"} without a human review.
          They go live as The Body Cue Editorial Team, with no &ldquo;Reviewed by&rdquo;. I&rsquo;ve
          checked the covers below.
        </span>
      </label>
      <button
        type="submit"
        disabled={!confirmed || pending}
        className="rounded bg-primary px-4 py-2 font-semibold text-on-primary hover:bg-primary-hover disabled:opacity-60"
      >
        {pending ? "Publishing…" : `Publish all ${count}`}
      </button>
      {state.error && (
        <p role="alert" className="text-sm font-semibold">
          {state.error}
        </p>
      )}
    </form>
  );
}
