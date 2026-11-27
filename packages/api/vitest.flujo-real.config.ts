import { defineConfig } from "vitest/config";

/**
 * Flujo operativo completo contra un Supabase REAL (local), sin mocks:
 * JWT reales por rol, RLS, GRANTs, triggers y RPCs tal como los usan las apps.
 * Requiere `pnpm db:start` (o `supabase start`) con todas las migraciones.
 *
 *   pnpm test:flujo-real
 */
export default defineConfig({
  test: {
    include: ["tests/flujo-real/**/*.test.ts"],
    testTimeout: 30_000,
    hookTimeout: 60_000,
    sequence: { concurrent: false },
    fileParallelism: false
  }
});
