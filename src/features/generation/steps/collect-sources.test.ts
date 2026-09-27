import type { GenerateContentResponse } from "@google/genai";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { collectSources } = await import("./collect-sources");

// Sources come from grounding metadata, filtered to trusted publishers that load.
const redirect = (n: number) =>
  `https://vertexaisearch.cloud.google.com/grounding-api-redirect/${n}`;
const response = {
  candidates: [
    {
      groundingMetadata: {
        groundingChunks: [
          { web: { uri: redirect(0), domain: "www.nhs.uk" } },
          { web: { uri: redirect(1), domain: "facebook.com" } },
          { web: { uri: redirect(2), domain: "mayoclinic.org" } },
          { web: { uri: redirect(3), domain: "health.harvard.edu" } },
          { web: { uri: redirect(4), domain: "www.nhs.uk" } }, // same page as 0 after redirect
          { web: { uri: redirect(5), domain: "sleepfoundation.org" } }, // dead
        ],
        groundingSupports: [
          { groundingChunkIndices: [2] },
          { groundingChunkIndices: [2, 3] },
          { groundingChunkIndices: [0] },
        ],
      },
    },
  ],
} as unknown as GenerateContentResponse;

const pages: Record<string, { url: string; status: number; title: string | null }> = {
  [redirect(0)]: {
    url: "https://www.nhs.uk/conditions/insomnia/#causes",
    status: 200,
    title: "Insomnia - NHS",
  },
  [redirect(2)]: {
    url: "https://www.mayoclinic.org/insomnia",
    status: 200,
    title: "Insomnia &amp; sleep | Mayo Clinic",
  },
  [redirect(3)]: { url: "https://www.health.harvard.edu/sleep", status: 200, title: null },
  [redirect(4)]: {
    url: "https://www.nhs.uk/conditions/insomnia/",
    status: 200,
    title: "Insomnia - NHS",
  },
  [redirect(5)]: { url: "https://www.sleepfoundation.org/gone", status: 404, title: null },
};
const check = vi.fn(async (url: string) => pages[url] ?? { url, status: 0, title: null });

describe("collectSources", () => {
  it("keeps trusted, live pages — resolved, de-duplicated, ranked by support", async () => {
    const sources = await collectSources(response, { check });
    expect(sources.map((s) => s.url)).toEqual([
      "https://www.mayoclinic.org/insomnia", // supports 2 passages
      // NHS and Harvard support 1 each — a tie keeps Google's order (NHS came first)
      "https://www.nhs.uk/conditions/insomnia/", // fragment dropped; chunk 4 is the same page
      "https://www.health.harvard.edu/sleep",
    ]);
    expect(sources[0]).toMatchObject({ publisher: "Mayo Clinic", title: "Insomnia & sleep" });
    expect(sources[1]).toMatchObject({ publisher: "NHS", title: "Insomnia" });
  });

  it("never fetches untrusted domains", async () => {
    await collectSources(response, { check });
    expect(check).not.toHaveBeenCalledWith(redirect(1));
  });

  it("drops a trusted-looking chunk whose redirect lands somewhere untrusted", async () => {
    const sneaky = vi.fn(async () => ({
      url: "https://supplement-shop.example/buy",
      status: 200,
      title: "Buy now",
    }));
    const one = {
      candidates: [
        {
          groundingMetadata: { groundingChunks: [{ web: { uri: redirect(9), domain: "nhs.uk" } }] },
        },
      ],
    };
    expect(
      await collectSources(one as unknown as GenerateContentResponse, { check: sneaky }),
    ).toEqual([]);
  });

  it("returns nothing when there's no grounding", async () => {
    expect(
      await collectSources({ candidates: [{}] } as GenerateContentResponse, { check }),
    ).toEqual([]);
  });
});
