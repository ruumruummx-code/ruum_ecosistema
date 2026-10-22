import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const preferencesStore = vi.hoisted(() => new Map<string, string>());

vi.mock("@capacitor/preferences", () => ({
  Preferences: {
    get: vi.fn(async ({ key }: { key: string }) => ({ value: preferencesStore.get(key) ?? null })),
    set: vi.fn(async ({ key, value }: { key: string; value: string }) => {
      preferencesStore.set(key, value);
    }),
    remove: vi.fn(async ({ key }: { key: string }) => {
      preferencesStore.delete(key);
    })
  }
}));

const mockRecordOperationalEvent = vi.fn();
vi.mock("../src/lib/observability", () => ({
  recordOperationalEvent: (...args: unknown[]) => mockRecordOperationalEvent(...args)
}));

import {
  leerEvidenciasDescartadas,
  registrarEvidenciaDescartada,
  obtenerEvidenciasDescartadasPorTraslado,
  resolverEvidenciaDescartada,
  limpiarTodasEvidenciasDescartadas,
  CLAVE_EVIDENCIAS_DESCARTADAS,
  type EvidenciaDescartada
} from "../src/lib/evidencias-descartadas";

describe("evidencias descartadas — persistencia, aviso y observabilidad", () => {
  beforeEach(async () => {
    preferencesStore.clear();
    mockRecordOperationalEvent.mockClear();
  });

  afterEach(async () => {
    await limpiarTodasEvidenciasDescartadas();
  });

  it("lee lista vacía inicialmente", async () => {
    const items = await leerEvidenciasDescartadas();
    expect(items).toEqual([]);
  });

  it("persiste un descarte, evita duplicados por localId y notifica a observabilidad", async () => {
    const descarte: EvidenciaDescartada = {
      localId: "loc-123",
      trasladoId: "tras-abc",
      razon: "ttl_expirado",
      fecha: new Date().toISOString(),
      angulo: "frontal",
      tipo: "inicial"
    };

    await registrarEvidenciaDescartada(descarte);

    const items = await leerEvidenciasDescartadas();
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      localId: "loc-123",
      trasladoId: "tras-abc",
      razon: "ttl_expirado",
      angulo: "frontal"
    });

    expect(mockRecordOperationalEvent).toHaveBeenCalledWith(
      "evidence_discarded",
      expect.objectContaining({
        localId: "loc-123",
        trasladoId: "tras-abc",
        razon: "ttl_expirado",
        angulo: "frontal"
      }),
      "error"
    );

    // Reintento de registrar mismo localId es idempotente
    await registrarEvidenciaDescartada(descarte);
    const despues = await leerEvidenciasDescartadas();
    expect(despues).toHaveLength(1);
  });

  it("filtra descartes por traslado específico", async () => {
    await registrarEvidenciaDescartada({
      localId: "loc-1",
      trasladoId: "tras-1",
      razon: "max_reintentos",
      fecha: new Date().toISOString(),
      angulo: "lateral_izquierdo"
    });
    await registrarEvidenciaDescartada({
      localId: "loc-2",
      trasladoId: "tras-2",
      razon: "ttl_expirado",
      fecha: new Date().toISOString(),
      angulo: "trasera"
    });

    const tras1 = await obtenerEvidenciasDescartadasPorTraslado("tras-1");
    expect(tras1).toHaveLength(1);
    expect(tras1[0].localId).toBe("loc-1");

    const tras2 = await obtenerEvidenciasDescartadasPorTraslado("tras-2");
    expect(tras2).toHaveLength(1);
    expect(tras2[0].localId).toBe("loc-2");

    const trasInexistente = await obtenerEvidenciasDescartadasPorTraslado("tras-999");
    expect(trasInexistente).toHaveLength(0);
  });

  it("permite resolver/descartar un aviso de evidencia específica", async () => {
    await registrarEvidenciaDescartada({
      localId: "loc-1",
      trasladoId: "tras-1",
      razon: "max_reintentos",
      fecha: new Date().toISOString()
    });
    await registrarEvidenciaDescartada({
      localId: "loc-2",
      trasladoId: "tras-1",
      razon: "ttl_expirado",
      fecha: new Date().toISOString()
    });

    await resolverEvidenciaDescartada("loc-1");

    const restantes = await leerEvidenciasDescartadas();
    expect(restantes).toHaveLength(1);
    expect(restantes[0].localId).toBe("loc-2");
  });
});
