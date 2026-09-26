import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

// fetch is mocked: these tests never call WaveSpeed.

vi.mock("server-only", () => ({}));

let wavespeed: typeof import("./wavespeed");
const poll = { intervalMs: 1, timeoutMs: 200 };

beforeAll(async () => {
  for (const [key, value] of Object.entries({
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
    NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
    SUPABASE_SERVICE_ROLE_KEY: "service",
    GEMINI_API_KEY: "gemini",
    CRON_SECRET: "x".repeat(32),
    WAVESPEED_API_KEY: "ws-test-key",
  })) {
    vi.stubEnv(key, value);
  }
  wavespeed = await import("./wavespeed");
});

afterEach(() => vi.unstubAllGlobals());

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

/** Responds to each fetch in order. */
function sequence(...responses: (Response | Error)[]) {
  const fetchMock = vi.fn();
  for (const response of responses) {
    if (response instanceof Error) fetchMock.mockRejectedValueOnce(response);
    else fetchMock.mockResolvedValueOnce(response);
  }
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

// Factories, not shared objects: a Response body can only be read once.
const created = () => json({ data: { id: "pred-1" } });
const processing = () => json({ data: { status: "processing" } });
const completed = () =>
  json({ data: { status: "completed", outputs: ["https://cdn.example/img.jpeg"] } });
const image = () => new Response("jpeg-bytes");

describe("generateWavespeedImage", () => {
  it("creates, polls until complete, downloads — with the image-01 model and 16:9 size", async () => {
    const fetchMock = sequence(created(), processing(), completed(), image());
    const bytes = await wavespeed.generateWavespeedImage({ prompt: "calm bedroom", poll });

    expect(bytes.toString()).toBe("jpeg-bytes");
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://api.wavespeed.ai/api/v3/minimax/image-01/text-to-image");
    expect(init.headers.Authorization).toBe("Bearer ws-test-key");
    expect(JSON.parse(init.body)).toMatchObject({ size: "1344*768", num_images: 1 });
    expect(fetchMock.mock.calls[1]![0]).toBe(
      "https://api.wavespeed.ai/api/v3/predictions/pred-1/result",
    );
    expect(fetchMock.mock.calls[3]![0]).toBe("https://cdn.example/img.jpeg");
  });

  it("keeps polling through a network blip — the prediction is still running", async () => {
    sequence(created(), new Error("ENOTFOUND"), completed(), image());
    await expect(wavespeed.generateWavespeedImage({ prompt: "p", poll })).resolves.toBeInstanceOf(
      Buffer,
    );
  });

  it("retries a failed download instead of losing a paid image", async () => {
    sequence(created(), completed(), new Error("socket hang up"), image());
    await expect(wavespeed.generateWavespeedImage({ prompt: "p", poll })).resolves.toBeInstanceOf(
      Buffer,
    );
  });

  it("treats a content refusal as permanent", async () => {
    sequence(created(), json({ data: { status: "failed", error: "NSFW content detected" } }));
    await expect(wavespeed.generateWavespeedImage({ prompt: "p", poll })).rejects.toMatchObject({
      transient: false,
      message: expect.stringMatching(/refused this prompt/),
    });
  });

  it("treats a server-side prediction failure as transient", async () => {
    sequence(created(), json({ data: { status: "failed", error: "[1033] system error" } }));
    await expect(wavespeed.generateWavespeedImage({ prompt: "p", poll })).rejects.toMatchObject({
      transient: true,
    });
  });

  it("fails fast on a bad key or an empty balance", async () => {
    sequence(json({ message: "unauthorized" }, 401));
    await expect(wavespeed.generateWavespeedImage({ prompt: "p", poll })).rejects.toMatchObject({
      transient: false,
      message: expect.stringMatching(/WAVESPEED_API_KEY/),
    });
    sequence(json({ message: "Insufficient balance" }, 402));
    await expect(wavespeed.generateWavespeedImage({ prompt: "p", poll })).rejects.toMatchObject({
      transient: false,
      message: expect.stringMatching(/balance/),
    });
  });

  it("retries creating a prediction after a network failure", async () => {
    sequence(new Error("fetch failed"), created(), completed(), image());
    await expect(wavespeed.generateWavespeedImage({ prompt: "p", poll })).resolves.toBeInstanceOf(
      Buffer,
    );
  });

  it("treats the concurrency limit as busy, not broke — even when it mentions topping up", async () => {
    const busy = () =>
      json({ message: "Concurrency limit reached, top up balance to raise it" }, 429);
    sequence(busy(), busy(), busy());
    await expect(wavespeed.generateWavespeedImage({ prompt: "p", poll })).rejects.toMatchObject({
      transient: true,
      message: expect.stringMatching(/busy/),
    });
  });

  it("times out if the prediction never finishes", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(created());
    fetchMock.mockImplementation(async () => json({ data: { status: "processing" } }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      wavespeed.generateWavespeedImage({ prompt: "p", poll: { intervalMs: 1, timeoutMs: 20 } }),
    ).rejects.toMatchObject({ transient: true, message: expect.stringMatching(/timed out/) });
  });
});
