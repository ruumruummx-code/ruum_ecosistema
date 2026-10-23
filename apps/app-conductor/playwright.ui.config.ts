import { defineConfig } from "@playwright/test";
import authConfig from "./playwright.auth.config";

export default defineConfig({
  ...authConfig,
  testMatch: [
    "login-mobile-rc-2026-001.spec.ts",
    "registro-mobile-rc-2026-002-004.spec.ts",
    "driver-navigation.spec.ts",
    "driver-desktop.spec.ts",
  ],
});
