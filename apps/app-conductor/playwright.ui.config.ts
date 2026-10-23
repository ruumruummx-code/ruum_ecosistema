import { defineConfig } from "@playwright/test";
import operationalConfig from "./playwright.operational.config";

export default defineConfig({
  ...operationalConfig,
  testMatch: [
    "login-mobile-rc-2026-001.spec.ts",
    "registro-mobile-rc-2026-002-004.spec.ts",
    "driver-navigation.spec.ts",
    "driver-desktop.spec.ts",
    "driver-operational.spec.ts",
    "driver-earnings.spec.ts",
    "driver-notifications.spec.ts",
    "driver-contained-scroll.spec.ts",
  ],
});
