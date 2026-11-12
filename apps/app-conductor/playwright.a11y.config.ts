import { defineConfig } from "@playwright/test";
import interfaceConfig from "./playwright.interface.config";

export default defineConfig({ ...interfaceConfig, testDir: "./tests/a11y" });
