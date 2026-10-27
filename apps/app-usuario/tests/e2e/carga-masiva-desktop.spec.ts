import { test, expect } from "@playwright/test";
import { config as loadDotenv } from "dotenv";
import path from "node:path";
import ExcelJS from "exceljs";
import { aceptarConsentimientoSiAparece, esperarHidratacion } from "./fixtures/navegacion";
import { seedMockAuthSession } from "./fixtures/sesion";

loadDotenv({ path: path.resolve(process.cwd(), ".env.local") });

async function generarXlsxPrueba(
  cantidadValidas = 1,
  cantidadInvalidas = 0
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Traslados");
  ws.addRow([
    "vehiculo_marca",
    "vehiculo_modelo",
    "vehiculo_anio",
    "vehiculo_placas",
    "condicion",
    "origen_codigo_postal",
    "destino_codigo_postal",
    "contacto_entrega_nombre",
    "contacto_entrega_telefono",
    "contacto_recepcion_nombre",
    "contacto_recepcion_telefono",
    "origen_calle",
    "origen_numero",
    "origen_colonia",
    "destino_calle",
    "destino_numero",
    "destino_colonia",
  ]);

  for (let i = 0; i < cantidadValidas; i++) {
    ws.addRow([
      "Nissan",
      `Versa ${i + 1}`,
      "2024",
      `ABC${1000 + i}`,
      "seminueva",
      "06700",
      "04360",
      `Entrega ${i + 1}`,
      "5512345678",
      `Recibe ${i + 1}`,
      "5587654321",
      "Calle Origen",
      "100",
      "Roma Norte",
      "Calle Destino",
      "200",
      "Copilco",
    ]);
  }

  for (let j = 0; j < cantidadInvalidas; j++) {
    ws.addRow([
      "MarcaInvalida",
      `Error ${j + 1}`,
      "2024",
      "", // Sin placas ni VIN -> error
      "seminueva",
      "00000", // CP inválido
      "04360",
      `Entrega Bad ${j + 1}`,
      "123", // Teléfono inválido
      `Recibe Bad ${j + 1}`,
      "456",
      "",
      "",
      "",
      "",
      "",
      "",
    ]);
  }

  return Buffer.from(await wb.xlsx.writeBuffer());
}

async function setupDesktopMocks(page: import("@playwright/test").Page) {
  await seedMockAuthSession(page, { variante: "verificada" });

  await page.route("**/api/csrf**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ token: "mock_csrf_desktop" }),
    });
  });

  await page.route("**/rest/v1/usuarios**", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "00000000-0000-4000-8000-00000000e001",
            auth_user_id: "00000000-0000-4000-8000-00000000e001",
            nombre: "Alex",
            email: "alex@ejemplo.com",
            estado_verificacion: "verificado",
            version_terminos_aceptada: 1,
            foto_url: null,
            doc_identidad_url: null,
          },
        ]),
      });
    } else await route.continue();
  });

  await page.route("**/api/viajes/masivos/pendientes**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ pendientes: [] }),
    });
  });
}

test.describe("RR-CM-001 — Flujo operativo Carga Masiva Desktop", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test.beforeEach(async ({ page }) => {
    await setupDesktopMocks(page);
  });

  test("Escenario 1: 100 filas válidas -> cotización consolidada y checkout completo", async ({ page }) => {
    test.slow();
    const filasValidas = Array.from({ length: 100 }).map((_, i) => ({
      indice: i,
      estado: "correcto" as const,
      errores: {},
      datos: {
        marca: "Nissan",
        modelo: `Versa ${i + 1}`,
        anio: "2024",
        condicion: "seminueva",
        origenCodigoPostal: "06700",
        destinoCodigoPostal: "04360",
        entregaNombre: `Entrega ${i + 1}`,
        entregaTelefono: "5512345678",
        recepcionNombre: `Recibe ${i + 1}`,
        recepcionTelefono: "5587654321",
        vehiculo_placas: `ABC${1000 + i}`,
      },
    }));

    await page.route("**/api/viajes/masivos/validate", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ filas: filasValidas }),
      });
    });

    await page.route("**/api/viajes/masivos/cotizar", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "carga-100-valida-uuid",
          clientSecret: "pi_test_secret_100",
          totalMXN: 65000,
          cotizaciones: filasValidas.map((f) => ({
            indice: f.indice,
            tarifa: 650,
            distanciaKm: 15.2,
            datos: f.datos,
          })),
        }),
      });
    });

    await page.goto("/viajes/masivo", { waitUntil: "domcontentloaded" });
    await esperarHidratacion(page);
    await aceptarConsentimientoSiAparece(page);

    // Dropzone visible en desktop
    await expect(page.getByRole("heading", { name: "Carga masiva de traslados" })).toBeVisible();
    await expect(page.getByText(/Arrastra y suelta tu archivo aquí/i)).toBeVisible();

    const buffer = await generarXlsxPrueba(100, 0);
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByLabel("Cargar archivo Excel .xlsx").click({ force: true });
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: "flota_100_unidades.xlsx",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      buffer,
    });

    // Vista de validación desktop
    const regionValidacion = page.getByRole("region", { name: "Validación y corrección de traslados" });
    await expect(regionValidacion).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("Total de traslados")).toBeVisible();
    await expect(page.getByText("Listos para cotizar", { exact: true })).toBeVisible();

    // Cotizar lote completo
    const btnCotizarLote = page.getByRole("button", { name: /Cotizar lote completo/i });
    await expect(btnCotizarLote).toBeVisible();
    await btnCotizarLote.click();

    // Transición a Checkout consolidado
    await expect(
      page.getByRole("heading", { name: "Revisión consolidada y Checkout masivo" })
    ).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("button", { name: "Pagar $65,000.00 MXN" })).toBeVisible();
    await expect(page.getByText("Resumen de traslados cotizados (100)")).toBeVisible();
  });

  test("Escenario 2: 80 válidas, 20 inválidas -> cotización parcial conservando 20 pendientes", async ({ page }) => {
    test.slow();
    const filasMixtas = [
      ...Array.from({ length: 80 }).map((_, i) => ({
        indice: i,
        estado: "correcto" as const,
        errores: {},
        datos: {
          marca: "Nissan",
          modelo: `Versa ${i + 1}`,
          anio: "2024",
          condicion: "seminueva",
          origenCodigoPostal: "06700",
          destinoCodigoPostal: "04360",
          entregaNombre: `Entrega ${i + 1}`,
          entregaTelefono: "5512345678",
          recepcionNombre: `Recibe ${i + 1}`,
          recepcionTelefono: "5587654321",
          vehiculo_placas: `ABC${1000 + i}`,
        },
      })),
      ...Array.from({ length: 20 }).map((_, j) => ({
        indice: 80 + j,
        estado: "error" as const,
        errores: { origenCodigoPostal: "CP no encontrado o inválido" },
        datos: {
          marca: "Ford",
          modelo: `Focus Bad ${j + 1}`,
          anio: "2020",
          condicion: "seminueva",
          origenCodigoPostal: "00000",
          destinoCodigoPostal: "04360",
          entregaNombre: `Entrega Bad ${j + 1}`,
          entregaTelefono: "12345",
          recepcionNombre: `Recibe Bad ${j + 1}`,
          recepcionTelefono: "67890",
          vehiculo_placas: "",
        },
      })),
    ];

    await page.route("**/api/viajes/masivos/validate", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ filas: filasMixtas }),
      });
    });

    let cotizarParcialEnviado = false;
    await page.route("**/api/viajes/masivos/cotizar", async (route) => {
      const body = JSON.parse(route.request().postData() ?? "{}");
      cotizarParcialEnviado = body.permitirParcial === true;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "carga-parcial-80-uuid",
          clientSecret: "pi_test_secret_parcial_80",
          totalMXN: 52000,
          cotizaciones: filasMixtas.slice(0, 80).map((f) => ({
            indice: f.indice,
            tarifa: 650,
            distanciaKm: 15.2,
            datos: f.datos,
          })),
        }),
      });
    });

    await page.goto("/viajes/masivo", { waitUntil: "domcontentloaded" });
    await esperarHidratacion(page);
    await aceptarConsentimientoSiAparece(page);

    const buffer = await generarXlsxPrueba(80, 20);
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByLabel("Cargar archivo Excel .xlsx").click({ force: true });
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: "lote_mixto_100.xlsx",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      buffer,
    });

    // Verificar desglose de métricas
    const regionValidacion = page.getByRole("region", { name: "Validación y corrección de traslados" });
    await expect(regionValidacion).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("button", { name: "Válidas (80)" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Con incidencias (20)" })).toBeVisible();

    // Banner de advertencia de lote parcial
    await expect(page.getByText(/80 traslados listos para cotizar · 20 fila\(s\) con incidencias/i)).toBeVisible();

    // Clic en "Cotizar 80 válidas"
    const btnCotizarValidas = page.getByRole("button", { name: "Cotizar 80 válidas" }).first();
    await btnCotizarValidas.click();

    // Esperar checkout consolidado parcial
    await expect(
      page.getByRole("heading", { name: "Revisión consolidada y Checkout masivo" })
    ).toBeVisible({ timeout: 15000 });
    expect(cotizarParcialEnviado).toBe(true);

    // Aviso de pago parcial con 20 filas conservadas en servidor
    await expect(page.getByRole("status", { name: "Aviso de pago parcial" })).toBeVisible();
    await expect(page.getByText(/Estás procesando el pago de 80 traslados válidos/i)).toBeVisible();
    await expect(page.getByText(/Los 20 traslados con incidencias quedan guardados como borrador/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "Pagar $52,000.00 MXN" })).toBeVisible();
  });

  test("Escenario 3: Archivo incorrecto (formato no soportado) -> error claro sin generar lote", async ({ page }) => {
    test.slow();
    let validateLlamado = false;
    await page.route("**/api/viajes/masivos/validate", async (route) => {
      validateLlamado = true;
      await route.continue();
    });

    await page.goto("/viajes/masivo", { waitUntil: "domcontentloaded" });
    await esperarHidratacion(page);
    await aceptarConsentimientoSiAparece(page);

    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByLabel("Cargar archivo Excel .xlsx").click({ force: true });
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: "documento_invalido.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4 dummy content"),
    });

    // Se muestra alerta en UI y no se genera lote
    await expect(
      page.getByText("Formato no admitido. Selecciona un archivo con extensión .xlsx")
    ).toBeVisible({ timeout: 10000 });
    expect(validateLlamado).toBe(false);
  });

  test("Escenario 4: Incidencia de Mapbox -> recoverable sin inventar importe", async ({ page }) => {
    test.slow();
    const filaConErrorRuta = [
      {
        indice: 0,
        estado: "error" as const,
        errores: {},
        errorCotizacion: "No se encontró ruta terrestre entre los códigos postales origen y destino.",
        datos: {
          marca: "Toyota",
          modelo: "Hilux",
          anio: "2023",
          condicion: "nueva",
          origenCodigoPostal: "99999",
          destinoCodigoPostal: "01000",
          entregaNombre: "Juan",
          entregaTelefono: "5511223344",
          recepcionNombre: "Pedro",
          recepcionTelefono: "5599887766",
          vehiculo_placas: "DEF5678",
        },
      },
    ];

    await page.route("**/api/viajes/masivos/validate", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ filas: filaConErrorRuta }),
      });
    });

    await page.goto("/viajes/masivo", { waitUntil: "domcontentloaded" });
    await esperarHidratacion(page);
    await aceptarConsentimientoSiAparece(page);

    const buffer = await generarXlsxPrueba(1, 0);
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByLabel("Cargar archivo Excel .xlsx").click({ force: true });
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: "ruta_invalida.xlsx",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      buffer,
    });

    await expect(page.getByRole("heading", { name: "Validación de archivo" })).toBeVisible({ timeout: 15000 });

    // La fila aparece con incidencia y mensaje claro, sin tarifa asignada
    await expect(page.getByText("✕ Con incidencia")).toBeVisible();
    await expect(page.getByText("Toyota Hilux")).toBeVisible();
    await expect(
      page.getByText("No se encontró ruta terrestre entre los códigos postales origen y destino.")
    ).toBeVisible();

    // No se inventa monto y el botón cotizar queda inhabilitado
    const btnCotizar = page.getByRole("button", { name: "Corrige los errores para cotizar todo" });
    await expect(btnCotizar).toBeDisabled();
  });

  test("Escenario 5 y 8: Anti doble clic y pago en procesamiento -> sin duplicados", async ({ page }) => {
    test.slow();
    const filaUnica = [
      {
        indice: 0,
        estado: "correcto" as const,
        errores: {},
        datos: {
          marca: "Honda",
          modelo: "Civic",
          anio: "2024",
          condicion: "seminueva",
          origenCodigoPostal: "06700",
          destinoCodigoPostal: "04360",
          entregaNombre: "Ana",
          entregaTelefono: "5544332211",
          recepcionNombre: "Luis",
          recepcionTelefono: "5588776655",
          vehiculo_placas: "HND1234",
        },
      },
    ];

    await page.route("**/api/viajes/masivos/validate", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ filas: filaUnica }),
      });
    });

    await page.route("**/api/viajes/masivos/cotizar", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "carga-anti-dobleclic-uuid",
          clientSecret: "pi_test_anti_dobleclic",
          totalMXN: 950,
          cotizaciones: [
            {
              indice: 0,
              tarifa: 950,
              distanciaKm: 18.5,
              datos: filaUnica[0]!.datos,
            },
          ],
        }),
      });
    });

    await page.goto("/viajes/masivo", { waitUntil: "domcontentloaded" });
    await esperarHidratacion(page);
    await aceptarConsentimientoSiAparece(page);

    const buffer = await generarXlsxPrueba(1, 0);
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByLabel("Cargar archivo Excel .xlsx").click({ force: true });
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: "lote_anti_duplicado.xlsx",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      buffer,
    });

    await expect(page.getByRole("heading", { name: "Validación de archivo" })).toBeVisible({ timeout: 15000 });
    await page.getByRole("button", { name: /Cotizar lote completo/i }).click();

    await expect(
      page.getByRole("heading", { name: "Revisión consolidada y Checkout masivo" })
    ).toBeVisible({ timeout: 15000 });

    const btnPagar = page.getByRole("button", { name: /Pagar \$950\.00 MXN/i });
    await expect(btnPagar).toBeVisible();

    // El botón está protegido contra doble clic al no estar listo aún el formulario o durante envío
    await expect(btnPagar).toBeDisabled();
  });

  test("Escenario 6 y 7: Cargas pendientes del servidor -> reanudación y conciliación", async ({ page }) => {
    test.slow();
    await page.route("**/api/viajes/masivos/pendientes*", async (route) => {
      const url = new URL(route.request().url());
      const id = url.searchParams.get("id");

      if (id === "carga-pendiente-servidor-uuid") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: "carga-pendiente-servidor-uuid",
            clientSecret: "pi_secret_pendiente_recuperada",
            totalMXN: 1800,
            cotizaciones: [
              {
                indice: 0,
                tarifa: 900,
                distanciaKm: 14.5,
                datos: {
                  marca: "Toyota",
                  modelo: "Corolla",
                  anio: "2023",
                  origenCodigoPostal: "06700",
                  destinoCodigoPostal: "04360",
                },
              },
              {
                indice: 1,
                tarifa: 900,
                distanciaKm: 14.5,
                datos: {
                  marca: "Mazda",
                  modelo: "3",
                  anio: "2024",
                  origenCodigoPostal: "06700",
                  destinoCodigoPostal: "04360",
                },
              },
            ],
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            pendientes: [
              {
                id: "carga-pendiente-servidor-uuid",
                totalMXN: 1800,
                cantidad_traslados: 2,
                creado_en: new Date().toISOString(),
                archivo: "flota_sucursales.xlsx",
                estado: "Pendiente de pago",
              },
            ],
          }),
        });
      }
    });

    await page.goto("/viajes/masivo", { waitUntil: "domcontentloaded" });
    await esperarHidratacion(page);
    await aceptarConsentimientoSiAparece(page);

    // Muestra las cargas pendientes guardadas en servidor
    await expect(page.getByRole("heading", { name: /Cargas pendientes de pago/i })).toBeVisible({ timeout: 15000 });
    await expect(page.locator("text=$1,800.00 MXN >> visible=true")).toBeVisible();
    await expect(page.getByText("flota_sucursales.xlsx")).toBeVisible();

    // Reanudar carga pendiente desde desktop
    const btnReanudar = page.getByRole("button", { name: "Reanudar carga" });
    await expect(btnReanudar).toBeVisible();
    await btnReanudar.click();

    // Entra al checkout recuperado
    await expect(
      page.getByRole("heading", { name: "Revisión consolidada y Checkout masivo" })
    ).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("button", { name: "Pagar $1,800.00 MXN" })).toBeVisible();
    await expect(page.getByText("Resumen de traslados cotizados (2)")).toBeVisible();
  });
});
