import { defineConfig } from "@playwright/test";
import config from "./playwright.auth.config";

export default defineConfig({
  ...config,
  testMatch: ["driver-contained-scroll.spec.ts", "driver-profile-documents.spec.ts", "driver-bank-certification.spec.ts", "login-mobile-rc-2026-001.spec.ts"],
});
