import { expect, test, type Page } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("CapacitorStorage.ruum_conductor_onboarding_visto", "1");
  });
  await page.goto("/login", { timeout: 90_000 });
  await expect(page.getByRole("heading", { name: "Iniciar sesión", exact: true })).toBeVisible();
  await page.locator("nextjs-portal").evaluateAll(nodes => nodes.forEach(node => (node as HTMLElement).style.setProperty("display", "none", "important")));
});

async function expectUsableLogin(page: Page) {
  const screen = page.locator("[data-conductor-login]");
  const frame = await screen.boundingBox();
  for (const control of [
    page.getByRole("heading", { name: "Iniciar sesión", exact: true }),
    page.getByLabel("Correo", { exact: true }),
    page.getByLabel("Contraseña", { exact: true }),
    page.getByRole("button", { name: "Entrar", exact: true }),
    page.getByRole("link", { name: "¿Olvidaste tu contraseña?", exact: true }),
    page.getByRole("link", { name: "Crear cuenta de conductor", exact: true }),
  ]) {
    await control.scrollIntoViewIfNeeded();
    const bounds = await control.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.y).toBeGreaterThanOrEqual(frame!.y - 1);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(frame!.y + frame!.height + 1);
    expect(bounds!.x).toBeGreaterThanOrEqual(frame!.x);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(frame!.x + frame!.width);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.getByRole("link", { name: "Términos y Condiciones", exact: true })).toHaveAttribute("href", "/legal/terminos?volver=%2Flogin");
  await expect(page.getByRole("link", { name: "Aviso de Privacidad", exact: true })).toHaveAttribute("href", "/legal/privacidad?volver=%2Flogin");
}

test("controles accesibles en móviles, paisaje y viewport reducido por teclado", async ({ page }) => {
  for (const viewport of [
    { width: 320, height: 568 }, { width: 360, height: 640 },
    { width: 390, height: 844 }, { width: 430, height: 932 },
    { width: 667, height: 375 }, { width: 320, height: 284 },
  ]) {
    await page.setViewportSize(viewport);
    await expect.poll(() => page.locator("[data-conductor-login]").evaluate((el) => el.clientHeight)).toBe(viewport.height);
    await expectUsableLogin(page);
  }
  await expect(page.getByText("Acción requerida", { exact: true })).toHaveCount(0);
  await expect(page.getByText("DRIVEAWAY SERVICE", { exact: true })).toHaveCount(0);
});

test("sigue visualViewport cuando el teclado no redimensiona el documento", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByLabel("Contraseña", { exact: true }).focus();
  await page.evaluate(() => {
    Object.defineProperties(window.visualViewport!, {
      height: { configurable: true, value: 320 },
      offsetTop: { configurable: true, value: 24 },
    });
    window.visualViewport!.dispatchEvent(new Event("resize"));
    window.visualViewport!.dispatchEvent(new Event("scroll"));
  });
  await expect.poll(() => page.locator("[data-conductor-login]").evaluate((el) => el.clientHeight)).toBe(320);
  await expect.poll(() => page.locator("[data-conductor-login]").evaluate((el) => el.getBoundingClientRect().top)).toBe(24);
  await expectUsableLogin(page);
  await expect(page.getByLabel("Contraseña", { exact: true })).toBeFocused();
  await page.evaluate(() => {
    delete (window.visualViewport as unknown as Record<string, unknown>).height;
    delete (window.visualViewport as unknown as Record<string, unknown>).offsetTop;
    window.visualViewport!.dispatchEvent(new Event("resize"));
  });
  await expect.poll(() => page.locator("[data-conductor-login]").evaluate((el) => el.clientHeight)).toBe(844);
});

test.describe("errores simulados de autenticación", () => {

  test("error de acceso visible y envío con Enter en espacio de teclado", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 284 });
    let attempts = 0;
    await page.route("**/auth/v1/token**", async (route) => {
      expect(route.request().postDataJSON()).toMatchObject({ email: "conductor@example.com", password: "incorrecta" });
      const code = ++attempts === 1 ? "invalid_credentials" : "over_request_rate_limit";
      await route.fulfill({ status: 400, contentType: "application/json",
        headers: { "x-supabase-api-version": "2024-01-01" },
        body: JSON.stringify({ code, message: code === "invalid_credentials" ? "Invalid login credentials" : "Too many requests: rate limit" }) });
    });
    await page.getByLabel("Correo", { exact: true }).fill("conductor@example.com");
    await page.getByLabel("Contraseña", { exact: true }).fill("incorrecta");
    await page.getByLabel("Contraseña", { exact: true }).press("Enter");
    await expect(page.locator("#login-status")).toHaveText("Correo o contraseña incorrectos.");
    await expectUsableLogin(page);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(page.locator("#login-status")).toContainText("Demasiados intentos");
    await expectUsableLogin(page);
  });
});

test("recuperación y registro conservan la navegación y desmontan el shell de login", async ({ page }) => {
  for (const [name, destination] of [
    ["¿Olvidaste tu contraseña?", "/recuperar-password"],
    ["Crear cuenta de conductor", "/registro"],
  ]) {
    await page.getByRole("link", { name, exact: true }).click();
    await page.waitForURL(url => url.pathname === destination, { timeout: 120_000 });
    await expect(page.locator("[data-conductor-login]")).toHaveCount(0);
    if (destination === "/recuperar-password") expect(await page.evaluate(() => getComputedStyle(document.body).overflowY)).not.toBe("hidden");
    else await expect(page.locator("[data-conductor-registration]")).toBeVisible();
    await page.goBack();
    await expect(page.getByRole("heading", { name: "Iniciar sesión", exact: true })).toBeVisible();
  }
});
