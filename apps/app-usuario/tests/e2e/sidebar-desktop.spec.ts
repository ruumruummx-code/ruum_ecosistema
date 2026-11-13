import { expect, test } from "@playwright/test";
import { seedMockAuthSession } from "./fixtures/sesion";
import { esperarHidratacion } from "./fixtures/navegacion";

test("Sidebar desktop: menú y banner completos sin scroll y rutas activas", async ({ page }) => {
  test.setTimeout(240_000);
  await seedMockAuthSession(page, { variante: "verificada" });
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/cuenta", { waitUntil: "domcontentloaded" });
  await esperarHidratacion(page);
  const sidebar = page.locator("#userDashboardSidebar");
  const nav = sidebar.locator("nav");

  for (const [width, height] of [[1280, 640], [1366, 768], [1440, 900], [1920, 1080], [3840, 2160]]) {
    await page.setViewportSize({ width, height });
    await expect(sidebar.getByRole("link", { name: "Registrar traslado" })).toBeInViewport({ ratio: 1 });
    await expect(nav.getByRole("link")).toHaveCount(9);
    const geometry = await sidebar.evaluate(el => {
      const menu = el.querySelector("nav")!;
      const last = menu.lastElementChild!;
      const promo = el.querySelector('a[href="/viajes/nuevo"]')!;
      return {
        overflow: el.scrollHeight - el.clientHeight,
        menuOverflow: menu.parentElement!.scrollHeight - menu.parentElement!.clientHeight,
        overlap: last.getBoundingClientRect().bottom > promo.parentElement!.getBoundingClientRect().top,
        contentLeft: document.querySelector("#userDashboardMainContent")!.getBoundingClientRect().left,
        sidebarRight: el.getBoundingClientRect().right,
        horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
      };
    });
    expect(geometry.overflow).toBeLessThanOrEqual(1);
    expect(geometry.menuOverflow).toBeLessThanOrEqual(1);
    expect(geometry.overlap).toBe(false);
    expect(geometry.contentLeft).toBeGreaterThanOrEqual(geometry.sidebarRight);
    expect(geometry.horizontalOverflow).toBe(false);
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({ path: "test-results/sidebar-desktop.png" });
  const asset = await page.request.get("/imagenes/sidebar-traslado.webp");
  expect(asset.ok()).toBe(true);
  for (const [label, route] of [
    ["Inicio", "/"], ["Mis traslados", "/mis-viajes"],
    ["Mis vehículos", "/cuenta/vehiculos"], ["Mis ubicaciones", "/ubicaciones"],
    ["Carga Masiva", "/viajes/masivo"], ["Mi cuenta", "/cuenta"],
    ["Mi perfil", "/cuenta?seccion=perfil"], ["Mis preferencias", "/cuenta/preferencias"],
    ["Ayuda", "/soporte"],
  ]) {
    const link = sidebar.getByRole("link", { name: label, exact: true });
    await expect(link).toHaveAttribute("href", route);
    await link.click();
    await page.waitForURL(url => `${url.pathname}${url.search}` === route);
    await expect(sidebar.getByRole("link", { name: label, exact: true })).toHaveAttribute("aria-current", "page");
  }
  for (const route of ["/cuenta/cambiar-contrasena", "/cuenta/verificacion-documentos", "/preguntas-frecuentes", "/pasaporte"]) {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await expect(sidebar).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Registrar traslado" })).toBeVisible();
  }
  await sidebar.getByRole("link", { name: "Registrar traslado" }).click();
  await page.waitForURL("**/viajes/nuevo");
});
