import { defineConfig, devices } from '@playwright/test';

const disableAuthArtifacts = process.env.PLAYWRIGHT_DISABLE_AUTH_ARTIFACTS === '1';
// 3000 puede estar ocupado por Docker/WSL en el entorno de desarrollo; usar
// un puerto dedicado evita que Playwright confunda otro listener con Next.
const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 3012);

/**
 * T03/T04 — Supabase hermético para la suite E2E.
 *
 * El middleware de app-usuario valida la sesión del lado servidor
 * (`supabase.auth.getUser()` → GoTrue, y `clasificarRolApp` → PostgREST).
 * Con una cookie falsa y un Supabase real, esas llamadas devuelven 401/[]
 * indistinguible de una red caída: la aserción "con sesión, /login redirige a
 * /" no puede ni pasar ni fallar de forma honesta. Por defecto la suite apunta
 * a un doble local (`tests/e2e/fixtures/mock-supabase.mjs`) para que el flujo
 * autenticado sea reproducible sin red, sin credenciales y sin tocar ningún
 * proyecto real.
 *
 * Opt-out: `PLAYWRIGHT_E2E_SUPABASE_REAL=1` con `PLAYWRIGHT_SUPABASE_URL`
 * (o `NEXT_PUBLIC_SUPABASE_URL`) apunta la suite a un proyecto real.
 */
const E2E_SUPABASE_REAL = process.env.PLAYWRIGHT_E2E_SUPABASE_REAL === '1';
const MOCK_SUPABASE_PUERTO = Number(process.env.PLAYWRIGHT_MOCK_SUPABASE_PORT ?? 54399);
const SUPABASE_URL = E2E_SUPABASE_REAL
  ? process.env.PLAYWRIGHT_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  : `http://127.0.0.1:${MOCK_SUPABASE_PUERTO}`;

if (!SUPABASE_URL) {
  throw new Error(
    'Falta NEXT_PUBLIC_SUPABASE_URL para la suite E2E (o define PLAYWRIGHT_E2E_SUPABASE_REAL=1 con un proyecto real).'
  );
}

// La fixture de sesión (fixtures/sesion.ts) deriva el nombre de la cookie del
// hostname de esta URL, igual que hace supabase-js en el servidor. Fijarla aquí
// (proceso de test Y servidor Next, que la inyecta en el bundle/middleware)
// evita que ambos piensen en proyectos distintos. En @next/env una variable ya
// presente en el proceso tiene prioridad sobre .env/.env.local, así que el
// override del `webServer` de abajo también gana.
process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_URL;

/** `next start` exige `pnpm --filter @ruum/app-usuario build` previo (así corre CI). */
const E2E_PRODUCCION = process.env.PLAYWRIGHT_E2E_PRODUCCION === '1';

function crearWebServers(): NonNullable<Parameters<typeof defineConfig>[0]['webServer']> {
  if (process.env.PLAYWRIGHT_SKIP_WEBSERVER) return [];

  const servidores: NonNullable<Parameters<typeof defineConfig>[0]['webServer']> = [];

  if (!E2E_SUPABASE_REAL) {
    servidores.push({
      command: 'node tests/e2e/fixtures/mock-supabase.mjs',
      env: { PLAYWRIGHT_MOCK_SUPABASE_PORT: String(MOCK_SUPABASE_PUERTO) },
      url: `http://127.0.0.1:${MOCK_SUPABASE_PUERTO}/`,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000
    });
  }

  servidores.push({
    command: E2E_PRODUCCION ? `pnpm exec next start -p ${PORT}` : `pnpm exec next dev -p ${PORT}`,
    port: PORT,
    timeout: E2E_PRODUCCION ? 60_000 : 180_000,
    reuseExistingServer: !process.env.CI,
    env: E2E_SUPABASE_REAL
      ? {}
      : {
          NEXT_PUBLIC_SUPABASE_URL: SUPABASE_URL,
          // La anon key del doble no valida nada (no hay backend real); solo hace
          // falta que exista para que createServerClient/crearClienteNavegador
          // no fallen y `tieneSupabaseConfigurado()` sea true.
          NEXT_PUBLIC_SUPABASE_ANON_KEY:
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'sb_publishable_anon_key_e2e_mock',
          // Sin token, `tieneMapboxConfigurado()` es false y el Paso 0 del wizard
          // nunca llega a cotizar: geocodificarRuta devuelve `incompletas` y la
          // previsualización se resuelve como "cotización especial". El token es
          // un placeholder (los specs interceptan toda petición a api.mapbox.com
          // y /api/ruta en el navegador), pero debe existir y empezar por "pk."
          // para que el gate lo acepte — igual que en CI.
          NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN:
            process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? 'pk.eyJuY19fZWVfdG9rZW5fcGxhY2Vob2xkZXIifQ'
        }
  });

  return servidores;
}

export default defineConfig({
  testDir: './tests',
  timeout: 90_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [['list'], ['html', { open: 'never' }], ['github']]
    : [['list'], ['html', { open: 'never' }]],
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || `http://localhost:${PORT}`,
    actionTimeout: 10_000,
    navigationTimeout: 60_000,
    trace: disableAuthArtifacts ? 'off' : 'on-first-retry',
    screenshot: disableAuthArtifacts ? 'off' : 'only-on-failure',
    video: disableAuthArtifacts ? 'off' : 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: crearWebServers(),
});
