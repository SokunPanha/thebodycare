"use client";

import { useRef, useState } from "react";

import type { NextCoverResult } from "../../actions";

// Stop after this many failures in a row — it's a service problem, not a one-off.
const MAX_CONSECUTIVE_FAILURES = 3;

/**
 * Fills in missing covers one post at a time, with live progress and a Stop button. Each image is
 * its own server call (~30s), so no single request can hit the function time limit.
 */
export function BulkCoverButton({
  missing,
  aiEnabled,
  generateNext,
}: {
  missing: number;
  aiEnabled: boolean;
  generateNext: () => Promise<NextCoverResult>;
}) {
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(missing);
  const [done, setDone] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const stop = useRef(false);

  if (missing === 0 && done === 0) return null;

  async function run() {
    stop.current = false;
    setRunning(true);
    let failures = 0;
    let left = remaining;
    while (!stop.current && left > 0 && failures < MAX_CONSECUTIVE_FAILURES) {
      const result = await generateNext();
      left = result.remaining;
      setRemaining(left);
      if (result.error) {
        failures++;
        setLog((lines) => [`✗ ${result.title ?? "—"}: ${result.error}`, ...lines].slice(0, 5));
        if (!result.title) break; // not a per-post failure (e.g. not configured)
      } else if (result.title) {
        failures = 0;
        setDone((n) => n + 1);
        setLog((lines) => [`✓ ${result.title}`, ...lines].slice(0, 5));
      }
    }
    if (failures >= MAX_CONSECUTIVE_FAILURES) {
      setLog((lines) => [`Stopped after ${failures} failures in a row.`, ...lines]);
    }
    setRunning(false);
  }

  return (
    <div className="space-y-3 rounded-lg bg-surface p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm" role="status">
          {running
            ? `Generating… ${done} done, ${remaining} to go (about 30s each)`
            : remaining === 0
              ? `Finished — ${done} ${done === 1 ? "cover" : "covers"} added.`
              : `${remaining} ${remaining === 1 ? "post needs" : "posts need"} a cover photo.`}
        </p>
        {running ? (
          <button
            type="button"
            onClick={() => (stop.current = true)}
            className="rounded-full border border-line-strong px-4 py-2 text-sm font-semibold"
          >
            Stop after this one
          </button>
        ) : (
          remaining > 0 && (
            <button
              type="button"
              onClick={run}
              disabled={!aiEnabled}
              className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary hover:bg-primary-hover disabled:opacity-60"
            >
              Generate missing covers
            </button>
          )
        )}
        {!aiEnabled && (
          <p className="text-xs text-ink-muted">Needs WAVESPEED_API_KEY in the environment.</p>
        )}
      </div>
      {log.length > 0 && (
        <ul className="space-y-1 text-xs text-ink-muted">
          {log.map((line, i) => (
            <li key={`${i}-${line}`}>{line}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
