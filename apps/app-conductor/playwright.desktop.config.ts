import { defineConfig, devices } from "@playwright/test";
import localConfig from "./playwright.traslados.config";

export default defineConfig({
  ...localConfig,
  testMatch: "driver-desktop.spec.ts",
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
