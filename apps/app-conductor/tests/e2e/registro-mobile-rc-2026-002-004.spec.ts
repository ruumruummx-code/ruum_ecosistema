import { expect, test, type Page } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });
import { openRegistration as fixture } from "../fixtures/registration";

async function geometry(page: Page) {
  const screen = page.locator("[data-conductor-registration]");
  const frame = await screen.boundingBox();
  const form = screen.locator("form");
  const noOverlap = await form.evaluate(element => {
    const fields = element.querySelector(":scope > fieldset")!.getBoundingClientRect();
    const footer = element.querySelector(":scope > footer")!.getBoundingClientRect();
    return fields.bottom <= footer.top + 1;
  });
  expect(noOverlap).toBe(true);
  if (!await page.getByRole("dialog").count()) {
    for (const control of await form.locator('input:visible, select:visible, button[type="submit"]:visible').all()) {
      await control.scrollIntoViewIfNeeded();
      const bounds = await control.boundingBox();
      expect(bounds!.y).toBeGreaterThanOrEqual(frame!.y - 1);
      expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(frame!.y + frame!.height + 1);
      expect(bounds!.x).toBeGreaterThanOrEqual(frame!.x);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(frame!.x + frame!.width);
    }
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}
async function checkSizes(page: Page) {
  for (const viewport of [{ width: 320, height: 568 }, { width: 360, height: 640 }, { width: 390, height: 844 }, { width: 430, height: 932 }, { width: 667, height: 375 }, { width: 320, height: 284 }]) {
    await page.setViewportSize(viewport);
    await expect.poll(() => page.locator("[data-conductor-registration]").evaluate((el) => el.clientHeight)).toBe(viewport.height);
    await geometry(page);
  }
}

test("Cuenta: controles accesibles, progreso 1 de 5, validación y enlace Entrar", async ({ page }) => {
  await fixture(page, null);
  await expect(page.getByRole("progressbar", { name: "Progreso de registro" })).toHaveAttribute("aria-valuenow", "1");
  await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuemax", "5");
  await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuetext", "1 de 5");
  await checkSizes(page);
  await page.screenshot({ animations: "disabled", path: test.info().outputPath("cuenta-teclado.png") });
  await expect(page.getByRole("button", { name: "Crear cuenta y continuar" })).toBeDisabled();
  const phone = page.getByLabel("Teléfono", { exact: true });
  await phone.fill("123");
  await phone.blur();
  await expect(phone).toHaveAttribute("aria-invalid", "true");
  await expect(phone).toHaveAccessibleDescription(/teléfono/i);
  await expect(page.getByRole("status").filter({ hasText: "teléfono" })).toBeVisible();
  await geometry(page);
  await page.getByRole("link", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Iniciar sesión", exact: true })).toBeVisible();
});

test("Cuenta: requisitos en tiempo real y envío con Enter abre identidad", async ({ page }) => {
  await fixture(page, null);
  await page.setViewportSize({ width: 320, height: 284 });
  await page.getByLabel("Teléfono", { exact: true }).fill("5512345678");
  await page.getByLabel("Correo", { exact: true }).fill("conductor@example.com");
  await page.getByLabel("Contraseña", { exact: true }).fill("Conductor2026");
  await page.getByLabel("Confirmar contraseña", { exact: true }).fill("Conductor2026");
  await expect(page.getByRole("list", { name: "Requisitos de contraseña" }).locator('[data-met="true"]')).toHaveCount(4);
  await page.getByRole("checkbox", { name: /Acepto los Términos y Condiciones/ }).check();
  await page.getByLabel("Confirmar contraseña", { exact: true }).press("Enter");
  await expect(page.getByRole("heading", { name: "Identidad", exact: true })).toBeVisible();
  await geometry(page);
});

test("Identidad: sheets validan, cancelan, guardan y conservan datos al volver", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/data/codigos-postales/52.json", (route) => route.fulfill({ json: { "52104": { estado: "México", ciudades: ["San Mateo Atenco"], colonias: ["Centro"] } } }));
  const calls = await fixture(page, 2);
  await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "2");
  await expect(page.getByRole("progressbar").locator('[data-active="true"]')).toHaveCount(2);
  await checkSizes(page);
  await page.setViewportSize({ width: 1280, height: 900 });
  // El marco debe adoptar el nuevo viewport y dimensiones antes de medir (mismo criterio que checkSizes).
  await expect.poll(async () => {
    const b = await page.locator("[data-conductor-registration]").boundingBox();
    return b ? { width: Math.round(b.width), height: Math.round(b.height), x: Math.round(b.x), y: Math.round(b.y) } : null;
  }).toEqual({ width: 440, height: 860, x: 420, y: 20 });
  await geometry(page);
  const next = page.getByRole("button", { name: "Guardar y continuar", exact: true });
  await expect(next).toBeDisabled();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: /Domicilio/ }).click();
  let dialog = page.getByRole("dialog", { name: "Domicilio", exact: true });
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate((el) => Math.round(el.getBoundingClientRect().height))).toBe(Math.round(844 * .85));
  await dialog.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(dialog.getByRole("status")).toContainText("código postal");
  await dialog.getByLabel("Código postal", { exact: true }).fill("52104");
  await expect(dialog.getByLabel("Estado", { exact: true })).not.toHaveValue("");
  await dialog.getByLabel("Calle", { exact: true }).fill("Juárez");
  await dialog.getByLabel("Número", { exact: true }).fill("12");
  await dialog.getByLabel("Referencias", { exact: true }).fill("Portón azul");
  await dialog.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Domicilio/ })).toContainText(/Juárez/i);
  await expect(next).toBeDisabled();
  await expect(page.getByRole("button", { name: /Domicilio/ })).toBeFocused();
  await page.getByRole("button", { name: /Contacto de emergencia/ }).click();
  dialog = page.getByRole("dialog", { name: "Contacto de emergencia", exact: true });
  expect(await dialog.evaluate((el) => Math.round(el.getBoundingClientRect().height))).toBe(422);
  await dialog.getByLabel("Nombre del contacto", { exact: true }).fill("María Gómez");
  await dialog.getByLabel("Teléfono del contacto", { exact: true }).fill("123");
  await dialog.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(dialog.getByRole("status")).toContainText("10 dígitos");
  await dialog.getByLabel("Teléfono del contacto", { exact: true }).fill("5512345678");
  await dialog.getByLabel("Teléfono del contacto", { exact: true }).press("Enter");
  await expect(next).toBeEnabled();
  await page.getByRole("button", { name: /Domicilio/ }).click();
  dialog = page.getByRole("dialog", { name: "Domicilio", exact: true });
  await dialog.getByLabel("Calle", { exact: true }).fill("No guardar");
  await dialog.getByRole("button", { name: "Cancelar", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Domicilio/ })).toContainText(/Juárez/i);
  await page.getByRole("button", { name: "Atrás", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Crea tu cuenta", exact: true })).toBeVisible();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(next).toBeEnabled();
  await next.click();
  await expect(page.getByRole("heading", { name: "Licencia (3/5)", exact: true })).toBeVisible();
  await expect.poll(() => calls.filter(call => call.rpc === "guardar_borrador_conductor").at(-1)?.body, { timeout: 15_000 }).toMatchObject({
    p_paso_actual: 3,
    p_domicilio: { calle: expect.stringMatching(/^Juárez$/i), numero: "12" },
    p_contacto_emergencia: { nombre: expect.stringMatching(/^María Gómez$/i) },
  });
});

test("Identidad: visualViewport y teclado dentro del sheet no alteran el lienzo", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await fixture(page, 2, true);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ animations: "disabled", path: test.info().outputPath("identidad.png"), timeout: 10_000 });
  await expect(page.getByPlaceholder("Como en tu identificación")).toHaveCount(0);
  for (const label of ["Nombre", "Apellido", "CURP"]) {
    const height = await page.getByLabel(label, { exact: true }).evaluate((input) => input.parentElement!.parentElement!.getBoundingClientRect().height);
    expect(height).toBeLessThanOrEqual(48);
  }
  await page.getByLabel("CURP", { exact: true }).focus();
  await page.evaluate(() => {
    Object.defineProperties(window.visualViewport!, { height: { configurable: true, value: 320 }, offsetTop: { configurable: true, value: 24 } });
    window.visualViewport!.dispatchEvent(new Event("resize"));
    window.visualViewport!.dispatchEvent(new Event("scroll"));
  });
  await expect.poll(() => page.locator("[data-conductor-registration]").evaluate((el) => el.clientHeight)).toBe(320);
  await expect.poll(() => page.locator("[data-conductor-registration]").evaluate((el) => el.getBoundingClientRect().top)).toBe(24);
  await expect(page.getByLabel("CURP", { exact: true })).toBeFocused();
  await geometry(page);
  await page.getByRole("button", { name: /Domicilio/ }).click();
  const dialog = page.getByRole("dialog", { name: "Domicilio", exact: true });
  await dialog.getByLabel("Referencias", { exact: true }).fill("Portón verde");
  await geometry(page);
  const activeField = await dialog.getByLabel("Referencias", { exact: true }).boundingBox();
  const sheetFooter = await dialog.locator("footer").boundingBox();
  expect(activeField!.y + activeField!.height).toBeLessThanOrEqual(sheetFooter!.y);
  expect(sheetFooter!.y + sheetFooter!.height).toBeLessThanOrEqual(344);
  await dialog.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await geometry(page);
});

test("Licencia: controles accesibles, 60%, consulta legal y consentimientos solo al continuar", async ({ page }) => {
  const calls = await fixture(page, 3, true);
  await expect(page.getByRole("progressbar")).toHaveAttribute("value", "60");
  await expect(page.getByRole("checkbox")).toHaveCount(0);
  await checkSizes(page);
  await page.getByRole("button", { name: "Ver declaración", exact: true }).click();
  const details = page.getByRole("dialog", { name: "Declaración y autorizaciones", exact: true });
  await expect(details).toContainText("geolocalización");
  await details.getByRole("button", { name: "Cerrar", exact: true }).click();
  expect(calls.filter((call) => call.rpc === "registrar_consentimientos_conductor")).toHaveLength(0);
  await page.getByLabel("Número de licencia", { exact: true }).fill("ABC12345");
  await page.getByLabel("Tipo de Licencia", { exact: true }).selectOption({ index: 1 });
  await page.getByLabel("Vigencia", { exact: true }).fill("2030-10-17");
  await page.screenshot({ animations: "disabled", path: test.info().outputPath("licencia-teclado.png") });
  await geometry(page);
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Documentos", exact: true })).toBeVisible();
  await expect.poll(() => calls.filter((call) => call.rpc === "registrar_consentimientos_conductor").length).toBeGreaterThan(0);
  expect(calls.find((call) => call.rpc === "registrar_consentimientos_conductor")!.body.p_consentimientos).toEqual(expect.arrayContaining([{ tipo_documento: "autorizacion_antecedentes", version: 1 }, { tipo_documento: "declaracion_suspensiones", version: 1 }]));
  await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuetext", "4 de 5");
});
