// Generation: topic selection → dedup → draft → scope guard → persist.
// Public surface of this feature. Import from "@/features/generation", never a deep path. (STRUCTURE.md rule 2)
// Covers use v2 — v1 let underwear and bottle-like props through (see prompts/v2/cover-image.ts).
export { COVER_PROMPT_VERSION, coverImageAlt, coverImagePrompt } from "./prompts/v2/cover-image";
export { draftArticleSchema, type DraftArticle, type SourcedDraft } from "./schema";
export {
  deterministicViolations,
  guardScope,
  type GuardResult,
  type ScopeVerdict,
} from "./steps/guard-scope";
