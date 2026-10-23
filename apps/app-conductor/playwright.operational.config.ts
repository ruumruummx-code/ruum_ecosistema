import { defineConfig } from "@playwright/test";
import config from "./playwright.auth.config";

export default defineConfig({
  ...config,
  testMatch: "driver-operational.spec.ts",
  webServer: (Array.isArray(config.webServer) ? config.webServer : []).map((server, index) =>
    index === 0 ? { ...server, command: "node tests/fixtures/driver-operational-server.mjs" } : server),
});
