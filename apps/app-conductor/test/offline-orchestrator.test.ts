import { describe, it, expect } from "vitest";

// offline-orchestrator.ts es un shim que re-exporta desde lib/offline/index.ts
// Verificamos que las exportaciones nombradas y el default existan.
import {
  OfflineOrchestrator,
  purgarColaExpirada,
} from "../src/lib/offline-orchestrator";

describe("offline-orchestrator.ts", () => {
  it("exporta OfflineOrchestrator como objeto", () => {
    expect(OfflineOrchestrator).toBeDefined();
    expect(typeof OfflineOrchestrator).toBe("object");
  });

  it("exporta OfflineOrchestrator como default", async () => {
    const modulo = await import("../src/lib/offline-orchestrator");
    expect(modulo.default).toBeDefined();
    expect(modulo.default).toBe(modulo.OfflineOrchestrator);
  });

  it("expone subobjetos de evidencia, telemetria, cache y snapshot", () => {
    const orchestrator = OfflineOrchestrator;

    expect(orchestrator.evidencia).toBeDefined();
    expect(orchestrator.telemetria).toBeDefined();
    expect(orchestrator.cache).toBeDefined();
    expect(orchestrator.snapshot).toBeDefined();
  });

  it("expone métodos de evidencia", () => {
    const e = OfflineOrchestrator.evidencia;

    expect(typeof e.encolar).toBe("function");
    expect(typeof e.leer).toBe("function");
    expect(typeof e.leerCompleta).toBe("function");
    expect(typeof e.sincronizar).toBe("function");
    expect(typeof e.contar).toBe("function");
    expect(typeof e.limpiar).toBe("function");
    expect(typeof e.limpiarCompleta).toBe("function");
  });

  it("expone métodos de telemetría", () => {
    const t = OfflineOrchestrator.telemetria;

    expect(typeof t.encolar).toBe("function");
    expect(typeof t.leer).toBe("function");
    expect(typeof t.sincronizar).toBe("function");
    expect(typeof t.contar).toBe("function");
  });

  it("expone métodos de caché de viaje activo", () => {
    const c = OfflineOrchestrator.cache;

    expect(typeof c.leer).toBe("function");
    expect(typeof c.guardar).toBe("function");
    expect(typeof c.limpiar).toBe("function");
    expect(typeof c.crearDesdePasaporte).toBe("function");
  });

  it("expone métodos de snapshot de sincronización", () => {
    const s = OfflineOrchestrator.snapshot;

    expect(typeof s.calcular).toBe("function");
    expect(typeof s.publicar).toBe("function");
    expect(typeof s.ultimo).toBe("function");
  });

  it("expone sincronizarTodo y purgarExpirada", () => {
    const o = OfflineOrchestrator;

    expect(typeof o.sincronizarTodo).toBe("function");
    expect(typeof o.purgarExpirada).toBe("function");
  });

  it("expone utilidad isOnline", () => {
    expect(typeof OfflineOrchestrator.isOnline).toBe("function");
  });

  it("purgarColaExpirada es una función exportada", () => {
    expect(typeof purgarColaExpirada).toBe("function");
  });

  it("OfflineOrchestrator.purgarExpirada es alias de purgarColaExpirada", () => {
    expect(OfflineOrchestrator.purgarExpirada).toBe(purgarColaExpirada);
  });
});
