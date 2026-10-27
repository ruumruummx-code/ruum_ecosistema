import { expect, test } from "@playwright/test";
import { seedMockAuthSession, USUARIO_ID_E2E, urlSupabaseE2E } from "./fixtures/sesion";
import { esperarHidratacion } from "./fixtures/navegacion";

test("la fotografía desktop se sube, persiste y aparece en perfil, cuenta y barra superior", async ({ page, request }) => {
  test.slow();
  const token = "mock_access_token_foto_perfil";
  const headers = { authorization: `Bearer ${token}` };
  const reset = await request.patch(`${urlSupabaseE2E()}/rest/v1/usuarios`, { headers, data: { foto_url: null, nombre: "Prueba" } });
  expect(reset.ok()).toBe(true);
  await seedMockAuthSession(page, { token });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/cuenta/datos-personales", { waitUntil: "domcontentloaded" });
  await esperarHidratacion(page);
  const foto = page.getByRole("img", { name: "Foto de perfil", exact: true });
  const cabecera = page.getByRole("banner", { name: "Barra superior de usuario" });
  await expect(foto).toHaveCount(0);
  await page.getByLabel("Archivo de foto de perfil").setInputFiles({ name: "nota.txt", mimeType: "text/plain", buffer: Buffer.from("no es imagen") });
  await expect(page.getByRole("alert").filter({ hasText: "Selecciona una imagen JPG, PNG o WebP de hasta 5 MB." })).toBeVisible();

  // Imagen real: el E2E comprueba que el navegador puede decodificarla.
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=", "base64");
  await page.getByLabel("Archivo de foto de perfil").setInputFiles({ name: "mi-foto.png", mimeType: "image/png", buffer: png });
  await expect(foto).toBeVisible();
  await expect(cabecera.getByRole("img", { name: "Prueba", exact: true })).toBeVisible();
  await expect.poll(() => foto.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(1);
  const descargar = await request.get((await foto.getAttribute("src"))!);
  expect(await descargar.body()).toEqual(png);

  // Reemplazar el mismo objeto debe mostrar sus nuevos bytes, sin caché anterior.
  const srcAnterior = (await foto.getAttribute("src"))!;
  const reemplazo = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
  await page.getByLabel("Archivo de foto de perfil").setInputFiles({ name: "otra-foto.png", mimeType: "image/png", buffer: reemplazo });
  await expect(foto).not.toHaveAttribute("src", srcAnterior);
  await expect.poll(() => foto.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(1);
  const srcNuevo = (await foto.getAttribute("src"))!;
  const nuevaDescarga = await request.get(srcNuevo);
  expect(await nuevaDescarga.body()).toEqual(reemplazo);
  await expect(cabecera.getByRole("img", { name: "Prueba", exact: true })).toHaveAttribute("src", srcNuevo);

  await page.getByLabel("Apellidos", { exact: true }).fill("E2E");
  await page.getByRole("button", { name: "Guardar cambios", exact: true }).click();
  await expect(page.getByText("Tus datos se guardaron correctamente", { exact: true })).toBeVisible();
  const perfil = await request.get(`${urlSupabaseE2E()}/rest/v1/usuarios`, { headers });
  expect((await perfil.json())[0].foto_url).toBe(`${USUARIO_ID_E2E}/perfil.png`);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(foto).toBeVisible();
  await expect.poll(() => foto.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(1);
  await expect(cabecera.getByRole("img", { name: "Prueba E2E", exact: true })).toBeVisible();

  await page.goto("/cuenta", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("img", { name: "Fotografía de Prueba E2E", exact: true })).toBeVisible();
  await expect(cabecera.getByRole("img", { name: "Prueba E2E", exact: true })).toBeVisible();
  await expect.poll(() => page.getByRole("img", { name: "Fotografía de Prueba E2E", exact: true }).evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(1);
  await expect.poll(() => cabecera.getByRole("img", { name: "Prueba E2E", exact: true }).evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(1);
  await page.goto("/mis-viajes", { waitUntil: "domcontentloaded" });
  await expect.poll(() => cabecera.getByRole("img", { name: "Prueba E2E", exact: true }).evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(1);
});
