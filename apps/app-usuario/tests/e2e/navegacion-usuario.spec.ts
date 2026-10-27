import { expect, test } from "@playwright/test";
import { seedMockAuthSession } from "./fixtures/sesion";
import { esperarHidratacion, rutaActual } from "./fixtures/navegacion";

test.describe("RR-UI-002 — Hardening de navegación premium y protección Mobile First", () => {
  test.beforeEach(async ({ page }) => {
    await seedMockAuthSession(page, { variante: "verificada" });
  });

  test("Desktop: UserSidebar y UserHeader visibles, branding oficial y navegación lateral funcional", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    await esperarHidratacion(page);

    // Sidebar y Header presentes
    const sidebar = page.locator("#userDashboardSidebar");
    const header = page.locator("#userDashboardHeader");
    await expect(sidebar).toBeVisible();
    await expect(header).toBeVisible();

    // Logotipo oficial con lema «Tu traslado, en orden»
    await expect(sidebar.getByText("Ruum Ruum")).toBeVisible();
    await expect(sidebar.getByText("Tu traslado, en orden")).toBeVisible();

    // Navegación lateral hacia Mis traslados
    const linkTraslados = sidebar.getByRole("link", { name: "Mis traslados" });
    await expect(linkTraslados).toBeVisible();
    await linkTraslados.click();

    await page.waitForURL("**/mis-viajes", { timeout: 15_000 });
    expect(rutaActual(page)).toBe("/mis-viajes");
    await expect(linkTraslados).toHaveAttribute("aria-current", "page");

    // Navegación lateral hacia Mis vehículos
    const linkVehiculos = sidebar.getByRole("link", { name: "Mis vehículos" });
    await expect(linkVehiculos).toBeVisible();
    await linkVehiculos.click();

    await page.waitForURL("**/cuenta/vehiculos", { timeout: 15_000 });
    expect(rutaActual(page)).toBe("/cuenta/vehiculos");
    await expect(linkVehiculos).toHaveAttribute("aria-current", "page");

    // Navegación lateral hacia Mis ubicaciones
    const linkUbicaciones = sidebar.getByRole("link", { name: "Mis ubicaciones" });
    await expect(linkUbicaciones).toBeVisible();
    await linkUbicaciones.click();

    await page.waitForURL("**/ubicaciones", { timeout: 15_000 });
    expect(rutaActual(page)).toBe("/ubicaciones");
    await expect(linkUbicaciones).toHaveAttribute("aria-current", "page");
  });

  test("Desktop: Colapso y expansión del sidebar con persistencia en localStorage", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    await esperarHidratacion(page);

    const botonColapsar = page.getByRole("button", { name: "Colapsar menú lateral" });
    await expect(botonColapsar).toBeVisible();
    await botonColapsar.click();

    // El sidebar adquiere el estado contraído y el botón cambia a expandir
    const botonExpandir = page.getByRole("button", { name: "Expandir menú lateral" });
    await expect(botonExpandir).toBeVisible();

    const preferenciaGuardada = await page.evaluate(() =>
      localStorage.getItem("ruum-usuario-sidebar-colapsada")
    );
    expect(preferenciaGuardada).toBe("1");

    // Volver a expandir
    await botonExpandir.click();
    await expect(page.getByRole("button", { name: "Colapsar menú lateral" })).toBeVisible();
    const preferenciaRestaurada = await page.evaluate(() =>
      localStorage.getItem("ruum-usuario-sidebar-colapsada")
    );
    expect(preferenciaRestaurada).toBe("0");
  });

  test("Global Search: Atajo de teclado Ctrl+K / Cmd+K y envío de búsqueda a /mis-viajes", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    await esperarHidratacion(page);

    // Presionar atajo de búsqueda Control+K
    await page.keyboard.press("Control+k");

    const inputBuscador = page.getByPlaceholder("Buscar traslados, vehículos o documentos...");
    await expect(inputBuscador).toBeFocused();

    const sugerencias = page.locator("#userHeaderSearchSuggestions");
    await expect(sugerencias).toBeVisible();

    // Escribir término y enviar formulario
    await inputBuscador.fill("Querétaro");
    await page.keyboard.press("Enter");

    await page.waitForURL("**/mis-viajes?buscar=Quer%C3%A9taro", { timeout: 15_000 });
    expect(rutaActual(page)).toBe("/mis-viajes?buscar=Quer%C3%A9taro");
  });

  test("Tema: Alternancia entre tema claro y tema oscuro con atributo data-theme", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    await esperarHidratacion(page);

    const botonTema = page.getByRole("button", { name: /Cambiar a modo (oscuro|claro)/ });
    await expect(botonTema).toBeVisible();

    // Click para alternar a tema oscuro
    await botonTema.click();
    const temaActual = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
    expect(temaActual).toBe("dark");

    // Click nuevamente para volver a claro
    await botonTema.click();
    const temaSiguiente = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
    expect(temaSiguiente).toBe("light");
  });

  test("Notificaciones: Apertura de popover, lista de avisos y enlace a traslados", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    await esperarHidratacion(page);

    const botonCampana = page.getByRole("button", { name: /Notificaciones/ });
    await expect(botonCampana).toBeVisible();
    await botonCampana.click();

    const panelNotificaciones = page.getByRole("dialog", { name: "Notificaciones" });
    await expect(panelNotificaciones).toBeVisible();

    const enlaceVerTraslados = panelNotificaciones.getByRole("link", { name: /Ver mis traslados/ });
    await expect(enlaceVerTraslados).toBeVisible();
    await enlaceVerTraslados.click();

    await page.waitForURL("**/mis-viajes", { timeout: 15_000 });
    expect(rutaActual(page)).toBe("/mis-viajes");
  });

  test("Perfil: Dropdown con Mi cuenta, Mis vehículos, Mis preferencias y Cerrar sesión", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    await esperarHidratacion(page);

    const botonPerfil = page.getByRole("button", { name: /Menú de usuario/ });
    await expect(botonPerfil).toBeVisible();
    await botonPerfil.click();

    const menuPerfil = page.getByRole("menu");
    await expect(menuPerfil).toBeVisible();

    await expect(menuPerfil.getByRole("menuitem", { name: "Mi cuenta" })).toBeVisible();
    await expect(menuPerfil.getByRole("menuitem", { name: "Mis vehículos" })).toBeVisible();
    await expect(menuPerfil.getByRole("menuitem", { name: "Mis preferencias" })).toBeVisible();

    const botonCerrarSesion = menuPerfil.getByRole("menuitem", { name: "Cerrar sesión" });
    await expect(botonCerrarSesion).toBeVisible();
    await botonCerrarSesion.click();

    await page.waitForURL("**/login**", { timeout: 15_000 });
    expect(rutaActual(page)).toContain("/login");
  });

  test("Móvil: Drawer accesible, focus trap, Escape, restauración de foco y contención no-scroll", async ({
    page,
  }) => {
    // Viewport de smartphone moderno
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await esperarHidratacion(page);

    // Botón hamburguesa visible
    const botonMenu = page.getByRole("button", { name: "Abrir menú de navegación" });
    await expect(botonMenu).toBeVisible();

    // Abrir drawer
    await botonMenu.click();

    const drawer = page.getByRole("dialog", { name: "Menú principal de navegación" });
    await expect(drawer).toBeVisible();
    await expect(drawer).toHaveAttribute("aria-modal", "true");

    // Aislamiento del fondo (background isolation)
    const contenedorPrincipal = page.locator("#userDashboardMainContent");
    await expect(contenedorPrincipal).toHaveAttribute("aria-hidden", "true");

    // El botón de cierre dentro del drawer recibe el foco
    const botonCerrar = drawer.getByRole("button", { name: "Cerrar menú de navegación" });
    await expect(botonCerrar).toBeFocused();

    // Cerrar con tecla Escape
    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();

    // Restauración de foco al botón que detonó la apertura
    await expect(botonMenu).toBeFocused();

    // Contención no-scroll: verificar que no existe desbordamiento horizontal
    const tieneOverflowHorizontal = await page.evaluate(() => {
      const docWidth = document.documentElement.clientWidth;
      const scrollWidth = document.documentElement.scrollWidth;
      const bodyScrollWidth = document.body.scrollWidth;
      return scrollWidth > docWidth || bodyScrollWidth > docWidth;
    });
    expect(tieneOverflowHorizontal).toBe(false);
  });

  test("Tablet (768px y 1023px): Layout contenido sin desbordamiento horizontal ni colisiones", async ({
    page,
  }) => {
    // Probar zona crítica de tablet 768px
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");
    await esperarHidratacion(page);

    const sidebar = page.locator("#userDashboardSidebar");
    const header = page.locator("#userDashboardHeader");
    await expect(sidebar).toBeVisible();
    await expect(header).toBeVisible();

    // En tablet, verificar que no hay scroll horizontal
    const overflow768 = await page.evaluate(() => {
      return (
        document.documentElement.scrollWidth > document.documentElement.clientWidth ||
        document.body.scrollWidth > document.body.clientWidth
      );
    });
    expect(overflow768).toBe(false);

    // Probar borde superior de tablet 1023px
    await page.setViewportSize({ width: 1023, height: 768 });
    await page.waitForTimeout(300);

    const overflow1023 = await page.evaluate(() => {
      return (
        document.documentElement.scrollWidth > document.documentElement.clientWidth ||
        document.body.scrollWidth > document.body.clientWidth
      );
    });
    expect(overflow1023).toBe(false);
  });
});
