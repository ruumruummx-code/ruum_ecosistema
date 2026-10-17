import { expect, test, type Page } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });
const HOST = process.env.PLAYWRIGHT_SUPABASE_URL ?? "https://rc-registration-test.supabase.co";
const USER_ID = "00000000-0000-4000-8000-00000000c002";
const SOLICITUD_ID = "00000000-0000-4000-8000-00000000c003";
const user = { id: USER_ID, aud: "authenticated", role: "authenticated", email: "conductor@example.com", app_metadata: {}, user_metadata: {}, created_at: "2026-10-01T00:00:00Z" };
function session() {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
  return { access_token: `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ sub: USER_ID, aud: "authenticated", role: "authenticated", exp })}.test-signature`, refresh_token: "test-refresh-token", token_type: "bearer", expires_at: exp, expires_in: 3600, user };
}
async function fixture(page: Page, step: number | null, complete = false) {
  const calls: Array<{ rpc: string; body: Record<string, unknown> }> = [];
  const solicitud = {
    id: SOLICITUD_ID, auth_user_id: USER_ID, estado: "datos_incompletos", paso_actual: step ?? 1,
    datos_personales: { nombres: "Juan", apellidos: "Gómez Cruz", curp: "GOMC900101HDFRRL09", telefono: "+525512345678" },
    domicilio: complete ? { codigo_postal: "52104", estado: "México", ciudad_municipio: "San Mateo Atenco", colonia: "Centro", calle: "Juárez", numero: "12", referencias: "Portón azul" } : {},
    contacto_emergencia: complete ? { nombre: "María Gómez", telefono: "5512345678" } : {},
    licencia: {},
  };
  await page.addInitScript(({ authenticated, value, cookie }) => {
    localStorage.setItem("CapacitorStorage.ruum_conductor_onboarding_visto", "1");
    if (authenticated) document.cookie = `${cookie}=${value}; path=/; SameSite=Lax`;
  }, { authenticated: step !== null, value: `base64-${Buffer.from(JSON.stringify(session())).toString("base64url")}`, cookie: `sb-${new URL(HOST).hostname.split(".")[0]}-auth-token` });
  await page.route("**/auth/v1/**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(pathname.endsWith("signup") ? session() : user) });
  });
  await page.route("**/rest/v1/**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    let body: unknown = [];
    if (pathname.endsWith("/solicitudes_conductor")) body = [solicitud];
    if (pathname.includes("/rpc/")) {
      const rpc = pathname.split("/").pop()!;
      const payload = route.request().postDataJSON() ?? {};
      calls.push({ rpc, body: payload });
      if (rpc === "guardar_borrador_conductor") {
        Object.assign(solicitud, { paso_actual: payload.p_paso_actual, datos_personales: payload.p_datos_personales, domicilio: payload.p_domicilio, contacto_emergencia: payload.p_contacto_emergencia, licencia: payload.p_licencia });
      }
      if (["iniciar_solicitud_conductor", "guardar_borrador_conductor"].includes(rpc)) body = [{ solicitud_id: SOLICITUD_ID, conductor_id: null, estado: "datos_incompletos", paso_actual: solicitud.paso_actual }];
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  });
  await page.goto("/registro", { timeout: 90_000 });
  await expect(page.locator('form[data-registration-ready="true"]')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("heading", { name: step === 2 ? "Identidad (2/5)" : step === 3 ? "Licencia (3/5)" : "Cuenta (1/5)", exact: true })).toBeVisible();
  return calls;
}
async function geometry(page: Page) {
  const result = await page.locator("[data-conductor-registration]").evaluate((screen) => {
    const r = screen.getBoundingClientRect();
    const footer = screen.querySelector("form > footer")!.getBoundingClientRect();
    const fieldset = screen.querySelector("form > fieldset")!.getBoundingClientRect();
    return {
      scroll: document.documentElement.scrollHeight > window.innerHeight || screen.scrollHeight > screen.clientHeight,
      footerInside: footer.bottom <= r.bottom + 1 && footer.top >= r.top,
      noOverlap: fieldset.bottom <= footer.top + 1,
      inputsInside: [...screen.querySelectorAll("fieldset input")].filter((input) => !input.closest("dialog")).every((input) => {
        const bounds = input.getBoundingClientRect(); const parent = input.parentElement!.getBoundingClientRect();
        return bounds.top >= parent.top && bounds.bottom <= parent.bottom && bounds.bottom <= footer.top;
      }),
    };
  });
  expect(result).toEqual({ scroll: false, footerInside: true, noOverlap: true, inputsInside: true });
}
async function checkSizes(page: Page) {
  for (const viewport of [{ width: 320, height: 568 }, { width: 360, height: 640 }, { width: 390, height: 844 }, { width: 430, height: 932 }, { width: 667, height: 375 }, { width: 320, height: 284 }]) {
    await page.setViewportSize(viewport);
    await expect.poll(() => page.locator("[data-conductor-registration]").evaluate((el) => el.clientHeight)).toBe(viewport.height);
    await geometry(page);
  }
}

test("Cuenta: sin scroll, progreso 20%, validación y enlace Entrar", async ({ page }) => {
  await fixture(page, null);
  await expect(page.getByRole("progressbar")).toHaveAttribute("value", "20");
  await checkSizes(page);
  await page.screenshot({ animations: "disabled", path: test.info().outputPath("cuenta-teclado.png") });
  await page.getByRole("button", { name: "Crear cuenta y continuar" }).click();
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
  await page.getByLabel("Confirmar contraseña", { exact: true }).press("Enter");
  await expect(page.getByRole("heading", { name: "Identidad (2/5)", exact: true })).toBeVisible();
  await geometry(page);
});

test("Identidad: sheets validan, cancelan, guardan y conservan datos al volver", async ({ page }) => {
  const calls = await fixture(page, 2);
  await expect(page.getByRole("progressbar")).toHaveAttribute("value", "40");
  await checkSizes(page);
  await page.screenshot({ animations: "disabled", path: test.info().outputPath("identidad-teclado.png") });
  const next = page.getByRole("button", { name: "Guardar y Continuar", exact: true });
  await expect(next).toBeDisabled();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: /Domicilio/ }).click();
  let dialog = page.getByRole("dialog", { name: "Domicilio", exact: true });
  await expect(dialog).toBeVisible();
  await page.screenshot({ animations: "disabled", path: test.info().outputPath("domicilio-sheet.png") });
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
  await expect(page.getByRole("heading", { name: "Cuenta (1/5)", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(next).toBeEnabled();
  await next.click();
  await expect(page.getByRole("heading", { name: "Licencia (3/5)", exact: true })).toBeVisible();
  await expect.poll(() => calls.filter((call) => call.rpc === "guardar_borrador_conductor").length).toBeGreaterThan(0);
  const save = calls.filter((call) => call.rpc === "guardar_borrador_conductor").at(-1)!;
  expect(save.body.p_domicilio).toMatchObject({ calle: expect.stringMatching(/^Juárez$/i), numero: "12" });
  expect(save.body.p_contacto_emergencia).toMatchObject({ nombre: expect.stringMatching(/^María Gómez$/i) });
});

test("Identidad: visualViewport y teclado dentro del sheet no alteran el lienzo", async ({ page }) => {
  await fixture(page, 2, true);
  await page.setViewportSize({ width: 390, height: 844 });
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

test("Licencia: sin scroll, 60%, consulta legal y consentimientos solo al continuar", async ({ page }) => {
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
  await expect(page.getByRole("heading", { name: "Documentos (4/5)", exact: true })).toBeVisible();
  await expect.poll(() => calls.filter((call) => call.rpc === "registrar_consentimientos_conductor").length).toBeGreaterThan(0);
  expect(calls.find((call) => call.rpc === "registrar_consentimientos_conductor")!.body.p_consentimientos).toEqual(expect.arrayContaining([{ tipo_documento: "autorizacion_antecedentes", version: 1 }, { tipo_documento: "declaracion_suspensiones", version: 1 }]));
  expect(await page.evaluate(() => getComputedStyle(document.body).overflowY)).not.toBe("hidden");
});
