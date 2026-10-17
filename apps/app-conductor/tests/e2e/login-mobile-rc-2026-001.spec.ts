import { expect, test, type Page } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("CapacitorStorage.ruum_conductor_onboarding_visto", "1");
  });
  await page.goto("/login", { timeout: 90_000 });
  await expect(page.getByRole("heading", { name: "Iniciar sesión", exact: true })).toBeVisible();
});

async function expectUsableLogin(page: Page) {
  const bounds = await page.evaluate(() => {
    const screen = document.querySelector<HTMLElement>("[data-conductor-login]")!;
    const rect = screen.getBoundingClientRect();
    const selectors = ["header", "input[name=email]", "input[name=password]", "button[type=submit]", "footer"];
    return {
      overflow: document.documentElement.scrollHeight > window.innerHeight,
      screenOverflow: screen.scrollHeight > screen.clientHeight,
      visible: selectors.every((selector) => {
        const element = screen.querySelector(selector)!.getBoundingClientRect();
        return element.top >= rect.top && element.bottom <= rect.bottom;
      }),
      inputsContained: [...screen.querySelectorAll("input")].every((input) => {
        const field = input.parentElement!.getBoundingClientRect();
        const bounds = input.getBoundingClientRect();
        return bounds.top >= field.top && bounds.bottom <= field.bottom;
      }),
      footer: screen.querySelector("footer")!.getBoundingClientRect().top,
      formBottom: screen.querySelector("form")!.getBoundingClientRect().bottom,
      links: [...screen.querySelectorAll("footer a")].map((link) => {
        const { width, height } = link.getBoundingClientRect();
        return { width, height };
      }),
    };
  });
  expect(bounds.overflow).toBe(false);
  expect(bounds.screenOverflow).toBe(false);
  expect(bounds.visible).toBe(true);
  expect(bounds.inputsContained).toBe(true);
  expect(bounds.formBottom).toBeLessThanOrEqual(bounds.footer);
  expect(bounds.links[0].width).toBeCloseTo(bounds.links[1].width, 0);
  for (const link of bounds.links) expect(link.height).toBeGreaterThanOrEqual(44);
}

test("sin scroll en móviles, paisaje y viewport reducido por teclado", async ({ page }) => {
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
  // The isolated auth fixture can use ci.supabase.test, outside production CSP.
  // Layout and navigation tests above/below still run with the real page CSP.
  test.use({ bypassCSP: true });

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

test("recuperación y registro conservan la navegación y liberan el scroll", async ({ page }) => {
  for (const [name, destination] of [
    ["Recuperar contraseña", "/recuperar-password"],
    ["Solicitar certificación como conductor", "/registro"],
  ]) {
    await page.getByRole("link", { name, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${destination}$`));
    expect(await page.evaluate(() => getComputedStyle(document.body).overflowY)).not.toBe("hidden");
    await page.goBack();
    await expect(page.getByRole("heading", { name: "Iniciar sesión", exact: true })).toBeVisible();
  }
});
