"use client";

import Link from "next/link";
import { useActionState } from "react";

import type { ActionState } from "../../actions";

const initial: ActionState = { error: null };

type Action = (previous: ActionState, formData: FormData) => Promise<ActionState>;

export function ReviewActions({
  postId,
  approve,
  reject,
}: {
  postId: string;
  approve: Action;
  reject: Action;
}) {
  const [approveState, approveAction, approving] = useActionState(approve, initial);
  const [rejectState, rejectAction, rejecting] = useActionState(reject, initial);
  const busy = approving || rejecting;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <form action={approveAction}>
          <button
            type="submit"
            disabled={busy}
            className="rounded bg-primary px-4 py-2 font-semibold text-on-primary hover:bg-primary-hover disabled:opacity-60"
          >
            {approving ? "Publishing…" : "Approve and publish"}
          </button>
        </form>
        <Link
          href={`/admin/posts/${postId}/edit`}
          className="rounded border border-line-strong px-4 py-2 font-semibold no-underline"
        >
          Edit
        </Link>
      </div>
      {approveState.error && (
        <p role="alert" className="text-sm font-semibold">
          {approveState.error}
        </p>
      )}

      <form action={rejectAction} className="space-y-2">
        <label htmlFor="reason" className="text-sm font-semibold">
          Reject — reason
        </label>
        <textarea
          id="reason"
          name="reason"
          rows={2}
          required
          placeholder="e.g. Names a medication in the second section"
          className="block w-full rounded-sm border border-line-strong bg-surface px-3 py-2 text-sm"
        />
        {rejectState.error && (
          <p role="alert" className="text-sm font-semibold">
            {rejectState.error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="rounded border border-line-strong px-4 py-2 text-sm font-semibold disabled:opacity-60"
        >
          {rejecting ? "Rejecting…" : "Reject"}
        </button>
      </form>
    </div>
  );
}
