import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

// fetch is mocked: these tests never call MiniMax.

vi.mock("server-only", () => ({}));

let minimax: typeof import("./minimax");

beforeAll(async () => {
  for (const [key, value] of Object.entries({
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
    NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
    SUPABASE_SERVICE_ROLE_KEY: "service",
    GEMINI_API_KEY: "gemini",
    CRON_SECRET: "x".repeat(32),
    MINIMAX_API_KEY: "test-key",
  })) {
    vi.stubEnv(key, value);
  }
  minimax = await import("./minimax");
});

afterEach(() => vi.unstubAllGlobals());

function respond(body: unknown, status = 200) {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("generateImage", () => {
  it("sends image-01 with base64 output and returns the decoded bytes", async () => {
    const fetchMock = respond({
      data: { image_base64: [Buffer.from("fake-jpeg").toString("base64")] },
      base_resp: { status_code: 0, status_msg: "success" },
    });

    const bytes = await minimax.generateMinimaxImage({ prompt: "a calm bedroom", seed: 7 });

    expect(bytes.toString()).toBe("fake-jpeg");
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://api.minimax.io/v1/image_generation");
    expect(init.headers.Authorization).toBe("Bearer test-key");
    expect(JSON.parse(init.body)).toMatchObject({
      model: "image-01",
      response_format: "base64",
      aspect_ratio: "3:2",
      seed: 7,
      n: 1,
    });
  });

  it("truncates prompts to the 1500-character API limit", async () => {
    const fetchMock = respond({
      data: { image_base64: ["eA=="] },
      base_resp: { status_code: 0 },
    });
    await minimax.generateMinimaxImage({ prompt: "x".repeat(2000) });
    expect(JSON.parse(fetchMock.mock.calls[0]![1].body).prompt).toHaveLength(1500);
  });

  it.each([
    [1002, true, /rate limit/],
    [1004, false, /API key/],
    [1008, false, /balance/],
    [1026, false, /sensitive/],
  ])("classifies status %i (transient: %s)", async (code, transient, message) => {
    respond({ data: null, base_resp: { status_code: code, status_msg: "x" } });
    const error = await minimax.generateMinimaxImage({ prompt: "p" }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(minimax.ImageGenerationError);
    expect(error).toMatchObject({ code, transient });
    expect((error as Error).message).toMatch(message);
  });

  it("treats HTTP 5xx as transient and a malformed body as permanent", async () => {
    respond({}, 503);
    await expect(minimax.generateMinimaxImage({ prompt: "p" })).rejects.toMatchObject({
      transient: true,
    });
    respond({ unexpected: true });
    await expect(minimax.generateMinimaxImage({ prompt: "p" })).rejects.toMatchObject({
      transient: false,
    });
  });
});
