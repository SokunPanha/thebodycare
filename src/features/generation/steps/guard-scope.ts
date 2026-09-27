import "server-only";

import { generateJson } from "@/lib/ai/gemini";
import { textModels } from "@/lib/ai/models";

import { guardSystemPrompt, guardUserPrompt } from "../prompts/v2/guard-scope";
import {
  guardVerdictJsonSchema,
  guardVerdictSchema,
  type ScopeRule,
  type SourcedDraft,
} from "../schema";

// The scope guard (MVP.md M4.8): the second net behind the drafting prompt, and the reason the
// review queue can be trusted. Two layers — cheap deterministic checks first, then a Flash
// classifier for everything that needs judgement (V10's "a teaspoon, three times a day" is the
// case a regex can't catch). TESTING.md §1.

type Violation = { rule: ScopeRule; excerpt: string; explanation?: string };
export type ScopeVerdict = { verdict: "pass" | "fail"; violations: Violation[] };
export type GuardResult = {
  ok: boolean;
  reason: ScopeRule | null;
  verdict: ScopeVerdict;
  costUsd: number;
};

export const MIN_SOURCES = 3;

/** The article's own words — everything the reader sees except the source list. */
export function articleProse(draft: SourcedDraft): string {
  return [
    draft.title,
    draft.excerpt,
    ...draft.key_points,
    ...draft.sections.flatMap((s) => [s.heading, s.body]),
    draft.when_to_seek_care,
    ...draft.faq.flatMap((f) => [f.question, f.answer]),
  ].join("\n");
}

// Names and classes that are never acceptable in the prose. Deliberately short: the classifier is
// the real net; this catches the unambiguous cases for free. ("insulin" and "steroid" are left out
// — they're hormones the site explains, e.g. "insulin resistance".)
const DRUGS =
  /\b(ibuprofen|paracetamol|acetaminophen|aspirin|naproxen|codeine|tramadol|omeprazole|lansoprazole|esomeprazole|pantoprazole|ranitidine|famotidine|antacids?|laxatives?|statins?|atorvastatin|simvastatin|metformin|melatonin|zolpidem|sertraline|fluoxetine|citalopram|antidepressants?|benzodiazepines?|diazepam|antihistamines?|cetirizine|loratadine|beta[- ]blockers?|ace inhibitors?|amlodipine|lisinopril|levothyroxine|prednisolone|painkillers?|sleeping pills?)\b/i;
// International units only ever measure supplements and medicines.
const IU_DOSE = /\b\d[\d,.]*\s?(IU|international units)\b/i;

function excerptAround(text: string, match: RegExpMatchArray) {
  const start = Math.max(0, (match.index ?? 0) - 60);
  return text
    .slice(start, (match.index ?? 0) + match[0].length + 60)
    .replace(/\s+/g, " ")
    .trim();
}

/** Layer 1: structure, sources, and unambiguous words. No model call. */
export function deterministicViolations(draft: SourcedDraft): Violation[] {
  if (!draft.when_to_seek_care?.trim()) {
    return [
      {
        rule: "schema",
        excerpt: "(when_to_seek_care is empty)",
        explanation: "Required on every article.",
      },
    ];
  }
  if (draft.sources.length < MIN_SOURCES) {
    return [
      {
        rule: "insufficient_sources",
        excerpt: `(${draft.sources.length} usable sources)`,
        explanation: `At least ${MIN_SOURCES} live authority sources are required.`,
      },
    ];
  }
  const prose = articleProse(draft);
  const violations: Violation[] = [];
  const drug = prose.match(DRUGS);
  if (drug) violations.push({ rule: "medication_mention", excerpt: excerptAround(prose, drug) });
  const dose = prose.match(IU_DOSE);
  if (dose) violations.push({ rule: "dosage", excerpt: excerptAround(prose, dose) });
  return violations;
}

type Classifier = (draft: SourcedDraft) => Promise<{ verdict: ScopeVerdict; costUsd: number }>;

/** Layer 2: the Flash classifier. Temperature 0 — the same article should get the same verdict. */
export const classifyWithGemini: Classifier = async (draft) => {
  const { data, costUsd } = await generateJson({
    model: textModels.guard,
    system: guardSystemPrompt,
    prompt: guardUserPrompt(draft),
    schema: guardVerdictSchema,
    jsonSchema: guardVerdictJsonSchema,
    temperature: 0,
  });
  const violations = data.violations.map((v) => ({ ...v, rule: v.rule as ScopeRule }));
  // A "fail" with no violations, or violations under a "pass", is incoherent — trust the list.
  return { verdict: { verdict: violations.length ? "fail" : "pass", violations }, costUsd };
};

export async function guardScope(
  draft: SourcedDraft,
  { classify = classifyWithGemini }: { classify?: Classifier } = {},
): Promise<GuardResult> {
  const found = deterministicViolations(draft);
  if (found.length) {
    return {
      ok: false,
      reason: found[0]!.rule,
      verdict: { verdict: "fail", violations: found },
      costUsd: 0,
    };
  }
  const { verdict, costUsd } = await classify(draft);
  return {
    ok: verdict.verdict === "pass",
    reason: verdict.violations[0]?.rule ?? null,
    verdict,
    costUsd,
  };
}
