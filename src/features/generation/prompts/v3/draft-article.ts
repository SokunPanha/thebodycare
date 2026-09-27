// IMMUTABLE once used in production. Never edit — add prompts/v4/. (CLAUDE.md non-negotiable 7)
//
// v3 (2026-09-27): drafting is split into two calls.
//
// In production, every v2 draft failed on sources. Measured against "why does stress upset my
// stomach": the v2 system prompt returned 0 grounding chunks whenever JSON output was requested
// (by schema or in the prompt) and 16 when the same prompt asked for plain text. The model's own
// URL suggestions were mostly invented (Harvard 404s) or blocked (Hopkins 403). A plain-text
// research call returned 9–13 chunks on each of three failing topics, mostly NHS / Mayo Clinic /
// Cleveland Clinic.
//
// So: (1) research, grounded, free text → the notes and the grounding pages (the sources);
// (2) write, ungrounded, structured → the article, from the notes only. The model never writes
// URLs. The writer's system prompt is v1's with the EVIDENCE section replaced; everything else is
// unchanged.

import {
  draftSystemPrompt as v1,
  draftUserPrompt as v1User,
  type DraftBrief,
} from "../v1/draft-article";

export type { DraftBrief };

export const DRAFT_PROMPT_VERSION = "v3/draft-article";

export const researchSystemPrompt = `You research health topics for The Body Cue, a publication that explains healthy living and what symptoms mean. It never practises medicine.

Use Google Search to find what health authorities (government health services such as the NHS and CDC, the NIH, major medical institutions such as Mayo Clinic and Cleveland Clinic, professional bodies and major health charities) and peer-reviewed research say about the topic. Do not rely on blogs, clinics marketing their services, social media, or anything selling a product.

Write research notes for a writer — not an article. Cover: what is happening and why, how common it is, typical durations or thresholds, what tends to help in everyday lifestyle terms, and the specific signs that mean someone should see a professional, including any that need urgent care. Keep each note factual and specific, and say which kind of source it comes from.

Do not name medications, drugs or supplements, and give no doses; where treatment exists, note only that it is a matter for a clinician.`;

export function researchUserPrompt(brief: DraftBrief): string {
  return [
    "Research notes for an article.",
    "",
    `Category: ${brief.category}`,
    `Subtopic: ${brief.subtopic}`,
    `Angle: ${brief.angle.replaceAll("-", " ")}`,
    `Audience: ${brief.audience}`,
    `The reader's search: "${brief.targetQuery}"`,
  ].join("\n");
}

const v1Evidence = `Use Google Search to research and ground every factual claim. Search for and rely on health authorities and government health services, major medical institutions, peer-reviewed research, and professional bodies. Do not rely on blogs, content farms, clinics marketing their services, social media, or anything selling a product.

Your sources are recorded automatically from your searches. Do NOT write URLs, a reference list, or bracketed citations in the text.`;

const v3Evidence = `You are given research notes drawn from health authorities and peer-reviewed research. Every factual claim you make must come from those notes. Do not add facts, figures or thresholds that are not in them; if the notes don't cover something, leave it out rather than guess.

The sources are recorded automatically from the research. Do NOT write URLs, a reference list, or bracketed citations in the text, and leave the sources field empty.`;

if (!v1.includes(v1Evidence))
  throw new Error("prompts/v3/draft-article: v1 evidence section changed");

export const draftSystemPrompt = v1.replace(v1Evidence, v3Evidence);

const v1Ground = "Ground every claim with Google Search.";

/** The writer's user turn: v1's brief, with the research notes in place of "search". */
export function draftUserPrompt(brief: DraftBrief, notes: string): string {
  const base = v1User(brief);
  if (!base.includes(v1Ground)) throw new Error("prompts/v3/draft-article: v1 user prompt changed");
  return base.replace(
    v1Ground,
    `Base every claim on these research notes:\n\n<research>\n${notes}\n</research>`,
  );
}
