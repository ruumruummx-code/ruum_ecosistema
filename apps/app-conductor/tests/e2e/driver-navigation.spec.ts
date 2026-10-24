import { expect, test, type Locator } from "@playwright/test";

test.skip(process.env.PLAYWRIGHT_TRASLADOS_FIXTURE !== "1", "Requiere playwright.navigation.config.ts y el API local de pruebas.");

test.beforeEach(async ({ context, page }) => {
  const userId = "00000000-0000-4000-8000-000000000001";
  const token = `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ sub: userId, role: "authenticated", aud: "authenticated", exp: 2100000000 })).toString("base64url")}.e2e-signature`;
  const session = { access_token: token, refresh_token: "e2e-refresh-only", expires_at: 2100000000, token_type: "bearer", user: { id: userId, email: "conductor@example.test" } };
  await context.addCookies([{ name: "sb-127-auth-token", value: `base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`, domain: "localhost", path: "/" }]);
  await page.route("**/rest/v1/conductores?*", async route => {
    const response = await route.fetch();
    const conductor = await response.json();
    await route.fulfill({ response, json: { ...conductor, estado_expediente: "aprobado" } });
  });
  await page.route("**/rest/v1/payouts_conductor?*", route => route.fulfill({ headers: { "access-control-allow-origin": "*" }, json: [
    { id: "safe-area-p1", estado: "procesado", monto_neto: 1850, creado_en: "2026-10-12T18:00:00Z", procesado_en: "2026-10-12T18:00:00Z" },
    { id: "safe-area-p2", estado: "pendiente", monto_neto: 1620, creado_en: "2026-10-05T18:00:00Z", procesado_en: null },
  ] }));
  await page.clock.setFixedTime(new Date("2026-10-17T18:00:00Z"));
});


async function expectUnobstructed(target: Locator, scroll = true) {
  await expect.poll(() => target.evaluate((element, shouldScroll) => {
    // La carga de datos puede cambiar la altura entre el primer scroll y la medición.
    if (shouldScroll) element.scrollIntoView({ block: "center", behavior: "instant" });
    const rect = element.getBoundingClientRect();
    const header = document.querySelector("[data-conductor-header]")?.getBoundingClientRect();
    const footer = document.querySelector("[data-conductor-mobile-nav]")?.getBoundingClientRect();
    const bottom = footer?.height ? footer.top : innerHeight;
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    return rect.top >= (header?.bottom ?? 0) && rect.bottom <= bottom && !!hit && element.contains(hit);
  }, scroll)).toBe(true);
}

for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 667, height: 375 }, { width: 1280, height: 960 }]) {
  test(`shell único y contenido accesible en ${viewport.width}×${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    for (const route of ["/viajes", "/notificaciones", "/cuenta", "/cuenta/perfil", "/ganancias", "/panel"]) {
      await test.step(route, async () => {
        await page.goto(route, { waitUntil: "domcontentloaded" });
        await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible({ timeout: 180_000 });
        const mobile = viewport.width < 768;
        const navigation = page.getByRole("navigation", { name: mobile ? "Navegación principal móvil" : "Navegación principal", exact: true });
        await expect(navigation).toBeVisible();
        await expect(navigation.getByRole("link")).toHaveCount(route === "/panel" ? (mobile ? 3 : 7) : 5);
        await expect(navigation.locator('[aria-current="page"]')).toHaveCount(1);
        if (route !== "/panel") {
          await expect(page.locator("#contenido-principal nav[aria-label='Navegación principal']")).toHaveCount(0);
        }
        const main = page.locator("#contenido-principal");
        const header = route === "/panel"
          ? (mobile ? page.getByRole("banner", { name: "Encabezado móvil del panel" }) : page.locator("[data-panel-desktop-header]"))
          : page.locator("[data-conductor-header]");
        if (route !== "/panel") {
          await expect.poll(async () => main.evaluate(element => parseFloat(getComputedStyle(element).paddingTop))).toBeGreaterThanOrEqual(16);
        }
        await page.getByRole("heading", { level: 1 }).first().evaluate(element => element.scrollIntoView({ block: "start", behavior: "instant" }));
        await expectUnobstructed(page.getByRole("heading", { level: 1 }).first(), false);
        const last = main.locator('button:visible, a:visible, input:visible').last();
        await expectUnobstructed(last);
        if (route === "/viajes") await expectUnobstructed(page.getByRole("link", { name: "Volver al panel", exact: true }));
        if (route === "/cuenta") await expectUnobstructed(page.getByRole("button", { name: "Cerrar sesión", exact: true }));
        if (route === "/ganancias") {
          await expect(page.locator('[data-status="pendiente"]')).toHaveText(/1,620/);
          await expectUnobstructed(page.locator('[data-status="pendiente"]').locator(".."));
          const request = page.getByRole("button", { name: "Consultar programación de pago", exact: true });
          await expect(request).toBeEnabled();
          await expectUnobstructed(request);
          await request.click();
          await expect(page.getByRole("dialog", { name: "Programación de pago", exact: true })).toBeVisible();
          await page.getByRole("button", { name: "Cerrar programación de pago", exact: true }).click();
        }
        await expect(header).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        expect(await page.evaluate(() => getComputedStyle(document.body).overflowY)).not.toBe("hidden");
      });
    }
  });
}

test("403 conserva un único shell y sus acciones accesibles", async ({ page }) => {
  for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 667, height: 375 }, { width: 1280, height: 960 }]) {
    await page.setViewportSize(viewport);
    for (const route of ["/403", "/403?reason=rol_usuario"]) {
      await test.step(`${route} en ${viewport.width}×${viewport.height}`, async () => {
        await page.goto(route);
        const navigation = page.getByRole("navigation", { name: viewport.width < 768 ? "Navegación principal móvil" : "Navegación principal", exact: true });
        await expect(navigation).toHaveCount(1);
        await expect(navigation).toBeVisible();
        await expect(navigation.getByRole("link")).toHaveCount(5);
        await expect(navigation.locator('[aria-current="page"]')).toHaveCount(0);
        await expect(page.getByRole("main")).toHaveCount(1);
        await expect(page.locator("#contenido-principal nav")).toHaveCount(0);
        await expect(page.locator("[data-conductor-header]")).toHaveCount(1);
        await expect(page.locator("[data-conductor-mobile-nav]")).toHaveCount(1);
        await expectUnobstructed(page.getByRole("heading", { name: "Cuenta no autorizada para operar", exact: true }));
        await expectUnobstructed(page.getByRole("link", { name: "Cambiar de cuenta", exact: true }));
        await expectUnobstructed(page.getByRole("link", { name: "Ir al inicio", exact: true }));
      });
    }
  }
});

test("recalcula los márgenes cuando cambian las barras, la orientación y la ruta de acceso", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/cuenta");
  await expect(page.getByRole("heading", { name: "Cuenta", exact: true })).toBeVisible();
  await page.locator("[data-conductor-header]").evaluate(element => { element.style.paddingTop = "28px"; });
  await page.locator("[data-conductor-mobile-nav]").evaluate(element => {
    element.style.paddingBottom = "34px";
    const activeTrip = document.createElement("div");
    activeTrip.style.height = "72px";
    element.prepend(activeTrip);
  });
  const assertInsets = async () => {
    await expect.poll(() => page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      const headerHeight = document.querySelector("[data-conductor-header]")!.getBoundingClientRect().height;
      const footerHeight = document.querySelector("[data-conductor-mobile-nav]")!.getBoundingClientRect().height;
      const main = getComputedStyle(document.querySelector("#contenido-principal")!);
      return parseFloat(root.getPropertyValue("--conductor-shell-header-height")) >= headerHeight
        && parseFloat(root.getPropertyValue("--conductor-shell-bottom-height")) >= footerHeight
        && parseFloat(main.paddingBottom) >= footerHeight + 16;
    })).toBe(true);
  };
  await assertInsets();
  await expectUnobstructed(page.getByRole("button", { name: "Cerrar sesión", exact: true }));
  await page.screenshot({ path: testInfo.outputPath("cuenta-safe-areas-320.png") });
  await page.setViewportSize({ width: 1280, height: 960 });
  await assertInsets();
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--conductor-shell-bottom-height"))).toBe("0px");
  await page.setViewportSize({ width: 320, height: 568 });
  await assertInsets();
  await page.context().clearCookies();
  await page.goto("/login");
  await expect(page).toHaveURL(/\/login/);
  await expect(page.locator("[data-conductor-header]")).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => document.documentElement.style.getPropertyValue("--conductor-shell-header-height"))).toBe("");
  await expect.poll(() => page.evaluate(() => document.documentElement.style.getPropertyValue("--conductor-shell-bottom-height"))).toBe("");
});
