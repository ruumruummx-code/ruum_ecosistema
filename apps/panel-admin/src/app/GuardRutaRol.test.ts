import { afterEach, describe, expect, it, vi } from "vitest";
import { leerRolSimulado } from "./GuardRutaRol";

function simularNavegador(cookie: string, globalRol?: string) {
  vi.stubGlobal("document", { cookie });
  vi.stubGlobal("window", globalRol ? { __RUUM_SMOKE_ROL__: globalRol } : {});
}

describe("GuardRutaRol / rol simulado de smoke", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("lee la cookie del smoke en modo demo fuera de producción", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_PANEL_ADMIN_DEMO", "true");
    simularNavegador("otra=1; ruum_smoke_rol=finanzas");
    expect(leerRolSimulado()).toBe("finanzas");
  });

  it("usa el rol global si no hay cookie en modo demo", () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("NEXT_PUBLIC_PANEL_ADMIN_DEMO", "true");
    simularNavegador("", "compliance");
    expect(leerRolSimulado()).toBe("compliance");
  });

  it("ignora la cookie si el modo demo no está activo", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_PANEL_ADMIN_DEMO", "");
    simularNavegador("ruum_smoke_rol=direccion", "direccion");
    expect(leerRolSimulado()).toBeNull();
  });

  it("ignora la cookie en un build de producción aunque el modo demo esté activo", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_PANEL_ADMIN_DEMO", "true");
    simularNavegador("ruum_smoke_rol=direccion", "direccion");
    expect(leerRolSimulado()).toBeNull();
  });
});
