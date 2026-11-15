import type { Page } from "@playwright/test";

/** Bloquea el endpoint de tarifas y devuelve una respuesta determinista. */
export async function mockearTarifa(
  page: Page,
  tarifa: number,
  disponible = true,
) {
  await page.route("**/api/ruta", (route) =>
    route.fulfill({
      json: { distanciaKm: 12.5, tiempoEstimadoHoras: 0.5, tarifa },
    })
  );
  await page.route("**/rest/v1/rpc/usuario_previsualizar_tarifa", async (route) => {
    const origen = new URL(
      process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${process.env.PLAYWRIGHT_PORT ?? "3012"}`
    ).origin;
    const headers = {
      "access-control-allow-origin": origen,
      "access-control-allow-credentials": "true",
      "access-control-allow-headers":
        route.request().headers()["access-control-request-headers"] ??
        "apikey,authorization,content-type,x-client-info,x-supabase-api-version",
      "access-control-allow-methods": "POST,OPTIONS",
    };
    if (route.request().method() === "OPTIONS") {
      await route.fulfill({ status: 204, headers, body: "" });
      return;
    }
    await route.fulfill({
      status: 200,
      headers,
      contentType: "application/json",
      json: disponible
        ? { disponible: true, tarifa, categoria: "ligero_a", gama: "media" }
        : { disponible: false, motivo: "Tarifa especial requerida" },
    });
  });
  await page.route("**/api.mapbox.com/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "access-control-allow-origin": "*" },
      json: {
        features: [{
          place_name: "Ciudad de México, México",
          center: [-99.1332, 19.4326],
          geometry: { coordinates: [-99.1332, 19.4326] },
        }],
      },
    })
  );
}
