import { expect, test } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] }, navigationTimeout: 120_000 });

const sizes = [
  { width: 320, height: 568 },
  { width: 375, height: 667 },
  { width: 390, height: 844 },
  { width: 375, height: 340 },
  { width: 1280, height: 900 },
];

for (const size of sizes) {
  test(`registro completo sin desbordamiento en ${size.width}×${size.height}`, async ({ page }, testInfo) => {
    await page.setViewportSize(size);
    await page.goto("/registro", { waitUntil: "domcontentloaded" });
    await expect(page.locator("form[data-registration-ready=true]")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Crea tu cuenta" })).toBeVisible();
    await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuetext", "1 de 5");
    await page.locator("nextjs-portal").evaluateAll((nodes) => nodes.forEach((node) => (node as HTMLElement).style.setProperty("display", "none", "important")));
    const layout = await page.locator("[data-conductor-registration]").evaluate((screen) => {
      const bounds = screen.getBoundingClientRect();
      const controls = [...screen.querySelectorAll("input, select, button, a, h1, ul")];
      return {
        width: bounds.width,
        overflow: screen.scrollHeight - screen.clientHeight,
        documentOverflow: document.documentElement.scrollHeight - window.innerHeight,
        outside: controls.filter((control) => {
          const rect = control.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0 && (rect.top < -1 || rect.bottom > window.innerHeight + 1 || rect.left < -1 || rect.right > window.innerWidth + 1);
        }).map((control) => control.getAttribute("aria-label") || control.textContent || control.tagName),
      };
    });
    await page.screenshot({ path: testInfo.outputPath("registro.png") });
    expect(layout.width).toBeLessThanOrEqual(440);
    expect(layout.overflow).toBeLessThanOrEqual(1);
    expect(layout.documentOverflow).toBeLessThanOrEqual(1);
    expect(layout.outside).toEqual([]);
  });
}

test("valida requisitos, consentimiento y visibilidad antes de crear cuenta", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/registro", { waitUntil: "domcontentloaded" });
  await expect(page.locator("form[data-registration-ready=true]")).toBeVisible();
  const submit = page.getByRole("button", { name: "Crear cuenta y continuar" });
  const password = page.getByLabel("Contraseña", { exact: true });
  const confirmation = page.getByLabel("Confirmar contraseña", { exact: true });
  const legal = page.getByRole("checkbox");
  await expect(submit).toBeDisabled();
  await page.getByLabel("Teléfono", { exact: true }).fill("5512345678");
  await page.getByLabel("Correo", { exact: true }).fill("conductor@example.test");
  await password.fill("carretera");
  await confirmation.fill("carretera");
  await legal.check();
  await expect(submit).toBeDisabled();
  await password.fill("Carretera2026");
  await expect(submit).toBeDisabled();
  await confirmation.fill("Carretera2026");
  await expect(page.locator("#requisitos-password li[data-met=true]")).toHaveCount(4);
  await expect(submit).toBeEnabled();
  await page.getByRole("button", { name: "Mostrar contraseña", exact: true }).click();
  await expect(password).toHaveAttribute("type", "text");
  await expect(confirmation).toHaveAttribute("type", "password");
  await page.getByRole("button", { name: "Mostrar confirmación de contraseña", exact: true }).click();
  await expect(confirmation).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Ocultar contraseña", exact: true }).click();
  await expect(password).toHaveAttribute("type", "password");
  await legal.uncheck();
  await expect(submit).toBeDisabled();
  await legal.check();
  await password.fill("Carretera2027");
  await expect(submit).toBeDisabled();
  await expect(page.getByRole("link", { name: "Términos y Condiciones" })).toHaveAttribute("href", "/legal/terminos");
  await expect(page.getByRole("link", { name: "Aviso de Privacidad" })).toHaveAttribute("href", "/legal/privacidad");
  await expect(page.getByRole("link", { name: "Entrar", exact: true })).toHaveAttribute("href", "/login");
});
