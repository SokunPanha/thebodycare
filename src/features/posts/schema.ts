import { z } from "zod";

// posts.faq is jsonb, so the database only guarantees "an array". Parse it before rendering.
export const faqSchema = z.array(
  z.object({ question: z.string().min(1), answer: z.string().min(1) }),
);

/**
 * generation_runs.scope_verdict — written by the scope guard (M4, generation/steps/guard-scope).
 * This is the contract: the guard must produce this shape, and the review screen parses it.
 */
export const scopeVerdictSchema = z.object({
  verdict: z.enum(["pass", "fail"]),
  violations: z
    .array(z.object({ rule: z.string(), excerpt: z.string(), explanation: z.string().optional() }))
    .default([]),
});
export type ScopeVerdict = z.infer<typeof scopeVerdictSchema>;

const lines = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

/** The admin edit form. Mirrors the posts table's CHECK constraints so errors show inline. */
export const postEditSchema = z.object({
  title: z.string().trim().min(1, "Required").max(70, "70 characters at most"),
  excerpt: z.string().trim().min(1, "Required"),
  category_id: z.uuid("Choose a category"),
  key_points: z
    .string()
    .transform(lines)
    .pipe(z.array(z.string()).min(3, "At least 3 key points").max(5, "At most 5 key points")),
  body_md: z.string().trim().min(1, "Required"),
  when_to_seek_care: z.string().trim().min(1, "Every article needs this section"),
  seo_title: z
    .string()
    .trim()
    .max(60, "60 characters at most")
    .transform((value) => value || null),
  seo_description: z
    .string()
    .trim()
    .max(155, "155 characters at most")
    .transform((value) => value || null),
});
export type PostEditInput = z.input<typeof postEditSchema>;
