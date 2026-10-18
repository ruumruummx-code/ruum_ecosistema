import { expect, test, type Page } from "@playwright/test";

test.skip(process.env.PLAYWRIGHT_TRASLADOS_FIXTURE !== "1", "Requiere playwright.earnings.config.ts y el API local de pruebas.");
test.beforeEach(async ({ context, page }) => {
  const userId = "00000000-0000-4000-8000-000000000001";
  const token = `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ sub: userId, role: "authenticated", aud: "authenticated", exp: 2100000000 })).toString("base64url")}.e2e-signature`;
  const session = { access_token: token, refresh_token: "e2e-refresh-only", expires_at: 2100000000, token_type: "bearer", user: { id: userId, email: "conductor@example.test" } };
  await context.addCookies([{ name: "sb-127-auth-token", value: `base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`, domain: "localhost", path: "/" }]);
  await page.clock.setFixedTime(new Date("2026-10-17T18:00:00Z"));
});
async function fixture(page: Page, empty = false, failure = false) {
  await page.route("**/rest/v1/traslados?*", route => route.fulfill({ status: failure ? 500 : 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(failure ? { message: "No disponible" } : empty ? [] : [
    { id: "trip-now", estado: "servicio_cerrado", cerrado_en: "2026-10-12T18:00:00Z", creado_en: "2026-10-12T18:00:00Z", ganancia_conductor_congelada: 2450 },
    { id: "trip-before", estado: "servicio_cerrado", cerrado_en: "2026-10-05T18:00:00Z", creado_en: "2026-10-05T18:00:00Z", ganancia_conductor_congelada: 2187.5 },
  ]) }));
  await page.route("**/rest/v1/payouts_conductor?*", route => route.fulfill({ contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(empty ? [] : [
    { id: "p1", estado: "procesado", monto_neto: 1850, creado_en: "2026-10-12T18:00:00Z", procesado_en: "2026-10-12T18:00:00Z" },
    { id: "p2", estado: "pendiente", monto_neto: 1620, creado_en: "2026-10-05T18:00:00Z", procesado_en: null },
  ]) }));
  await page.route("**/rest/v1/datos_bancarios_conductor?*", route => route.fulfill({ contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: "null" }));
}
async function open(page: Page) {
  await page.goto("/ganancias", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("tabpanel")).toHaveAttribute("aria-busy", "false", { timeout: 180_000 });
  await page.locator("nextjs-portal").evaluateAll(nodes => nodes.forEach(node => (node as HTMLElement).style.setProperty("display", "none", "important")));
}
for (const size of [{ width: 320, height: 568 }, { width: 375, height: 667 }, { width: 390, height: 844 }, { width: 1280, height: 960 }]) {
  test(`Ganancias sin scroll en ${size.width}×${size.height}`, async ({ page }, testInfo) => {
    await page.setViewportSize(size); await fixture(page); await open(page);
    await expect(page.getByTestId("earnings-total")).toContainText("$2,450.00");
    const layout = await page.locator("[data-driver-earnings]").evaluate(screen => ({
      width: screen.getBoundingClientRect().width, overflow: screen.scrollHeight - screen.clientHeight,
      documentOverflow: document.documentElement.scrollHeight - innerHeight,
      paymentOverlap: (() => { const list = screen.querySelector("section[aria-labelledby=ultimos-pagos]")?.lastElementChild; const button = screen.querySelector(":scope > button"); return list && button ? list.getBoundingClientRect().bottom - button.getBoundingClientRect().top : 0; })(),
      outside: [...screen.querySelectorAll("a,button,h1,h2,h3,p,time")].filter(el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (r.top < -1 || r.bottom > innerHeight + 1 || r.left < -1 || r.right > innerWidth + 1); }).map(el => el.textContent),
    }));
    await page.screenshot({ path: testInfo.outputPath("ganancias.png") });
    expect(layout.width).toBeLessThanOrEqual(440); expect(layout.overflow).toBeLessThanOrEqual(1); expect(layout.documentOverflow).toBeLessThanOrEqual(1); expect(layout.outside).toEqual([]); expect(layout.paymentOverlap).toBeLessThanOrEqual(0);
  });
}
test("cambia periodo, distingue pagos pendientes y abre solicitud sin simular un depósito", async ({ page }) => {
  await fixture(page); await open(page);
  await expect(page.getByText("↑ +12%", { exact: true })).toBeVisible();
  await expect(page.getByText("Pendiente", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Este mes", exact: true }).click();
  await expect(page.getByTestId("earnings-total")).toContainText("$4,637.50");
  await expect(page.getByRole("tab", { name: "Este mes", exact: true })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("link", { name: /Ver todos/ })).toHaveAttribute("href", "/ganancias/historial");
  await page.getByRole("button", { name: "Solicitar pago", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("link", { name: "Revisar datos bancarios" })).toHaveAttribute("href", "/cuenta/datos-bancarios");
  await expect(page.getByRole("link", { name: "Contactar a soporte" })).toHaveAttribute("href", /wa.me|whatsapp/);
  await page.keyboard.press("Escape"); await expect(page.getByRole("dialog")).not.toBeVisible();
});
test("estado sin actividad y errores no presentan ingresos de ejemplo", async ({ page }) => {
  await fixture(page, true); await open(page);
  await expect(page.getByTestId("earnings-total")).toContainText("$0.00");
  await expect(page.getByText("Aún no tienes pagos registrados.")).toBeVisible();
  await fixture(page, true, true); await open(page);
  await expect(page.locator("[data-driver-earnings]").getByRole("alert")).toBeVisible();
  await expect(page.getByTestId("earnings-total")).not.toContainText("$0.00");
  await expect(page.getByRole("button", { name: "Solicitar pago", exact: true })).toBeDisabled();
});
