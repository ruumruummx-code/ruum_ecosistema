import { test, expect } from "@playwright/test";
import { config as loadDotenv } from "dotenv";
import path from "node:path";

loadDotenv({ path: path.resolve(process.cwd(), ".env.local") });

/**
 * Carga masiva (xlsx) — RC-09/RC-10: la ruta /viajes/masivo con CSV y polling
 * ya no existe. El módulo vigente es un BottomSheet en el Paso 0 del wizard
 * (/viajes/nuevo) que acepta .xlsx y usa /api/viajes/masivos/*.
 */

async function seedMockAuthSession(page: import("@playwright/test").Page) {
  const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.PLAYWRIGHT_SUPABASE_URL ?? "https://mock.supabase.co";
  const projectRef = new URL(configuredUrl).hostname.split(".")[0];
  const session = {
    access_token: "mock_access_token",
    refresh_token: "mock_refresh_token",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: "bearer",
    user: { id: "00000000-0000-4000-8000-00000000e001", aud: "authenticated", role: "authenticated", email: "usuario@ejemplo.com" },
  };
  const value = `base64-${Buffer.from(JSON.stringify(session), "utf8").toString("base64url")}`;
  await page.context().addCookies([{ name: `sb-${projectRef}-auth-token`, value, url: process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${process.env.PLAYWRIGHT_PORT ?? "3012"}` }]);
}

async function mockWizardBase(page: import("@playwright/test").Page) {
  await page.route("**/rest/v1/usuarios**", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([{ id: "00000000-0000-4000-8000-00000000e001", email: "usuario@ejemplo.com", estado_verificacion: "verificado", foto_url: null, doc_identidad_url: null }]),
      });
    } else await route.continue();
  });
  await page.route("**/rest/v1/vehiculos**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
  });
  await page.route("**/rpc/previsualizar_tarifa_usuario**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ precio: 1234, categoria: "ligero_a" }) });
  });
}

async function abrirModuloCargaMasiva(page: import("@playwright/test").Page) {
  await seedMockAuthSession(page);
  await mockWizardBase(page);
  await page.goto("/viajes/nuevo", { waitUntil: "domcontentloaded" });
  const btn = page.getByRole("button", { name: /Abrir módulo de carga masiva de traslados/i });
  await expect(btn).toBeVisible({ timeout: 10000 });
  await btn.click();
  await expect(page.getByRole("heading", { name: /carga masiva de traslados/i })).toBeVisible({ timeout: 5000 });
}

test.describe("R6 Carga masiva (xlsx) en BottomSheet", () => {
  test("abre el módulo con límites y solo acepta .xlsx", async ({ page }) => {
    await abrirModuloCargaMasiva(page);

    await expect(page.getByText(/máximo 100/i).first()).toBeVisible();
    await expect(page.getByText(/5 MB/i).first()).toBeVisible();

    const fileInput = page.locator("#masivo-file-input");
    await expect(fileInput).toHaveAttribute("accept", /\.xlsx/);
  });

  test("cancelar cierra el módulo sin dejar la pantalla bloqueada", async ({ page }) => {
    await abrirModuloCargaMasiva(page);

    await page.getByRole("button", { name: /^Cancelar carga$/i }).click();

    // El BottomSheet debe cerrarse y volver al Paso 0 del wizard.
    await expect(page.getByRole("heading", { name: /carga masiva de traslados/i })).toBeHidden({ timeout: 5000 });
    await expect(page.getByRole("button", { name: /Abrir módulo de carga masiva de traslados/i })).toBeVisible({ timeout: 5000 });
  });
});
