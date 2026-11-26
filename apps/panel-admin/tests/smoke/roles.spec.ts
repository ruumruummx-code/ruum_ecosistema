import { test, expect } from "@playwright/test";

test.describe("Smoke E2E: Control de Acceso por Rol en panel-admin", () => {
  test.describe("Rol Operador", () => {
    test.beforeEach(async ({ context }) => {
      await context.addCookies([
        {
          name: "ruum_smoke_rol",
          value: "operador",
          domain: "127.0.0.1",
          path: "/"
        }
      ]);
    });

    test("puede acceder a sus módulos autorizados (/viajes, /mapa, /incidencias)", async ({ page }) => {
      await page.goto("/viajes");
      expect(page.url()).toContain("/viajes");
      await expect(page.locator("text=No tienes permiso para abrir esta sección")).not.toBeVisible();

      await page.goto("/mapa");
      expect(page.url()).toContain("/mapa");
      await expect(page.locator("text=No tienes permiso para abrir esta sección")).not.toBeVisible();

      await page.goto("/incidencias");
      expect(page.url()).toContain("/incidencias");
      await expect(page.locator("text=No tienes permiso para abrir esta sección")).not.toBeVisible();
    });

    test("es redirigido a /sin-permiso al intentar entrar a módulos no autorizados (/tarifas, /pagos, /usuarios)", async ({ page }) => {
      await page.goto("/tarifas");
      expect(page.url()).toContain("/sin-permiso");
      await expect(page.locator("text=No tienes permiso para abrir esta sección")).toBeVisible();

      await page.goto("/pagos");
      expect(page.url()).toContain("/sin-permiso");
      await expect(page.locator("text=No tienes permiso para abrir esta sección")).toBeVisible();

      await page.goto("/usuarios");
      expect(page.url()).toContain("/sin-permiso");
      await expect(page.locator("text=No tienes permiso para abrir esta sección")).toBeVisible();
    });
  });

  test.describe("Rol Supervisor", () => {
    test.beforeEach(async ({ context }) => {
      await context.addCookies([
        {
          name: "ruum_smoke_rol",
          value: "supervisor",
          domain: "127.0.0.1",
          path: "/"
        }
      ]);
    });

    test("puede acceder a sus módulos autorizados (/viajes, /incidencias, /reportes)", async ({ page }) => {
      await page.goto("/viajes");
      expect(page.url()).toContain("/viajes");
      await expect(page.locator("text=No tienes permiso para abrir esta sección")).not.toBeVisible();

      await page.goto("/incidencias");
      expect(page.url()).toContain("/incidencias");
      await expect(page.locator("text=No tienes permiso para abrir esta sección")).not.toBeVisible();

      await page.goto("/reportes");
      expect(page.url()).toContain("/reportes");
      await expect(page.locator("text=No tienes permiso para abrir esta sección")).not.toBeVisible();
    });

    test("es redirigido a /sin-permiso al intentar entrar a módulos financieros o de usuarios (/tarifas, /pagos, /usuarios)", async ({ page }) => {
      await page.goto("/tarifas");
      expect(page.url()).toContain("/sin-permiso");
      await expect(page.locator("text=No tienes permiso para abrir esta sección")).toBeVisible();

      await page.goto("/pagos");
      expect(page.url()).toContain("/sin-permiso");
      await expect(page.locator("text=No tienes permiso para abrir esta sección")).toBeVisible();

      await page.goto("/usuarios");
      expect(page.url()).toContain("/sin-permiso");
      await expect(page.locator("text=No tienes permiso para abrir esta sección")).toBeVisible();
    });
  });

  test.describe("Rol Finanzas", () => {
    test.beforeEach(async ({ context }) => {
      await context.addCookies([
        {
          name: "ruum_smoke_rol",
          value: "finanzas",
          domain: "127.0.0.1",
          path: "/"
        }
      ]);
    });

    test("puede acceder a sus módulos autorizados (/viajes, /pagos, /tarifas)", async ({ page }) => {
      await page.goto("/viajes");
      expect(page.url()).toContain("/viajes");
      await expect(page.locator("text=No tienes permiso para abrir esta sección")).not.toBeVisible();

      await page.goto("/pagos");
      expect(page.url()).toContain("/pagos");
      await expect(page.locator("text=No tienes permiso para abrir esta sección")).not.toBeVisible();

      await page.goto("/tarifas");
      expect(page.url()).toContain("/tarifas");
      await expect(page.locator("text=No tienes permiso para abrir esta sección")).not.toBeVisible();
    });

    test("es redirigido a /sin-permiso al intentar acceder a mapa u operaciones de campo (/mapa, /conductores, /incidencias)", async ({ page }) => {
      await page.goto("/mapa");
      expect(page.url()).toContain("/sin-permiso");
      await expect(page.locator("text=No tienes permiso para abrir esta sección")).toBeVisible();

      await page.goto("/conductores");
      expect(page.url()).toContain("/sin-permiso");
      await expect(page.locator("text=No tienes permiso para abrir esta sección")).toBeVisible();

      await page.goto("/incidencias");
      expect(page.url()).toContain("/sin-permiso");
      await expect(page.locator("text=No tienes permiso para abrir esta sección")).toBeVisible();
    });
  });

  test.describe("Rol Compliance", () => {
    test.beforeEach(async ({ context }) => {
      await context.addCookies([
        {
          name: "ruum_smoke_rol",
          value: "compliance",
          domain: "127.0.0.1",
          path: "/"
        }
      ]);
    });

    test("puede acceder a sus módulos autorizados (/documentos, /incidencias, /usuarios)", async ({ page }) => {
      await page.goto("/documentos");
      expect(page.url()).toContain("/documentos");
      await expect(page.locator("text=No tienes permiso para abrir esta sección")).not.toBeVisible();

      await page.goto("/incidencias");
      expect(page.url()).toContain("/incidencias");
      await expect(page.locator("text=No tienes permiso para abrir esta sección")).not.toBeVisible();

      await page.goto("/usuarios");
      expect(page.url()).toContain("/usuarios");
      await expect(page.locator("text=No tienes permiso para abrir esta sección")).not.toBeVisible();
    });

    test("es redirigido a /sin-permiso al intentar acceder a traslados o finanzas (/viajes, /mapa, /pagos)", async ({ page }) => {
      await page.goto("/viajes");
      expect(page.url()).toContain("/sin-permiso");
      await expect(page.locator("text=No tienes permiso para abrir esta sección")).toBeVisible();

      await page.goto("/mapa");
      expect(page.url()).toContain("/sin-permiso");
      await expect(page.locator("text=No tienes permiso para abrir esta sección")).toBeVisible();

      await page.goto("/pagos");
      expect(page.url()).toContain("/sin-permiso");
      await expect(page.locator("text=No tienes permiso para abrir esta sección")).toBeVisible();
    });
  });

  test.describe("Rol Dirección", () => {
    test.beforeEach(async ({ context }) => {
      await context.addCookies([
        {
          name: "ruum_smoke_rol",
          value: "direccion",
          domain: "127.0.0.1",
          path: "/"
        }
      ]);
    });

    test("tiene acceso integral a todos los módulos (/viajes, /tarifas, /usuarios, /pagos)", async ({ page }) => {
      for (const ruta of ["/viajes", "/tarifas", "/usuarios", "/pagos"]) {
        await page.goto(ruta);
        expect(page.url()).toContain(ruta);
        await expect(page.locator("text=No tienes permiso para abrir esta sección")).not.toBeVisible();
      }
    });
  });
});
