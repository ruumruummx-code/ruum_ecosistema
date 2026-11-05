import { defineConfig } from "@playwright/test";
import config from "./playwright.traslados.config";

export default defineConfig({
  ...config,
  testMatch: "driver-mobile-shell.spec.ts",
  expect: { timeout: 30_000 },
  use: { ...config.use, launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : undefined },
  webServer: (Array.isArray(config.webServer) ? config.webServer : []).map(server => ({
    ...server,
    reuseExistingServer: !process.env.CI,
  })),
});
