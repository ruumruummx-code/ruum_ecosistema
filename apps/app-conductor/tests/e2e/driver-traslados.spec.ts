import { expect, test, type Page } from "@playwright/test";

test.skip(process.env.PLAYWRIGHT_TRASLADOS_FIXTURE !== "1", "Usa playwright.traslados.config.ts para iniciar el API local de pruebas.");

test.beforeEach(async ({ context, page }) => {
  const userId = "00000000-0000-4000-8000-000000000001";
  const token = `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ sub: userId, role: "authenticated", aud: "authenticated", exp: 2100000000 })).toString("base64url")}.e2e-signature`;
  const session = { access_token: token, refresh_token: "e2e-refresh-only", expires_at: 2100000000, token_type: "bearer", user: { id: userId, email: "conductor@example.test" } };
  await context.addCookies([{ name: "sb-127-auth-token", value: `base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`, domain: "localhost", path: "/" }]);
  await page.clock.setFixedTime(new Date("2026-10-17T18:00:00Z"));
});

async function openTrips(page: Page, offers = 0) {
  await page.goto("/viajes", { waitUntil: "domcontentloaded" });
  await expect(page.locator("[data-driver-traslados] [role=tabpanel]")).toHaveAttribute("aria-busy", "false", { timeout: 30_000 });
  await expect(page.getByRole("tab", { name: `Ofertas (${offers})`, exact: true })).toBeVisible();
  await expect(page.getByText("Información de los traslados", { exact: true })).toHaveCount(0);
  await page.locator("nextjs-portal").evaluateAll((nodes) => nodes.forEach((node) => (node as HTMLElement).style.setProperty("display", "none", "important")));
}

async function measureScreen(page: Page) {
  return page.locator("[data-driver-traslados]").evaluate((screen) => ({
    width: screen.getBoundingClientRect().width,
    overflow: screen.scrollHeight - screen.clientHeight,
    documentOverflow: document.documentElement.scrollHeight - window.innerHeight,
    outside: [...screen.querySelectorAll("button, a, input, h1, h2, p")].filter((element) => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && (rect.top < -1 || rect.bottom > window.innerHeight + 1 || rect.left < -1 || rect.right > window.innerWidth + 1);
    }).map((element) => element.getAttribute("aria-label") || element.textContent || element.tagName),
  }));
}

for (const size of [{ width: 320, height: 568 }, { width: 375, height: 667 }, { width: 390, height: 844 }, { width: 375, height: 340 }, { width: 1280, height: 960 }]) {
  test(`Traslados completo sin scroll en ${size.width}×${size.height}`, async ({ page }, testInfo) => {
    await page.setViewportSize(size);
    await openTrips(page);
    await expect(page.getByRole("heading", { name: "Sin traslados para este día" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Navegación principal", exact: true }).getByRole("link")).toHaveCount(3);
    const layout = await measureScreen(page);
    await page.screenshot({ path: testInfo.outputPath("traslados.png") });
    expect(layout.width).toBeLessThanOrEqual(440);
    expect(layout.overflow).toBeLessThanOrEqual(1);
    expect(layout.documentOverflow).toBeLessThanOrEqual(1);
    expect(layout.outside).toEqual([]);
  });
}

test("alterna pestañas, selecciona fechas y navega entre semanas", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await openTrips(page);
  const today = page.getByRole("group", { name: "Días de la semana" }).getByRole("button", { name: /sábado.*17/ });
  await expect(today).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("HOY", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Aceptados (0)" }).click();
  await expect(page.getByRole("tab", { name: "Aceptados (0)" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByText(/No tienes traslados aceptados/)).toBeVisible();
  await page.getByRole("button", { name: "Buscar ofertas disponibles" }).click();
  await expect(page.getByRole("tab", { name: "Ofertas (0)" })).toHaveAttribute("aria-selected", "true");
  await page.getByRole("group", { name: "Días de la semana" }).getByRole("button", { name: /domingo.*11/ }).click();
  await expect(page.locator("time")).toHaveText("DOM 11 DE OCT");
  await expect(page.getByText("HOY", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Día anterior", exact: true }).click();
  await expect(page.locator("time")).toHaveText("SÁB 10 DE OCT");
  await expect(page.getByRole("group", { name: "Días de la semana" }).getByRole("button", { name: /sábado.*10/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page).toHaveURL(/fecha=2026-10-10/);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator("time")).toHaveText("SÁB 10 DE OCT");
});

test("ordenar, recargar, menú y accesos conservan sus acciones", async ({ page }) => {
  await openTrips(page);
  await page.getByRole("button", { name: "Ordenar por mayor ganancia" }).click();
  await expect(page).toHaveURL(/orden=mayor_ganancia/);
  await expect(page.getByRole("button", { name: "Ordenar por mayor ganancia" })).toHaveAttribute("aria-pressed", "true");
  const reloaded = page.waitForRequest((request) => request.url().includes("/rest/v1/pasaporte_digital") && new URL(request.url()).searchParams.get("estado") === "eq.pendiente_de_conductor");
  await page.getByRole("button", { name: "Recargar", exact: true }).click();
  await reloaded;
  await expect(page.getByRole("button", { name: "Recargar", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Abrir menú del conductor" }).click();
  await expect(page.getByRole("dialog", { name: "Menú del conductor" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Ganancias", exact: true })).toHaveAttribute("href", "/ganancias");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Menú del conductor" })).not.toBeVisible();
  await expect(page.getByRole("link", { name: "Volver al panel" })).toHaveAttribute("href", "/panel");
  await expect(page.getByRole("link", { name: "Notificaciones", exact: true })).toHaveAttribute("href", "/notificaciones");
  await page.getByRole("button", { name: "Ayuda y soporte rápido" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
});

test("pagina ofertas reales del fixture, ordena y filtra sin perder el detalle", async ({ page }, testInfo) => {
  const trips = [
    { traslado_id: "00000000-0000-4000-8000-000000000011", estado: "pendiente_de_conductor", origen_ciudad: "Ciudad de México", origen_direccion: "Plaza de la Constitución 1", destino_ciudad: "Toluca", destino_direccion: "Centro de Toluca", ganancia_conductor: 650, distancia_km: 60, creado_en: "2026-10-17T18:00:00Z", vehiculo_marca: "Toyota", vehiculo_modelo: "Corolla" },
    { traslado_id: "00000000-0000-4000-8000-000000000012", estado: "pendiente_de_conductor", origen_ciudad: "Puebla", origen_direccion: "Centro de Puebla", destino_ciudad: "Cuernavaca", destino_direccion: "Centro de Cuernavaca", ganancia_conductor: 900, distancia_km: 120, creado_en: "2026-10-17T19:00:00Z" },
  ];
  await page.route("**/rest/v1/pasaporte_digital*", (route) => route.fulfill({ headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "*" }, json: new URL(route.request().url()).searchParams.get("estado") === "eq.pendiente_de_conductor" ? trips : [] }));
  await page.setViewportSize({ width: 320, height: 568 });
  await openTrips(page, 2);
  await expect(page.getByRole("link", { name: "Ver oferta" })).toHaveAttribute("href", new RegExp(trips[0].traslado_id));
  const layout = await measureScreen(page);
  await page.screenshot({ path: testInfo.outputPath("ofertas.png") });
  expect(layout.overflow).toBeLessThanOrEqual(1);
  expect(layout.outside).toEqual([]);
  await page.getByRole("button", { name: "Siguiente", exact: true }).click();
  await expect(page.getByRole("link", { name: "Ver oferta" })).toHaveAttribute("href", new RegExp(trips[1].traslado_id));
  await page.getByRole("button", { name: "Abrir menú del conductor" }).click();
  await page.getByRole("button", { name: "Mayor ganancia", exact: true }).click();
  await page.getByRole("button", { name: "Cerrar menú" }).click();
  await expect(page.getByRole("link", { name: "Ver oferta" })).toHaveAttribute("href", new RegExp(trips[1].traslado_id));
  await page.getByRole("searchbox").fill("Plaza");
  await expect(page.getByRole("link", { name: "Ver oferta" })).toHaveAttribute("href", new RegExp(trips[0].traslado_id));
  await page.getByRole("button", { name: "Limpiar búsqueda" }).click();
  await expect(page.getByRole("searchbox")).toHaveValue("");
  await expect(page.getByText("2 ofertas disponibles", { exact: true })).toBeVisible();
});
