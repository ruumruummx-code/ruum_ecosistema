import { expect, test, type Page } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] }, navigationTimeout: 120_000 });

async function openVerification(page: Page, freezeClock = false) {
  // Intercepta Auth: estas pruebas no crean cuentas ni envían correos reales.
  await page.route("**/auth/v1/**", async (route) => {
    const endpoint = new URL(route.request().url()).pathname;
    const headers = { "access-control-allow-origin": "*" };
    if (endpoint.endsWith("/signup")) {
      await route.fulfill({ json: { user: { id: "00000000-0000-4000-8000-000000000001", email: "conductor@example.test", aud: "authenticated", role: "authenticated", identities: [], created_at: "2026-10-18T12:00:00Z" }, session: null }, headers });
    } else if (endpoint.endsWith("/resend")) {
      await route.fulfill({ json: {}, headers });
    } else {
      await route.fulfill({ status: 400, json: { code: "otp_expired", msg: "Token has expired or is invalid" }, headers });
    }
  });
  await page.goto("/registro", { waitUntil: "domcontentloaded" });
  await expect(page.locator("form[data-registration-ready=true]")).toBeVisible();
  if (freezeClock) {
    await page.clock.install({ time: new Date("2026-10-18T12:00:00Z") });
    await page.clock.pauseAt(new Date("2026-10-18T12:00:01Z"));
  }
  await page.getByLabel("Teléfono", { exact: true }).fill("5512345678");
  await page.getByLabel("Correo", { exact: true }).fill("conductor@example.test");
  await page.getByLabel("Contraseña", { exact: true }).fill("Carretera2026");
  await page.getByLabel("Confirmar contraseña", { exact: true }).fill("Carretera2026");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Crear cuenta y continuar" }).click();
  await expect(page.getByRole("heading", { name: "Confirma tu correo" })).toBeVisible();
}

for (const size of [{ width: 320, height: 568 }, { width: 375, height: 667 }, { width: 390, height: 844 }, { width: 375, height: 340 }, { width: 1280, height: 900 }]) {
  test(`verificación completa sin scroll en ${size.width}×${size.height}`, async ({ page }, testInfo) => {
    await page.setViewportSize(size);
    await openVerification(page);
    await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuetext", "2 de 5");
    await expect(page.getByLabel("Código de verificación")).toBeFocused();
    await page.locator("nextjs-portal").evaluateAll((nodes) => nodes.forEach((node) => (node as HTMLElement).style.setProperty("display", "none", "important")));
    const layout = await page.locator("[data-conductor-registration]").evaluate((screen) => ({
      width: screen.getBoundingClientRect().width,
      overflow: screen.scrollHeight - screen.clientHeight,
      documentOverflow: document.documentElement.scrollHeight - window.innerHeight,
      outside: [...screen.querySelectorAll("input, button, h1, label, p")].filter((control) => {
        const rect = control.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && (rect.top < -1 || rect.bottom > window.innerHeight + 1 || rect.left < -1 || rect.right > window.innerWidth + 1);
      }).map((control) => control.textContent || control.tagName),
    }));
    await page.screenshot({ path: testInfo.outputPath("verificacion.png") });
    expect(layout.width).toBeLessThanOrEqual(440);
    expect(layout.overflow).toBeLessThanOrEqual(1);
    expect(layout.documentOverflow).toBeLessThanOrEqual(1);
    expect(layout.outside).toEqual([]);
  });
}

test("acepta pegado, envía el OTP y permite reenvío solo tras 60 segundos", async ({ page }) => {
  await openVerification(page, true);
  const input = page.getByLabel("Código de verificación");
  const confirm = page.getByRole("button", { name: "Confirmar y activar" });
  await expect(confirm).toBeDisabled();
  await expect(page.getByRole("button", { name: "Reenviar código (60s)", exact: true })).toBeDisabled();
  await input.fill("12a34");
  await expect(input).toHaveValue("1234");
  await expect(confirm).toBeDisabled();
  await input.evaluate((element) => {
    const clipboard = new DataTransfer();
    clipboard.setData("text", "12 34 56");
    element.dispatchEvent(new ClipboardEvent("paste", { clipboardData: clipboard, bubbles: true, cancelable: true }));
  });
  await expect(input).toHaveValue("123456");
  await expect(confirm).toBeEnabled();
  const verification = page.waitForRequest((request) => new URL(request.url()).pathname.endsWith("/auth/v1/verify"));
  await confirm.click();
  expect((await verification).postDataJSON()).toMatchObject({ email: "conductor@example.test", token: "123456", type: "signup" });
  await expect(page.locator("#error-codigo")).toBeVisible();
  await expect(input).toBeFocused();
  await page.clock.fastForward(13_000);
  await expect(page.getByRole("button", { name: "Reenviar código (47s)", exact: true })).toBeDisabled();
  await page.clock.fastForward(47_000);
  await expect(page.getByRole("button", { name: "Reenviar código", exact: true })).toBeEnabled();
  const resend = page.waitForRequest((request) => new URL(request.url()).pathname.endsWith("/auth/v1/resend"));
  await page.getByRole("button", { name: "Reenviar código", exact: true }).click();
  expect((await resend).postDataJSON()).toMatchObject({ email: "conductor@example.test", type: "signup" });
  await expect(input).toHaveValue("");
  await expect(confirm).toBeDisabled();
  await expect(page.getByRole("button", { name: "Reenviar código (60s)", exact: true })).toBeDisabled();
  await expect(page.locator("#error-codigo")).toHaveCount(0);
  await page.getByRole("button", { name: "Atrás", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Crea tu cuenta" })).toBeVisible();
});
