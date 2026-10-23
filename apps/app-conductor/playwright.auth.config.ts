import { defineConfig, devices } from "@playwright/test";
import localConfig from "./playwright.traslados.config";

// El cliente y la cookie del fixture deben usar el mismo identificador de proyecto.
process.env.PLAYWRIGHT_SUPABASE_URL = "http://127.0.0.1:54329";

const webServers = Array.isArray(localConfig.webServer) ? localConfig.webServer : [];

export default defineConfig({
  ...localConfig,
  // Producción evita las recargas HMR que interrumpen clics y autoguardados.
  webServer: webServers.map((server, index) => index === 1 ? {
    ...server,
    command: "pnpm exec next build && pnpm exec next start -p 3001",
    timeout: 420_000,
    env: { ...server.env, RUUM_LOCAL_PRODUCTION: "true", NEXT_PUBLIC_RUUM_AMBIENTE: "development" },
  } : server),
  testMatch: ["login-mobile-rc-2026-001.spec.ts", "registro-mobile-rc-2026-002-004.spec.ts"],
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], storageState: { cookies: [], origins: [] } } }],
  use: { ...localConfig.use, actionTimeout: 15_000, serviceWorkers: "block", trace: "retain-on-failure" },
});
