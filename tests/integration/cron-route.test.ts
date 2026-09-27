import { beforeAll, describe, expect, it, vi } from "vitest";

import { status as supabase } from "./local-supabase";

// TESTING.md G9: the cron endpoint refuses anything without the secret, and runs nothing.

vi.mock("server-only", () => ({}));
const runPipeline = vi.fn(async () => []);
vi.mock("@/features/generation", () => ({ runPipeline }));

let GET: (request: Request) => Promise<Response>;
const SECRET = "s".repeat(40);

beforeAll(async () => {
  for (const [k, v] of Object.entries({
    NEXT_PUBLIC_SUPABASE_URL: supabase.API_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: supabase.ANON_KEY,
    NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
    SUPABASE_SERVICE_ROLE_KEY: supabase.SERVICE_ROLE_KEY,
    CRON_SECRET: SECRET,
  })) {
    vi.stubEnv(k, v);
  }
  ({ GET } = await import("@/app/api/cron/generate/route"));
});

const request = (auth?: string) =>
  new Request(
    "http://localhost/api/cron/generate",
    auth ? { headers: { authorization: auth } } : {},
  );

describe("GET /api/cron/generate", () => {
  it("G9: 401 without the secret, and nothing runs", async () => {
    expect((await GET(request())).status).toBe(401);
    expect((await GET(request("Bearer wrong"))).status).toBe(401);
    expect((await GET(request(`Bearer ${SECRET}x`))).status).toBe(401);
    expect(runPipeline).not.toHaveBeenCalled();
  });

  it("runs the pipeline with the right secret", async () => {
    const response = await GET(request(`Bearer ${SECRET}`));
    expect(response.status).toBe(200);
    expect(runPipeline).toHaveBeenCalledOnce();
    expect(await response.json()).toEqual({ outcomes: [] });
  });
});
