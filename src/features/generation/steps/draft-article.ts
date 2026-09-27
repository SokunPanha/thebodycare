import "server-only";

import type { GenerateContentResponse } from "@google/genai";

import { generateJson } from "@/lib/ai/gemini";
import { textModels } from "@/lib/ai/models";

import { draftSystemPrompt, draftUserPrompt, type DraftBrief } from "../prompts/v1/draft-article";
import { draftArticleJsonSchema, draftArticleSchema, type DraftArticle } from "../schema";

export type DraftResult = {
  draft: DraftArticle;
  response: GenerateContentResponse;
  costUsd: number;
  tokensIn: number;
  tokensOut: number;
  searchQueries: number;
};

export type Drafter = (brief: DraftBrief) => Promise<DraftResult>;

/** Drafting (M4.7): Flash with Google Search grounding, parsed through Zod. */
export const draftWithGemini: Drafter = async (brief) => {
  const { data, response, usage, costUsd } = await generateJson({
    model: textModels.draft,
    system: draftSystemPrompt,
    prompt: draftUserPrompt(brief),
    schema: draftArticleSchema,
    jsonSchema: draftArticleJsonSchema,
    grounding: true,
    temperature: 0.7,
  });
  return {
    draft: data,
    response,
    costUsd,
    tokensIn: usage?.promptTokenCount ?? 0,
    tokensOut: (usage?.candidatesTokenCount ?? 0) + (usage?.thoughtsTokenCount ?? 0),
    searchQueries: response.candidates?.[0]?.groundingMetadata?.webSearchQueries?.length ?? 0,
  };
};

/**
 * Internal links (M4.12): keep links to the related posts the brief offered; unwrap any other
 * /posts/ link to plain text — the model must never point readers at a page that doesn't exist.
 */
export function keepKnownLinks(markdown: string, allowedSlugs: Set<string>): string {
  return markdown.replace(
    /\[([^\]]+)\]\(\/posts\/([a-z0-9-]+)\/?\)/g,
    (match, text: string, slug: string) =>
      allowedSlugs.has(slug) ? `[${text}](/posts/${slug})` : text,
  );
}

export function withKnownLinks(draft: DraftArticle, allowedSlugs: Set<string>): DraftArticle {
  return {
    ...draft,
    sections: draft.sections.map((s) => ({ ...s, body: keepKnownLinks(s.body, allowedSlugs) })),
    when_to_seek_care: keepKnownLinks(draft.when_to_seek_care, allowedSlugs),
  };
}

/** Sections → one markdown body: "## heading" then the section. */
export function bodyMarkdown(draft: DraftArticle): string {
  return draft.sections.map((s) => `## ${s.heading.trim()}\n\n${s.body.trim()}`).join("\n\n");
}
