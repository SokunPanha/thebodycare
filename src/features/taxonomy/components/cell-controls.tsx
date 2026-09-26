"use client";

import { useActionState } from "react";

import type { CellState } from "../actions";

const initial: CellState = { error: null };

export function CellControls({
  status,
  priority,
  toggle,
  prioritise,
}: {
  status: string;
  priority: number;
  toggle: ((previous: CellState) => Promise<CellState>) | null;
  prioritise: (previous: CellState, formData: FormData) => Promise<CellState>;
}) {
  const [toggleState, toggleAction, toggling] = useActionState(
    toggle ?? (async () => initial),
    initial,
  );
  const [priorityState, priorityAction, saving] = useActionState(prioritise, initial);
  const error = toggleState.error ?? priorityState.error;

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <form action={priorityAction} className="flex items-center gap-1">
        <select
          name="priority"
          defaultValue={priority}
          disabled={saving}
          onChange={(event) => event.currentTarget.form?.requestSubmit()}
          className="rounded-sm border border-line-strong bg-surface px-2 py-1 text-xs"
          aria-label="Priority (1 is first)"
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              P{n}
            </option>
          ))}
        </select>
      </form>
      {toggle && (
        <form action={toggleAction}>
          <button
            type="submit"
            disabled={toggling}
            className="rounded-sm border border-line-strong px-2 py-1 text-xs font-semibold disabled:opacity-60"
          >
            {status === "exhausted" ? "Reopen" : "Retire"}
          </button>
        </form>
      )}
      {error && (
        <p role="alert" className="w-full text-right text-xs font-semibold">
          {error}
        </p>
      )}
    </div>
  );
}
