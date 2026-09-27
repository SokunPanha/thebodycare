import { beforeAll, describe, expect, it, vi } from "vitest";
import { z } from "zod";

// TESTING.md G2/G3 at the client boundary: transient failures retry, malformed output never
// reaches the caller as data.

vi.mock("server-only", () => ({}));
const generateContent = vi.fn();
vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = { generateContent };
  },
}));

let gemini: typeof import("./gemini");
beforeAll(async () => {
  for (const [k, v] of Object.entries({
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
    NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
    SUPABASE_SERVICE_ROLE_KEY: "service",
    CRON_SECRET: "x".repeat(32),
    GOOGLE_CLOUD_PROJECT: "test-project",
    GEMINI_SERVICE_ACCOUNT_JSON: "{}",
  })) {
    vi.stubEnv(k, v);
  }
  vi.useFakeTimers({ shouldAdvanceTime: true, advanceTimeDelta: 1000 });
  gemini = await import("./gemini");
});

const schema = z.object({ answer: z.string() });
const call = () =>
  gemini.generateJson({
    model: "gemini-3.7-flash",
    system: "s",
    prompt: "p",
    schema,
    jsonSchema: {},
    temperature: 0,
  });
const ok = (text: string) => ({
  text,
  usageMetadata: { promptTokenCount: 1000, candidatesTokenCount: 100, thoughtsTokenCount: 200 },
  candidates: [{}],
});

describe("generateJson", () => {
  it("parses fenced JSON and costs thought tokens as output", async () => {
    generateContent.mockResolvedValueOnce(ok('```json\n{"answer":"yes"}\n```'));
    const result = await call();
    expect(result.data).toEqual({ answer: "yes" });
    // 1000 in × $0.75/M + (100 + 200) out × $3.75/M
    expect(result.costUsd).toBeCloseTo((1000 * 0.75 + 300 * 3.75) / 1e6, 10);
  });

  it("G3: retries a transient failure (503), then succeeds", async () => {
    generateContent.mockRejectedValueOnce(Object.assign(new Error("overloaded"), { status: 503 }));
    generateContent.mockResolvedValueOnce(ok('{"answer":"after retry"}'));
    expect((await call()).data).toEqual({ answer: "after retry" });
  });

  it("G3: gives up after three transient failures", async () => {
    generateContent.mockRejectedValue(Object.assign(new Error("overloaded"), { status: 503 }));
    await expect(call()).rejects.toMatchObject({ name: "GeminiError", transient: true });
    generateContent.mockReset();
  });

  it("does not retry a permanent failure (400)", async () => {
    generateContent.mockRejectedValueOnce(Object.assign(new Error("bad request"), { status: 400 }));
    await expect(call()).rejects.toMatchObject({ transient: false });
    expect(generateContent).toHaveBeenCalledTimes(1);
    generateContent.mockReset();
  });

  it("G2: malformed JSON or the wrong shape throws — never returned as data", async () => {
    generateContent.mockResolvedValueOnce(ok("not json at all"));
    await expect(call()).rejects.toThrow(/valid JSON/);
    generateContent.mockResolvedValueOnce(ok('{"answer": 42}'));
    await expect(call()).rejects.toMatchObject({ name: "ZodError" });
  });
});
