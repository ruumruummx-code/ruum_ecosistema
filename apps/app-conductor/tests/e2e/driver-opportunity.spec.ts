import { expect, test, type Page } from "@playwright/test";

const trip = (index = 10) => `10000000-0000-4000-8000-${String(index).padStart(12, "0")}`;
const returnTo = "/viajes?vista=disponibles&fecha=2026-10-24&q=Toluca";
const url = `/viajes/${trip()}?volver=${encodeURIComponent(returnTo)}`;

test.beforeEach(async ({ context }) => {
  const id = "00000000-0000-4000-8000-000000000001";
  const token = `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ sub: id, role: "authenticated", aud: "authenticated", exp: 2100000000 })).toString("base64url")}.e2e-signature`;
  await context.addCookies([{ name: "sb-127-auth-token", value: `base64-${Buffer.from(JSON.stringify({ access_token: token, refresh_token: "e2e-refresh-only", expires_at: 2100000000, token_type: "bearer", user: { id, email: "conductor@example.test" } })).toString("base64url")}`, domain: "localhost", path: "/" }]);
});

async function openOffer(page: Page) {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await expect(page.locator("[data-opportunity-detail]")).toBeVisible();
  await expect(page.getByRole("button", { name: "ACEPTAR TRASLADO", exact: true })).toBeVisible();
  await expect(page.locator("[data-conductor-mobile-nav]")).toBeHidden();
}

for (const size of [{ width: 320, height: 568 }, { width: 375, height: 667 }, { width: 390, height: 844 }, { width: 375, height: 500 }, { width: 667, height: 375 }]) {
  test(`detalle de oferta sin scroll y acciones visibles en ${size.width}×${size.height}`, async ({ page }, info) => {
    await page.setViewportSize(size);
    await openOffer(page);
    await expect(page.locator("[data-opportunity-detail]")).toContainText("$531.45");
    await expect(page.locator("[data-opportunity-detail]")).toContainText("Chrysler Stratus 2015");
    await expect(page.locator("[data-opportunity-detail]")).toContainText("Aprox. 1 h 10 min");
    await expect(page.getByRole("link", { name: "Volver a Traslados", exact: true })).toHaveAttribute("href", returnTo);
    const layout = await page.evaluate(() => {
      const screen = document.querySelector("[data-opportunity-detail]")!;
      const secondary = ["Rechazar", "Mensajes"].map(text => Array.from(document.querySelectorAll("[data-trip-primary] button")).find(b => b.textContent?.trim() === text)!.getBoundingClientRect());
      return {
        root: document.documentElement.scrollHeight - innerHeight,
        overflow: ["[data-trip-frame]", "[data-trip-scroll]", "[data-opportunity-detail]"].map(selector => { const el=document.querySelector(selector)!; return el.scrollHeight-el.clientHeight; }),
        map: document.querySelector("[data-opportunity-map]")!.getBoundingClientRect().height,
        addresses: Array.from(screen.querySelectorAll("dd")).every(e => { const r=e.getBoundingClientRect(); return r.top>=0 && r.bottom<=innerHeight && e.scrollHeight<=e.clientHeight+1; }),
        controls: Array.from(document.querySelectorAll("[data-trip-primary] button, [data-trip-safety-bar] button, [data-trip-safety-bar] > a")).every(e => { const r=e.getBoundingClientRect(); if (!r.height) return true; const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2); return r.top>=0 && r.bottom<=innerHeight && !!hit && e.contains(hit); }),
        row: Math.abs(secondary[0].top-secondary[1].top),
        widths: Math.abs(secondary[0].width-secondary[1].width),
      };
    });
    await page.screenshot({ path: info.outputPath("detalle-oferta.png") });
    expect(layout.root).toBeLessThanOrEqual(1);
    expect(layout.overflow.every(value => value<=1), JSON.stringify(layout)).toBe(true);
    expect(layout.map).toBeGreaterThan(0);
    expect(layout.map).toBeLessThanOrEqual(150);
    expect(layout.addresses).toBe(true);
    expect(layout.controls).toBe(true);
    expect(layout.row).toBeLessThanOrEqual(1);
    expect(layout.widths).toBeLessThanOrEqual(1);
    await page.getByRole("button", { name: "Mensajes", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "Mensajes del traslado" })).toContainText("El chat se habilita cuando se asigna");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Mensajes", exact: true })).toBeFocused();
  });
}

test("soporte, emergencia, metadatos y retorno conservan su funcionamiento", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await openOffer(page);
  await page.getByRole("button", { name: "Soporte", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Soporte del traslado", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Abrir emergencia", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "¿Qué necesitas?", exact: true }).getByRole("button", { name: /^911/ })).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: /^Ver información de Chrysler/ }).click();
  await expect(page.getByRole("dialog", { name: "Vehículo y referencias" })).toContainText("QA-123");
  await page.keyboard.press("Escape");
  await page.getByRole("link", { name: "Volver a Traslados", exact: true }).click();
  await expect(page).toHaveURL(new RegExp("/viajes\\?vista=disponibles&fecha=2026-10-24&q=Toluca$"));
  await expect(page.locator("[data-conductor-mobile-nav]")).toBeVisible();
  await page.goto(`/viajes/${trip(1)}`);
  await expect(page.locator("[data-opportunity-detail]")).toHaveCount(0);
  await expect(page.locator("[data-conductor-mobile-nav]")).toBeVisible();
});

test("aceptar registra la solicitud una vez y mantiene el resultado visible", async ({ page }) => {
  let requests = 0;
  await page.route("**/rest/v1/rpc/conductor_solicita_asignacion", route => {
    requests++;
    expect(route.request().postDataJSON().p_traslado_id).toBe(trip());
    return route.fulfill({ headers: { "access-control-allow-origin": "*" }, json: { competencia_id: "qa-competencia", cierra_en: "2030-10-24T12:00:00Z" } });
  });
  await openOffer(page);
  await page.getByRole("button", { name: "ACEPTAR TRASLADO", exact: true }).click();
  await expect(page.getByRole("button", { name: "SOLICITUD REGISTRADA", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Rechazar", exact: true })).toBeDisabled();
  await expect(page.locator("[data-trip-primary]").getByRole("status")).toContainText("Solicitud registrada");
  expect(requests).toBe(1);
});

test("un error de aceptación permite reintentar sin perder las acciones", async ({ page }) => {
  await page.route("**/rest/v1/rpc/conductor_solicita_asignacion", route => route.fulfill({ status: 409, headers: { "access-control-allow-origin": "*" }, json: { message: "No fue posible registrar la solicitud" } }));
  await openOffer(page);
  await page.getByRole("button", { name: "ACEPTAR TRASLADO", exact: true }).click();
  await expect(page.locator("[data-trip-primary]").getByRole("alert")).toBeVisible();
  await expect(page.getByRole("button", { name: "ACEPTAR TRASLADO", exact: true })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Rechazar", exact: true })).toBeEnabled();
});

test("rechazar conserva el motivo y regresa a los filtros originales", async ({ page }) => {
  let reason = "";
  await page.route("**/rest/v1/registro_auditoria*", route => {
    if (route.request().method() === "POST") reason = route.request().postDataJSON().datos?.motivo ?? reason;
    return route.fulfill({ headers: { "access-control-allow-origin": "*" }, json: [] });
  });
  await page.setViewportSize({ width: 375, height: 500 });
  await openOffer(page);
  await page.getByRole("button", { name: "Rechazar", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Motivo de rechazo" })).toBeVisible();
  await page.getByRole("button", { name: "Horario incompatible", exact: true }).click();
  await expect(page).toHaveURL(/q=Toluca$/);
  expect(reason).toBe("Horario incompatible");
});
