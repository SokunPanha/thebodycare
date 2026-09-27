import "server-only";

import type { GenerateContentResponse } from "@google/genai";

import { trustedPublisher } from "@/config/sources";

// Sources come from Google's grounding metadata, never from the model's text. The spike found 6 of
// 15 model-written URLs dead (real domains, invented paths); the grounding data points at pages the
// search actually returned. (docs/spike/results/2026-09-27)

export type Source = { url: string; title: string; publisher: string };

const MAX_SOURCES = 6;
const UA = "Mozilla/5.0 (compatible; TheBodyCueBot/1.0; +https://thebodycue.com/about)";

/** A fetch that follows redirects and returns the final URL, status, and page <title>. */
export type PageCheck = (
  url: string,
) => Promise<{ url: string; status: number; title: string | null }>;

export const checkPage: PageCheck = async (url) => {
  try {
    const response = await fetch(url, {
      redirect: "follow",
      headers: { "User-Agent": UA, Accept: "text/html" },
      signal: AbortSignal.timeout(15_000),
    });
    const html = response.ok ? (await response.text()).slice(0, 200_000) : "";
    const title = html.match(/<title[^>]*>([^<]{3,300})<\/title>/i)?.[1] ?? null;
    return { url: response.url || url, status: response.status, title };
  } catch {
    return { url, status: 0, title: null };
  }
};

const decode = (s: string) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&ndash;|&#8211;/g, "–")
    .replace(/\s+/g, " ")
    .trim();

/** "Insomnia - NHS" → "Insomnia". Drops the site-name suffix most pages append. */
function cleanTitle(title: string | null, publisher: string, url: string): string {
  if (!title)
    return (
      new URL(url).pathname.split("/").filter(Boolean).pop()?.replace(/[-_]/g, " ") || publisher
    );
  const parts = decode(title).split(/\s+[|\-–—]\s+/);
  return (parts.length > 1 ? parts.slice(0, -1).join(" – ") : parts[0]!).slice(0, 200);
}

/**
 * The grounding chunks, resolved to real pages, filtered to trusted publishers that load, ranked by
 * how many passages of the article each one supports.
 */
/** Why each grounding page was kept or dropped — surfaced in the rejection reason so the
 *  allowlist can be tuned from the admin screen. */
export type SourceNote = {
  domain: string;
  outcome: "kept" | "untrusted" | "dead" | "duplicate";
  /** grounding = Google's search record; suggested = the model's own list (verified here). */
  via: "grounding" | "suggested";
  /** For dead links: the path and HTTP status, to tell an invented URL (404) from a site that
   *  blocks our checker (401/403/429) or a network failure (0). */
  detail?: string;
};

export async function collectSources(
  response: GenerateContentResponse,
  {
    check = checkPage,
    notes,
    suggested = [],
  }: { check?: PageCheck; notes?: SourceNote[]; suggested?: Source[] } = {},
): Promise<Source[]> {
  const grounding = response.candidates?.[0]?.groundingMetadata;
  const chunks = grounding?.groundingChunks ?? [];
  const supportCount = new Map<number, number>();
  for (const support of grounding?.groundingSupports ?? []) {
    for (const index of support.groundingChunkIndices ?? []) {
      supportCount.set(index, (supportCount.get(index) ?? 0) + 1);
    }
  }

  const ranked = chunks
    .map((chunk, index) => ({ chunk, index, support: supportCount.get(index) ?? 0 }))
    .filter(({ chunk }) => chunk.web?.uri)
    // Cheap pre-filter on the domain Google reports, before any network call.
    .filter(({ chunk }) => {
      const domain = chunk.web?.domain ?? chunk.web?.title ?? "";
      const trusted = trustedPublisher(domain) !== null;
      if (!trusted) notes?.push({ domain, outcome: "untrusted", via: "grounding" });
      return trusted;
    })
    .sort((a, b) => b.support - a.support);

  const sources: Source[] = [];
  const seen = new Set<string>();
  for (const { chunk } of ranked) {
    if (sources.length >= MAX_SOURCES) break;
    // Vertex grounding URIs are redirects (vertexaisearch…/grounding-api-redirect/…) — resolve them.
    const page = await check(chunk.web!.uri!);
    const domain = chunk.web?.domain ?? "?";
    if (page.status < 200 || page.status >= 400) {
      notes?.push({ domain, outcome: "dead", via: "grounding", detail: String(page.status) });
      continue;
    }
    const url = page.url.split("#")[0]!;
    const publisher = trustedPublisher(new URL(url).hostname);
    if (!publisher) {
      notes?.push({ domain: new URL(url).hostname, outcome: "untrusted", via: "grounding" }); // redirect landed elsewhere
      continue;
    }
    if (seen.has(url)) {
      notes?.push({ domain, outcome: "duplicate", via: "grounding" });
      continue;
    }
    seen.add(url);
    notes?.push({ domain, outcome: "kept", via: "grounding" });
    sources.push({ url, publisher, title: cleanTitle(page.title, publisher, url) });
  }

  // Then the model's own suggestions — some topics ground on nothing (mouth ulcers: 2 searches,
  // 0 chunks). Kept only if trusted AND live: the spike's bad citations were invented paths on
  // real domains, and a live check removes exactly those.
  for (const suggestion of suggested) {
    if (sources.length >= MAX_SOURCES) break;
    let host: string;
    try {
      host = new URL(suggestion.url).hostname;
    } catch {
      continue;
    }
    if (!trustedPublisher(host)) {
      notes?.push({ domain: host, outcome: "untrusted", via: "suggested" });
      continue;
    }
    const page = await check(suggestion.url);
    if (page.status < 200 || page.status >= 400) {
      const path = new URL(suggestion.url).pathname.slice(0, 60);
      notes?.push({
        domain: host,
        outcome: "dead",
        via: "suggested",
        detail: `${page.status} ${path}`,
      });
      continue;
    }
    const url = page.url.split("#")[0]!;
    const publisher = trustedPublisher(new URL(url).hostname);
    if (!publisher || seen.has(url)) {
      notes?.push({
        domain: host,
        outcome: publisher ? "duplicate" : "untrusted",
        via: "suggested",
      });
      continue;
    }
    seen.add(url);
    notes?.push({ domain: host, outcome: "kept", via: "suggested" });
    sources.push({
      url,
      publisher,
      title: page.title ? cleanTitle(page.title, publisher, url) : suggestion.title,
    });
  }
  return sources;
}
