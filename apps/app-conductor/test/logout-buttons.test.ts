import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function read(relativePath: string) {
  return readFileSync(resolve(__dirname, relativePath), "utf8");
}

const PANEL_FILE = read("../src/app/panel/page.tsx");

// Cuenta se extrajo a DriverAccountView (cabecera + diálogo de confirmación);
// la sección destacada "Cerrar Sesión Activa" vive en /cuenta/seguridad.
const CUENTA_FILE = read("../src/app/cuenta/page.tsx");
const CUENTA_VIEW_FILE = read("../src/app/cuenta/DriverAccountView.tsx");
const SEGURIDAD_FILE = read("../src/app/cuenta/seguridad/page.tsx");

describe("Botones de Cerrar Sesión - Panel y Cuenta", () => {
  it("incluye el botón de cerrar sesión en el panel", () => {
    expect(PANEL_FILE).toContain("useCerrarSesion");
    expect(PANEL_FILE).toContain("cerrarSesion()");
    expect(PANEL_FILE).toContain("cerrandoSesion");
    // El botón expone su nombre accesible por texto visible (no por aria-label).
    expect(PANEL_FILE).toContain("Cerrar sesión");
    expect(PANEL_FILE).toContain("Cerrando sesión");
  });

  it("incluye el botón de cerrar sesión en cuenta (cabecera y sección destacada)", () => {
    expect(CUENTA_FILE).toContain("useCerrarSesion");
    expect(CUENTA_FILE).toContain("cerrarSesion()");
    expect(CUENTA_FILE).toContain("cerrandoSesion");

    // Cabecera: botón de salida con diálogo de confirmación.
    expect(CUENTA_VIEW_FILE).toContain("Cerrar sesión");
    expect(CUENTA_VIEW_FILE).toContain("Cerrando sesión");

    // Sección destacada en /cuenta/seguridad.
    expect(SEGURIDAD_FILE).toContain("Cerrar Sesión Activa");
    expect(SEGURIDAD_FILE).toContain("cerrarSesion()");
    expect(SEGURIDAD_FILE).toContain("cerrandoSesion");
  });
});
