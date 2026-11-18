import { expect, test } from "@playwright/test";
import { seedMockAuthSession } from "./fixtures/sesion";
import { esperarHidratacion } from "./fixtures/navegacion";

test.use({ channel: "chromium", video: "off", trace: "off" });

/**
 * Mis traslados es UNA pantalla (MisTraslados) para todos los anchos:
 * - <1280px: lista de tarjetas; la tarjeta abre el expediente.
 * - ≥1280px: lista + panel de detalle a la derecha.
 * En ningún ancho hay scroll de página ni desbordes horizontales.
 */
test("Mis traslados: lista, panel de detalle, filtros y contención del scroll", async ({ page }) => {
  test.setTimeout(240_000);
  await seedMockAuthSession(page, { token: "mock_access_token_dashboard" });
  await page.route("https://api.mapbox.com/**", (route) => route.abort());
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/mis-viajes", { waitUntil: "domcontentloaded", timeout: 180_000 });
  await esperarHidratacion(page);
  await page.evaluate(() =>
    document.querySelector<HTMLElement>("script[data-nextjs-dev-overlay]")?.style.setProperty("display", "none", "important"),
  );
  const main = page.getByRole("main", { name: "Contenido principal" });
  await expect(main.getByRole("heading", { name: "Mis traslados", exact: true })).toBeVisible();
  await expect(main.getByRole("complementary")).toBeVisible();

  for (const [width, height] of [
    [1024, 768],
    [1280, 640],
    [1366, 768],
    [1672, 941],
    [1920, 1080],
  ]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    const geometry = await page.evaluate(() => ({
      global: document.documentElement.scrollHeight - innerHeight,
      horizontal: document.documentElement.scrollWidth - innerWidth,
    }));
    expect(geometry.global, JSON.stringify({ width, height, geometry })).toBeLessThanOrEqual(1);
    expect(geometry.horizontal, JSON.stringify({ width, height, geometry })).toBeLessThanOrEqual(1);
    if (width >= 1280) {
      // El panel es sticky: al desplazar la lista, sus acciones quedan siempre a la vista.
      const accion = main.getByRole("complementary").getByRole("link", { name: "Contactar soporte", exact: true });
      await accion.scrollIntoViewIfNeeded();
      await expect(accion).toBeInViewport({ ratio: 0.99 });
    } else {
      await expect(main.getByRole("complementary")).toHaveCount(0);
    }
  }

  await page.setViewportSize({ width: 1672, height: 941 });
  await page.screenshot({ path: "test-results/mis-traslados-desktop.png" });
  const segundo = main.getByRole("article").nth(1).getByRole("button", { name: /^Ver / });
  const nombre = (await segundo.getAttribute("aria-label"))!.slice("Ver ".length);
  await segundo.click();
  await expect(main.getByRole("complementary").getByRole("heading", { name: nombre })).toBeVisible();
  await main.getByRole("complementary").getByRole("tab", { name: "Detalles" }).click();
  await expect(main.getByText("Folio", { exact: true })).toBeVisible();
  await main.getByRole("button", { name: "Cerrar detalle" }).click();
  await expect(main.getByRole("complementary")).toHaveCount(0);

  await main.getByRole("button", { name: /^Cancelados/ }).click();
  await expect(main.getByRole("button", { name: /^Cancelados/ })).toHaveAttribute("aria-pressed", "true");
  await main.getByRole("button", { name: /^Todos/ }).click();
  await main.getByRole("searchbox", { name: "Buscar traslado" }).fill("sin-coincidencias-123");
  await expect(main.getByText("No se encontraron traslados")).toBeVisible();
  await main.getByRole("button", { name: "Limpiar filtros" }).click();
  await expect(main.getByRole("article").first()).toBeVisible();
});
