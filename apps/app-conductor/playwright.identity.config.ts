import { defineConfig } from "@playwright/test";
import driverConfig from "./playwright.traslados.config";

// Solo servicios locales y respuestas interceptadas; no usa cuentas reales.
process.env.PLAYWRIGHT_SUPABASE_URL = "http://127.0.0.1:54329";

export default defineConfig({
  ...driverConfig,
  testMatch: "registro-mobile-rc-2026-002-004.spec.ts",
  grep: /Identidad:/,
  use: { ...driverConfig.use, actionTimeout: 15_000, screenshot: "off" },
});
