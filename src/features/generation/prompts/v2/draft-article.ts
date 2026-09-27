// IMMUTABLE once used in production. Never edit — add prompts/v3/. (CLAUDE.md non-negotiable 7)
//
// v2 (2026-09-27): v1 told the model not to write URLs, relying on grounding metadata alone. In the
// first real runs, grounding returned NO pages for some topics ("why do i keep getting mouth
// ulcers": 2 searches, 0 grounding chunks) — it's topic-dependent. v2 asks for the model's sources
// again; the pipeline keeps only those that are on a trusted domain AND load (which removes the
// invented paths the spike found), after the grounding pages.
// Everything else is v1 unchanged.

import { draftSystemPrompt as v1 } from "../v1/draft-article";

export { draftUserPrompt, type DraftBrief } from "../v1/draft-article";

export const DRAFT_PROMPT_VERSION = "v2/draft-article";

const v1Sources =
  "Your sources are recorded automatically from your searches. Do NOT write URLs, a reference list, or bracketed citations in the text.";

const v2Sources =
  "List the pages you actually relied on in the sources field — the exact URL of each page as you found it in search, never a guessed or constructed URL. Every link is checked, and any that doesn't load is discarded. Do not put URLs or bracketed citations in the article text itself.";

if (!v1.includes(v1Sources))
  throw new Error("prompts/v2/draft-article: v1 evidence paragraph changed");

export const draftSystemPrompt = v1.replace(v1Sources, v2Sources);
