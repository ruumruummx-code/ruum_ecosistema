import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page, context }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => localStorage.setItem("CapacitorStorage.ruum_conductor_onboarding_visto", "1"));
  const id = "00000000-0000-4000-8000-000000000001";
  const token = `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ sub: id, role: "authenticated", aud: "authenticated", exp: 2100000000 })).toString("base64url")}.e2e-signature`;
  await context.addCookies([{ name: "sb-127-auth-token", value: `base64-${Buffer.from(JSON.stringify({ access_token: token, refresh_token: "e2e-refresh-only", expires_at: 2100000000, token_type: "bearer", user: { id, email: "conductor@example.test" } })).toString("base64url")}`, domain: "localhost", path: "/" }]);
  await page.route("**/rest/v1/conductores?*", async route => {
    const response = await route.fetch();
    await route.fulfill({ response, json: { ...await response.json(), estado_expediente: "aprobado" } });
  });
});

for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 1280, height: 960 }]) {
  test(`diálogos de Inicio conservan modalidad y foco en ${viewport.width}×${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/panel", { waitUntil: "domcontentloaded" });
    // El encabezado viene del servidor; esperar los datos evita pulsarlo
    // antes de que termine la hidratación y se conecten sus eventos.
    await expect(page.getByRole("link", { name: /^Ver balance:/ })).toBeVisible();
    for (const name of ["Abrir menú", "Documentos: Todo en orden"]) {
      const trigger = page.getByRole("button", { name, exact: true });
      await trigger.click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      expect(await dialog.evaluate(node => node.matches(":modal"))).toBe(true);
      await expect(dialog.getByRole("button", { name: "Cerrar diálogo", exact: true }).first()).toBeFocused();
      for (let index = 0; index < 20; index++) {
        await page.keyboard.press("Tab");
        expect(await dialog.evaluate(node => node.contains(document.activeElement))).toBe(true);
      }
      await page.keyboard.press("Escape");
      await expect(dialog).toHaveCount(0);
      await expect(trigger).toBeFocused();
    }
  });
  test(`un solo marco móvil y acciones visibles en ${viewport.width}×${viewport.height}`, async ({ page }, info) => {
    await page.setViewportSize(viewport);
    for (const path of ["/panel", "/cuenta", "/viajes", "/ganancias"]) {
      await test.step(path, async () => {
        await page.goto(path, { waitUntil: "domcontentloaded" });
        await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
        const nav = page.locator("[data-conductor-mobile-nav]");
        await expect(nav).toHaveCount(1);
        await expect(nav.getByRole("link")).toHaveCount(3);
        const action = path === "/panel" ? page.getByRole("link", { name: /^Ver balance:/ })
          : path === "/ganancias" ? page.getByRole("button", { name: /Consultar programación/ })
          : path === "/cuenta" ? page.getByRole("button", { name: /Cerrar sesión/ }).first()
          : page.getByRole("heading", { level: 1 }).first();
        await expect(action).toBeVisible();
        await expect.poll(() => action.evaluate(node => {
          const rect = node.getBoundingClientRect();
          const bottom = document.querySelector("[data-conductor-mobile-nav]")!.getBoundingClientRect().top;
          return rect.top >= 0 && rect.bottom <= bottom + 1;
        })).toBe(true);
        const layout = await page.locator("#contenido-principal").evaluate(main => ({
          horizontal: document.documentElement.scrollWidth > innerWidth,
          width: main.getBoundingClientRect().width,
          rootScroll: document.documentElement.scrollHeight > innerHeight + 1,
        }));
        expect(layout.horizontal).toBe(false);
        expect(layout.rootScroll).toBe(false);
        expect(layout.width).toBeLessThanOrEqual(440);
        await page.screenshot({ path: info.outputPath(`${path.slice(1)}.png`) });
      });
    }
    await page.goto("/ganancias");
    await page.getByRole("button", { name: /Consultar programación/ }).click();
    const dialog = page.getByRole("dialog", { name: "Programación de pago", exact: true });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { name: "Programación de pagos", exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
  });
}
