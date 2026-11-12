import { defineConfig, devices } from "@playwright/test";
import base from "./playwright.config";

export default defineConfig({
  ...base,
  testMatch: "**/registro-individual.spec.ts",
  workers: 1,
  projects: [
    { name: "web-pequeno", use: { browserName: "chromium", viewport: { width: 320, height: 568 } } },
    { name: "android", use: { ...devices["Pixel 5"] } },
    { name: "ios", use: { ...devices["iPhone 13"] } },
    { name: "escritorio", use: { browserName: "chromium", viewport: { width: 1440, height: 900 } } },
  ],
});
