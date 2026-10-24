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
  await expect(page.locator("[data-driver-traslados] [role=tabpanel]")).toHaveAttribute("aria-busy", "false", { timeout: 180_000 });
  await expect(page.getByRole("tab", { name: `Ofertas (${offers})`, exact: true })).toBeVisible();
  await expect(page.getByText("Información de los traslados", { exact: true })).toHaveCount(0);
  await page.locator("nextjs-portal").evaluateAll((nodes) => nodes.forEach((node) => (node as HTMLElement).style.setProperty("display", "none", "important")));
}

for (const size of [{ width: 320, height: 568 }, { width: 375, height: 667 }, { width: 390, height: 844 }, { width: 375, height: 500 }, { width: 667, height: 375 }]) {
  test(`aceptado con diseño de oferta sin scroll en ${size.width}×${size.height}`, async ({ page }, info) => {
    const trip = {
      traslado_id: "acbb6c27-0000-4000-8000-000000000011", estado: "conductor_asignado",
      conductor_id: "00000000-0000-4000-8000-000000000002",
      origen_ciudad: "Ciudad de México", origen_direccion: "LONDRES 899, Juárez, 06600, Ciudad de México",
      destino_ciudad: "Metepec", destino_direccion: "LOS SERRANOS 225, Uno Residencial, 52104, Metepec, Méx.",
      ganancia_conductor: 531.45, distancia_km: 51, tiempo_estimado_horas: 70 / 60,
      creado_en: "2026-10-17T21:12:00Z", vehiculo_marca: "Chrysler", vehiculo_modelo: "Stratus", vehiculo_anio: 2015, tipo_pago: "al_cierre",
    };
    await page.route("**/rest/v1/pasaporte_digital*", route => {
      const query = new URL(route.request().url()).searchParams;
      return route.fulfill({ headers: { "access-control-allow-origin": "*" }, json: query.get("estado") === "eq.pendiente_de_conductor" || !query.has("conductor_id") ? [] : [trip, { ...trip, traslado_id: "acbb6c28-0000-4000-8000-000000000012" }] });
    });
    await page.route("**/rest/v1/traslados?*", route => route.fulfill({ headers: { "access-control-allow-origin": "*" }, json: [trip.traslado_id, "acbb6c28-0000-4000-8000-000000000012"].map(id => ({ ...trip, id, fecha_hora_programada: trip.creado_en })) }));
    await page.setViewportSize(size);
    await openTrips(page);
    await page.getByRole("tab", { name: "Aceptados (2)", exact: true }).click();
    const card = page.locator("[data-accepted-card]");
    await expect(card).toContainText("PENDIENTE DE INICIO");
    await expect(card).toContainText("$531.45");
    await expect(card).toContainText("Chrysler Stratus 2015");
    await expect(card).toContainText("Aprox. 1 h 10 min");
    await expect(card.locator("[data-offer-map]")).toBeVisible();
    await expect(card.locator("[data-offer-badges]")).toBeVisible();
    const cta = card.getByRole("link", { name: "INICIAR TRASLADO" });
    await expect(cta).toHaveAttribute("href", new RegExp(trip.traslado_id));
    const layout = await page.evaluate(() => {
      const nav = document.querySelector("[data-conductor-mobile-nav]")!.getBoundingClientRect();
      return {
        root: document.documentElement.scrollHeight - innerHeight,
        overflow: ["[data-driver-traslados]", "[role=tabpanel]", "[role=tabpanel] > div", "[data-accepted-card]"].map(selector => { const e=document.querySelector(selector)!; return e.scrollHeight-e.clientHeight; }),
        actions: Array.from(document.querySelectorAll("[data-accepted-card] a, [data-accepted-card] button, [aria-label='Paginación de traslados'] button")).every(e => { const r=e.getBoundingClientRect(); const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2); return r.top>=0 && r.bottom<=nav.top+1 && !!hit && e.contains(hit); }),
      };
    });
    await page.screenshot({ path: info.outputPath("aceptado-redisenado.png") });
    expect(layout.root).toBeLessThanOrEqual(1);
    expect(layout.overflow.every(value => value<=1), JSON.stringify(layout)).toBe(true);
    expect(layout.actions).toBe(true);
    await page.getByRole("button", { name: "Siguiente", exact: true }).click();
    await expect(cta).toHaveAttribute("href", /acbb6c28/);
    await card.getByRole("button", { name: "Opciones de traslado" }).click();
    await expect(page.getByRole("dialog", { name: "Motivo de rechazo" })).toBeVisible();
  });
}

async function measureScreen(page: Page) {
  return page.locator("[data-driver-traslados]").evaluate((screen) => ({
    width: screen.getBoundingClientRect().width,
    overflow: screen.scrollHeight - screen.clientHeight,
    horizontalOverflow: document.documentElement.scrollWidth - window.innerWidth,
    outside: [...screen.querySelectorAll("button, a, input, h1, h2, p")].filter((element) => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && (rect.left < -1 || rect.right > window.innerWidth + 1);
    }).map((element) => element.getAttribute("aria-label") || element.textContent || element.tagName),
  }));
}

for (const size of [{ width: 320, height: 568 }, { width: 375, height: 667 }, { width: 390, height: 844 }, { width: 375, height: 340 }, { width: 1280, height: 960 }]) {
  test(`Traslados completo en el flujo del shell en ${size.width}×${size.height}`, async ({ page }, testInfo) => {
    await page.setViewportSize(size);
    await openTrips(page);
    await expect(page.getByRole("heading", { name: "Sin traslados para este día" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: /^Navegación principal(?: móvil)?$/, exact: true }).filter({ visible: true }).getByRole("link")).toHaveCount(3);
    const layout = await measureScreen(page);
    await page.screenshot({ path: testInfo.outputPath("traslados.png") });
    expect(layout.width).toBeLessThanOrEqual(440);
    expect(layout.overflow).toBeLessThanOrEqual(1);
    expect(layout.horizontalOverflow).toBeLessThanOrEqual(1);
    expect(layout.outside).toEqual([]);
  });
}

test("alterna pestañas, selecciona fechas y navega entre semanas", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await openTrips(page);
  const today = page.getByRole("group", { name: "Días de la semana" }).getByRole("button", { name: /sábado.*17/ });
  await expect(today).toHaveAttribute("aria-pressed", "true");
  await expect(today).toHaveAttribute("aria-current", "date");
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
  await expect(page.getByRole("link", { name: "Ver detalles de la oferta" })).toHaveAttribute("href", new RegExp(trips[0].traslado_id));
  const layout = await measureScreen(page);
  await page.screenshot({ path: testInfo.outputPath("ofertas.png") });
  expect(layout.overflow).toBeLessThanOrEqual(1);
  expect(layout.outside).toEqual([]);
  await page.getByRole("button", { name: "Siguiente", exact: true }).click();
  await expect(page.getByRole("link", { name: "Ver detalles de la oferta" })).toHaveAttribute("href", new RegExp(trips[1].traslado_id));
  await page.getByRole("button", { name: "Abrir menú del conductor" }).click();
  await page.getByRole("button", { name: "Mayor ganancia", exact: true }).click();
  await page.getByRole("button", { name: "Cerrar menú" }).click();
  await expect(page.getByRole("link", { name: "Ver detalles de la oferta" })).toHaveAttribute("href", new RegExp(trips[1].traslado_id));
  await page.getByRole("searchbox").fill("Plaza");
  await expect(page.getByRole("link", { name: "Ver detalles de la oferta" })).toHaveAttribute("href", new RegExp(trips[0].traslado_id));
  await page.getByRole("button", { name: "Limpiar búsqueda" }).click();
  await expect(page.getByRole("searchbox")).toHaveValue("");
  await expect(page.getByRole("tab", { name: "Ofertas (2)", exact: true })).toBeVisible();
});

for (const size of [{ width: 320, height: 568 }, { width: 375, height: 667 }, { width: 390, height: 844 }, { width: 375, height: 500 }, { width: 667, height: 375 }]) {
  test(`oferta rediseñada sin scroll en ${size.width}×${size.height}`, async ({ page }, info) => {
    const offer = {
      traslado_id: "cdbb6c27-0000-4000-8000-000000000011", estado: "pendiente_de_conductor",
      origen_ciudad: "Ciudad de México", origen_direccion: "LONDRES 899, Juárez, 06600, Ciudad de México",
      destino_ciudad: "Metepec", destino_direccion: "LOS SERRANOS 225, Uno Residencial, 52104, Metepec, Méx.",
      ganancia_conductor: 531.45, distancia_km: 51, tiempo_estimado_horas: 70 / 60,
      creado_en: "2026-10-17T21:12:00Z", vehiculo_marca: "Chrysler", vehiculo_modelo: "Stratus", vehiculo_anio: 2015, tipo_pago: "al_cierre",
    };
    await page.route("**/rest/v1/pasaporte_digital*", route => route.fulfill({ headers: { "access-control-allow-origin": "*" }, json: new URL(route.request().url()).searchParams.get("estado") === "eq.pendiente_de_conductor" ? [offer, { ...offer, traslado_id: "dabb6c28-0000-4000-8000-000000000012" }] : [] }));
    await page.route("**/rest/v1/traslados?*", route => route.fulfill({ headers: { "access-control-allow-origin": "*" }, json: [offer.traslado_id, "dabb6c28-0000-4000-8000-000000000012"].map(id => ({ ...offer, id, fecha_hora_programada: offer.creado_en })) }));
    await page.setViewportSize(size);
    await openTrips(page, 2);
    const card = page.locator("[data-offer-card]");
    await expect(card).toContainText("$531.45");
    await expect(card).toContainText("Chrysler Stratus 2015");
    await expect(card.locator("time")).toHaveText(/03:12/);
    await expect(card).toContainText("Aprox. 1 h 10 min");
    await expect(card).toContainText("Peaje: por confirmar");
    const cta = card.getByRole("link", { name: "Ver detalles de la oferta" });
    await expect(cta).toHaveAttribute("href", new RegExp(offer.traslado_id));
    const layout = await page.evaluate(() => {
      const nav = document.querySelector("[data-conductor-mobile-nav]")!.getBoundingClientRect();
      const selectors = ["[data-driver-traslados]", "[data-driver-traslados] > div", "[role=tabpanel]", "[role=tabpanel] > div", "[data-offer-card]"];
      return {
        root: document.documentElement.scrollHeight - innerHeight,
        overflow: selectors.map(selector => { const e = document.querySelector(selector)!; return e.scrollHeight - e.clientHeight; }),
        controls: Array.from(document.querySelectorAll("[data-offer-card] > a, [aria-label='Paginación de traslados'] button")).every(e => { const r=e.getBoundingClientRect(); const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2); return r.top >= 0 && r.bottom <= nav.top + 1 && !!hit && e.contains(hit); }),
      };
    });
    await page.screenshot({ path: info.outputPath("oferta-redisenada.png") });
    expect(layout.root).toBeLessThanOrEqual(1);
    expect(layout.overflow.every(value => value <= 1), JSON.stringify(layout)).toBe(true);
    expect(layout.controls).toBe(true);
    await page.getByRole("button", { name: "Siguiente", exact: true }).click();
    await expect(cta).toHaveAttribute("href", /dabb6c28/);
    await page.getByRole("button", { name: "Abrir filtros avanzados" }).click();
    await expect(page.getByRole("dialog", { name: "Menú del conductor" })).toBeVisible();
  });
}
