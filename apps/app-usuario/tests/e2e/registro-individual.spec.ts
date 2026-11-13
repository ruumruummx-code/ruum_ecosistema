import { test, expect, type Page } from "@playwright/test";

// El navegador recorre el formulario real. SMS y alta se interceptan para no
// enviar mensajes ni crear cuentas reales. La ruta de alta se valida en Vitest.

async function comprobarSinScroll(page: Page) {
  const errores = await page.evaluate(() => {
    const content = document.querySelector(".registro-content")!;
    const fallos: string[] = [];
    if (content.scrollHeight > content.clientHeight + 1) fallos.push(`Scroll del formulario: ${content.scrollHeight}/${content.clientHeight}`);
    if (document.documentElement.scrollHeight > innerHeight || document.documentElement.scrollWidth > innerWidth) fallos.push("Scroll del documento");
    for (const el of document.querySelectorAll('.registro-content input:not([type="hidden"]), .registro-content button[type="submit"], .registro-content a[href="/login"]')) {
      const rect = el.getBoundingClientRect();
      if (rect.top < 0 || rect.bottom > innerHeight || rect.right > innerWidth || rect.left < 0) fallos.push(`Control fuera de pantalla: ${el.id || el.textContent}`);
    }
    return fallos;
  });
  expect(errores).toEqual([]);
}

  test("registra sólo perfil individual, sin selector y sin scroll", async ({ page }) => {
    let alta: Record<string, unknown> | undefined;
    await page.route("**/api/auth/phone-verify/send", route => route.fulfill({ json: { ok: true } }));
    await page.route("**/api/auth/phone-verify/verify", route => route.fulfill({ json: { ok: true, token: "token-sms-fixture" } }));
    await page.route("**/api/auth/signup", route => {
      alta = route.request().postDataJSON();
      return route.fulfill({ json: { ok: true, requiereConfirmacion: true, correo: "ana@ejemplo.com" } });
    });
    await page.goto("/registro");
    await expect(page.getByLabel("Nombre", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /empresa|personal|particular/i })).toHaveCount(0);
    await comprobarSinScroll(page);
    await page.getByLabel("Nombre", { exact: true }).fill("ANA");
    await page.getByLabel("Apellido", { exact: true }).fill("LÓPEZ");
    await page.getByLabel("Teléfono celular", { exact: true }).fill("5512345678");
    await page.getByRole("button", { name: "Continuar", exact: true }).focus();
    await comprobarSinScroll(page);
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Elige tus credenciales" }).or(page.getByRole("dialog", { name: "Verifica tu número celular" }))).toBeVisible();
    if (await page.getByRole("dialog").isVisible()) {
      await page.getByLabel("Código de verificación SMS").fill("123456");
      await page.getByRole("button", { name: /verificar.*continuar/i }).click();
    }
    await expect(page.getByRole("heading", { name: "Elige tus credenciales" })).toBeVisible();
    await expect(page.getByLabel("Correo electrónico", { exact: true })).toBeFocused();
    await page.getByLabel("Correo electrónico", { exact: true }).fill("ana@ejemplo.com");
    await page.getByLabel("Contraseña", { exact: true }).fill("Segura123");
    await expect(page.getByLabel("Contraseña", { exact: true })).toHaveValue("Segura123");
    await page.getByLabel("Confirmar contraseña", { exact: true }).fill("Segura123");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Crear cuenta", exact: true }).focus();
    await comprobarSinScroll(page);
    await page.getByRole("button", { name: "Crear cuenta", exact: true }).click();
    await expect(page).toHaveURL(/\/registro\/confirma-correo/);
    expect(alta).toMatchObject({ nombre: "ANA", apellido: "LÓPEZ", telefono: "5512345678", tipoCuenta: "personal" });
  });
