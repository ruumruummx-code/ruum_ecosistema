import { defineConfig } from "@playwright/test";
import config from "./playwright.operational.config";

export default defineConfig({ ...config, testMatch: "driver-opportunity.spec.ts" });
