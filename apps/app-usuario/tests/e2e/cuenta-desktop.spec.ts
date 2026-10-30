import { expect, test } from "@playwright/test";
import { seedMockAuthSession } from "./fixtures/sesion";
import { esperarHidratacion } from "./fixtures/navegacion";
test.use({ channel: "chromium", video: "off", trace: "off" });
test("Mi cuenta: módulos sin scroll, datos, enlaces y sesiones autenticadas", async ({
  page,
}) => {
  test.setTimeout(240_000);
  await seedMockAuthSession(page, { token: "mock_access_token_account" });
  await page.setViewportSize({ width: 1672, height: 941 });
  await page.goto("/cuenta", {
    waitUntil: "domcontentloaded",
    timeout: 180_000,
  });
  await esperarHidratacion(page);
  // The Next development overlay adds its own 100px script outside the application.
  await page.evaluate(() =>
    document
      .querySelector<HTMLElement>("script[data-nextjs-dev-overlay]")
      ?.style.setProperty("display", "none", "important"),
  );
  const account = page.getByTestId("account-desktop");
  await expect(
    account.getByRole("heading", { name: /Hola, Carlos/ }),
  ).toBeVisible();
  await expect(
    page
      .locator("#userDashboardSidebar")
      .getByRole("link", { name: "Mi cuenta", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  for (const [width, height] of [
    [1024, 768],
    [1280, 640],
    [1366, 768],
    [1440, 900],
    [1672, 941],
    [1920, 1080],
  ]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    );
    for (const name of [
      "Resumen de perfil",
      "Información personal",
      "Actividad reciente",
      "Dirección y facturación",
      "Seguridad de la cuenta",
    ]) {
      await expect(
        account.getByRole("region", { name, exact: true }),
      ).toBeInViewport({ ratio: 1 });
    }
    const geometry = await account.evaluate((el) => {
      const cards = Array.from(el.querySelectorAll("section[aria-label]")).map(
        (node) => ({
          name: node.getAttribute("aria-label"),
          scroll: node.scrollHeight - node.clientHeight,
        }),
      );
      const root = document.getElementById("contenido-cuenta")!;
      return {
        global: document.documentElement.scrollHeight - innerHeight,
        horizontal: document.documentElement.scrollWidth - innerWidth,
        page: el.scrollHeight - el.clientHeight,
        main: root.scrollHeight - root.clientHeight,
        cards,
      };
    });
    for (const key of ["global", "horizontal", "page", "main"] as const)
      expect(
        geometry[key],
        JSON.stringify({ width, height, geometry }),
      ).toBeLessThanOrEqual(1);
    for (const card of geometry.cards)
      expect(
        card.scroll,
        JSON.stringify({ width, height, card }),
      ).toBeLessThanOrEqual(1);
    await expect(
      account.getByRole("button", { name: "Administrar", exact: true }),
    ).toBeInViewport({ ratio: 1 });
  }
  await page.setViewportSize({ width: 1672, height: 941 });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: "test-results/cuenta-desktop.png" });
  const abrir = account.getByRole("button", {
    name: "Ver consejos de seguridad",
  });
  await abrir.click();
  await expect(
    page.getByRole("dialog", { name: "Consejos de seguridad" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(abrir).toBeFocused();
  await account
    .getByRole("button", { name: "Administrar", exact: true })
    .click();
  const sesiones = page.getByRole("dialog", {
    name: "Dispositivos y sesiones",
  });
  await sesiones.getByRole("button", { name: "Cerrar otras sesiones" }).click();
  const request = page.waitForRequest(
    (req) =>
      req.url().includes("/auth/v1/logout") &&
      new URL(req.url()).searchParams.get("scope") === "others",
  );
  await sesiones.getByRole("button", { name: "Confirmar cierre" }).click();
  await request;
  await expect(sesiones.getByRole("status")).toContainText(
    "Esta sesión permanece activa",
  );
  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(/\/cuenta$/);
  await account.getByRole("button", { name: "Activar", exact: true }).click();
  await expect(
    page.getByRole("dialog").getByText(/todavía no está disponible/),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await account
    .getByRole("navigation", { name: "Categorías de mi cuenta" })
    .getByRole("button", { name: /Métodos de pago/ })
    .click();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("link", { name: "Datos de facturación" }),
  ).toHaveAttribute("href", "/cuenta/facturacion");
  await page.keyboard.press("Escape");
  await expect(
    account.getByRole("link", { name: "Editar perfil", exact: true }),
  ).toHaveAttribute("href", "/cuenta/datos-personales");
  await expect(
    account.getByRole("link", { name: "Cambiar", exact: true }),
  ).toHaveAttribute("href", "/cuenta/cambiar-contrasena");
  await expect(
    account
      .getByRole("region", { name: "Actividad reciente" })
      .getByRole("link", { name: /Traslado Chrysler Cirrus/ }),
  ).toHaveAttribute("href", "/viajes/70000000-0000-4000-8000-000000000001");
});
