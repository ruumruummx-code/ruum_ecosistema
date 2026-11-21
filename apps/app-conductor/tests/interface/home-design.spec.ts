import { expect, test } from "@playwright/test";
import { session } from "./qa-session";

for (const mode of ["light", "dark"]) {
  for (const width of [320, 390]) {
    test(`inicio base: ${mode} ${width}`, async ({ page, context, request }, info) => {
      await request.get("http://127.0.0.1:54331/qa/reset");
      await session(page, context, mode);
      // Con GPS concedido el panel puede declararse listo para conducir.
      await context.grantPermissions(["geolocation"]); await context.setGeolocation({ latitude: 19.4326, longitude: -99.1332 });
      await page.setViewportSize({ width, height: width === 320 ? 568 : 844 });
      const errors: string[] = [];
      page.on("pageerror", error => errors.push(error.message));
      await page.goto("/panel");
      await expect(page.getByRole("heading", { name: "Inicio", exact: true })).toBeVisible();
      await expect(page.getByRole("heading", { name: "Tu actividad de hoy" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "Listo para conducir" })).toBeVisible();
      await expect(page.getByRole("link", { name: "Buscar traslados ahora" })).toHaveAttribute("href", "/viajes");
      const availability = page.getByRole("button", { name: "Pausar solicitudes", exact: true });
      await expect(availability).toBeVisible();
      await availability.click();
      const confirm = page.getByRole("dialog", { name: "¿Pasas a no disponible?" });
      await expect(confirm).toBeVisible();
      await confirm.getByRole("button", { name: "Cancelar" }).click();
      await expect(confirm).not.toBeVisible();
      await expect(availability).toBeVisible();
      await page.screenshot({ path: info.outputPath(`inicio-${mode}-${width}.png`) });
      const documents = page.getByRole("button", { name: /^Documentos:.*Ver estado operativo$/ });
      await documents.scrollIntoViewIfNeeded();
      await documents.click();
      const status = page.getByRole("dialog", { name: "Estado operativo" });
      await expect(status).toBeVisible();
      await expect(status.getByRole("link", { name: "Revisar documentos" })).toHaveAttribute("href", "/cuenta/documentos");
      await page.keyboard.press("Escape");
      await expect(status).not.toBeVisible();
      const menu = page.getByRole("button", { name: "Abrir menú", exact: true });
      await menu.scrollIntoViewIfNeeded();
      await menu.click();
      await expect(page.getByRole("navigation", { name: "Menú del conductor" })).toBeVisible();
      await page.keyboard.press("Escape");
      expect(await page.evaluate(() => ({ horizontal: document.documentElement.scrollWidth > innerWidth + 1, scroll: scrollY }))).toEqual({ horizontal: false, scroll: 0 });
      expect(errors).toEqual([]);
    });
  }
}


test("inicio de una cuenta en revisión comparte el marco y conserva sus documentos", async ({ page, context }, info) => {
  await session(page, context, "light");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("**/rest/v1/conductores*", route => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
    id: "00000000-0000-4000-8000-000000000002", auth_user_id: "00000000-0000-4000-8000-000000000001",
    nombre: "Conductor de prueba", estado: "en_revision", estado_expediente: "en_revision", documentos_vigentes: false,
  }) }));
  await page.goto("/panel");
  await expect(page.getByRole("heading", { name: "Inicio", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Tu solicitud está en revisión" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Estado documental" })).toBeVisible();
  await expect(page.getByRole("banner")).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(false);
  await page.screenshot({ path: info.outputPath("inicio-en-revision.png") });
});
