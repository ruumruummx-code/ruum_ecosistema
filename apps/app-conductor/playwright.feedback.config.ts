import { defineConfig } from "@playwright/test";
import config from "./playwright.auth.config";

export default defineConfig({
  ...config,
  testMatch: ["driver-earnings.spec.ts", "driver-notifications.spec.ts", "driver-navigation.spec.ts"],
});
