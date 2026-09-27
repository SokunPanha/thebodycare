// IMMUTABLE once used in production. Never edit — add prompts/v5/. (CLAUDE.md non-negotiable 7)
//
// v4 (2026-09-27): first aid, for the Symptoms & First Aid category (EDITORIAL.md §2).
//   - The writer's system prompt gains a FIRST AID section — the rules apply wherever first aid
//     appears, in any category.
//   - When the brief is for a first-aid category, research also gathers the steps recognised
//     first-aid bodies give, and the writer adds a "First aid: what to do now" section.
// Everything else is v3 unchanged.

import {
  draftSystemPrompt as v3,
  draftUserPrompt as v3User,
  researchSystemPrompt,
  researchUserPrompt as v3ResearchUser,
  type DraftBrief as V3Brief,
} from "../v3/draft-article";

export { researchSystemPrompt };

export type DraftBrief = V3Brief & {
  /** The category is one whose articles carry a first-aid section (config/categories.ts). */
  firstAid?: boolean;
};

export const DRAFT_PROMPT_VERSION = "v4/draft-article";

const firstAidRules = `## FIRST AID

When an article includes first aid, it gives only the immediate, practical steps a bystander can take until professional help arrives or the problem settles, as recommended by recognised first-aid bodies (the NHS, the Red Cross, St John Ambulance, resuscitation councils, national health services).

- If the situation can be an emergency, the first step is always to call the local emergency number. Say which signs mean calling straight away.
- Write the steps as a short numbered list, in the order they should be done, in plain words.
- Never name or dose a medicine, even where official first aid involves one. Say only "if they have their own prescribed emergency medicine, such as an auto-injector, help them use it" or "the call handler may tell you what to do".
- Do not give step-by-step instructions for skills that need training to do safely, such as CPR or back blows and abdominal thrusts. Say the call handler will guide them, and that a first-aid course teaches these properly.
- Mention common folk remedies only to say not to use them (for example, no butter, ice or toothpaste on a burn).
- First aid never replaces care: the when_to_seek_care field still says clearly when to get help.`;

const v3Structure = "## STRUCTURE";
if (!v3.includes(v3Structure))
  throw new Error("prompts/v4/draft-article: v3 structure heading changed");

export const draftSystemPrompt = v3.replace(v3Structure, `${firstAidRules}\n\n${v3Structure}`);

export function researchUserPrompt(brief: DraftBrief): string {
  const base = v3ResearchUser(brief);
  if (!brief.firstAid) return base;
  return `${base}\n\nAlso find the first-aid steps that recognised first-aid bodies (the NHS, the Red Cross, St John Ambulance) recommend, in order, including when to call emergency services and what not to do. Leave out any medicine names or doses.`;
}

export function draftUserPrompt(brief: DraftBrief, notes: string): string {
  const base = v3User(brief, notes);
  if (!brief.firstAid) return base;
  return `${base}\n\nThis article needs a section headed "First aid: what to do now", placed early, with the steps as a numbered list, following the FIRST AID rules.`;
}
