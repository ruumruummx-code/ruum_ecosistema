import type { Page } from "@playwright/test";

/**
 * T03 — Fixture de sesión autenticada para E2E.
 *
 * El middleware NO se fía de la cookie: llama a GoTrue (`getUser`). El doble
 * local (`fixtures/mock-supabase.mjs`) valida exactamente este token, de modo
 * que "sesión válida" significa lo mismo para el navegador y para el servidor.
 * `playwright.config.ts` fija `NEXT_PUBLIC_SUPABASE_URL` al doble antes de que
 * corra ningún test; aquí solo se deriva el nombre de la cookie, igual que lo
 * hace supabase-js: `sb-<primer segmento del hostname>-auth-token`.
 *
 * OJO: estos valores deben coincidir con `fixtures/mock-supabase.mjs`
 * (ACCESS_TOKEN / REFRESH_TOKEN / USUARIO_E2E). No se importan de allí porque
 * Playwright compila los `.mjs` a CommonJS y `import.meta` no sobrevive.
 */
export const ACCESS_TOKEN_E2E = "mock_access_token";
/** Token de la MISMA cuenta con `estado_verificacion: "pendiente"`. */
export const ACCESS_TOKEN_PENDIENTE_E2E = "mock_access_token_pendiente";
export const REFRESH_TOKEN_E2E = "mock_refresh_token";
export const USUARIO_ID_E2E = "00000000-0000-4000-8000-00000000e001";
export const CORREO_E2E = "usuario@ejemplo.com";

/**
 * Variante de cuenta que se quiere simular. `verificada` es la única desde la
 * que el wizard de `/viajes/nuevo` deja solicitar; `pendiente` es la única
 * desde la que `/verificacion` ofrece el portal Didit. La variante viaja en
 * el TOKEN (no en un estado compartido del doble), así ambas pueden correr en
 * paralelo sin pisarse.
 */
export type VarianteSesion = "verificada" | "pendiente";

export function tokenParaVariante(variante: VarianteSesion): string {
  return variante === "pendiente" ? ACCESS_TOKEN_PENDIENTE_E2E : ACCESS_TOKEN_E2E;
}

export function urlSupabaseE2E(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.PLAYWRIGHT_SUPABASE_URL;
  if (!configuredUrl) {
    throw new Error(
      "Falta NEXT_PUBLIC_SUPABASE_URL para la fixture E2E (playwright.config.ts la inyecta desde el doble local)."
    );
  }
  return configuredUrl;
}

export function nombreCookieSesion(): string {
  const projectRef = new URL(urlSupabaseE2E()).hostname.split(".")[0];
  return `sb-${projectRef}-auth-token`;
}

/**
 * Semilla la cookie de sesión de Supabase en el contexto del navegador.
 *
 * `variante` elige el perfil que devolverá el doble (verificado / pendiente).
 * `token` permite forzar un token a propósito INVÁLIDO para certificar que el
 * middleware no se fía de la cookie.
 */
export async function seedMockAuthSession(
  page: Page,
  { variante = "verificada", token }: { variante?: VarianteSesion; token?: string } = {}
): Promise<void> {
  const accessToken = token ?? tokenParaVariante(variante);
  const session = {
    access_token: accessToken,
    refresh_token: REFRESH_TOKEN_E2E,
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: "bearer",
    user: {
      id: USUARIO_ID_E2E,
      aud: "authenticated",
      role: "authenticated",
      email: CORREO_E2E
    }
  };
  const value = `base64-${Buffer.from(JSON.stringify(session), "utf8").toString("base64url")}`;
  await page.context().addCookies([
    {
      name: nombreCookieSesion(),
      value,
      url: process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${process.env.PLAYWRIGHT_PORT ?? "3012"}`
    }
  ]);
}
