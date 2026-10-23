import { expect, test, type Page } from "@playwright/test";

test.skip(process.env.PLAYWRIGHT_TRASLADOS_FIXTURE !== "1", "Requiere el API de pruebas local.");
const noticeId = "20000000-0000-4000-8000-000000000001";
test.beforeEach(async ({ page, context }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  const id = "00000000-0000-4000-8000-000000000001";
  const token = `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ sub: id, role: "authenticated", aud: "authenticated", exp: 2100000000 })).toString("base64url")}.e2e-signature`;
  await context.addCookies([{ name: "sb-127-auth-token", value: `base64-${Buffer.from(JSON.stringify({ access_token: token, refresh_token: "e2e-refresh-only", expires_at: 2100000000, token_type: "bearer", user: { id, email: "conductor@example.test" } })).toString("base64url")}`, domain: "localhost", path: "/" }]);
});
async function fixture(page: Page, read = false) {
  const notice = { id: noticeId, tipo: "pago", titulo: "Revisa la programación de tu pago", cuerpo: "Consulta la información de tu saldo.", destino: "/ganancias", entidad_tipo: null, entidad_id: null, leida_en: read ? "2026-10-23T12:00:00Z" : null as string | null, estado: "activa", creado_en: "2026-10-23T12:00:00Z" };
  const api = { notice, calls: 0, fail: false, release: Promise.resolve() };
  await page.route("**/rest/v1/notificaciones_conductor?*", route => route.fulfill({ headers: { "access-control-allow-origin": "*", "access-control-expose-headers": "Content-Range", "content-range": `*/${notice.leida_en ? 0 : 1}` }, json: [notice] }));
  await page.route("**/rest/v1/rpc/marcar_notificacion_leida", async route => {
    api.calls++;
    expect(route.request().postDataJSON()).toEqual({ p_notificacion_id: noticeId });
    await api.release;
    if (!api.fail) notice.leida_en = new Date().toISOString();
    await route.fulfill({ status: api.fail ? 500 : 200, headers: { "access-control-allow-origin": "*" }, json: api.fail ? { message: "Fallo de prueba al guardar lectura" } : null });
  });
  await page.goto("/notificaciones");
  const row = page.locator(`[data-notification-id='${noticeId}']`);
  await expect(row).toBeVisible();
  return { api, row };
}

test("muestra sincronización optimista y confirma antes de navegar", async ({ page }) => {
  const { api, row } = await fixture(page);
  let release!: () => void;
  api.release = new Promise(resolve => { release = resolve; });
  await page.getByRole("button", { name: /^Sin leer/ }).click();
  await row.getByRole("button").click();
  await expect(row.getByRole("status")).toHaveText("Leída · sincronizando…");
  await expect(row).toHaveAttribute("data-read", "true");
  await expect(page).toHaveURL(/\/notificaciones$/);
  release();
  await expect(page).toHaveURL(/\/ganancias$/);
  expect(api.calls).toBe(1);
  await page.goto("/notificaciones");
  await page.getByRole("button", { name: /^Leídas/ }).click();
  await expect(row.getByRole("status")).toHaveText("Leída");
});

test("un fallo mantiene el aviso sin leer y permite reintentar", async ({ page }, info) => {
  const { api, row } = await fixture(page);
  api.fail = true;
  await page.getByRole("button", { name: /^Sin leer/ }).click();
  await row.getByRole("button").click();
  await expect(row.getByRole("alert")).toContainText("No pudimos confirmar la lectura");
  await expect(row.getByRole("status")).toHaveText("Sin leer");
  await expect(row).toHaveAttribute("data-read", "false");
  await expect(page).toHaveURL(/\/notificaciones$/);
  await row.getByRole("button", { name: "Reintentar guardar lectura" }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath("notificacion-error.png") });
  api.fail = false;
  await row.getByRole("button", { name: "Reintentar guardar lectura" }).click();
  await expect(page).toHaveURL(/\/ganancias$/);
  expect(api.calls).toBe(2);
  expect(api.notice.leida_en).not.toBeNull();
});

test("permite consultar el destino cuando no se puede guardar la lectura", async ({ page }) => {
  const { api, row } = await fixture(page);
  api.fail = true;
  await row.getByRole("button").click();
  await row.getByRole("link", { name: "Abrir aviso sin actualizar lectura", exact: true }).click();
  await expect(page).toHaveURL(/\/ganancias$/);
  expect(api.notice.leida_en).toBeNull();
  expect(api.calls).toBe(1);
});

test("las notificaciones ya leídas abren el destino sin otra escritura", async ({ page }) => {
  const { api, row } = await fixture(page, true);
  await expect(row.getByRole("status")).toHaveText("Leída");
  await row.getByRole("button").click();
  await expect(page).toHaveURL(/\/ganancias$/);
  expect(api.calls).toBe(0);
});
