import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REGISTRO = readFileSync(resolve(__dirname, "../src/app/registro/page.tsx"), "utf8");
const NAVEGACION = readFileSync(resolve(__dirname, "../src/app/NavegacionUsuario.tsx"), "utf8");
const EXPERIENCIA_PUBLICA = readFileSync(resolve(__dirname, "../src/app/experiencia-publica.tsx"), "utf8");
const GLOBALES = readFileSync(resolve(__dirname, "../src/app/globals.css"), "utf8");

describe("rediseño del registro de usuario", () => {
  it("usa el header navy con un título contextual y sin navegación inferior", () => {
    expect(REGISTRO).toContain('titulo={paso === 1 ? "¡Crea tu cuenta!" : "Configura tu acceso"}');
    expect(REGISTRO).toContain("mostrarEnAcceso");
    expect(REGISTRO).toContain("mostrarNavegacionInferior={false}");
    expect(NAVEGACION).toContain("bg-[var(--ruum-navy)]/95");
    expect(NAVEGACION).toContain('aria-label="Acciones del usuario"');
  });

  it("presenta el formulario en una tarjeta blanca y elimina el logo vertical interno", () => {
    expect(REGISTRO).toContain("bg-[#f3f6f9]");
    expect(REGISTRO).toContain("border-slate-200 bg-white");
    expect(REGISTRO).toContain("shadow-md");
    expect(REGISTRO).not.toContain("<LogoRuum");
  });

  it("aplica turquesa a progreso, foco y acción principal", () => {
    expect(REGISTRO).toContain("bg-[var(--ruum-teal)]");
    expect(EXPERIENCIA_PUBLICA).toContain("focus:border-[var(--ruum-teal-deep)]");
    expect(EXPERIENCIA_PUBLICA).toContain("focus:ring-[var(--ruum-teal)]/25");
    expect(GLOBALES).toContain("linear-gradient(100deg, var(--ruum-teal) 0%, #00aeb8 100%)");
  });
});
