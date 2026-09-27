import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

// Tests that call real, billed APIs (Gemini on Vertex). Not part of `pnpm test`; run on demand
// with `pnpm test:live` — they cost a few cents and need .env.local's credentials.
// Node's built-in .env loader — the live tests need the real credentials.
process.loadEnvFile(".env.local");

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    include: ["tests/live/**/*.live.test.ts"],
    testTimeout: 120_000,
    fileParallelism: false,
    maxConcurrency: 4,
  },
});
