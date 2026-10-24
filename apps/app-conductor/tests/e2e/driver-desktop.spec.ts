import { expect, test } from "@playwright/test";

test.skip(process.env.PLAYWRIGHT_TRASLADOS_FIXTURE !== "1", "Requiere playwright.desktop.config.ts y el API local.");

test.beforeEach(async ({ context, page }) => {
  const id = "00000000-0000-4000-8000-000000000001";
  const token = `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ sub: id, role: "authenticated", aud: "authenticated", exp: 2100000000 })).toString("base64url")}.e2e-signature`;
  const session = { access_token: token, refresh_token: "e2e-refresh-only", expires_at: 2100000000, token_type: "bearer", user: { id, email: "conductor@example.test" } };
  await context.addCookies([{ name: "sb-127-auth-token", value: `base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`, domain: "localhost", path: "/" }]);
  await page.route("**/rest/v1/conductores?*", async route => {
    const response = await route.fetch();
    await route.fulfill({ response, json: { ...await response.json(), estado_expediente: "aprobado" } });
  });
});

for (const width of [1024, 1280, 1536]) {
  test(`shell y vistas comparten el lienzo centrado en ${width}×960`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 960 });
    for (const route of ["/panel", "/viajes", "/ganancias", "/notificaciones", "/cuenta", "/cuenta/perfil"]) {
      await test.step(route, async () => {
        await page.goto(route, { waitUntil: "domcontentloaded" });
        await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible({ timeout: 180_000 });
        if (route === "/panel") {
          await expect(page.locator("[data-panel-desktop-header]")).toBeVisible();
          await expect(page.locator("[data-panel-sidebar]")).toBeVisible();
          await expect(page.locator("[data-panel-sidebar] nav a")).toHaveCount(7);
        } else {
          await expect(page.locator("[data-conductor-header]")).toHaveCount(0);
          await expect(page.locator("[data-conductor-mobile-nav]")).toBeVisible();
          const left = (width - 440) / 2;
          await expect.poll(() => page.evaluate(() =>
            ["#contenido-principal", "[data-conductor-mobile-nav]"].map(selector => {
              const rect = document.querySelector(selector)?.getBoundingClientRect();
              return rect ? { x: rect.x, width: rect.width } : null;
            }),
          )).toEqual(Array.from({ length: 2 }, () => ({ x: left, width: 440 })));
          const bounds = await page.locator("[data-conductor-mobile-nav] a").evaluateAll(links => links.map(link => {
            const r = link.getBoundingClientRect(); return { left: r.left, right: r.right };
          }));
          expect(bounds).toHaveLength(3);
          for (const link of bounds) {
            expect(link.left).toBeGreaterThanOrEqual(left);
            expect(link.right).toBeLessThanOrEqual(left + 440);
          }
          expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe("rgb(238, 242, 247)");
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        if (width === 1280) await page.screenshot({ path: testInfo.outputPath(route.slice(1).replaceAll("/", "-") + ".png") });
      });
    }
    await page.getByRole("navigation", { name: "Navegación principal móvil", exact: true }).getByRole("link", { name: "Traslados", exact: true }).click();
    await expect(page).toHaveURL(/\/viajes$/, { timeout: 120_000 });
    await page.setViewportSize({ width: 320, height: 568 });
    await expect(page.getByRole("navigation", { name: "Navegación principal móvil", exact: true })).toBeVisible();
    await expect.poll(() => page.locator("#contenido-principal").evaluate(el => el.getBoundingClientRect().width)).toBe(320);
  });
}
