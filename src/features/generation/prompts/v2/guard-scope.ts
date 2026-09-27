// IMMUTABLE once used in production. Never edit — add prompts/v3/. (CLAUDE.md non-negotiable 7)
//
// v2 (2026-09-27): first aid (EDITORIAL.md §2, §4). Official first-aid steps are allowed and must
// not be flagged as home_remedy_as_treatment; pointing to the person's own prescribed emergency
// medicine is allowed; naming or dosing that medicine is still a violation. Everything else is v1.

import { guardSystemPrompt as v1 } from "../v1/guard-scope";

export { guardUserPrompt } from "../v1/guard-scope";

export const GUARD_PROMPT_VERSION = "v2/guard-scope";

const v1Anchor =
  "- General statements that treatments exist and are for a clinician to discuss, with nothing named.";

if (!v1.includes(v1Anchor))
  throw new Error("prompts/v2/guard-scope: v1 NOT VIOLATIONS list changed");

export const guardSystemPrompt = v1.replace(
  v1Anchor,
  `${v1Anchor}
- First-aid steps a bystander takes until help arrives or the problem settles: "cool the burn under cool running water for 20 minutes", "press firmly on the wound with a clean cloth", "rest and raise the ankle", "call your local emergency number". These are first aid, not home remedies.
- Pointing to the person's own prescribed emergency medicine without naming or dosing it: "help them use their own auto-injector if they have one". Naming it ("adrenaline", "aspirin") or giving an amount is still medication_mention or dosage.
- Saying not to use a folk remedy ("don't put butter on a burn").

A remedy presented as treating or healing the problem ("put honey on the burn to heal it") is still home_remedy_as_treatment, even inside a first-aid section.`,
);
