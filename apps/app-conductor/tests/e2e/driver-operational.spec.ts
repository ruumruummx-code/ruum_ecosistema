import { expect, test, type Locator, type Page } from "@playwright/test";
import { writeFile } from "node:fs/promises";

const trip = (index: number) => `10000000-0000-4000-8000-${String(index).padStart(12, "0")}`;
test.skip(process.env.PLAYWRIGHT_TRASLADOS_FIXTURE !== "1", "Requiere el API operativo local.");
test.beforeEach(async ({ context, page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  const id = "00000000-0000-4000-8000-000000000001";
  const token = `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ sub: id, role: "authenticated", aud: "authenticated", exp: 2100000000 })).toString("base64url")}.e2e-signature`;
  await context.addCookies([{ name: "sb-127-auth-token", value: `base64-${Buffer.from(JSON.stringify({ access_token: token, refresh_token: "e2e-refresh-only", expires_at: 2100000000, token_type: "bearer", user: { id, email: "conductor@example.test" } })).toString("base64url")}`, domain: "localhost", path: "/" }]);
});

async function reachable(element: Locator, bottom = 568) {
  await expect(element).toBeVisible();
  await expect.poll(() => element.evaluate((node, limit) => {
    const rect = node.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
    return rect.top >= 0 && rect.bottom <= limit && !!hit && node.contains(hit);
  }, bottom)).toBe(true);
}
async function rootRemainsStill(page: Page) {
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  expect(await page.evaluate(() => ({ y: scrollY, x: document.documentElement.scrollWidth > innerWidth }))).toEqual({ y: 0, x: false });
  expect(await page.evaluate(() => getComputedStyle(document.body).overflowY)).toBe("hidden");
}
async function keyboard(page: Page, height: number) {
  await page.evaluate(value => {
    const viewport = window.visualViewport!;
    Object.defineProperty(viewport, "height", { configurable: true, value });
    viewport.dispatchEvent(new Event("resize"));
  }, height);
}

for (const [index, action] of [[0, "ACEPTAR TRASLADO"], [1, "ESTOY EN CAMINO AL ORIGEN"], [2, "HE LLEGADO AL ORIGEN"], [3, "CONTINUAR INSPECCIÓN"], [4, "HE LLEGADO AL DESTINO"], [5, "FINALIZAR Y ENTREGAR VEHÍCULO"]] as const) {
  test(`estado ${index}: acción, soporte y emergencia accesibles sin scroll raíz`, async ({ page }, info) => {
    await page.goto(`/viajes/${trip(index)}`);
    const primary = page.locator("[data-trip-primary]");
    const button = primary.getByRole("button", { name: action });
    await reachable(button);
    await expect(primary.getByRole("status")).not.toBeEmpty();
    await page.locator("[data-trip-scroll]").evaluate(node => { node.scrollTop = node.scrollHeight; });
    await reachable(button);
    await reachable(page.getByRole("button", { name: "Abrir emergencia", exact: true }));
    await page.getByRole("button", { name: "Soporte", exact: true }).click();
    const support = page.getByRole("dialog", { name: "Soporte del traslado", exact: true });
    await reachable(support.getByRole("link", { name: "WhatsApp de soporte" }));
    await page.screenshot({ path: info.outputPath("soporte.png") });
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Soporte", exact: true })).toBeFocused();
    await page.getByRole("button", { name: "Abrir emergencia", exact: true }).click();
    const emergency = page.getByRole("dialog", { name: "¿Qué necesitas?", exact: true });
    await reachable(emergency.getByRole("button", { name: /^911/ }));
    expect(await emergency.getByRole("button", { name: /^911/ }).evaluate(button => {
      const description = button.lastElementChild!.getBoundingClientRect();
      return description.bottom <= button.getBoundingClientRect().bottom;
    })).toBe(true);
    await page.screenshot({ path: info.outputPath("emergencia.png") });
    await page.keyboard.press("Escape");
    await reachable(button);
    await rootRemainsStill(page);
    await page.screenshot({ path: info.outputPath("estado.png") });
    if (index === 5) {
      await button.click();
      const confirmation = page.getByRole("dialog", { name: "Confirmar entrega", exact: true });
      await reachable(confirmation.getByRole("button", { name: "SÍ, ENTREGAR", exact: true }));
      await page.keyboard.press("Escape");
    }
  });
}

// Regresión: la información extensa no debe desplazar ni tapar la acción.
for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }]) {
  for (const [index, action] of [[1, "ESTOY EN CAMINO AL ORIGEN"], [4, "HE LLEGADO AL DESTINO"], [5, "FINALIZAR Y ENTREGAR VEHÍCULO"]] as const) {
    test(`acción persistente ${index} a ${viewport.width}x${viewport.height}: contenido largo y clic`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto(`/viajes/${trip(index)}`);
      const body = page.getByRole("region", {
        name: index === 1 ? "Información del traslado asignado" : index === 4 ? "Información del traslado en curso" : "Información del cierre de traslado",
        exact: true,
      });
      const button = page.locator("[data-trip-primary]").getByRole("button", { name: action });
      await reachable(button, viewport.height);
      await expect(button).toBeInViewport({ ratio: 1 });

      // Simula referencias extensas sin cambiar datos ni lógica del servicio.
      await body.evaluate(node => {
        const extra = document.createElement("p");
        extra.textContent = "Referencias adicionales del traslado. ".repeat(150);
        node.append(extra);
      });
      expect(await body.evaluate(node => node.scrollHeight > node.clientHeight)).toBe(true);
      await body.focus();
      await page.keyboard.press("End");
      await expect.poll(() => body.evaluate(node => node.scrollTop)).toBeGreaterThan(0);
      await reachable(button, viewport.height);
      await expect(button).toBeInViewport({ ratio: 1 });
      await button.click({ trial: true });
      await reachable(page.getByRole("button", { name: "Soporte", exact: true }), viewport.height);
      await reachable(page.getByRole("button", { name: "Abrir emergencia", exact: true }), viewport.height);
      await rootRemainsStill(page);

      if (index === 5) {
        await button.click();
        const dialog = page.getByRole("dialog", { name: "Confirmar entrega", exact: true });
        await reachable(dialog.getByRole("button", { name: "SÍ, ENTREGAR", exact: true }), viewport.height);
        await page.keyboard.press("Escape");
        await expect(button).toBeFocused();
      } else {
        const rpc = index === 1 ? "conductor_avanza_traslado" : "conductor_confirmar_llegada_destino";
        // Un error del servidor también debe dejar el botón disponible para reintentar.
        await page.route(`**/rest/v1/rpc/${rpc}`, route => route.fulfill({
          status: 500, contentType: "application/json", body: JSON.stringify({ message: "Error de prueba recuperable" }),
        }));
        const request = page.waitForRequest(req => req.url().endsWith(`/rpc/${rpc}`) && req.method() === "POST");
        await button.click();
        expect((await request).postDataJSON()).toMatchObject({ p_traslado_id: trip(index) });
        await expect(page.locator("[data-trip-primary]").getByRole("alert")).toBeVisible();
        await expect(button).toBeEnabled();
        await reachable(button, viewport.height);
      }
    });
  }
}

test("carga y error conservan salida, emergencia y reintento", async ({ page }, info) => {
  await page.goto(`/viajes/${trip(7)}`, { waitUntil: "commit" });
  await expect(page.getByLabel("Cargando traslado", { exact: true })).toBeVisible();
  await reachable(page.getByRole("button", { name: "Abrir emergencia", exact: true }));
  try {
    // La respuesta SSR sigue abierta: document.fonts.ready no termina todavía.
    const capture = await page.context().newCDPSession(page);
    try {
      const { data } = await capture.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- Playwright resuelve esta ruta dentro del directorio de resultados del caso.
      await writeFile(info.outputPath("carga.png"), Buffer.from(data, "base64"));
    } finally { await capture.detach(); }
  } finally { await page.request.post("http://127.0.0.1:54329/qa/release-loading"); }
  await expect(page.locator("[data-trip-primary]")).toBeVisible();
  await page.goto(`/viajes/${trip(8)}`);
  await expect(page.getByRole("heading", { name: "Error al cargar este viaje" })).toBeVisible();
  await reachable(page.getByRole("button", { name: "Reintentar", exact: true }));
  await reachable(page.getByRole("button", { name: "Abrir emergencia", exact: true }));
  await rootRemainsStill(page);
  await page.screenshot({ path: info.outputPath("error.png") });
});

test("evidencias: siguiente requisito, teclado y retorno de soporte", async ({ page }, info) => {
  await page.goto(`/viajes/${trip(3)}/evidencia`);
  await expect(page.getByRole("heading", { name: "Checklist de Origen" })).toBeVisible();
  const next = page.getByRole("button", { name: "Siguiente requisito", exact: false });
  await reachable(next);
  await next.click();
  await expect(page.getByRole("region", { name: "Llaves del vehículo", exact: true })).toBeVisible();
  const steps = page.getByRole("navigation", { name: "Pasos de evidencia", exact: true });
  await steps.getByRole("link", { name: /^KM:/ }).click();
  const km = page.getByRole("textbox", { name: "Kilometraje actual", exact: true });
  await km.fill("12345");
  await keyboard(page, 320);
  await reachable(km, 320);
  await reachable(next, 320);
  await reachable(page.getByRole("button", { name: "Abrir emergencia", exact: true }), 320);
  await rootRemainsStill(page);
  await page.screenshot({ path: info.outputPath("evidencia-teclado.png"), clip: { x: 0, y: 0, width: 320, height: 320 } });
  await keyboard(page, 284);
  await reachable(next, 284);
  await reachable(page.getByRole("button", { name: "Abrir emergencia", exact: true }), 284);
  await keyboard(page, 568);
  await page.getByRole("button", { name: "Soporte", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(km).toHaveValue("12345");
  await reachable(next);
  await page.screenshot({ path: info.outputPath("evidencia.png") });
});

test("gastos y reporte conservan el siguiente paso sobre el teclado", async ({ page }, info) => {
  await page.goto(`/viajes/${trip(1)}`);
  await page.getByRole("button", { name: "Gastos", exact: true }).click();
  const expenses = page.getByRole("dialog", { name: "Gastos del traslado", exact: true });
  await expenses.getByLabel("Monto (MXN)", { exact: false }).fill("250");
  await keyboard(page, 320);
  await reachable(expenses.getByRole("button", { name: "+ Registrar gasto", exact: true }), 320);
  await page.screenshot({ path: info.outputPath("gastos-teclado.png"), clip: { x: 0, y: 0, width: 320, height: 320 } });
  await keyboard(page, 568);
  await page.keyboard.press("Escape");
  await page.goto(`/viajes/${trip(1)}/soporte`);
  await page.getByRole("button", { name: "Abrir reporte", exact: true }).click();
  const report = page.getByRole("dialog", { name: "¿Qué está ocurriendo?", exact: true });
  await report.getByRole("button", { name: /^No encuentro al contacto/ }).click();
  await report.getByRole("textbox").fill("Llamé dos veces y estoy en la entrada principal.");
  await keyboard(page, 320);
  await reachable(report.getByRole("button", { name: "Enviar reporte", exact: true }), 320);
  await page.screenshot({ path: info.outputPath("reporte-teclado.png"), clip: { x: 0, y: 0, width: 320, height: 320 } });
  await keyboard(page, 568);
  await page.keyboard.press("Escape");
  await reachable(page.locator("[data-trip-primary]").getByRole("link", { name: "Volver al traslado", exact: true }));
  await rootRemainsStill(page);
});

test("detalles mantiene los paneles y el retorno operativo accesibles", async ({ page }, info) => {
  await page.goto(`/viajes/${trip(1)}/detalles`);
  await page.getByRole("button", { name: "Vehículo", exact: true }).click();
  await expect(page.getByText("TEST0000000000001", { exact: true })).toBeVisible();
  await page.locator("[data-trip-scroll]").evaluate(node => { node.scrollTop = node.scrollHeight; });
  await reachable(page.getByRole("button", { name: "Abrir emergencia", exact: true }));
  const back = page.locator("[data-trip-safety-bar]").getByRole("link", { name: "Volver al traslado", exact: true });
  await reachable(back);
  await rootRemainsStill(page);
  await page.screenshot({ path: info.outputPath("detalles.png") });
  await back.click();
  await reachable(page.locator("[data-trip-primary]").getByRole("button", { name: "ESTOY EN CAMINO AL ORIGEN" }));
});

test("error al cargar evidencias mantiene reintento y ayuda inmediatos", async ({ page }, info) => {
  await page.goto(`/viajes/${trip(8)}/evidencia`);
  await expect(page.getByRole("heading", { name: "No pudimos cargar las evidencias", exact: true })).toBeVisible();
  await reachable(page.getByRole("button", { name: "Reintentar", exact: true }));
  await reachable(page.getByRole("button", { name: "Abrir emergencia", exact: true }));
  await rootRemainsStill(page);
  await page.screenshot({ path: info.outputPath("error-evidencia.png") });
});

for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }]) {
  test(`evidencia origen: Siguiente avanza Fotos, Llaves y Formulario en ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto(`/viajes/${trip(3)}/evidencia`);
    const siguiente = page.getByRole("region", { name: "Acciones de evidencia" }).getByRole("button", { name: /Siguiente/ });
    await expect(page.getByRole("region", { name: "Fotos del vehículo", exact: true })).toBeVisible({ timeout: 30_000 });
    await siguiente.click();
    await expect(page.getByRole("region", { name: "Llaves del vehículo", exact: true })).toBeVisible();
    await siguiente.click();
    await expect(page.getByRole("region", { name: "Formulario de inspección", exact: true })).toBeVisible();
  });
}
