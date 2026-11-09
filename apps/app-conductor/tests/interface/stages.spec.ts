import { test, expect, type Locator, type Page } from "@playwright/test";
type RpcCall = { rpc: string; params: Record<string, unknown> };
const trip = (i: number) => `10000000-0000-4000-8000-${String(i).padStart(12, "0")}`;
test.beforeEach(async ({ page, context, request }) => {
  await request.get("http://127.0.0.1:54331/qa/reset");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => localStorage.setItem("CapacitorStorage.ruum_conductor_onboarding_visto", "1"));
  const id = "00000000-0000-4000-8000-000000000001";
  const token = `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ sub: id, role: "authenticated", aud: "authenticated", exp: 2100000000 })).toString("base64url")}.e2e-signature`;
  await context.addCookies([{ name: "sb-127-auth-token", value: `base64-${Buffer.from(JSON.stringify({ access_token: token, refresh_token: "e2e-refresh-only", expires_at: 2100000000, token_type: "bearer", user: { id, email: "conductor@example.test" } })).toString("base64url")}`, domain: "localhost", path: "/" }]);
});
async function hit(locator: Locator) {
  await expect(locator).toBeVisible();
  await expect.poll(() => locator.evaluate(node => { const r = node.getBoundingClientRect(); const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return r.top >= 0 && r.bottom <= innerHeight + 1 && r.left >= 0 && r.right <= innerWidth + 1 && !!hit && node.contains(hit); })).toBe(true);
}
async function noRootScroll(page: Page) {
  expect(await page.evaluate(() => { scrollTo(0, document.documentElement.scrollHeight); return { y: scrollY, overflow: document.documentElement.scrollWidth > innerWidth + 1 }; })).toEqual({ y: 0, overflow: false });
}
for (const width of [320, 390]) {
  test(`etapas uniformes y acción visible ${width}`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: width === 320 ? 568 : 844 });
    const errors: string[] = []; page.on("pageerror", e => errors.push(e.message));
    for (const i of [0, 1, 2, 3, 4, 5, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]) {
      await test.step(`estado ${i}`, async () => {
        await page.goto(`/viajes/${trip(i)}`);
        await expect(page.locator("[data-conductor-screen=operation]:visible")).toHaveCount(1);
        await hit(page.getByRole("heading", { level: 1 }));
        await hit(page.locator("[data-trip-primary]:visible").locator("button,a").last());
        await hit(page.locator('header[aria-label="Seguridad del traslado"]').getByRole("link", { name: "Volver a Traslados", exact: true }));
        const nav = page.getByRole("navigation", { name: "Navegación principal móvil", exact: true }); await hit(nav);
        expect(await page.locator("[data-screen-body]:visible").evaluate(n => n.scrollHeight - n.clientHeight)).toBeLessThanOrEqual(1);
        const controls = page.locator("[data-conductor-screen] button:visible, [data-conductor-screen] a:visible");
        for (const control of await controls.all()) { const r = await control.boundingBox(); expect(r!.height).toBeGreaterThanOrEqual(48); expect(r!.width).toBeGreaterThanOrEqual(48); }
        await noRootScroll(page);
        if ([1, 12, 14, 18].includes(i)) await page.screenshot({ path: info.outputPath(`estado-${i}-${width}.png`) });
      });
    }
    expect(errors.filter(e => /418|hydration|hydrating/i.test(e))).toEqual([]);
  });
  test(`datos completos, foco y texto ampliado ${width}`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: width === 320 ? 568 : 844 });
    await page.goto(`/viajes/${trip(24)}`);
    const trigger = page.getByRole("button", { name: "Ver dirección completa de recogida" });
    await trigger.click(); const dialog = page.getByRole("dialog", { name: "Dirección completa", exact: true });
    await expect(dialog).toContainText("FIN DIRECCIÓN"); await expect(dialog).toContainText("FIN REFERENCIAS");
    await hit(dialog.getByRole("button", { name: "Cerrar Dirección completa" }));
    await page.screenshot({ path: info.outputPath(`direccion-completa-${width}.png`) });
    await page.keyboard.press("Escape"); await expect(trigger).toBeFocused();
    await trigger.click(); await page.getByRole("dialog").getByRole("button", { name: "Abrir chat del traslado" }).click();
    await expect(page.getByRole("dialog", { name: "Mensajes del traslado", exact: true })).toContainText("Mensajes rápidos");
    await page.keyboard.press("Escape"); await expect(trigger).toBeFocused();
    await page.evaluate(() => { const items = [...document.querySelectorAll<HTMLElement>("[data-conductor-screen] h1,[data-conductor-screen] p,[data-conductor-screen] span,[data-conductor-screen] button,[data-conductor-screen] a")].map(n => ({ n, size: parseFloat(getComputedStyle(n).fontSize) })); items.forEach(({ n, size }) => n.style.fontSize = `${size * 2}px`); });
    await hit(page.locator("[data-trip-primary] button"));
    await page.locator("[data-screen-body]:visible").evaluate(n => n.scrollTop = n.scrollHeight);
    await hit(page.getByRole("button", { name: "Detalles y herramientas" }));
    await noRootScroll(page);
  });
}
test("recepción e inicio son dos decisiones y una RPC por pulsación", async ({ page, request }) => {
  await page.goto(`/viajes/${trip(13)}`);
  await page.getByRole("button", { name: "Confirmar recepción", exact: true }).click();
  await expect(page.getByRole("button", { name: "Iniciar traslado", exact: true })).toBeEnabled();
  let calls = await (await request.get("http://127.0.0.1:54331/qa/calls")).json();
  expect(calls.filter((c: RpcCall) => c.rpc === "conductor_avanza_traslado").map((c: RpcCall) => c.params.p_evento)).toEqual(["vehiculo_recibido"]);
  await page.getByRole("button", { name: "Iniciar traslado", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Conduce al destino" })).toBeVisible();
  calls = await (await request.get("http://127.0.0.1:54331/qa/calls")).json();
  expect(calls.filter((c: RpcCall) => c.rpc === "conductor_avanza_traslado").map((c: RpcCall) => c.params.p_evento)).toEqual(["vehiculo_recibido", "iniciar_traslado"]);
});
test("llegada no inicia registro final y conserva datos de geocerca", async ({ page, request, context }) => {
  await context.grantPermissions(["geolocation"]); await context.setGeolocation({ latitude: 19.4, longitude: -99.1, accuracy: 15 });
  await page.goto(`/viajes/${trip(4)}`);
  await expect(page.getByRole("heading", { name: "Conduce al destino", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Confirmar llegada a destino" }).click();
  await expect(page.getByRole("heading", { name: "Registra la entrega", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Continuar registro final" })).toBeEnabled();
  expect((await page.getByRole("button", { name: "Continuar registro final" }).boundingBox())!.height).toBeGreaterThanOrEqual(56);
  const calls = await (await request.get("http://127.0.0.1:54331/qa/calls")).json();
  expect(calls.filter((c: RpcCall) => c.rpc === "conductor_avanza_traslado")).toHaveLength(0);
  const arrival = calls.filter((c: RpcCall) => c.rpc === "conductor_confirmar_llegada_destino");
  expect(arrival).toHaveLength(1); expect(arrival[0].params).toMatchObject({ p_precision_m: 15, p_fuera_geocerca: false, p_motivo_sin_medicion: "destino_sin_coordenadas" });
});
test("llegada se corrige con el estado autoritativo del servidor", async ({ page, request, context }) => {
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ latitude: 19.4, longitude: -99.1 });
  await request.get("http://127.0.0.1:54331/qa/arrival-state?state=evidencia_final_completada");
  await page.goto(`/viajes/${trip(4)}`);
  await page.getByRole("button", { name: "Confirmar llegada a destino" }).click();
  await expect(page.getByRole("heading", { name: "Confirma la entrega", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Continuar registro final" })).toHaveCount(0);
});

test("cierre resumido y terminales sin acciones de avance", async ({ page }) => {
  await page.goto(`/viajes/${trip(5)}`);
  await page.getByRole("link", { name: "Revisar y finalizar" }).click();
  await expect(page).toHaveURL(/cierre=1/); await expect(page.locator("[data-trip-form]")).toHaveCount(1);
  for (const i of [18, 19, 20, 21, 22, 23]) {
    await page.goto(`/viajes/${trip(i)}?cierre=1`);
    await expect(page.getByRole("link", { name: "Volver a Traslados", exact: true })).toHaveCount(2);
    await expect(page.getByRole("button", { name: /Iniciar|Confirmar|Continuar|Finalizar/ })).toHaveCount(0);
    await page.getByRole("button", { name: "Ver detalle", exact: true }).click();
    await expect(page.getByRole("dialog")).toBeVisible(); await expect(page.getByRole("dialog").getByRole("link", { name: /Registrar gasto|Reportar/ })).toHaveCount(0);
  }
});
test("REPUVE conserva bloqueo, requisitos y datos faltantes", async ({ page, request }) => {
  await page.goto(`/viajes/${trip(12)}`); await page.getByRole("button", { name: "Abrir verificación", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Confirmar verificación", exact: true }).click();
  await expect(dialog.getByRole("alert")).toContainText("VIN físico");
  await dialog.getByLabel("VIN físico").fill("TEST0000000000001"); await dialog.getByLabel("Placas físicas").fill("QA-123");
  await dialog.getByRole("button", { name: "Confirmar verificación", exact: true }).click();
  await expect(dialog.getByRole("alert")).toContainText("Adjunta la captura");
  await dialog.getByRole("combobox").selectOption("con_reporte_robo");
  await expect(dialog.getByRole("button", { name: "Contactar soporte", exact: true })).toBeVisible();
  const calls = await (await request.get("http://127.0.0.1:54331/qa/calls")).json(); expect(calls.filter((c: RpcCall) => c.rpc === "conductor_avanza_traslado")).toHaveLength(0);
  await page.goto(`/viajes/${trip(25)}`);
  await expect(page.getByRole("button", { name: "Contactar soporte", exact: true })).toBeVisible(); await expect(page.getByRole("button", { name: "Navegar", exact: true })).toBeDisabled();
  await expect(page.locator("[data-screen-body]:visible")).toContainText("Vehículo por confirmar");
});
test("expediente con teclado y filtros completos conservan retorno", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto(`/viajes/${trip(1)}/detalles`);
  await hit(page.getByRole("link", { name: "Volver al traslado", exact: true }));
  await page.getByRole("tab", { name: "Ruta", exact: true }).focus(); await page.keyboard.press("End");
  await expect(page.getByRole("tab", { name: "Operación", exact: true })).toBeFocused(); await expect(page.getByRole("tabpanel")).toBeVisible();
  await page.locator("[data-screen-body]:visible").evaluate(n => n.scrollTop = n.scrollHeight); await hit(page.getByRole("link", { name: "Volver al traslado", exact: true }));
  await page.goto("/viajes"); await page.getByRole("button", { name: "Abrir filtros avanzados" }).click();
  const dialog = page.getByRole("dialog", { name: "Vista y filtros", exact: true }); await expect(dialog).toBeVisible();
  await dialog.getByLabel("Elegir fecha").fill("2030-01-01"); await hit(dialog.getByRole("button", { name: "Ver resultados" }));
  await dialog.getByRole("button", { name: "Ver resultados" }).click(); await expect(page).toHaveURL(/fecha=2030-01-01/);
  await page.getByRole("button", { name: "Ver todas las fechas", exact: true }).click(); await expect(page).not.toHaveURL(/fecha=/);
  await expect(page.getByRole("button", { name: "Recargar ofertas", exact: true })).toBeEnabled();
  await noRootScroll(page);
});
for (const width of [320, 390]) {
  test(`lista poblada, búsqueda, paginación y cierre pendiente ${width}`, async ({ page, request }, info) => {
    await request.get("http://127.0.0.1:54331/qa/list?mode=populated");
    await page.setViewportSize({ width, height: width === 320 ? 568 : 844 });
    await page.goto("/viajes"); await expect(page.locator("[data-offer-card]")).toHaveCount(1);
    await expect(page.getByRole("link", { name: /canal de emergencia directo/ })).toHaveCount(0);
    await hit(page.getByRole("button", { name: "Abrir emergencia", exact: true }));
    await hit(page.getByRole("link", { name: "Ver detalles de la oferta" }));
    expect(await page.locator("[data-screen-body]:visible").evaluate(n => n.scrollHeight - n.clientHeight)).toBeLessThanOrEqual(1);
    await page.getByRole("button", { name: "Siguiente", exact: true }).click();
    await expect(page.getByRole("group", { name: "Paginación de traslados" })).toContainText("2 de 3");
    const search = page.getByRole("searchbox"); await search.fill("no existe");
    await expect(page.getByRole("heading", { name: "Sin resultados con estos filtros" })).toBeVisible();
    await page.getByRole("button", { name: "Limpiar filtros", exact: true }).click(); await expect(page.locator("[data-offer-card]")).toHaveCount(1);
    await page.getByRole("button", { name: "Aceptados (3)", exact: true }).click();
    await expect(page.locator("[data-accepted-card]")).toContainText("CIERRE PENDIENTE");
    await hit(page.getByRole("link", { name: "Continuar traslado" }));
    await noRootScroll(page); await page.screenshot({ path: info.outputPath(`lista-${width}.png`) });
    await page.getByRole("button", { name: "Abrir filtros avanzados" }).click();
    const filters = page.getByRole("dialog", { name: "Vista y filtros", exact: true });
    await filters.getByRole("button", { name: "Mapa", exact: true }).click(); await filters.getByRole("button", { name: "Ver resultados" }).click();
    await expect(page.getByText("Mapa no disponible. Puedes revisar los traslados en la lista.", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Volver a lista", exact: true }).click(); await expect(page.locator("[data-offer-map]")).toHaveCount(0);
    await noRootScroll(page);
  });
}
test("fallo de red mantiene contexto, muestra motivo y permite reintentar", async ({ page }) => {
  await page.goto(`/viajes/${trip(1)}`);
  await page.route("**/rest/v1/rpc/conductor_avanza_traslado", route => route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ message: "Servicio temporalmente no disponible" }) }));
  await page.getByRole("button", { name: "Iniciar ruta", exact: true }).click();
  await expect(page.locator("[data-trip-primary]").getByRole("alert")).toBeVisible(); await expect(page.getByRole("button", { name: "Iniciar ruta", exact: true })).toBeEnabled();
  await page.unroute("**/rest/v1/rpc/conductor_avanza_traslado");
  await page.getByRole("button", { name: "Iniciar ruta", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Ve al punto de recogida" })).toBeVisible();
});
test("seguridad y navegación se abren sin perder el paso", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 }); await page.goto(`/viajes/${trip(1)}`);
  await page.getByRole("button", { name: "Navegar", exact: true }).click();
  const navigation = page.getByRole("dialog", { name: "Elegir navegación", exact: true });
  await expect(navigation.getByRole("link", { name: "Abrir en Google Maps" })).toHaveAttribute("href", /destination=Avenida%20Reforma/);
  await page.keyboard.press("Escape");
  const trigger = page.getByRole("button", { name: "Abrir emergencia", exact: true }); await trigger.click();
  const emergency = page.getByRole("dialog", { name: "¿Qué necesitas?", exact: true }); await expect(emergency).toBeVisible();
  await hit(emergency.getByRole("button", { name: "Cerrar", exact: true }));
  expect(await emergency.evaluate(n => n.scrollWidth - n.clientWidth)).toBeLessThanOrEqual(1);
  const action = emergency.getByRole("button", { name: /Avisar que el traslado requiere/ });
  await action.scrollIntoViewIfNeeded(); const r = await action.boundingBox(); expect(r!.width).toBeGreaterThan(200); expect(r!.height).toBeGreaterThanOrEqual(48);
  await emergency.getByRole("button", { name: "Cerrar", exact: true }).click(); await expect(trigger).toBeFocused();
  await hit(page.getByRole("button", { name: "Iniciar ruta", exact: true }));
});
test("oferta minimal: ruta como protagonista, ganancia oficial y rechazo con 6 motivos >= 56px", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/viajes/${trip(0)}`);
  await expect(page.locator("[data-conductor-screen=operation]:visible")).toHaveCount(1);
  await expect(page.locator("[data-screen-body]:visible")).toContainText("Ganancia:");
  const primaryBtn = page.locator("[data-trip-primary]:visible").locator("button,a").last();
  await hit(primaryBtn);
  const primaryBox = await primaryBtn.boundingBox();
  expect(primaryBox!.height).toBeGreaterThanOrEqual(56);

  const rejectBtn = page.getByRole("button", { name: "Rechazar oferta" });
  await hit(rejectBtn);
  const rejectBox = await rejectBtn.boundingBox();
  expect(rejectBox!.height).toBeGreaterThanOrEqual(48);
  expect(rejectBox!.width).toBeGreaterThanOrEqual(48);

  await rejectBtn.click();
  const dialog = page.getByRole("dialog", { name: "Motivo de rechazo" });
  await expect(dialog).toBeVisible();
  const reasonBtns = dialog.locator('[class*="rejectOption"]');
  await expect(reasonBtns).toHaveCount(6);
  for (const btn of await reasonBtns.all()) {
    const box = await btn.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(56);
  }
});
test("en curso minimal: direccion como protagonista, boton confirmar llegada >= 56px y sin scroll de pagina", async ({ page }) => {
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: width === 320 ? 568 : 844 });
    await page.goto(`/viajes/${trip(4)}`);
    await expect(page.locator("[data-conductor-screen=operation]:visible")).toHaveCount(1);
    await expect(page.getByRole("heading", { name: "Conduce al destino" })).toBeVisible();

    const primaryBtn = page.getByRole("button", { name: "Confirmar llegada a destino" });
    await hit(primaryBtn);
    const box = await primaryBtn.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(56);

    const tools = page.locator('[class*="tools"] button:visible');
    for (const tool of await tools.all()) {
      const toolBox = await tool.boundingBox();
      expect(toolBox!.height).toBeGreaterThanOrEqual(48);
      expect(toolBox!.width).toBeGreaterThanOrEqual(48);
    }

    expect(await page.locator("[data-screen-body]:visible").evaluate(n => n.scrollHeight - n.clientHeight)).toBeLessThanOrEqual(1);
    await noRootScroll(page);
  }
});
