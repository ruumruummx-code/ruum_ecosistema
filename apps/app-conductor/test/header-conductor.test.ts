import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const NAVEGACION = readFileSync(resolve(__dirname, "../src/app/NavegacionConductor.tsx"), "utf8");

describe("header global del conductor", () => {
  it("mantiene el fondo navy, el ancho contenido y la alineación central", () => {
    expect(NAVEGACION).toContain("<header role=\"banner\"");
    expect(NAVEGACION).toContain("bg-[var(--ruum-navy)]/95");
    expect(NAVEGACION).toContain("max-w-7xl items-center");
    expect(NAVEGACION).toContain("px-4 py-4");
  });

  it("expone acciones semánticas e interactivas de notificaciones y soporte", () => {
    expect(NAVEGACION).toContain('aria-label="Acciones del conductor"');
    expect(NAVEGACION).toContain('href="/notificaciones"');
    expect(NAVEGACION).toContain('href="/cuenta/soporte"');
    expect(NAVEGACION).toContain('IcoNotificaciones className="size-6"');
    expect(NAVEGACION).toContain('IcoSoporte className="size-6"');
    expect(NAVEGACION).toContain("cursor-pointer");
    expect(NAVEGACION).toContain("transition duration-200");
  });

  it("usa datos reales para el saludo y el indicador sutil de pendientes", () => {
    expect(NAVEGACION).toContain("obtenerConductorActual(cliente)");
    expect(NAVEGACION).toContain("contarNotificacionesNoLeidas(cliente)");
    expect(NAVEGACION).toContain("¡Hola, ${nombre}!");
    expect(NAVEGACION).toContain("bg-sky-400 ring-2 ring-[var(--ruum-navy)]");
  });
});
