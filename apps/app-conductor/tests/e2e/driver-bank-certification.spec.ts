import { expect, test, type Page } from "@playwright/test";

test.skip(process.env.PLAYWRIGHT_TRASLADOS_FIXTURE !== "1", "Requiere el API local de playwright.bank-certification.config.ts.");
const driverId = "00000000-0000-4000-8000-000000000002";
const userId = "00000000-0000-4000-8000-000000000001";
const token = `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ sub: userId, role: "authenticated", aud: "authenticated", exp: 2100000000 })).toString("base64url")}.e2e-signature`;
const user = { id: userId, email: "conductor@example.test", aud: "authenticated", role: "authenticated" };
const session = { access_token: token, refresh_token: "e2e-refresh-only", expires_at: 2100000000, expires_in: 36000000, token_type: "bearer", user };
const headers = { "access-control-allow-origin": "*" };
test.beforeEach(async ({ context, page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await context.addCookies([{ name: "sb-127-auth-token", value: `base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`, domain: "localhost", path: "/" }]);
  await page.clock.setFixedTime(new Date("2026-10-18T18:00:00Z"));
});
async function fixture(page: Page, existing = false) {
  const driver = { id: driverId, auth_user_id: userId, nombre: "Juan Pérez García", estado: "activo", foto_perfil_url: null, licencia_vigencia: "2027-12-31", identidad_validada: false, licencia_validada: false, autoriza_verificacion_antecedentes: false, capacitacion_aprobada: false, evaluacion_practica_aprobada: false, prueba_manejo_aprobada: false, nivel_certificacion: 2 };
  const documents = ["licencia_frente", "licencia_reverso", "documento_operativo", "constancia_situacion_fiscal"].map(type => ({ id: `doc-${type}`, conductor_id: driverId, tipo: type, es_actual: true, estado: "aprobado", version: 1, creado_en: "2026-10-18T12:00:00Z", expira_en: null }));
  const bank = existing ? { id: "bank-1", conductor_id: driverId, titular_cuenta: driver.nombre, banco: "BBVA México", clabe: "012345678901234567", numero_tarjeta: "1234567890123456", estado: "verificada" } : null;
  const mutations: Record<string, unknown>[] = [];
  await page.route("**/rest/v1/conductores?*", route => route.fulfill({ contentType: "application/json", headers, body: JSON.stringify(driver) }));
  await page.route("**/rest/v1/documentos_conductor?*", route => route.fulfill({ contentType: "application/json", headers, body: JSON.stringify(documents) }));
  await page.route("**/rest/v1/datos_bancarios_conductor?*", route => route.fulfill({ contentType: "application/json", headers, body: JSON.stringify(bank) }));
  await page.route("**/auth/v1/token?*", route => route.fulfill({ contentType: "application/json", headers, body: JSON.stringify(session) }));
  await page.route("**/rest/v1/rpc/conductor_guarda_datos_bancarios", async route => {
    const data = route.request().postDataJSON(); mutations.push(data);
    await route.fulfill({ contentType: "application/json", headers, body: JSON.stringify({ id: "bank-1", conductor_id: driverId, titular_cuenta: data.p_titular_cuenta, banco: data.p_banco, clabe: data.p_clabe, numero_tarjeta: data.p_numero_tarjeta, estado: "en_revision" }) });
  });
  return { driver, documents, bank, mutations };
}
async function open(page: Page, kind: "bank" | "certification") {
  await page.goto(kind === "bank" ? "/cuenta/datos-bancarios" : "/cuenta/certificacion", { waitUntil: "domcontentloaded" });
  if (kind === "bank") await expect(page.getByRole("form", { name: "Datos para depósito" })).toHaveAttribute("aria-busy", "false", { timeout: 180000 });
  else await expect(page.getByRole("region", { name: "Avance de certificación" })).toHaveAttribute("aria-busy", "false", { timeout: 180000 });
  await page.locator("nextjs-portal").evaluateAll(nodes => nodes.forEach(node => (node as HTMLElement).style.setProperty("display", "none", "important")));
  await expect(page.locator("[data-driver-details] header a")).toBeVisible();
  await expect(page.getByRole("img", { name: "Ruum Ruum", exact: true })).toBeVisible();
}
async function layout(page: Page) {
  const result = await page.locator("[data-driver-details]").evaluate(screen => ({
    width: screen.getBoundingClientRect().width, overflow: screen.scrollHeight - screen.clientHeight,
    documentOverflow: document.documentElement.scrollHeight - innerHeight,
    outside: [...screen.querySelectorAll("a,button,input,select,h1,h2,p")].filter(el => {
      if (el.closest('[inert],dialog:not([open])')) return false;
      const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (r.top < -1 || r.bottom > innerHeight + 1 || r.left < -1 || r.right > innerWidth + 1);
    }).map(el => el.getAttribute("aria-label") || el.textContent),
    outsideField: [...screen.querySelectorAll("form input,form select,form label")].filter(el => {
      if (el.closest("dialog")) return false;
      const field = el.parentElement?.parentElement; if (!field) return false;
      const control = el.getBoundingClientRect(), bounds = field.getBoundingClientRect();
      return control.height > 0 && (control.top < bounds.top - 1 || control.bottom > bounds.bottom + 1);
    }).map(el => el.id || el.textContent),
    overlaps: [...screen.firstElementChild!.children].filter(el => el.tagName !== "DIALOG").map(el => el.getBoundingClientRect()).filter(r => r.height > 0).slice(1).some((r, index, rects) => index > 0 && rects[index - 1].bottom > r.top + 1),
  }));
  expect(result.width).toBeLessThanOrEqual(440); expect(result.overflow).toBeLessThanOrEqual(1); expect(result.documentOverflow).toBeLessThanOrEqual(1); expect(result.outside).toEqual([]); expect(result.outsideField).toEqual([]); expect(result.overlaps).toBe(false);
}
for (const kind of ["bank", "certification"] as const) for (const size of [{ width: 320, height: 568 }, { width: 375, height: 667 }, { width: 390, height: 844 }, { width: 1280, height: 960 }]) {
  test(`${kind} sin scroll ${size.width}×${size.height}`, async ({ page }) => {
    await page.setViewportSize(size); await fixture(page); await open(page, kind); await layout(page);
    if (kind === "bank") { await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "4"); await expect(page.getByRole("button", { name: "Guardar y continuar" })).toBeDisabled(); }
    else await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "4");
  });
}
async function unlock(page: Page) {
  await page.getByRole("button", { name: "Confirma tu sesión", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Confirma tu sesión", exact: true });
  await dialog.getByLabel("Contraseña actual").fill("SecretPassword123");
  await dialog.getByRole("button", { name: "Confirmar sesión y editar datos" }).click();
  await expect(dialog).not.toBeVisible();
}
test("valida dígitos, confirma sesión y guarda antes de continuar", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 }); const state = await fixture(page); await open(page, "bank");
  await expect(page.getByLabel("Titular de la cuenta")).toHaveValue("Juan Pérez García");
  await expect(page.getByLabel("CLABE interbancaria")).toHaveAttribute("readonly", ""); await unlock(page);
  await page.getByLabel("CLABE interbancaria").fill("abc012345");
  await expect(page.getByLabel("CLABE interbancaria")).toHaveValue("012345");
  await page.getByLabel("CLABE interbancaria").fill("012345678901234567");
  await expect(page.getByLabel("CLABE interbancaria")).toHaveValue("012345678901234567");
  await expect(page.getByLabel("Banco emisor")).toHaveValue("BBVA México");
  const save = page.getByRole("button", { name: "Guardar y continuar" });
  await expect(save).toBeEnabled();
  await layout(page);
  await save.click();
  const confirm = page.getByRole("alertdialog", { name: "Actualizar cuenta para depósitos" });
  await expect(confirm).toContainText("terminación 4567");
  await expect(confirm).not.toContainText("012345678901234567");
  expect(state.mutations).toHaveLength(0);
  await confirm.getByRole("button", { name: "Guardar y enviar a revisión" }).click();
  await expect(page).toHaveURL(/\/cuenta\/certificacion$/, { timeout: 180000 });
  expect(state.mutations).toEqual([{ p_titular_cuenta: "Juan Pérez García", p_banco: "BBVA México", p_clabe: "012345678901234567", p_numero_tarjeta: null }]);
});
test("enmascara la cuenta existente y rechaza una confirmación incorrecta", async ({ page }) => {
  await fixture(page, true); await open(page, "bank");
  await expect(page.getByLabel("CLABE interbancaria")).toHaveValue("••••••••4567");
  await page.route("**/auth/v1/token?*", route => route.fulfill({ status: 400, contentType: "application/json", headers, body: JSON.stringify({ error_code: "invalid_credentials", msg: "Invalid login credentials" }) }));
  await page.getByRole("button", { name: "Confirma tu sesión", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Confirma tu sesión" }); await dialog.getByLabel("Contraseña actual").fill("Incorrect123");
  await dialog.getByRole("button", { name: "Confirmar sesión y editar datos" }).click(); await expect(dialog.getByRole("alert")).toBeVisible();
  await page.keyboard.press("Escape"); await expect(page.getByLabel("CLABE interbancaria")).toHaveAttribute("readonly", "");
  await expect(page.getByRole("button", { name: "Guardar y continuar" })).toBeDisabled();
});
test("acordeones muestran todos los textos sin scroll y solo uno abierto", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 }); await fixture(page); await open(page, "certification");
  for (const title of ["Capacitación y evaluación (MCE)", "Nivel de certificación", "Carta de derechos del conductor", "Compromisos del conductor"]) {
    const trigger = page.getByRole("button", { name: title, exact: true }); await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true"); await expect(page.locator('[aria-expanded="true"]')).toHaveCount(1);
    const next = page.getByRole("button", { name: `Siguiente: ${title}`, exact: true });
    do { await expect.poll(async () => page.getByRole("region", { name: title, exact: true }).evaluate(el => el.getBoundingClientRect().height)).toBeGreaterThan(50); await layout(page); if (await next.isDisabled()) break; await next.click(); } while (true);
  }
  await page.getByRole("button", { name: "Ver todos", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Requisitos de certificación" }); await expect(dialog.getByRole("listitem")).toHaveCount(10); await expect(dialog.getByText("✓ Listo", { exact: true })).toHaveCount(4);
});
test("completar lleva al requisito pendiente y no usa valores fijos", async ({ page }) => {
  const state = await fixture(page, true);
  state.documents.push({ ...state.documents[0], id: "doc-id", tipo: "identificacion_oficial" });
  state.driver.identidad_validada = true; state.driver.licencia_validada = true; state.driver.autoriza_verificacion_antecedentes = true;
  await open(page, "certification"); await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "8");
  await page.getByRole("button", { name: "Completar", exact: true }).click(); await expect(page.getByRole("button", { name: "Capacitación y evaluación (MCE)", exact: true })).toHaveAttribute("aria-expanded", "true");
  expect(page.url()).toContain("/cuenta/certificacion");
});
test("formulario bancario cabe con el teclado abierto", async ({ page }) => {
  await fixture(page); await open(page, "bank"); await unlock(page);
  await page.setViewportSize({ width: 375, height: 340 }); await page.getByLabel("CLABE interbancaria").focus(); await layout(page);
  // Android puede reducir solo visualViewport sin cambiar las media queries del viewport de diseño.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("[data-driver-details]").evaluate(el => (el as HTMLElement).style.setProperty("--details-height", "340px"));
  await layout(page);
  await page.getByRole("button", { name: "Ver aviso completo", exact: true }).click();
  const dialogBounds = await page.getByRole("dialog", { name: "Información", exact: true }).boundingBox();
  expect(dialogBounds).not.toBeNull(); expect(dialogBounds!.y).toBeGreaterThanOrEqual(0); expect(dialogBounds!.y + dialogBounds!.height).toBeLessThanOrEqual(340);
});
test("certificación completa refleja el nivel y las aprobaciones reales", async ({ page }) => {
  const state = await fixture(page, true);
  state.documents.push({ ...state.documents[0], id: "doc-id", tipo: "identificacion_oficial" });
  Object.assign(state.driver, { identidad_validada: true, licencia_validada: true, autoriza_verificacion_antecedentes: true, capacitacion_aprobada: true, evaluacion_practica_aprobada: true, prueba_manejo_aprobada: true });
  await open(page, "certification"); await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "10");
  await expect(page.getByText("Activo", { exact: true })).toBeVisible(); await expect(page.getByRole("button", { name: "Completado", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Nivel de certificación", exact: true }).click();
  await expect(page.getByRole("region", { name: "Nivel de certificación", exact: true })).toContainText("Nivel 2 · Intermedio");
  await layout(page);
});
test("banco respeta áreas seguras del iPhone antes y después de confirmar sesión", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await fixture(page); await open(page, "bank");
  // Chromium de escritorio devuelve env(safe-area-inset-*) = 0; se simula el padding del notch y del indicador de inicio.
  await page.locator("[data-driver-details] > div").evaluate(el => { (el as HTMLElement).style.paddingTop = "47px"; (el as HTMLElement).style.paddingBottom = "34px"; });
  await layout(page); await unlock(page); await layout(page);
});
test("certificación con acordeones abiertos respeta áreas seguras en pantalla alta", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await fixture(page); await open(page, "certification");
  await page.locator("[data-driver-details] > div").evaluate(el => { (el as HTMLElement).style.paddingTop = "47px"; (el as HTMLElement).style.paddingBottom = "34px"; });
  await layout(page);
  for (const title of ["Capacitación y evaluación (MCE)", "Nivel de certificación", "Carta de derechos del conductor", "Compromisos del conductor"]) {
    await page.getByRole("button", { name: title, exact: true }).click(); await layout(page);
  }
});
