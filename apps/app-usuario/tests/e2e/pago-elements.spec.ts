import { expect, test, type Page } from "@playwright/test";
import { aceptarConsentimientoSiAparece, esperarHidratacion } from "./fixtures/navegacion";
import { seedMockAuthSession } from "./fixtures/sesion";
import { mockearTarifa } from "./fixtures/tarifa";

test.use({ trace: "off", screenshot: "off", video: "off" });

const trasladoId = "c2000000-0000-4000-8000-000000000010";
const montoCentavos = 50_000;

async function capturarDomicilio(page: Page, lado: "origen" | "destino", calle: string, cp: string) {
  await page.getByRole("button", { name: new RegExp(`Domicilio de ${lado}:`) }).click();
  const dialogo = page.getByRole("dialog", { name: `Domicilio de ${lado}` });
  await dialogo.getByRole("button", { name: "Completar dirección" }).click();
  for (const [campo, valor] of Object.entries({
    direccion: calle, numero: "100", codigoPostal: cp,
    colonia: "Centro", ciudad: "Ciudad de México", estado: "Ciudad de México",
  })) {
    await dialogo.locator(`#${lado}${campo}`).fill(valor);
  }
  await dialogo.getByRole("button", { name: "Confirmar ubicación" }).click();
  await expect(dialogo).toBeHidden();
}

test("el wizard confirma un pago de prueba con Stripe Payment Element", async ({ page, request }) => {
  test.skip(process.env.PLAYWRIGHT_STRIPE_TEST !== "1", "Activar para usar Stripe Test Mode con las llaves de prueba.");
  test.setTimeout(180_000);
  const secreta = process.env.STRIPE_SECRET_KEY;
  const publica = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!secreta?.startsWith("sk_test_") || !publica?.startsWith("pk_test_")) {
    throw new Error("Se requieren llaves Stripe sk_test_ y pk_test_.");
  }
  if (process.env.PLAYWRIGHT_E2E_SUPABASE_REAL === "1" || process.env.PLAYWRIGHT_BASE_URL || process.env.PLAYWRIGHT_SKIP_WEBSERVER) {
    throw new Error("El spec de Stripe requiere la aplicación y el doble de Supabase locales.");
  }

  const stripeHeaders = { Authorization: `Bearer ${secreta}` };
  const creado = await request.post("https://api.stripe.com/v1/payment_intents", {
    headers: stripeHeaders,
    form: {
      amount: montoCentavos, currency: "mxn",
      "automatic_payment_methods[enabled]": true,
      "automatic_payment_methods[allow_redirects]": "never",
      description: "RUUM C2 Playwright Payment Element",
    },
  });
  expect(creado.ok(), `Stripe Test Mode respondió HTTP ${creado.status()}`).toBe(true);
  const intent = await creado.json();
  expect(intent.livemode).toBe(false);

  try {
    await mockearTarifa(page, 500);
    await seedMockAuthSession(page);
    await page.route("**/api/cuenta/metodos-pago", route => route.fulfill({ json: {} }));
    await page.route("**/functions/v1/crear-payment-intent", async route => {
      if (route.request().method() === "OPTIONS") return route.fallback();
      expect(route.request().postDataJSON()).toMatchObject({ traslado_id: trasladoId });
      return route.fulfill({ headers: { "access-control-allow-origin": "*" }, json: { clientSecret: intent.client_secret } });
    });
    await page.route("**/rest/v1/rpc/usuario_crea_traslado", route => {
      if (route.request().method() === "OPTIONS") return route.fallback();
      return route.fulfill({
        headers: { "access-control-allow-origin": "*" },
        json: { id: trasladoId, tipo_pago: "anticipado", precio_cotizado: 500 },
      });
    });
    await page.route("**/rest/v1/rpc/usuario_acepta_cotizacion", route => {
      if (route.request().method() === "OPTIONS") return route.fallback();
      expect(route.request().postDataJSON()).toMatchObject({ p_traslado_id: trasladoId });
      return route.fulfill({ headers: { "access-control-allow-origin": "*" }, json: {} });
    });
    await page.route("**/rest/v1/pagos?**", async route => {
      if (route.request().method() !== "GET") return route.fallback();
      const filtros = new URL(route.request().url()).searchParams;
      expect(filtros.get("traslado_id")).toBe(`eq.${trasladoId}`);
      expect(filtros.get("estado")).toBe("eq.completado");
      const consulta = await request.get(`https://api.stripe.com/v1/payment_intents/${intent.id}`, { headers: stripeHeaders });
      expect(consulta.ok()).toBe(true);
      const pago = await consulta.json();
      return route.fulfill({
        headers: { "access-control-allow-origin": "*" },
        json: pago.status === "succeeded" && pago.livemode === false && pago.amount_received === montoCentavos
          ? [{ id: "pago-c2" }]
          : [],
      });
    });
    await page.route("**/api/viajes", async route => {
      if (route.request().method() !== "POST") return route.fallback();
      const datos = route.request().postDataJSON();
      expect(datos).toMatchObject({ wizardPaso: 3, aceptaPoliticas: true, marca: "Nissan", modelo: "Versa" });
      return route.fulfill({ json: {
        ok: true,
        solicitud: {
          vehiculo: { vehiculoId: "c2000000-0000-4000-8000-000000000011" },
          traslado: {
            snapshot_tarifa: { monto: 500 }, distancia_km: 12.5, tiempo_estimado_horas: 0.5,
            contacto_entrega_nombre: datos.entregaNombre, contacto_entrega_telefono: datos.entregaTelefono,
            contacto_recepcion_nombre: datos.recepcionNombre, contacto_recepcion_telefono: datos.recepcionTelefono,
            origen_direccion: datos.origenCalle, origen_ciudad: datos.origenCiudad,
            destino_direccion: datos.destinoCalle, destino_ciudad: datos.destinoCiudad,
          },
          paradas: [],
        },
      } });
    });

    await page.goto("/viajes/nuevo", { waitUntil: "commit", timeout: 90_000 });
    await esperarHidratacion(page);
    await aceptarConsentimientoSiAparece(page);
    await page.locator("#gate-origenCodigoPostal").fill("03100");
    await page.locator("#gate-destinoCodigoPostal").fill("06600");
    await page.locator("#gate-marca").selectOption({ label: "Nissan" });
    await page.locator("#gate-modelo").selectOption({ label: "Versa" });
    await page.locator("#gate-condicion").selectOption("seminueva");
    await page.getByRole("button", { name: "Cotizar traslado" }).click({ timeout: 30_000 });

    await page.locator("#anio").fill("2020");
    await page.locator("#transmision").selectOption("automatica");
    const avanzarVehiculo = page.getByRole("button", { name: /Continuar · Tarifa:/ });
    await avanzarVehiculo.click();
    const detalles = page.getByRole("dialog", { name: "Detalles del vehículo" });
    await detalles.locator("#color").fill("Azul");
    await detalles.locator("#placas").fill("ABC1234");
    await detalles.locator("#vin").fill("1M8GDM9A0KP042788");
    await detalles.locator("#estadoGeneral").selectOption({ label: "Buen estado, desgaste normal" });
    for (const etiqueta of ["Tarjeta de circulación vigente", "Verificación vehicular vigente", "Ambas placas instaladas", "El vehículo enciende y puede circular rodando"]) {
      await detalles.getByLabel(etiqueta, { exact: true }).check();
    }
    await detalles.getByRole("button", { name: "Guardar detalles" }).click();
    await avanzarVehiculo.click();

    await capturarDomicilio(page, "origen", "Amores", "03100");
    await capturarDomicilio(page, "destino", "Reforma", "06600");
    await page.getByRole("tab", { name: "Contactos" }).click();
    for (const [campo, valor] of Object.entries({
      entregaNombre: "Luis", entregaApellido: "Pérez", entregaTelefono: "5511223344",
      recepcionNombre: "Ana", recepcionApellido: "Gómez", recepcionTelefono: "5511223345",
    })) await page.locator(`#${campo}`).fill(valor);
    await page.getByRole("button", { name: /^Continuar(?: · \d|$)/ }).click();
    await page.getByRole("button", { name: /^Continuar al pago/ }).click();

    const nombreTarjeta = /número de tarjeta|card number/i;
    async function buscarFormulario() {
      for (const frame of page.frames()) {
        if (frame.url().startsWith("https://js.stripe.com/") &&
            await frame.getByRole("textbox", { name: nombreTarjeta }).isVisible()) return frame;
      }
    }
    await expect.poll(async () => Boolean(await buscarFormulario()), { timeout: 45_000 }).toBe(true);
    const tarjeta = await buscarFormulario();
    if (!tarjeta) throw new Error("Stripe desmontó el formulario de tarjeta.");
    await tarjeta.getByRole("textbox", { name: nombreTarjeta }).fill("4242424242424242");
    await tarjeta.getByRole("textbox", { name: /fecha de caducidad|expir/i }).fill(`12${String(new Date().getFullYear() + 2).slice(-2)}`);
    await tarjeta.getByRole("textbox", { name: /código de seguridad|security code|cvc/i }).fill("123");
    const codigoPostal = tarjeta.getByRole("textbox", { name: /código postal|postal code|zip/i });
    if (await codigoPostal.isVisible()) await codigoPostal.fill("06600");
    await page.getByRole("button", { name: "Pagar $500.00 MXN" }).click();
    await expect(page.getByRole("heading", { name: "¡Traslado solicitado!" })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("link", { name: "Ver pasaporte" })).toHaveAttribute("href", `/viajes/${trasladoId}`);
  } finally {
    const consulta = await request.get(`https://api.stripe.com/v1/payment_intents/${intent.id}`, { headers: stripeHeaders });
    if (consulta.ok() && ["requires_payment_method", "requires_confirmation", "requires_action"].includes((await consulta.json()).status)) {
      await request.post(`https://api.stripe.com/v1/payment_intents/${intent.id}/cancel`, { headers: stripeHeaders });
    }
  }
});
