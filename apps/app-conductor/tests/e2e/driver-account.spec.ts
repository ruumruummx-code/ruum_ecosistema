import { expect, test, type Page } from "@playwright/test";
import { expectAccountShellNavigation } from "../fixtures/conductor-navigation";

test.skip(process.env.PLAYWRIGHT_TRASLADOS_FIXTURE !== "1", "Requiere playwright.account.config.ts y el API local de pruebas.");
test.beforeEach(async ({ context, page }) => {
  const userId = "00000000-0000-4000-8000-000000000001";
  const token = `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ sub: userId, role: "authenticated", aud: "authenticated", exp: 2100000000 })).toString("base64url")}.e2e-signature`;
  const session = { access_token: token, refresh_token: "e2e-refresh-only", expires_at: 2100000000, token_type: "bearer", user: { id: userId, email: "conductor@example.test" } };
  await context.addCookies([{ name: "sb-127-auth-token", value: `base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`, domain: "localhost", path: "/" }]);
  await page.route("**/rest/v1/notificaciones_conductor?*", route => route.fulfill({ contentType: "application/json", headers: { "access-control-allow-origin": "*", "access-control-expose-headers": "Content-Range", "content-range": "*/2" }, body: "" }));
});
async function openAccount(page: Page) {
  await page.goto("/cuenta", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: "Opciones de cuenta" })).toHaveAttribute("aria-busy", "false", { timeout: 180_000 });
  await expect(page.getByText("Sincronizado — todo al día", { exact: true })).toHaveCount(1, { timeout: 30_000 });
  await page.locator("nextjs-portal").evaluateAll(nodes => nodes.forEach(node => (node as HTMLElement).style.setProperty("display", "none", "important")));
}
for (const size of [{ width: 320, height: 568 }, { width: 375, height: 667 }, { width: 390, height: 844 }, { width: 375, height: 500 }, { width: 1280, height: 960 }]) {
  test(`Cuenta completa en el flujo del shell en ${size.width}×${size.height}`, async ({ page }, testInfo) => {
    await page.setViewportSize(size); await openAccount(page);
    const layout = await page.locator("[data-driver-account]").evaluate(screen => {
      const options = screen.querySelector("nav[aria-label='Configuración de cuenta']");
      const logout = screen.querySelector(":scope > div > button");
      return {
        width: screen.getBoundingClientRect().width, overflow: screen.scrollHeight - screen.clientHeight,
        horizontalOverflow: document.documentElement.scrollWidth - innerWidth,
        optionsOverlap: options && logout ? options.getBoundingClientRect().bottom - logout.getBoundingClientRect().top : 0,
        outside: [...screen.querySelectorAll("a,button,h1,h2,p")].filter(el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (r.left < -1 || r.right > innerWidth + 1); }).map(el => el.textContent),
      };
    });
    await page.screenshot({ path: testInfo.outputPath("cuenta.png") });
    expect(layout.width).toBeLessThanOrEqual(440); expect(layout.overflow).toBeLessThanOrEqual(1); expect(layout.horizontalOverflow).toBeLessThanOrEqual(1); expect(layout.outside).toEqual([]); expect(layout.optionsOverlap).toBeLessThanOrEqual(0);
    await expectAccountShellNavigation(page);
  });
}
for (const width of [320, 1280]) test(`accesos reales, iniciales, notificaciones y ajustes adicionales en ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 960 });
  await openAccount(page);
  const account = page.locator("[data-driver-account]");
  const options = account.getByRole("navigation", { name: "Configuración de cuenta", exact: true });
  await expect(options).toHaveCount(1);
  await expect(options.getByRole("link")).toHaveCount(4);
  for (const [name, href] of [["Perfil", "/cuenta/perfil"], ["Documentos", "/cuenta/documentos"], ["Certificación", "/cuenta/certificacion"], ["Datos bancarios", "/cuenta/datos-bancarios"]]) {
    await expect(options.getByRole("link", { name })).toHaveAttribute("href", href);
  }
  await expect(account.getByRole("link", { name: "Soporte", exact: true })).toHaveAttribute("href", "/cuenta/soporte");
  await expect(account.getByRole("link", { name: "Notificaciones (2 sin leer)" })).toHaveAttribute("href", "/notificaciones");
  await expect(page.getByRole("button", { name: "Opciones de cuenta" })).toHaveText("CP");
  const nav = await expectAccountShellNavigation(page);
  await expect(nav.getByRole("link", { name: "Ganancias", exact: true })).toHaveAttribute("href", "/ganancias");
  await page.getByRole("button", { name: "Opciones de cuenta" }).click();
  const dialog = page.getByRole("dialog", { name: "Ajustes de cuenta" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("link", { name: "Preferencias" })).toHaveAttribute("href", "/cuenta/preferencias");
  await expect(dialog.getByRole("link", { name: "Seguridad" })).toHaveAttribute("href", "/cuenta/seguridad");
  await expect(dialog.getByRole("link", { name: "Marco legal" })).toHaveAttribute("href", "/cuenta/legal");
  await page.keyboard.press("Escape"); await expect(dialog).not.toBeVisible();
});
test("barra local refleja desconexión y recuperación de sincronización", async ({ page, context }) => {
  await openAccount(page);
  const status = page.locator("[data-driver-account]").getByRole("status");
  await context.setOffline(true); await expect(status).toHaveText(/Sin conexión/);
  await expect(page.getByText("Sincronizado — todo al día", { exact: true })).toHaveCount(0);
  await context.setOffline(false); await expect(status).toHaveText("Sincronizado — todo al día");
});
test("muestra la acción requerida de sincronización", async ({ page }) => {
  await openAccount(page);
  const status = page.locator("[data-driver-account]").getByRole("status");
  await page.evaluate(() => window.dispatchEvent(new CustomEvent("ruum:sync-status-updated", { detail: { status: "accion_requerida", message: "Acción requerida para continuar sincronización.", pendingEvidence: 1, pendingTelemetry: 0, updatedAt: new Date().toISOString() } })));
  await expect(status).toContainText("Acción requerida");
  await expect(status.getByRole("link", { name: "Entrar", exact: true })).toHaveAttribute("href", "/login?next=/cuenta");
});
test("cancelar conserva sesión y confirmar cierra solo la sesión local de prueba", async ({ page, context }) => {
  let signOutRequests = 0;
  await page.route("**/auth/v1/logout*", route => { signOutRequests++; return route.fulfill({ status: 204, headers: { "access-control-allow-origin": "*" } }); });
  await openAccount(page);
  await page.getByRole("button", { name: "Cerrar sesión", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "¿Cerrar sesión?", exact: true });
  await expect(dialog).toBeVisible(); await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  await expect(dialog).not.toBeVisible(); expect(signOutRequests).toBe(0);
  await page.getByRole("button", { name: "Cerrar sesión", exact: true }).click();
  await page.keyboard.press("Escape"); await expect(dialog).not.toBeVisible();
  await page.getByRole("button", { name: "Cerrar sesión", exact: true }).click();
  await page.getByRole("button", { name: "Sí, cerrar sesión", exact: true }).click();
  await expect(page).toHaveURL(/\/onboarding$/, { timeout: 180_000 });
  expect(signOutRequests).toBe(1);
  expect((await context.cookies()).filter(cookie => cookie.name.startsWith("sb-127-auth-token"))).toEqual([]);
});
