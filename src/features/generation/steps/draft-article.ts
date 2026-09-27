import "server-only";

import type { GenerateContentResponse } from "@google/genai";

import { generateJson, generateText } from "@/lib/ai/gemini";
import { textModels } from "@/lib/ai/models";

import {
  draftSystemPrompt,
  draftUserPrompt,
  researchSystemPrompt,
  researchUserPrompt,
  type DraftBrief,
} from "../prompts/v3/draft-article";
import { draftArticleJsonSchema, draftArticleSchema, type DraftArticle } from "../schema";

export type DraftResult = {
  draft: DraftArticle;
  /** The research call's response — its grounding metadata is where the sources come from. */
  response: GenerateContentResponse;
  costUsd: number;
  tokensIn: number;
  tokensOut: number;
  searchQueries: number;
};

export type Drafter = (brief: DraftBrief) => Promise<DraftResult>;

const chunkCount = (r: GenerateContentResponse) =>
  r.candidates?.[0]?.groundingMetadata?.groundingChunks?.length ?? 0;

/**
 * Drafting (M4.7), two calls (prompts/v3): grounded research in plain text, then the structured
 * article written from those notes, parsed through Zod.
 */
export const draftWithGemini: Drafter = async (brief) => {
  let costUsd = 0;
  let tokensIn = 0;
  let tokensOut = 0;
  let searchQueries = 0;
  const tally = (r: Awaited<ReturnType<typeof generateText>>) => {
    costUsd += r.costUsd;
    tokensIn += r.usage?.promptTokenCount ?? 0;
    tokensOut += (r.usage?.candidatesTokenCount ?? 0) + (r.usage?.thoughtsTokenCount ?? 0);
    searchQueries += r.response.candidates?.[0]?.groundingMetadata?.webSearchQueries?.length ?? 0;
  };

  const researchOnce = () =>
    generateText({
      model: textModels.draft,
      system: researchSystemPrompt,
      prompt: researchUserPrompt(brief),
      grounding: true,
      temperature: 0.3,
    });
  // Grounding occasionally comes back empty; one more try is cheaper than losing the topic.
  let research = await researchOnce();
  tally(research);
  if (chunkCount(research.response) === 0) {
    research = await researchOnce();
    tally(research);
  }

  const write = await generateJson({
    model: textModels.draft,
    system: draftSystemPrompt,
    prompt: draftUserPrompt(brief, research.data),
    schema: draftArticleSchema,
    jsonSchema: draftArticleJsonSchema,
    temperature: 0.7,
  });
  tally({ ...write, data: "" });

  return {
    // The writer had no search: any URL it lists is invented. Sources come from research only.
    draft: { ...write.data, sources: [] },
    response: research.response,
    costUsd,
    tokensIn,
    tokensOut,
    searchQueries,
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
