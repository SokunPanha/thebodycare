import { z } from "zod";

// The drafting contract (MVP.md M4.3). Zod is the gate (non-negotiable 5); the JSON Schema below
// steers Gemini and mirrors the Zod limits — change them together (schema.test.ts checks). Enforces the editorial structure (EDITORIAL.md §5):
// a 70-char title, 3–5 key points, and a when_to_seek_care that can't be empty.
//
// No `sources` field: the spike showed the model's own source list is unreliable (6 of 15 URLs
// dead). Sources come from Google's grounding metadata instead — see steps/collect-sources.ts.

export const draftArticleSchema = z.object({
  title: z.string().min(10).max(70),
  excerpt: z.string().min(40).max(320),
  key_points: z.array(z.string().min(10)).min(3).max(5),
  sections: z
    .array(z.object({ heading: z.string().min(3).max(120), body: z.string().min(80) }))
    .min(3)
    .max(8),
  when_to_seek_care: z.string().min(80),
  faq: z
    .array(z.object({ question: z.string().min(5), answer: z.string().min(20) }))
    .max(5)
    .default([]),
  seo: z.object({ title: z.string().min(10).max(60), description: z.string().min(50).max(155) }),
});
export type DraftArticle = z.infer<typeof draftArticleSchema>;

/** For Gemini's responseJsonSchema. Descriptions steer the model; limits mirror the Zod ones. */
export const draftArticleJsonSchema = {
  type: "object",
  required: ["title", "excerpt", "key_points", "sections", "when_to_seek_care", "faq", "seo"],
  properties: {
    title: {
      type: "string",
      maxLength: 70,
      description: "Plain, specific headline. 70 characters at most.",
    },
    excerpt: {
      type: "string",
      description: "Standfirst under the headline: one or two sentences, 140–240 characters.",
    },
    key_points: {
      type: "array",
      minItems: 3,
      maxItems: 5,
      items: { type: "string" },
      description: "The answer before the essay. Use as many as the topic needs, from 3 to 5.",
    },
    sections: {
      type: "array",
      minItems: 3,
      maxItems: 8,
      description: "Body sections. Vary the number and shape to fit the topic — no fixed skeleton.",
      items: {
        type: "object",
        required: ["heading", "body"],
        properties: {
          heading: { type: "string" },
          body: {
            type: "string",
            description:
              "Markdown: paragraphs, lists, bold, and links to related posts given in the brief. No headings.",
          },
        },
      },
    },
    when_to_seek_care: {
      type: "string",
      description:
        "REQUIRED. Specific thresholds: durations, measurable changes, symptom combinations, and which need urgent care. Markdown list allowed.",
    },
    faq: {
      type: "array",
      maxItems: 5,
      description: "Real questions people ask. 0 to 5 — only include ones worth answering.",
      items: {
        type: "object",
        required: ["question", "answer"],
        properties: { question: { type: "string" }, answer: { type: "string" } },
      },
    },
    seo: {
      type: "object",
      required: ["title", "description"],
      properties: {
        title: { type: "string", maxLength: 60 },
        description: { type: "string", maxLength: 155 },
      },
    },
  },
} as const;

/** A draft plus the sources the pipeline attached — what the scope guard and finalize see. */
export type SourcedDraft = DraftArticle & {
  sources: { url: string; title: string; publisher: string }[];
};

// ---- Scope guard -----------------------------------------------------------------------------

/** EDITORIAL.md §3 blocks, as reason codes (TESTING.md §1). */
export const SCOPE_RULES = [
  "medication_mention",
  "dosage",
  "diagnosis",
  "cure_claim",
  "treatment_substitution",
  "discourages_care",
  "home_remedy_as_treatment",
  "individual_advice",
] as const;
export type ScopeRule = (typeof SCOPE_RULES)[number] | "schema" | "insufficient_sources";

/** The classifier's output. Same shape as posts' scopeVerdictSchema (the review screen reads it). */
export const guardVerdictSchema = z.object({
  verdict: z.enum(["pass", "fail"]),
  violations: z
    .array(z.object({ rule: z.string(), excerpt: z.string(), explanation: z.string().optional() }))
    .default([]),
});

export const guardVerdictJsonSchema = {
  type: "object",
  required: ["verdict", "violations"],
  properties: {
    verdict: { type: "string", enum: ["pass", "fail"] },
    violations: {
      type: "array",
      items: {
        type: "object",
        required: ["rule", "excerpt", "explanation"],
        properties: {
          rule: { type: "string", enum: [...SCOPE_RULES] },
          excerpt: {
            type: "string",
            description: "The exact offending words, quoted from the article.",
          },
          explanation: { type: "string" },
        },
      },
    },
  },
} as const;
