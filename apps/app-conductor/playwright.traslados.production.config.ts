import { defineConfig } from "@playwright/test";
import config from "./playwright.auth.config";

export default defineConfig({ ...config, testMatch: "driver-traslados.spec.ts" });
