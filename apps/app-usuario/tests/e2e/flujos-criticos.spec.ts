import { expect, test } from "@playwright/test";
import { ACCESS_TOKEN_E2E, ACCESS_TOKEN_PENDIENTE_E2E, seedMockAuthSession } from "./fixtures/sesion";
import {
  aceptarConsentimientoSiAparece,
  esperarHidratacion,
  rutaActual,
} from "./fixtures/navegacion";

/**
 * Rutas que este archivo cubre y que también existen como páginas:
 * /login · /registro · /viajes/nuevo (wizard de traslado) · /verificacion (Didit) ·
 * /soporte · /mis-viajes.
 *
 * Estas pruebas validan que la aplicación entrega el HTML que el usuario necesita:
 * que el login muestra el formulario, que el registro pide nombre+teléfono, que el
 * wizard muestra origen/destino y que las rutas privadas responden. Si la app se
 * rompe y devuelve la página vacía de error, la prueba falla.
 */

/**
 * T-03: las afirmaciones de redirección/autenticación validan el resultado final,
 * no el estado intermedio de un fetch. Sin sesión, la prueba exige la URL exacta
 * con su query (?next=…&reason=authentication_required); con sesión, exige que la
 * ruta resuelva al destino. Esto hace que la prueba falle si se rompe el
 * middleware o la sesión.
 */

/** Bloquea el endpoint de tarifas y devuelve una respuesta determinista. */
async function mockearTarifa(
  page: import("@playwright/test").Page,
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
      json: { features: [{ place_name: "Ciudad de México, México", center: [-99.1332, 19.4326] }] },
    })
  );
}

test.describe("Flujos críticos de la aplicación", () => {
  test("la aplicación carga y el login responde", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("h1")).toContainText("Bienvenido de nuevo");
    // formulario de acceso presente con sus campos reales
    await expect(page.locator("#login-email")).toBeVisible();
    await expect(page.locator("#login-password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Iniciar sesión" })).toBeVisible();
  });

  test("el formulario de login muestra errores cuando faltan datos", async ({ page }) => {
    await page.goto("/login");
    await esperarHidratacion(page);
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    // validación del lado del cliente: el usuario ve qué falta
    await expect(page.getByText("Introduce tu correo electrónico.")).toBeVisible();
  });

  test("el login con credenciales válidas funciona", async ({ page }) => {
    await page.goto("/login");
    await esperarHidratacion(page);
    await page.locator("#login-email").fill("usuario.e2e@correo.test");
    await page.locator("#login-password").fill("ClaveE2E123!");
    await page.getByRole("button", { name: "Iniciar sesión" }).click();

    await page.waitForURL("/", { timeout: 30_000 });
    expect(await rutaActual(page)).toBe("/");
  });

  test("el login con credenciales inválidas muestra un mensaje claro", async ({ page }) => {
    await page.goto("/login");
    await esperarHidratacion(page);
    await page.locator("#login-email").fill("no-existe@correo.test");
    await page.locator("#login-password").fill("ClaveIncorrecta123");
    await page.getByRole("button", { name: "Iniciar sesión" }).click();

    await expect(page.getByText("Correo o contraseña incorrectos.")).toBeVisible({ timeout: 30_000 });
  });

  test("el registro de usuario muestra el formulario con los campos correctos", async ({ page }) => {
    await page.goto("/registro");
    // formulario de registro: nombre, apellido y teléfono
    await expect(page.locator("h1")).toContainText("Crear cuenta");
    await expect(page.locator("#nombre")).toBeVisible();
    await expect(page.locator("#apellido")).toBeVisible();
    await expect(page.locator("#telefono")).toBeVisible();
  });

  test("el registro valida el formato del teléfono antes de avanzar", async ({ page }) => {
    await page.goto("/registro");
    await esperarHidratacion(page);

    await page.locator("#nombre").fill("Persona");
    await page.locator("#apellido").fill("E2E");
    await page.locator("#telefono").fill("123");
    await page.getByRole("button", { name: "Continuar" }).click();

    await expect(page.getByText("El teléfono debe tener 10 dígitos.")).toBeVisible();
  });

  test("el registro completa el OTP y avanza a credenciales", async ({ page }) => {
    // Sin bypass en build de producción: el OTP se intercepta en la red.
    // El mock del dev server (123456) está desactivado cuando NODE_ENV=production,
    // así que sin este route la prueba fallaría en CI.
    await page.route("**/api/auth/phone-verify/send", (route) => route.fulfill({ json: { ok: true } }));
    await page.route("**/api/auth/phone-verify/verify", (route) => route.fulfill({ json: { ok: true, token: "e2e-otp-token" } }));
    await page.route("**/api/auth/signup", (route) =>
      route.fulfill({ json: { user: { id: "e2e-user-id", email: "persona.e2e@correo.test" } } })
    );

    await page.goto("/registro");
    await esperarHidratacion(page);

    await page.locator("#nombre").fill("Persona");
    await page.locator("#apellido").fill("E2E");
    await page.locator("#telefono").fill("5512345678");
    await page.getByRole("button", { name: "Continuar" }).click();

    // el modal de OTP se abre y pide el código
    await expect(page.getByRole("dialog")).toContainText("Verifica tu número celular");
    await page.locator("#codigo-sms").fill("123456");
    await page.getByRole("button", { name: "Verificar y continuar" }).click();

    // paso 2: credenciales — el wizard de registro pide email y contraseña
    await expect(page.getByText("Elige tus credenciales")).toBeVisible({ timeout: 15_000 });
    await page.locator("#email").fill("persona.e2e@correo.test");
    await expect(page.locator("#password")).toBeVisible();

    // una contraseña débil explica exactamente qué falta
    await page.locator("#password").fill("debil");
    await page.locator("#password").blur();
    await expect(page.locator("#password-requisitos")).toContainText("Una mayúscula");
  });

  test("el registro con datos válidos envía a la pantalla de confirmación", async ({ page }) => {
    await page.route("**/api/auth/phone-verify/send", (route) => route.fulfill({ json: { ok: true } }));
    await page.route("**/api/auth/phone-verify/verify", (route) => route.fulfill({ json: { ok: true, token: "e2e-otp-token" } }));
    await page.route("**/api/auth/signup", (route) =>
      route.fulfill({ json: { user: { id: "e2e-user-id", email: "persona.e2e@correo.test" } } })
    );

    await page.goto("/registro");
    await esperarHidratacion(page);
    await page.locator("#nombre").fill("Persona");
    await page.locator("#apellido").fill("E2E");
    await page.locator("#telefono").fill("5512345678");
    await page.getByRole("button", { name: "Continuar" }).click();

    await expect(page.getByRole("dialog")).toContainText("Verifica tu número celular");
    await page.locator("#codigo-sms").fill("123456");
    await page.getByRole("button", { name: "Verificar y continuar" }).click();

    await expect(page.getByText("Elige tus credenciales")).toBeVisible({ timeout: 15_000 });
    await page.locator("#email").fill("persona.e2e@correo.test");
    await page.locator("#password").fill("Passw0rdE2E!");
    await page.locator("#confirmarPassword").fill("Passw0rdE2E!");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: /Crear cuenta/i }).click();

    await page.waitForURL("**/registro/confirma-correo", { timeout: 30_000 });
  });

  test("el wizard de traslados abre, cotiza y permite avanzar al vehículo", async ({ page }) => {
    await mockearTarifa(page, 500);
    await seedMockAuthSession(page, { variante: "verificada" });

    await page.goto("/viajes/nuevo");
    await esperarHidratacion(page);
    await aceptarConsentimientoSiAparece(page);

    // paso 0: origen y destino con códigos postales del catálogo local
    await page.locator("#gate-origenCodigoPostal").fill("03100");
    await page.locator("#gate-destinoCodigoPostal").fill("06600");

    // vehículo del catálogo
    await page.locator("#gate-marca").selectOption({ label: "Nissan" });
    await page.locator("#gate-modelo").selectOption({ label: "Versa" });
    await page.locator("#gate-condicion").selectOption("seminueva");

    // la cotización tarda: geocode (debounce 650 ms) → POST /api/ruta →
    // debounce de tarifa (600 ms) → RPC de previsualización
    const botonCotizado = page.getByRole("button", { name: /Continuar · Tarifa est\. \$500 MXN/ });
    await expect(botonCotizado).toBeEnabled({ timeout: 30_000 });

    // el botón solo se activa cuando la tarifa existe: no es decorativo
    await botonCotizado.click();

    // avanza al paso 2 de 5 y muestra los datos del vehículo
    await expect(page.getByText("Datos del vehículo")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Paso 2 de 5")).toBeVisible();
    await expect(page.getByText("Tarifa aceptada · $500.00 MXN")).toBeVisible();
  });

  test("la tarifa cotizada se congela antes de avanzar al vehículo", async ({ page }) => {
    await mockearTarifa(page, 500);
    await seedMockAuthSession(page, { variante: "verificada" });

    await page.goto("/viajes/nuevo");
    await esperarHidratacion(page);
    await aceptarConsentimientoSiAparece(page);

    await page.locator("#gate-origenCodigoPostal").fill("03100");
    await page.locator("#gate-destinoCodigoPostal").fill("06600");
    await page.locator("#gate-marca").selectOption({ label: "Nissan" });
    await page.locator("#gate-modelo").selectOption({ label: "Versa" });
    await page.locator("#gate-condicion").selectOption("seminueva");

    await expect(page.getByRole("button", { name: /Continuar · Tarifa est\. \$500 MXN/ })).toBeEnabled({ timeout: 30_000 });

    // si el backend de tarifas está roto, el botón no se activa
    await page.unroute("**/api/ruta");
    await page.route("**/api/ruta", (route) => route.fulfill({ status: 500, contentType: "application/json", json: { error: "downstream_no_disponible" } }));

    // recotiza cambiando el destino
    await page.locator("#gate-destinoCodigoPostal").fill("01000");

    // el usuario ve el error y no puede avanzar
    await expect(page.getByText(/tarifa no disponible/i)).toBeVisible({ timeout: 25_000 });
    await expect(page.getByRole("button", { name: /Continuar/ })).toBeDisabled();
  });

  test("el paso de vehículo pide los datos obligatorios y los congela", async ({ page }) => {
    await mockearTarifa(page, 500);
    await seedMockAuthSession(page, { variante: "verificada" });

    await page.goto("/viajes/nuevo");
    await esperarHidratacion(page);
    await aceptarConsentimientoSiAparece(page);

    await page.locator("#gate-origenCodigoPostal").fill("03100");
    await page.locator("#gate-destinoCodigoPostal").fill("06600");
    await page.locator("#gate-marca").selectOption({ label: "Nissan" });
    await page.locator("#gate-modelo").selectOption({ label: "Versa" });
    await page.locator("#gate-condicion").selectOption("seminueva");

    await expect(page.getByRole("button", { name: /Continuar · Tarifa est\. \$500 MXN/ })).toBeEnabled({ timeout: 30_000 });
    await page.getByRole("button", { name: /Continuar · Tarifa est\. \$500 MXN/ }).click();

    // Paso 2 de 5: datos del vehículo
    await expect(page.getByText("Datos del vehículo")).toBeVisible({ timeout: 15_000 });

    // continuar sin datos: el formulario no avanza
    await page.getByRole("button", { name: /Continuar · Tarifa/ }).click();
    await expect(page.getByText("Paso 2 de 5")).toBeVisible();

    // el sheet de "Detalles del vehículo" pide color, placas, VIN, estado y checks
    await page.locator("#anio").fill("2020");
    await page.getByRole("button", { name: /Detalles del vehículo/i }).click();

    await expect(page.locator("#color")).toBeVisible();
    await expect(page.locator("#placas")).toBeVisible();
    await expect(page.locator("#vin")).toBeVisible();
    await expect(page.locator("#estadoGeneral")).toBeVisible();

    await page.locator("#color").fill("Azul");
    await page.locator("#placas").fill("ABC1234");
    await page.locator("#vin").fill("1M8GDM9A0KP042788");
    await page.locator("#estadoGeneral").selectOption("bueno");
    await page.getByRole("button", { name: "Guardar detalles" }).click();

    // con los datos guardados, el botón de continuar usa la tarifa congelada
    const continuar = page.getByRole("button", { name: /Continuar · Tarifa: \$500\.00 MXN/ });
    await expect(continuar).toBeEnabled({ timeout: 15_000 });
    await continuar.click();

    // avanza al paso 3 de 5: origen y destino
    await expect(page.getByText("Origen y destino")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Paso 3 de 5")).toBeVisible();
  });

  test("una tarifa especial bloquea el avance hasta cotizar con soporte", async ({ page }) => {
    await mockearTarifa(page, 500, false);
    await seedMockAuthSession(page, { variante: "verificada" });

    await page.goto("/viajes/nuevo");
    await esperarHidratacion(page);
    await aceptarConsentimientoSiAparece(page);

    await page.locator("#gate-origenCodigoPostal").fill("03100");
    await page.locator("#gate-destinoCodigoPostal").fill("06600");
    await page.locator("#gate-marca").selectOption({ label: "Nissan" });
    await page.locator("#gate-modelo").selectOption({ label: "Versa" });
    await page.locator("#gate-condicion").selectOption("seminueva");

    // el usuario ve que debe cotizar con soporte
    await expect(page.getByRole("button", { name: "Cotización especial requerida" })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("button", { name: "Cotización especial requerida" })).toBeDisabled();

    // el enlace a soporte funciona
    const linkSoporte = page.getByRole("link", { name: "Solicitar cotización especial" });
    await expect(linkSoporte).toBeVisible();
    await linkSoporte.click();
    await page.waitForURL("**/soporte", { timeout: 15_000 });
  });

  test("la verificación con Didit abre el portal oficial", async ({ page }) => {
    await seedMockAuthSession(page, { variante: "pendiente" });

    await page.goto("/verificacion");
    await esperarHidratacion(page);
    await aceptarConsentimientoSiAparece(page);
    await expect(page.locator("h1")).toContainText("Verificación de identidad");

    const iniciarDidit = page.getByRole("button", { name: "Iniciar verificación con Didit" });
    await iniciarDidit.focus();
    await iniciarDidit.press("Enter");

    const dialog = page.getByRole("dialog", { name: "Verificación de identidad oficial" });
    await expect(dialog).toBeVisible({ timeout: 30_000 });
    await expect(dialog).toHaveAttribute("aria-modal", "true");
    await expect(dialog).toContainText("Verificación de identidad");
    // aviso claro de lo que se necesita (cámara, micrófono, ubicación)
    await expect(dialog.getByText(/cámara, micrófono y ubicación/i)).toBeVisible();
    // el iframe del portal pide permisos de cámara
    await expect(dialog.locator("iframe")).toHaveAttribute("allow", /camera/);

    // el usuario puede salir del modal con Escape
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden({ timeout: 10_000 });
  });

  test("el wizard carga masiva avisa el límite antes de subir", async ({ page }) => {
    await seedMockAuthSession(page, { variante: "verificada" });

    await page.goto("/viajes/nuevo");
    await esperarHidratacion(page);
    await aceptarConsentimientoSiAparece(page);

    // la carga masiva solo se ofrece a usuarios verificados
    const abrirCargaMasiva = page.getByRole("button", { name: /Abrir módulo de carga masiva de traslados/i });
    await abrirCargaMasiva.focus();
    await abrirCargaMasiva.press("Enter");
    await expect(page.getByRole("dialog")).toContainText("Carga masiva de traslados");
    await expect(page.getByRole("dialog")).toContainText("Máximo 100 traslados · 5 MB");
  });

  test("el usuario ve la lista de sus traslados", async ({ page }) => {
    await seedMockAuthSession(page, { variante: "verificada" });

    await page.goto("/mis-viajes");
    await expect(page.locator("h1")).toContainText("Mis Traslados");

    // filtros de estado ofrecidos por la interfaz de traslados
    await expect(page.getByRole("button", { name: "Activos" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Programados" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Finalizados" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Cancelados" })).toBeVisible();

    // estado vacío legible
    await expect(page.getByText("Sin traslados · En curso")).toBeVisible();
  });

  test("soporte funciona para un usuario autenticado", async ({ page }) => {
    await seedMockAuthSession(page, { variante: "verificada" });

    await page.goto("/soporte");
    await expect(page.locator("h1")).toContainText("Soporte");
    // el usuario ve canales de contacto
    await expect(page.getByText("Canales de soporte")).toBeVisible();
  });

  test("las rutas privadas piden sesión y muestran el aviso correcto", async ({ page }) => {
    await page.goto("/viajes/nuevo");

    // T-03: si el middleware cambia, la URL exacta del redirect es la aserción.
    await page.waitForURL("**/login?next=%2Fviajes%2Fnuevo&reason=authentication_required", { timeout: 15_000 });
    expect(await rutaActual(page)).toBe("/login?next=%2Fviajes%2Fnuevo&reason=authentication_required");

    // el usuario entiende por qué llegó al login
    await expect(page.getByText("Inicia sesión para solicitar un traslado")).toBeVisible();
  });

  test("una sesión inválida no da acceso a las rutas privadas", async ({ page }) => {
    await seedMockAuthSession(page, { variante: "verificada", token: "sbp_token_invalido_e2e" });

    await page.goto("/viajes/nuevo");

    // T-03: el resultado final es el login, no una página privada.
    await page.waitForURL("**/login**", { timeout: 15_000 });
    expect(await rutaActual(page)).toContain("/login");
    await expect(page.locator("#login-email")).toBeVisible();
  });

  test("con sesión válida el login redirige al home y no bloquea", async ({ page }) => {
    await seedMockAuthSession(page, { variante: "verificada" });

    await page.goto("/login");
    await page.waitForURL("/", { timeout: 15_000 });
    expect(await rutaActual(page)).toBe("/");
  });

  test("con sesión válida /mis-viajes es accesible", async ({ page }) => {
    await seedMockAuthSession(page, { variante: "verificada" });

    await page.goto("/mis-viajes");
    await expect(page.locator("h1")).toContainText("Mis Traslados");
    expect(await rutaActual(page)).toBe("/mis-viajes");
  });
});

test.describe("Reglas de negocio del perfil de usuario", () => {
  test("un usuario verificado y con términos aceptados pasa el guard del wizard", async ({ page }) => {
    await seedMockAuthSession(page, { variante: "verificada" });

    await page.goto("/viajes/nuevo");
    // el formulario del wizard está disponible: el guard no lo bloquea
    await expect(page.locator("#gate-origenCodigoPostal")).toBeVisible({ timeout: 30_000 });
    // sin banner de consentimiento legal pendiente
    await expect(page.getByText(/revisa y acepta los términos/i)).toBeHidden();
  });
});
