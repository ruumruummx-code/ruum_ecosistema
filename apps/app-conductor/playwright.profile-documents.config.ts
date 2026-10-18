import { defineConfig } from "@playwright/test";
import driverConfig from "./playwright.traslados.config";
export default defineConfig({ ...driverConfig, testMatch: "driver-profile-documents.spec.ts" });
