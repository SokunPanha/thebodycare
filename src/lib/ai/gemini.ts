import "server-only";

import { GoogleGenAI, type GenerateContentResponse } from "@google/genai";
import type { z } from "zod";

import { env } from "@/env";

import { textCost, type Usage } from "./costs";

// Gemini via Vertex AI. One client per server instance.

export class GeminiError extends Error {
  constructor(
    message: string,
    readonly transient: boolean,
    readonly status?: number,
  ) {
    super(message);
    this.name = "GeminiError";
  }
}

let client: GoogleGenAI | undefined;

export function isGeminiConfigured() {
  return Boolean(
    env.GOOGLE_CLOUD_PROJECT &&
    (env.GEMINI_SERVICE_ACCOUNT_JSON || env.GEMINI_SERVICE_ACCOUNT_FILE),
  );
}

export function gemini(): GoogleGenAI {
  if (client) return client;
  if (!isGeminiConfigured()) {
    throw new GeminiError(
      "Gemini isn't configured — set GOOGLE_CLOUD_PROJECT and GEMINI_SERVICE_ACCOUNT_FILE (or _JSON).",
      false,
    );
  }
  client = new GoogleGenAI({
    vertexai: true,
    project: env.GOOGLE_CLOUD_PROJECT,
    location: env.GOOGLE_CLOUD_LOCATION,
    googleAuthOptions: {
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
      ...(env.GEMINI_SERVICE_ACCOUNT_JSON
        ? { credentials: JSON.parse(env.GEMINI_SERVICE_ACCOUNT_JSON) }
        : { keyFile: env.GEMINI_SERVICE_ACCOUNT_FILE }),
    },
  });
  return client;
}

// From ../Youtube Automation/backend/utils/gemini_text.py: these are worth retrying.
const TRANSIENT_STATUS = new Set([408, 429, 500, 502, 503, 504]);

function classify(error: unknown): GeminiError {
  if (error instanceof GeminiError) return error;
  const status = (error as { status?: number })?.status;
  const message = error instanceof Error ? error.message : String(error);
  const network = /fetch failed|ECONNRESET|ETIMEDOUT|ENOTFOUND|socket hang up|network/i.test(
    message,
  );
  return new GeminiError(
    message.slice(0, 500),
    network || (status !== undefined && TRANSIENT_STATUS.has(status)),
    status,
  );
}

/** Markdown fences still appear in JSON mode — strip them, and any prose around the object. */
export function unwrapJson(text: string): string {
  let t = text.trim();
  const fenced = t.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/);
  if (fenced) t = fenced[1]!.trim();
  if (!t.startsWith("{")) {
    const i = t.indexOf("{");
    const j = t.lastIndexOf("}");
    if (i !== -1 && j > i) t = t.slice(i, j + 1);
  }
  return t;
}

export type GeminiResult<T> = {
  data: T;
  response: GenerateContentResponse;
  usage: Usage | undefined;
  costUsd: number;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * One plain-text call, retried on transient failures. Used for grounded research: Vertex returns
 * grounding chunks reliably for free text, but often none once JSON output is requested
 * (measured 2026-09-27 — see prompts/v3/draft-article.ts).
 */
export async function generateText({
  model,
  system,
  prompt,
  grounding = false,
  temperature,
  attempts = 3,
}: {
  model: string;
  system: string;
  prompt: string;
  grounding?: boolean;
  temperature: number;
  attempts?: number;
}): Promise<GeminiResult<string>> {
  let lastError: GeminiError | undefined;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await gemini().models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: system,
          temperature,
          ...(grounding ? { tools: [{ googleSearch: {} }] } : {}),
        },
      });
      const usage = response.usageMetadata;
      const text = response.text?.trim();
      if (!text) {
        throw new GeminiError(
          `Empty response (finish reason: ${response.candidates?.[0]?.finishReason ?? "unknown"})`,
          false,
        );
      }
      return { data: text, response, usage, costUsd: textCost(model, usage) };
    } catch (error) {
      lastError = classify(error);
      if (!lastError.transient || attempt === attempts) throw lastError;
      await sleep(2_000 * 2 ** (attempt - 1));
    }
  }
  throw lastError ?? new GeminiError("Gemini call failed.", false);
}

/**
 * One structured-output call: retried on transient failures, then parsed through Zod
 * (CLAUDE.md non-negotiable 5) — a malformed response throws instead of reaching the database.
 */
export async function generateJson<S extends z.ZodType>({
  model,
  system,
  prompt,
  schema,
  jsonSchema,
  grounding = false,
  temperature,
  attempts = 3,
}: {
  model: string;
  system: string;
  prompt: string;
  schema: S;
  jsonSchema: object;
  grounding?: boolean;
  temperature: number;
  attempts?: number;
}): Promise<GeminiResult<z.infer<S>>> {
  let lastError: GeminiError | undefined;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await gemini().models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: system,
          temperature,
          responseMimeType: "application/json",
          responseJsonSchema: jsonSchema,
          ...(grounding ? { tools: [{ googleSearch: {} }] } : {}),
        },
      });
      const usage = response.usageMetadata;
      const costUsd = textCost(model, usage);
      const text = response.text;
      if (!text) {
        throw new GeminiError(
          `Empty response (finish reason: ${response.candidates?.[0]?.finishReason ?? "unknown"})`,
          false,
        );
      }
      let parsed: unknown;
      try {
        parsed = JSON.parse(unwrapJson(text));
      } catch {
        throw new GeminiError("Response wasn't valid JSON.", false);
      }
      // Throws a ZodError on a malformed shape — deliberately not retried: same prompt, same shape.
      return { data: schema.parse(parsed), response, usage, costUsd };
    } catch (error) {
      if (!(error instanceof Error) || error.name === "ZodError") throw error;
      lastError = classify(error);
      if (!lastError.transient || attempt === attempts) throw lastError;
      await sleep(2_000 * 2 ** (attempt - 1)); // 2s, 4s
    }
  }
  throw lastError ?? new GeminiError("Gemini call failed.", false);
}
