import { expect, test } from "@playwright/test";
import { aceptarConsentimientoSiAparece, esperarHidratacion } from "./fixtures/navegacion";
import { ETAPAS_PASAPORTE, PASAPORTE_ID } from "./fixtures/pasaporte.mjs";
import { seedMockAuthSession } from "./fixtures/sesion";

test("el Pasaporte Digital refleja siete etapas y muestra conductor, evidencia y pago", async ({ page }) => {
  test.skip(process.env.PLAYWRIGHT_E2E_SUPABASE_REAL === "1", "Requiere el fixture local del pasaporte.");
  test.setTimeout(150_000);

  for (const [etapa, avance] of Object.entries(ETAPAS_PASAPORTE)) {
    await test.step(etapa, async () => {
      await seedMockAuthSession(page, { token: `mock_pasaporte_${etapa}` });
      await page.goto(`/viajes/${PASAPORTE_ID}`, { waitUntil: "commit", timeout: 90_000 });
      if (avance === 1) await aceptarConsentimientoSiAparece(page);
      await expect(page.getByRole("heading", { name: "Pasaporte #RR-C200" })).toBeVisible();
      await expect(page.getByRole("progressbar", { name: "Progreso del traslado" })).toHaveJSProperty("value", avance);
    });
  }

  await esperarHidratacion(page);
  await page.getByRole("button", { name: "Datos y recibo" }).click();
  let dialogo = page.getByRole("dialog", { name: "Detalles del traslado" });
  await expect(dialogo.getByText("Conductor: Andrea Operadora")).toBeVisible();
  await expect(dialogo.getByText("Calificación: 4.8")).toBeVisible();
  await dialogo.getByRole("button", { name: "Recibo", exact: true }).click();
  await expect(dialogo.getByText("Pagado", { exact: true })).toBeVisible();
  await expect(dialogo.getByText(/Pago 1 de 1.*Stripe/i)).toBeVisible();
  await expect(dialogo.getByText(/\$500\.00/).first()).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialogo).toBeHidden();

  await page.getByRole("tab", { name: "Fotos" }).click();
  const evidencia = page.getByRole("button", { name: "Abrir foto inicial frontal" });
  await expect(evidencia).toContainText("inicial · frontal");
  await evidencia.click();
  dialogo = page.getByRole("dialog", { name: "Evidencia del vehículo" });
  await expect(dialogo).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialogo).toBeHidden();
});
