import { expect, test } from "@playwright/test";
import { seedMockAuthSession } from "./fixtures/sesion";
import { esperarHidratacion } from "./fixtures/navegacion";

test.use({ channel: "chromium", video: "off", trace: "off" });
test("Mis traslados: tabla, selección, filtros y contención del scroll desktop", async ({
  page,
}) => {
  test.setTimeout(240_000);
  await seedMockAuthSession(page, { token: "mock_access_token_dashboard" });
  await page.route("https://api.mapbox.com/**", (route) => route.abort());
  await page.goto("/mis-viajes", {
    waitUntil: "domcontentloaded",
    timeout: 180_000,
  });
  await esperarHidratacion(page);
  // Next devtools adds a 100px script after body content; it is absent in production.
  await page.evaluate(() =>
    document
      .querySelector<HTMLElement>("script[data-nextjs-dev-overlay]")
      ?.style.setProperty("display", "none", "important"),
  );
  const main = page.getByRole("main", { name: "Contenido principal" });
  await expect(
    main.getByRole("heading", { name: "Mis traslados", exact: true }),
  ).toBeVisible();
  await expect(main.getByRole("table")).toBeVisible();
  await expect(main.getByRole("complementary")).toBeVisible();
  for (const [width, height] of [
    [1024, 768],
    [1280, 640],
    [1366, 768],
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
      main.getByRole("link", { name: "Contactar soporte", exact: true }),
    ).toBeInViewport({ ratio: 1 });
    const geometry = await main.evaluate((el) => {
      const table = el.querySelector('[role="tabpanel"]')!;
      const panel = el.querySelector("aside")!;
      const content = panel.querySelector('[role="tabpanel"]')!;
      return {
        global: document.documentElement.scrollHeight - innerHeight,
        horizontal: document.documentElement.scrollWidth - innerWidth,
        main: el.scrollHeight - el.clientHeight,
        tableOverflow: getComputedStyle(table).overflowY,
        panel: panel.scrollHeight - panel.clientHeight,
        content: content.scrollHeight - content.clientHeight,
      };
    });
    expect(
      geometry.global,
      JSON.stringify({ width, height, geometry }),
    ).toBeLessThanOrEqual(1);
    expect(geometry.horizontal).toBeLessThanOrEqual(1);
    expect(geometry.main).toBeLessThanOrEqual(1);
    expect(geometry.panel).toBeLessThanOrEqual(1);
    expect(
      geometry.content,
      JSON.stringify({ width, height, geometry }),
    ).toBeLessThanOrEqual(1);
    expect(geometry.tableOverflow).toBe("auto");
  }
  await page.setViewportSize({ width: 1672, height: 941 });
  await page.evaluate(() => document.fonts.ready);
  await expect
    .poll(() =>
      main
        .getByRole("complementary")
        .locator("img")
        .first()
        .evaluate(
          (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
        ),
    )
    .toBe(true);
  await page.screenshot({ path: "test-results/mis-traslados-desktop.png" });
  const rows = main.getByRole("row");
  const secondName = await rows.nth(2).locator("strong").innerText();
  await rows.nth(2).getByRole("button", { name: /^Ver / }).click();
  await expect(
    main.getByRole("complementary").getByRole("heading", { name: secondName }),
  ).toBeVisible();
  await main
    .getByRole("complementary")
    .getByRole("tab", { name: "Detalles" })
    .click();
  await expect(main.getByText("Folio", { exact: true })).toBeVisible();
  await main.getByRole("button", { name: "Cerrar detalle" }).click();
  await expect(main.getByRole("complementary")).toHaveCount(0);
  await main.getByRole("tab", { name: /^Cancelados/ }).click();
  await expect(main.getByRole("tab", { name: /^Cancelados/ })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await main.getByRole("button", { name: "Limpiar filtros" }).click();
  await main
    .getByRole("textbox", {
      name: "Buscar por vehículo, placas, folio o destino",
    })
    .fill("sin-coincidencias-123");
  await expect(
    main.getByText("No se encontraron traslados con los filtros seleccionados"),
  ).toBeVisible();
});
