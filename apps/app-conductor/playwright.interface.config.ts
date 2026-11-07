import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/interface",
  testMatch: "**/*.spec.ts",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  workers: 1,
  reporter: "list",
  use: { baseURL: "http://localhost:3003", serviceWorkers: "block", trace: "retain-on-failure", screenshot: "only-on-failure", launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : undefined },
  webServer: [
    { command: "node tests/interface/fixture.mjs", url: "http://127.0.0.1:54331/health", reuseExistingServer: !process.env.CI },
    { command: "pnpm exec next start -p 3003", url: "http://localhost:3003/login", reuseExistingServer: !process.env.CI, env: { NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54331", NEXT_PUBLIC_SUPABASE_ANON_KEY: "sb_publishable_e2e_only", RUUM_LOCAL_PRODUCTION: "true", NEXT_PUBLIC_RUUM_AMBIENTE: "development" } },
  ],
});
