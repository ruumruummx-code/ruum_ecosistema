import { expect, test } from "@playwright/test";
import { session } from "./qa-session";

test.use({
  viewport: { width: 390, height: 844 },
  launchOptions: {
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
  },
});

test.beforeEach(async ({ page, context }) => {
  await session(page, context, "día");
  await page.route("**/rest/v1/solicitudes_conductor?**", (route) => route.fulfill({
    json: [{
      id: "11000000-0000-4000-8000-000000000008",
      estado: "documentos_pendientes",
      paso_actual: 4,
      datos_personales: {},
      domicilio: {},
      licencia: {},
      contacto_emergencia: {},
    }],
    headers: { "Access-Control-Allow-Origin": "*" },
  }));
});

test("el registro captura un JPEG y conserva el archivo al cerrar la cámara", { tag: "@critico" }, async ({ page }) => {
  await page.addInitScript(() => {
    const original = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    const pistas: MediaStreamTrack[] = [];
    Object.defineProperty(window, "pistasRegistroPrueba", { value: pistas });
    navigator.mediaDevices.getUserMedia = async (restricciones) => {
      const flujo = await original(restricciones);
      pistas.push(...flujo.getVideoTracks());
      return flujo;
    };
  });
  await page.goto("/registro");
  const frente = page.getByRole("region", { name: "Licencia · Frente" });
  const abrirCamara = frente.getByRole("button", { name: "Tomar foto de licencia (frente)" });
  await abrirCamara.click();
  const dialogo = page.getByRole("dialog", { name: "Tomar foto de licencia (frente)" });
  await expect(dialogo.getByRole("button", { name: "Capturar foto" })).toBeEnabled();
  await dialogo.getByRole("button", { name: "Capturar foto" }).click();
  await expect(frente.getByText("licencia_frente.jpg")).toBeVisible();

  await abrirCamara.click();
  await expect(dialogo.getByRole("button", { name: "Capturar foto" })).toBeEnabled();
  await dialogo.getByRole("button", { name: "Cerrar cámara" }).click();
  await expect(dialogo).toHaveCount(0);
  await expect(frente.getByText("licencia_frente.jpg")).toBeVisible();
  await expect.poll(() => page.evaluate(() =>
    (window as Window & { pistasRegistroPrueba: MediaStreamTrack[] }).pistasRegistroPrueba.map((pista) => pista.readyState)
  )).toEqual(["ended", "ended"]);
});

test("el registro permite adjuntar un PDF si el navegador bloquea la cámara", { tag: "@critico" }, async ({ page }) => {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = async () => {
      throw new DOMException("Permiso de prueba denegado", "NotAllowedError");
    };
  });
  await page.goto("/registro");
  await page.getByRole("button", { name: "Tomar foto de identificación oficial" }).click();
  const dialogo = page.getByRole("dialog", { name: "Tomar foto de identificación oficial" });
  await expect(dialogo.getByRole("alert")).toContainText("No pudimos abrir la cámara");
  await page.keyboard.press("Escape");
  await expect(dialogo).toHaveCount(0);
  const identificacion = page.getByRole("region", { name: "Identificación oficial" });
  const [selector] = await Promise.all([
    page.waitForEvent("filechooser"),
    identificacion.getByRole("button", { name: "Adjuntar archivo de identificación oficial" }).click(),
  ]);
  await selector.setFiles({
    name: "identificacion-prueba.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4\n"),
  });
  await expect(identificacion.getByText("identificacion-prueba.pdf")).toBeVisible();
});
