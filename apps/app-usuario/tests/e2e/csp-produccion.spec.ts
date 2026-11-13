import { expect, test } from "@playwright/test";
import { seedMockAuthSession, nombreCookieSesion } from "./fixtures/sesion";

test.describe("CSP de producción", () => {
  test.skip(process.env.PLAYWRIGHT_E2E_PRODUCCION !== "1" || process.env.PLAYWRIGHT_E2E_SUPABASE_REAL === "1", "Requiere build de producción con Supabase local");

  for (const renovar of [false, true]) {
    test(`autoriza los scripts de Next con ${renovar ? "renovación de sesión" : "sesión anónima"}`, async ({ page }, info) => {
      if (renovar) await seedMockAuthSession(page, { expirada: true });
      await page.setExtraHTTPHeaders({ "content-security-policy": "script-src 'nonce-ajeno'", "x-nonce": "ajeno" });
      const violaciones: string[] = [];
      const erroresHidratacion: string[] = [];
      const registrarErrorDeHidratacion = (mensaje: string) => {
        if (/hydrat|Minified React error #(418|419|421|422|423|424|425)\b/i.test(mensaje)) {
          erroresHidratacion.push(mensaje);
        }
      };
      page.on("pageerror", (error) => registrarErrorDeHidratacion(error.message));
      page.on("console", (msg) => {
        if (/violates.*script-src/i.test(msg.text())) violaciones.push(msg.text());
        if (msg.type() === "error") registrarErrorDeHidratacion(msg.text());
      });
      const respuesta = await page.goto(renovar ? "/soporte" : "/login");
      expect(respuesta?.status()).toBe(200);
      const nonce = respuesta?.headers()["x-nonce"];
      expect(nonce).toBeTruthy();
      expect(nonce).not.toBe("ajeno");
      expect(respuesta?.headers()["content-security-policy"]).toContain(`'nonce-${nonce}' 'strict-dynamic'`);
      const bootstrap = await page.locator("script:not([src])").evaluateAll(
        (nodos) => nodos.filter((nodo) => nodo.textContent?.includes("self.__next_f"))
          .map((nodo) => (nodo as HTMLScriptElement).nonce)
      );
      expect(bootstrap.length).toBeGreaterThan(0);
      expect([...new Set(bootstrap)]).toEqual([nonce]);
      if (renovar) {
        expect(new URL(page.url()).pathname).toBe("/soporte");
        const cookies = await respuesta?.headerValues("set-cookie");
        expect(cookies?.some((cookie) => cookie.startsWith(`${nombreCookieSesion()}=`))).toBe(true);
        const sesion = (await page.context().cookies()).find((cookie) => cookie.name === nombreCookieSesion());
        expect(sesion).toBeDefined();
        const datos = JSON.parse(Buffer.from(sesion!.value.replace(/^base64-/, ""), "base64url").toString());
        expect(datos.expires_at).toBeGreaterThan(Date.now() / 1000);
        await info.attach("red-y-consola-csp", {
          contentType: "application/json",
          body: JSON.stringify({
            ruta: new URL(page.url()).pathname,
            estadoHttp: respuesta?.status(),
            cookieRenovada: true,
            nonceBootstrapCoincide: true,
            violacionesScriptCsp: violaciones.length,
          }, null, 2),
        });
      } else {
        const mostrar = page.getByRole("button", { name: "Mostrar contraseña" }).filter({ visible: true });
        await mostrar.first().click();
        await expect(page.getByRole("button", { name: "Ocultar contraseña" }).filter({ visible: true }).first()).toBeVisible();
      }
      expect(violaciones).toEqual([]);
      expect(erroresHidratacion).toEqual([]);
    });
  }
});
