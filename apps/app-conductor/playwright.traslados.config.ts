import { defineConfig } from "@playwright/test";

process.env.PLAYWRIGHT_TRASLADOS_FIXTURE = "1";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "driver-traslados.spec.ts",
  timeout: 420_000,
  workers: 1,
  reporter: "list",
  use: { baseURL: "http://localhost:3001", navigationTimeout: 360_000, screenshot: "only-on-failure" },
  webServer: [
    { command: "node tests/fixtures/driver-traslados-server.mjs", url: "http://127.0.0.1:54329/health", timeout: 20_000 },
    {
      // HTTP solo para el fixture de loopback; no cambia la configuración de despliegue.
      command: "pnpm exec next dev -p 3001",
      port: 3001,
      timeout: 120_000,
      env: { NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54329", NEXT_PUBLIC_SUPABASE_ANON_KEY: "sb_publishable_e2e_only" },
    },
  ],
});
