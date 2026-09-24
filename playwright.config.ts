import { defineConfig, devices } from "@playwright/test";

// E2E against a production build and the LOCAL Supabase stack (`pnpm db:start` first).
// Few journeys, kept trustworthy — TESTING.md §5.
const PORT = 3200;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `pnpm build && pnpm start --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    timeout: 240_000,
    reuseExistingServer: false,
  },
});
