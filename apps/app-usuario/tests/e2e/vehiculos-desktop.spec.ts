import { expect, test } from "@playwright/test";
import { seedMockAuthSession } from "./fixtures/sesion";
import { esperarHidratacion } from "./fixtures/navegacion";
const firstId = "50000000-0000-4000-8000-000000000001";
test.use({ channel: "chromium", video: "off", trace: "off" });
test("Vehículos desktop: fidelidad, selección, filtros y scroll interno", async ({
  page,
}) => {
  test.setTimeout(240_000);
  await seedMockAuthSession(page, { token: "mock_access_token_vehicles" });
  await page.setViewportSize({ width: 1672, height: 941 });
  await page.goto("/cuenta/vehiculos", {
    waitUntil: "domcontentloaded",
    timeout: 180_000,
  });
  await esperarHidratacion(page);
  // The development overlay inserts a 100px script outside the app; it is absent in production.
  await page.evaluate(() =>
    document
      .querySelector<HTMLElement>("script[data-nextjs-dev-overlay]")
      ?.style.setProperty("display", "none", "important"),
  );
  const main = page.getByTestId("vehicles-desktop");
  await expect(
    main.getByRole("heading", { name: "Mis vehículos", exact: true }),
  ).toBeVisible();
  await expect(main.getByRole("listitem")).toHaveCount(5);
  await expect(
    page
      .locator("#userDashboardSidebar")
      .getByRole("link", { name: "Mis vehículos", exact: true }),
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
    await expect(
      main.getByRole("link", {
        name: "Seleccionar para traslado",
        exact: true,
      }),
    ).toBeInViewport({ ratio: 1 });
    const geometry = await main.evaluate((el) => {
      const list = el.querySelector(
        '[aria-label="Contenedor de vehículos con desplazamiento interno"]',
      )!;
      const panel = el.querySelector("aside")!;
      const content = panel.querySelector('[role="tabpanel"]')!;
      const shell = document.getElementById("desktopVehiclesMainContent")!;
      return {
        global: document.documentElement.scrollHeight - innerHeight,
        horizontal: document.documentElement.scrollWidth - innerWidth,
        main: el.scrollHeight - el.clientHeight,
        shell: shell.scrollHeight - shell.clientHeight,
        listX: list.scrollWidth - list.clientWidth,
        listY: getComputedStyle(list).overflowY,
        panel: panel.scrollHeight - panel.clientHeight,
        content: content.scrollHeight - content.clientHeight,
      };
    });
    for (const key of [
      "global",
      "horizontal",
      "main",
      "shell",
      "listX",
      "panel",
      "content",
    ] as const)
      expect(
        geometry[key],
        JSON.stringify({ width, height, geometry }),
      ).toBeLessThanOrEqual(1);
    expect(geometry.listY).toBe("auto");
    for (const tab of ["Documentos", "Historial", "Información"]) {
      await main.getByRole("tab", { name: tab, exact: true }).click();
      const overflow = await main
        .getByRole("tabpanel")
        .evaluate((el) => el.scrollHeight - el.clientHeight);
      expect(overflow, `${width}x${height}: ${tab}`).toBeLessThanOrEqual(1);
    }
  }
  await page.setViewportSize({ width: 1672, height: 941 });
  await page.evaluate(() => document.fonts.ready);
  await expect
    .poll(() =>
      main
        .getByRole("complementary")
        .locator("img")
        .evaluate(
          (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
        ),
    )
    .toBe(true);
  await page.screenshot({ path: "test-results/vehiculos-desktop.png" });
  await main.getByRole("button", { name: "Ver Toyota RAV4 2023" }).click();
  const panel = main.getByRole("complementary", {
    name: "Detalle de Toyota RAV4 2023",
  });
  await expect(
    panel.getByRole("heading", { name: "Toyota RAV4 2023" }),
  ).toBeVisible();
  await panel.getByRole("button", { name: "Ver documentos" }).click();
  await expect(
    panel.getByText("Tarjeta de circulación", { exact: true }),
  ).toBeVisible();
  await panel.getByRole("tab", { name: "Historial" }).click();
  await expect(panel.getByRole("link", { name: /Toluca/ })).toHaveAttribute(
    "href",
    "/viajes/60000000-0000-4000-8000-000000000001",
  );
  await panel.getByRole("button", { name: "Editar", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Editar información del vehículo" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await main
    .getByRole("combobox", { name: "Estado", exact: true })
    .selectOption("revision");
  await expect(main.getByRole("listitem")).toHaveCount(1);
  await expect(
    main.getByRole("complementary", { name: "Detalle de RAM 1500 2024" }),
  ).toBeVisible();
  await main.getByRole("button", { name: "Limpiar filtros" }).click();
  await main.getByRole("searchbox").fill("PEM-789");
  await expect(main.getByRole("listitem")).toHaveCount(1);
  await expect(
    main.getByRole("link", { name: "Seleccionar para traslado" }),
  ).toHaveAttribute("href", `/viajes/nuevo?vehiculo=${firstId}`);
  await main.getByRole("searchbox").fill("sin-coincidencias");
  await expect(
    main.getByRole("heading", { name: "No se encontraron vehículos" }),
  ).toBeVisible();
  await expect(main.getByRole("complementary")).toHaveCount(0);
});
