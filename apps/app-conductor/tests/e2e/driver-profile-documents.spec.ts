import { expect, test, type Page } from "@playwright/test";
import { expectAccountShellNavigation } from "../fixtures/conductor-navigation";

test.skip(process.env.PLAYWRIGHT_TRASLADOS_FIXTURE !== "1", "Requiere playwright.profile-documents.config.ts y el API local de pruebas.");
const driverId = "00000000-0000-4000-8000-000000000002";
const types = ["licencia_frente", "licencia_reverso", "identificacion_oficial", "constancia_situacion_fiscal", "documento_operativo"];
test.beforeEach(async ({ context, page }) => {
  const userId = "00000000-0000-4000-8000-000000000001";
  const token = `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ sub: userId, role: "authenticated", aud: "authenticated", exp: 2100000000 })).toString("base64url")}.e2e-signature`;
  const session = { access_token: token, refresh_token: "e2e-refresh-only", expires_at: 2100000000, token_type: "bearer", user: { id: userId, email: "conductor@example.test" } };
  await context.addCookies([{ name: "sb-127-auth-token", value: `base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`, domain: "localhost", path: "/" }]);
  await page.clock.setFixedTime(new Date("2026-10-18T18:00:00Z"));
});
async function fixture(page: Page, allDocuments = false) {
  const driver: Record<string, unknown> = { id: driverId, auth_user_id: "00000000-0000-4000-8000-000000000001", nombre: "Juan Pérez López", telefono: "+525512345678", curp: "GODE561231HDFRRN09", foto_perfil_url: null, estado: "activo", documentos_vigentes: true, calificacion_promedio: 4.8, licencia_numero: "LIC12345", licencia_tipo: "A", licencia_vigencia: "2027-12-31", codigo_postal: "01000", estado_residencia: "Ciudad de México", ciudad_municipio: "Álvaro Obregón", colonia: "San Ángel", calle: "Av. Principal", numero: "20", referencias: "Frente al parque", contacto_emergencia_nombre: "Ana López", contacto_emergencia_telefono: "+525587654321" };
  const documents = types.filter((_, index) => allDocuments || index % 2 === 0).map(type => ({ id: `doc-${type}`, conductor_id: driverId, tipo: type, es_actual: true, estado: "en_revision", version: 1, creado_en: "2026-10-18T12:00:00Z", expira_en: null, nombre_archivo: "protegido.pdf", url: "ruta-privada" }));
  const mutations: Record<string, unknown>[] = [];
  const headers = { "access-control-allow-origin": "*" };
  await page.route("**/rest/v1/conductores?*", route => route.fulfill({ contentType: "application/json", headers, body: JSON.stringify(driver) }));
  await page.route("**/rest/v1/documentos_conductor?*", route => route.fulfill({ contentType: "application/json", headers, body: JSON.stringify(documents) }));
  await page.route("**/rest/v1/datos_bancarios_conductor?*", route => route.fulfill({ contentType: "application/json", headers, body: "null" }));
  await page.route("**/rest/v1/rpc/solicitar_cambio_expediente_conductor", async route => {
    const body = route.request().postDataJSON() as { p_cambios: Record<string, unknown> };
    mutations.push(body.p_cambios);
    const sensitive = body.p_cambios.nombre !== driver.nombre || body.p_cambios.curp !== driver.curp || body.p_cambios.licencia_numero !== driver.licencia_numero;
    if (!sensitive) Object.assign(driver, body.p_cambios);
    await route.fulfill({ contentType: "application/json", headers, body: JSON.stringify({ estado: sensitive ? "pendiente" : "aprobado", mensaje: "Solicitud procesada." }) });
  });
  return { driver, documents, mutations, headers };
}
async function open(page: Page, kind: "profile" | "documents") {
  await page.goto(kind === "profile" ? "/cuenta/perfil" : "/cuenta/documentos", { waitUntil: "domcontentloaded" });
  if (kind === "profile") await expect(page.getByLabel("Nombre completo", { exact: true })).toHaveValue("Juan Pérez López", { timeout: 180_000 });
  else await expect(page.getByRole("region", { name: "Documentos requeridos" })).toHaveAttribute("aria-busy", "false", { timeout: 180_000 });
  await page.locator("nextjs-portal").evaluateAll(nodes => nodes.forEach(node => (node as HTMLElement).style.setProperty("display", "none", "important")));
}
async function assertLayout(page: Page) {
  const layout = await page.locator("[data-driver-details]").evaluate(screen => ({
    width: screen.getBoundingClientRect().width, overflow: screen.scrollHeight - screen.clientHeight,
    horizontalOverflow: document.documentElement.scrollWidth - innerWidth,
    fieldsOverlap: (() => { const fields = screen.querySelector("[data-tab]"); const action = screen.querySelector(":scope > div > button"); return fields && action ? fields.getBoundingClientRect().bottom - action.getBoundingClientRect().top : 0; })(),
    outside: [...screen.querySelectorAll("a,button,input,select,h1,h2,p")].filter(el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (r.left < -1 || r.right > innerWidth + 1); }).map(el => el.getAttribute("aria-label") || el.textContent),
  }));
  expect(layout.width).toBeLessThanOrEqual(440); expect(layout.overflow).toBeLessThanOrEqual(1); expect(layout.horizontalOverflow).toBeLessThanOrEqual(1); expect(layout.outside).toEqual([]); expect(layout.fieldsOverlap).toBeLessThanOrEqual(0);
}
for (const kind of ["profile", "documents"] as const) for (const size of [{ width: 320, height: 568 }, { width: 375, height: 667 }, { width: 390, height: 844 }, { width: 1280, height: 960 }]) {
  test(`${kind} en el flujo del shell en ${size.width}×${size.height}`, async ({ page }, info) => {
    await page.setViewportSize(size); await fixture(page); await open(page, kind); await assertLayout(page);
    await page.screenshot({ path: info.outputPath(`${kind}.png`) });
    await expectAccountShellNavigation(page);
    if (kind === "profile") {
      await expect(page.getByText("★ 4.8", { exact: true })).toBeVisible();
      await expect(page.getByLabel("Teléfono", { exact: true })).toHaveValue("5512345678");
      await expect(page.getByRole("button", { name: "Guardar cambios", exact: true })).toBeDisabled();
      await expect(page.getByLabel("CURP", { exact: true })).toHaveAttribute("readonly", "");
    } else {
      await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "3");
      await expect(page.getByRole("button", { name: /^Subir / })).toHaveCount(5);
      await expect(page.getByRole("button", { name: "Continuar", exact: true })).toBeDisabled();
    }
  });
}
test("perfil conserva pestañas, todos los contactos y el guardado real", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 }); const state = await fixture(page); await open(page, "profile");
  await page.getByRole("tab", { name: "Documentación", exact: true }).click();
  await expect(page.getByLabel("Tipo de licencia", { exact: true })).toHaveAttribute("readonly", ""); await assertLayout(page);
  await page.getByRole("tab", { name: "Ubicación", exact: true }).click(); await assertLayout(page);
  await expect(page.getByLabel("Código postal", { exact: true })).toHaveValue("01000");
  await page.getByRole("button", { name: "Grupo siguiente", exact: true }).click(); await expect(page.getByLabel("Calle", { exact: true })).toBeVisible(); await assertLayout(page);
  await page.getByRole("button", { name: "Grupo siguiente", exact: true }).click();
  await page.getByLabel("Teléfono de emergencia", { exact: true }).fill("5511223344");
  await expect(page.getByRole("button", { name: "Guardar cambios", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Guardar cambios", exact: true }).click();
  await expect(page.locator("[data-driver-details]").getByRole("status")).toContainText("Cambios guardados");
  await assertLayout(page);
  expect(state.mutations.at(-1)?.contacto_emergencia_telefono).toBe("+525511223344");
});
test("cambios sensibles requieren confirmación y no simulan aprobación", async ({ page }) => {
  const state = await fixture(page); await open(page, "profile");
  await page.getByLabel("Nombre completo", { exact: true }).fill("Juan Pérez Nuevo");
  await page.getByRole("button", { name: "Guardar cambios", exact: true }).click();
  const dialog = page.getByRole("alertdialog", { name: "Guardar cambios sensibles" }); await expect(dialog).toBeVisible(); expect(state.mutations).toHaveLength(0);
  await dialog.getByRole("button", { name: "Guardar y enviar a revisión" }).click();
  await expect(page.locator("[data-driver-details]").getByRole("status")).toContainText("Cambios enviados a revisión");
  expect(state.mutations).toHaveLength(1); await expect(page.getByLabel("Nombre completo", { exact: true })).toHaveValue("Juan Pérez López");
  await assertLayout(page);
});
test("perfil bloquea formatos inválidos y se ajusta al alto con teclado", async ({ page }) => {
  await fixture(page); await open(page, "profile");
  await page.getByLabel("Correo electrónico", { exact: true }).fill("correo-invalido");
  await expect(page.getByRole("button", { name: "Guardar cambios", exact: true })).toBeDisabled();
  await page.getByLabel("Correo electrónico", { exact: true }).fill("conductor@example.test");
  await page.setViewportSize({ width: 375, height: 340 }); await assertLayout(page);
});
test("sube documento con tipo y versión, actualiza estado y habilita continuar", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  const state = await fixture(page, true); state.documents.splice(1, 1);
  let uploaded = "";
  await page.route("**/functions/v1/validar-documento-conductor", async route => {
    uploaded = route.request().postDataBuffer()?.toString("utf8") ?? "";
    const type = uploaded.includes("licencia_frente") ? "licencia_frente" : "licencia_reverso";
    const old = state.documents.find(item => item.tipo === type && item.es_actual);
    if (old) old.es_actual = false;
    state.documents.push({ id: `new-${type}`, conductor_id: driverId, tipo: type, es_actual: true, estado: "en_revision", version: (old?.version ?? 0) + 1, creado_en: "2026-10-18T18:00:00Z", expira_en: null, nombre_archivo: "licencia.pdf", url: "privado" });
    await route.fulfill({ contentType: "application/json", headers: state.headers, body: JSON.stringify({ documento_id: "new-reverso", ruta: "privado" }) });
  });
  await open(page, "documents"); await expect(page.getByRole("button", { name: "Continuar", exact: true })).toBeDisabled();
  const chooser = page.waitForEvent("filechooser"); await page.getByRole("button", { name: "Subir Licencia - Reverso", exact: true }).click();
  await (await chooser).setFiles({ name: "licencia.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\n%%EOF") });
  await expect(page.getByRole("button", { name: "Continuar", exact: true })).toBeEnabled({ timeout: 30_000 });
  expect(uploaded).toContain("licencia_reverso"); expect(uploaded).toContain(driverId);
  await assertLayout(page);
  const replacement = page.waitForEvent("filechooser"); await page.getByRole("button", { name: "Subir Licencia - Frente", exact: true }).click();
  await (await replacement).setFiles({ name: "licencia.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\n%%EOF") });
  await expect(page.getByRole("button", { name: "Continuar", exact: true })).toBeEnabled({ timeout: 30_000 });
  expect(uploaded).toContain("documento_anterior_id"); expect(uploaded).toContain("doc-licencia_frente");
  await page.getByRole("button", { name: "Continuar", exact: true }).click(); await expect(page).toHaveURL(/\/cuenta\/datos-bancarios$/, { timeout: 180_000 });
});
test("rechaza archivos no permitidos y permite consultar el detalle sin exponer rutas privadas", async ({ page }) => {
  await fixture(page); await open(page, "documents");
  const chooser = page.waitForEvent("filechooser"); await page.getByRole("button", { name: "Subir Licencia - Frente", exact: true }).click();
  await (await chooser).setFiles({ name: "script.txt", mimeType: "text/plain", buffer: Buffer.from("archivo no permitido") });
  await expect(page.locator("[data-driver-details]").getByRole("status")).toContainText("JPG, PNG, WEBP o un PDF");
  await page.getByRole("button", { name: "Ver detalles de Licencia - Frente", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Licencia - Frente", exact: true })).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Licencia - Frente", exact: true })).not.toContainText("ruta-privada");
  await page.keyboard.press("Escape");
});
test("editar fotografía abre el selector y valida el formato antes de cargar", async ({ page }) => {
  await fixture(page); await open(page, "profile");
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Editar fotografía de perfil", exact: true }).click();
  await (await chooser).setFiles({ name: "foto.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\n%%EOF") });
  await expect(page.locator("[data-driver-details]").getByRole("alert")).toContainText(/JPG|PNG|WEBP/);
});
