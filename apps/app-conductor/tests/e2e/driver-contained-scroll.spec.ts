import { expect, test, type Locator, type Page } from "@playwright/test";

test.skip(process.env.PLAYWRIGHT_TRASLADOS_FIXTURE !== "1", "Requiere el API local de pruebas.");
test.beforeEach(async ({ page, context }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => localStorage.setItem("CapacitorStorage.ruum_conductor_onboarding_visto", "1"));
  const id = "00000000-0000-4000-8000-000000000001";
  const token = `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ sub: id, role: "authenticated", aud: "authenticated", exp: 2100000000 })).toString("base64url")}.e2e-signature`;
  await context.addCookies([{ name: "sb-127-auth-token", value: `base64-${Buffer.from(JSON.stringify({ access_token: token, refresh_token: "e2e-refresh-only", expires_at: 2100000000, token_type: "bearer", user: { id, email: "conductor@example.test" } })).toString("base64url")}`, domain: "localhost", path: "/" }]);
});
async function fixture(page: Page) {
  const driver = { id: "00000000-0000-4000-8000-000000000002", auth_user_id: "00000000-0000-4000-8000-000000000001", nombre: "Conductor de prueba", estado: "activo", estado_expediente: "aprobado", licencia_vigencia: "2027-12-31", identidad_validada: false, licencia_validada: false, nivel_certificacion: 2 };
  const documents = ["licencia_frente", "licencia_reverso", "identificacion_oficial", "constancia_situacion_fiscal", "documento_operativo"].map(tipo => ({ id: `doc-${tipo}`, conductor_id: driver.id, tipo, es_actual: true, estado: "aprobado", version: 1, creado_en: "2026-10-23T12:00:00Z", expira_en: null }));
  await page.route("**/rest/v1/conductores?*", route => route.fulfill({ headers: { "access-control-allow-origin": "*" }, json: driver }));
  await page.route("**/rest/v1/documentos_conductor?*", route => route.fulfill({ headers: { "access-control-allow-origin": "*" }, json: documents }));
  await page.route("**/rest/v1/datos_bancarios_conductor?*", route => route.fulfill({ headers: { "access-control-allow-origin": "*" }, json: null }));
  return { driver, documents };
}
async function available(target: Locator) {
  await expect(target).toBeVisible();
  await expect.poll(() => target.evaluate(node => {
    const r = node.getBoundingClientRect();
    const header = document.querySelector("[data-conductor-header]")?.getBoundingClientRect();
    const footer = document.querySelector("[data-conductor-mobile-nav]")?.getBoundingClientRect();
    const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    return r.top >= (header?.bottom ?? 0) && r.bottom <= (footer?.height ? footer.top : innerHeight) && !!hit && node.contains(hit);
  })).toBe(true);
}
async function still(page: Page) {
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  expect(await page.evaluate(() => ({ y: scrollY, horizontal: document.documentElement.scrollWidth > innerWidth }))).toEqual({ y: 0, horizontal: false });
}

for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 1280, height: 960 }]) {
  test(`scroll interno y retorno permanente en ${viewport.width}×${viewport.height}`, async ({ page }, info) => {
    await page.setViewportSize(viewport); await fixture(page);
    for (const path of ["/cuenta/documentos", "/cuenta/certificacion", "/cuenta/datos-bancarios", "/legal/terminos", "/legal/privacidad"]) {
      await test.step(path, async () => {
        await page.goto(path);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        if (path === "/cuenta/documentos") await expect(page.getByRole("region", { name: "Documentos requeridos", exact: true })).toHaveAttribute("aria-busy", "false");
        if (path === "/cuenta/certificacion") await expect(page.getByRole("region", { name: "Avance de certificación", exact: true })).toHaveAttribute("aria-busy", "false");
        const region = page.locator("[data-contained-scroll]");
        const back = page.locator("[data-contained-return]").getByRole("link");
        await available(back);
        expect(await region.evaluate(node => getComputedStyle(node).overflowY)).toBe("auto");
        expect(await region.evaluate(node => parseFloat(getComputedStyle(node).maxHeight))).toBeGreaterThan(0);
        expect(await region.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
        const before = await back.boundingBox();
        await region.focus();
        await page.keyboard.press("End");
        await region.evaluate(node => { node.scrollTop = node.scrollHeight; });
        await available(back);
        expect((await back.boundingBox())!.y).toBe(before!.y);
        if (path.startsWith("/legal/")) {
          expect(await region.evaluate(node => node.scrollTop)).toBeGreaterThan(0);
          await available(page.getByRole("link", { name: /Descargar versión completa/ }));
        }
        await still(page);
        if (viewport.width === 320) await page.screenshot({ path: info.outputPath(path.slice(1).replaceAll("/", "-") + ".png") });
      });
    }
  });
}

test("certificación conserva el panel, la página y el retorno al actualizar documentos", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  const data = await fixture(page);
  data.documents.splice(data.documents.findIndex(item => item.tipo === "identificacion_oficial"), 1);
  await page.goto("/cuenta/certificacion");
  await expect(page.getByRole("region", { name: "Avance de certificación", exact: true })).toHaveAttribute("aria-busy", "false");
  const panel = page.getByRole("button", { name: "Carta de derechos del conductor", exact: true });
  await panel.click();
  await page.getByRole("button", { name: "Siguiente: Carta de derechos del conductor", exact: true }).click();
  await page.getByRole("button", { name: "Completar", exact: true }).click();
  await expect(page).toHaveURL(/\/cuenta\/documentos\?volver=%2Fcuenta%2Fcertificacion$/);
  const back = page.getByRole("link", { name: "Volver a Certificación", exact: true });
  await available(back); await back.click();
  await expect(panel).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("region", { name: "Carta de derechos del conductor", exact: true })).toContainText(/^.*2 de/s);
  await still(page);
});

test("legales recuerda la posición y descarta un retorno externo", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/legal/terminos");
  const region = page.locator("[data-contained-scroll]");
  await region.focus(); await page.keyboard.press("ArrowDown");
  await region.evaluate(node => { node.scrollTop = 650; });
  await expect.poll(() => region.evaluate(node => node.scrollTop)).toBeGreaterThan(0);
  const previous = await region.evaluate(node => node.scrollTop);
  await page.goto("/legal/privacidad");
  await page.goto("/legal/terminos");
  await expect.poll(() => region.evaluate((node, saved) => Math.abs(node.scrollTop - saved), previous)).toBeLessThanOrEqual(1);
  await page.goto("/legal/privacidad?volver=https%3A%2F%2Fexample.test");
  const back = page.locator("[data-contained-return]").getByRole("link");
  await expect(back).toHaveAttribute("href", "/cuenta/legal");
  await back.click();
  await expect(page).toHaveURL(/\/cuenta\/legal$/);
});

test("términos desde login mantiene un retorno explícito a acceso", async ({ page, context }) => {
  await context.clearCookies(); await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/login");
  await page.getByRole("link", { name: "Términos y Condiciones", exact: true }).click();
  const back = page.getByRole("link", { name: "Volver a inicio de sesión", exact: true });
  await available(back);
  await page.locator("[data-contained-scroll]").evaluate(node => { node.scrollTop = node.scrollHeight; });
  await available(back); await back.click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.locator("[data-contained-view]")).toHaveCount(0);
});

test("el checklist largo conserva el cierre y el retorno accesibles", async ({ page }, info) => {
  await page.setViewportSize({ width: 320, height: 568 }); await fixture(page);
  await page.goto("/cuenta/certificacion");
  await page.getByRole("button", { name: "Ver todos", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Requisitos de certificación", exact: true });
  await expect(dialog.getByRole("listitem")).toHaveCount(10);
  const close = dialog.getByRole("button", { name: "Cerrar", exact: true });
  await expect(close).toBeVisible();
  const rect = await close.boundingBox();
  expect(rect!.y + rect!.height).toBeLessThanOrEqual(568);
  await page.screenshot({ path: info.outputPath("checklist.png") });
  await close.click();
  await available(page.getByRole("link", { name: "Volver a Cuenta", exact: true }));
  await still(page);
});

test("el marco se adapta al tamaño real del shell y libera la vista al salir", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 }); await fixture(page);
  await page.goto("/cuenta/documentos");
  await page.locator("[data-conductor-header]").evaluate(node => { (node as HTMLElement).style.paddingTop = "28px"; });
  await page.locator("[data-conductor-mobile-nav]").evaluate(node => {
    (node as HTMLElement).style.paddingBottom = "34px";
    const trip = document.createElement("div"); trip.style.height = "72px"; node.prepend(trip);
  });
  await expect.poll(() => page.locator("[data-contained-view]").evaluate(node => {
    const rect = node.getBoundingClientRect();
    const header = document.querySelector("[data-conductor-header]")!.getBoundingClientRect();
    const footer = document.querySelector("[data-conductor-mobile-nav]")!.getBoundingClientRect();
    return Math.max(header.bottom - rect.top, rect.bottom - footer.top);
  })).toBeLessThanOrEqual(1);
  const back = page.getByRole("link", { name: "Volver a Cuenta", exact: true });
  await available(back); await still(page); await back.click();
  await expect(page).toHaveURL(/\/cuenta$/);
  await expect(page.locator("[data-contained-view]")).toHaveCount(0);
});
