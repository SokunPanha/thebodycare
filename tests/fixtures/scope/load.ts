import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import type { SourcedDraft } from "@/features/generation";

// TESTING.md §1: each fixture is the valid base article with exactly one change, so a failure
// names the rule that leaked. `inject` appends a sentence to the second section.

type Source = SourcedDraft["sources"][number];
type Fixture = {
  name: string;
  expect: { ok: boolean; reason?: string };
  inject?: string;
  patch?: Partial<SourcedDraft>;
  patch_sources_append?: Source;
};

const dir = join(process.cwd(), "tests/fixtures/scope");
const base = JSON.parse(readFileSync(join(dir, "base-draft.json"), "utf8")) as SourcedDraft;

function build(fixture: Fixture): SourcedDraft {
  const draft: SourcedDraft = structuredClone({ ...base, ...fixture.patch });
  if (fixture.inject) draft.sections[1]!.body += ` ${fixture.inject}`;
  if (fixture.patch_sources_append) draft.sources.push(fixture.patch_sources_append);
  return draft;
}

export function loadFixtures(kind: "violations" | "valid") {
  return readdirSync(join(dir, kind))
    .filter((file) => file.endsWith(".json"))
    .map((file) => {
      const fixture = JSON.parse(readFileSync(join(dir, kind, file), "utf8")) as Fixture;
      return {
        name: fixture.name,
        reason: fixture.expect.reason,
        ok: fixture.expect.ok,
        draft: build(fixture),
      };
    });
}

export const baseDraft = () => structuredClone(base);
