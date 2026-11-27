import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PANEL_ADMIN_SMOKE_PORT ?? 3102);

export default defineConfig({
  testDir: "./tests/smoke",
  // Next dev compila Mapbox y los módulos operativos de forma diferida por
  // ruta. globalSetup los compila antes de las pruebas, y un solo worker evita
  // que varias compilaciones simultáneas agoten el timeout de page.goto.
  globalSetup: "./tests/calentar-rutas.ts",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "retain-on-failure"
  },
  webServer: {
    command: `pnpm exec next dev -p ${PORT}`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
      NEXT_PUBLIC_PANEL_ADMIN_DEMO: "true"
    }
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
