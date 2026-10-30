import { expect, test } from "@playwright/test";
import { seedMockAuthSession } from "./fixtures/sesion";
import { esperarHidratacion } from "./fixtures/navegacion";
test.use({ channel: "chromium", video: "off", trace: "off" });
test("Mis ubicaciones: scroll confinado, selección, copia y persistencia autenticada", async ({
  page,
  context,
}) => {
  test.setTimeout(300000);
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.route("https://events.mapbox.com/**", (r) =>
    r.fulfill({ status: 204, headers: { "access-control-allow-origin": "*" } }),
  );
  await page.route("https://api.mapbox.com/**", (r) => {
    if (r.request().url().includes("/styles/"))
      return r.fulfill({
        json: {
          version: 8,
          sources: {
            streets: {
              type: "geojson",
              data: {
                type: "FeatureCollection",
                features: Array.from({ length: 20 }, (_, i) => ({
                  type: "Feature",
                  properties: {},
                  geometry: {
                    type: "LineString",
                    coordinates: [
                      [-99.54, 19.27 + i * 0.001],
                      [-99.5, 19.28 + i * 0.001],
                    ],
                  },
                })),
              },
            },
          },
          layers: [
            {
              id: "background",
              type: "background",
              paint: { "background-color": "#e8eef5" },
            },
            {
              id: "roads",
              type: "line",
              source: "streets",
              paint: { "line-color": "#fff", "line-width": 3 },
            },
          ],
        },
      });
    if (r.request().url().includes("/search/geocode/"))
      return r.fulfill({
        json: {
          features: [
            {
              geometry: { coordinates: [-99.5228, 19.2845] },
              properties: { full_address: "San Mateo Atenco" },
            },
          ],
        },
      });
    return r.fulfill({ json: {} });
  });
  await seedMockAuthSession(page, { token: "mock_access_token_locations" });
  await page.setViewportSize({ width: 1672, height: 941 });
  await page.goto("/ubicaciones", {
    waitUntil: "domcontentloaded",
    timeout: 180000,
  });
  await esperarHidratacion(page);
  const ocultarOverlay = () =>
    page.evaluate(() =>
      document
        .querySelector<HTMLElement>("script[data-nextjs-dev-overlay]")
        ?.style.setProperty("display", "none", "important"),
    );
  await ocultarOverlay();
  await page.request.get("/api/ubicaciones", { timeout: 120000 });
  const app = page.getByTestId("locations-desktop");
  await expect(
    app.getByRole("heading", { name: "Mis ubicaciones", exact: true }),
  ).toBeVisible();
  await expect(
    page
      .locator("#userDashboardSidebar")
      .getByRole("link", { name: "Mis ubicaciones", exact: true }),
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
        new Promise((r) =>
          requestAnimationFrame(() => requestAnimationFrame(r)),
        ),
    );
    const geometry = await app.evaluate((el) => {
      const main = document.getElementById("desktopLocationsMainContent")!;
      const list = el.querySelector("[role=tabpanel]")!;
      const detail = el.querySelector("aside")!;
      return {
        global: document.documentElement.scrollHeight - innerHeight,
        horizontal: document.documentElement.scrollWidth - innerWidth,
        page: el.scrollHeight - el.clientHeight,
        main: main.scrollHeight - main.clientHeight,
        detail: detail.scrollHeight - detail.clientHeight,
        listOverflow: getComputedStyle(list).overflowY,
        listWidth: list.scrollWidth - list.clientWidth,
      };
    });
    for (const k of [
      "global",
      "horizontal",
      "page",
      "main",
      "detail",
      "listWidth",
    ] as const)
      expect(
        geometry[k],
        JSON.stringify({ width, height, geometry }),
      ).toBeLessThanOrEqual(1);
    expect(geometry.listOverflow).toBe("auto");
    await expect(
      app.getByRole("button", { name: "Editar información" }),
    ).toBeInViewport({ ratio: 1 });
  }
  await page.setViewportSize({ width: 1672, height: 941 });
  await page.evaluate(() => document.fonts.ready);
  await expect(app.locator(".mapboxgl-marker")).toBeVisible({ timeout: 30000 });
  await page.screenshot({ path: "test-results/ubicaciones-desktop.png" });
  await app.getByRole("button", { name: "Ver Oficina corporativa" }).click();
  let detalle = app.getByRole("complementary", {
    name: "Detalle de Oficina corporativa",
  });
  await expect(detalle.getByText("19.427, -99.167")).toBeVisible();
  await detalle.getByRole("button", { name: "Copiar dirección" }).click();
  await expect(app.getByText("Dirección copiada")).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    "Av. Paseo de la Reforma 296, 06600, Cuauhtémoc, CDMX",
  );
  await detalle
    .getByRole("button", {
      name: "Marcar ubicación seleccionada como frecuente",
    })
    .click();
  await expect(
    detalle.getByRole("button", {
      name: "Quitar ubicación seleccionada de frecuentes",
    }),
  ).toBeVisible();
  await page.reload();
  await esperarHidratacion(page);
  await ocultarOverlay();
  await app.getByRole("button", { name: "Ver Oficina corporativa" }).click();
  detalle = app.getByRole("complementary", {
    name: "Detalle de Oficina corporativa",
  });
  await expect(
    detalle.getByRole("button", {
      name: "Quitar ubicación seleccionada de frecuentes",
    }),
  ).toBeVisible();
  await app
    .getByRole("button", { name: "Nueva ubicación", exact: true })
    .click();
  let editor = page.getByRole("dialog", { name: "Nueva ubicación" });
  await editor.getByLabel("Alias o nombre").fill("Oficina de prueba");
  await editor.getByLabel("Dirección", { exact: true }).fill("Reforma 123");
  await editor.getByLabel("Ciudad o municipio").fill("Toluca");
  await editor.getByLabel("Estado", { exact: true }).fill("Estado de México");
  await editor.getByLabel("Código postal").fill("50000");
  await editor.getByRole("button", { name: "Guardar ubicación" }).click();
  await expect(editor).not.toBeVisible();
  await expect(
    app.getByRole("complementary", { name: "Detalle de Oficina de prueba" }),
  ).toBeVisible();
  await page.reload();
  await esperarHidratacion(page);
  await ocultarOverlay();
  await app.getByRole("button", { name: "Ver Oficina de prueba" }).click();
  detalle = app.getByRole("complementary", {
    name: "Detalle de Oficina de prueba",
  });
  await detalle.getByRole("button", { name: "Editar información" }).click();
  editor = page.getByRole("dialog", { name: "Editar ubicación" });
  await editor.getByLabel("Alias o nombre").fill("Oficina editada");
  await editor.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(editor).not.toBeVisible();
  detalle = app.getByRole("complementary", {
    name: "Detalle de Oficina editada",
  });
  await detalle.getByRole("button", { name: "Eliminar", exact: true }).click();
  await page
    .getByRole("dialog", { name: "Eliminar ubicación" })
    .getByRole("button", { name: "Confirmar eliminación" })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Eliminar ubicación" }),
  ).not.toBeVisible();
  await page.reload();
  await esperarHidratacion(page);
  await ocultarOverlay();
  await expect(
    app.getByRole("button", { name: "Ver Oficina editada" }),
  ).toHaveCount(0);
  await app.getByRole("button", { name: "Página 2" }).click();
  await expect(
    app.getByText("Mostrando 11–16 de 16 ubicaciones"),
  ).toBeVisible();
});
