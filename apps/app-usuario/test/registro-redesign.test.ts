import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REGISTRO = readFileSync(resolve(__dirname, "../src/app/registro/page.tsx"), "utf8");
const NAVEGACION = readFileSync(resolve(__dirname, "../src/app/NavegacionUsuario.tsx"), "utf8");
const EXPERIENCIA_PUBLICA = readFileSync(resolve(__dirname, "../src/app/experiencia-publica.tsx"), "utf8");
const GLOBALES = readFileSync(resolve(__dirname, "../src/app/globals.css"), "utf8");

describe("rediseño del registro de usuario", () => {
  it("usa el header con título contextual y pasos progresivos", () => {
    expect(REGISTRO).toContain("Crear cuenta");
    expect(REGISTRO).toContain('paso === 1 ? "Paso 1 de 3 · Datos básicos" : "Paso 2 de 3 · Acceso"');
    expect(NAVEGACION).toContain('aria-label="Acciones del usuario"');
    expect(NAVEGACION).toContain("user-v2-shell-header");
    const bloqueHeader = GLOBALES.slice(GLOBALES.indexOf(".user-v2-shell-header {"));
    expect(bloqueHeader).toContain("position: sticky");
    expect(bloqueHeader).toContain("backdrop-filter: blur");
  });

  it("presenta el formulario en una tarjeta accesible y elimina el logo vertical interno", () => {
    expect(REGISTRO).toContain("bg-white");
    expect(REGISTRO).not.toContain("<LogoRuum");
  });

  it("aplica verificación telefónica SMS y tokens de foco accesibles", () => {
    expect(REGISTRO).toContain("Verifica tu número celular");
    expect(EXPERIENCIA_PUBLICA).toContain("focus:border-[var(--ruum-teal-deep)]");
    expect(EXPERIENCIA_PUBLICA).toContain("focus:ring-[var(--ruum-teal)]/25");
    expect(GLOBALES).toContain("linear-gradient(100deg, var(--ruum-teal) 0%, #00aeb8 100%)");
  });
});
