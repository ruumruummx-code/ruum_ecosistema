import { describe, expect, it, vi } from "vitest";
import { guardarFotoEvidenciaSincronizada } from "./evidencia";

const FILA = {
  id: "evidencia-1",
  traslado_id: "traslado-1",
  tipo: "inicial" as const,
  angulo: "frente" as const,
  url: "user/traslado-1/inicial/evidencia-1-frente.jpg",
  capturada_en: "2026-10-21T12:00:00.000Z",
  sincronizada: true,
  sha256: "hash-nuevo"
};

function clienteMock({
  insertError = null,
  existente = null
}: {
  insertError?: { code?: string; message?: string } | null;
  existente?: { id: string; sha256: string | null } | null;
} = {}) {
  const insert = vi.fn(async () => ({ error: insertError }));
  const insertIncidencia = vi.fn(async () => ({ error: null }));
  const select = vi.fn(() => ({
    eq: vi.fn(() => ({
      maybeSingle: vi.fn(async () => ({ data: existente, error: null }))
    }))
  }));
  const update = vi.fn(() => ({
    eq: vi.fn(async () => ({ error: null }))
  }));
  const from = vi.fn((tabla: string) =>
    tabla === "incidencias" ? { insert: insertIncidencia } : { insert, select, update }
  );
  return { cliente: { from } as never, insert, insertIncidencia, select, update, from };
}

describe("cadena de custodia de la evidencia (RT-68)", () => {
  it("inserta la evidencia cuando no existe", async () => {
    const mock = clienteMock();

    await expect(guardarFotoEvidenciaSincronizada(mock.cliente, FILA)).resolves.toEqual({
      estado: "registrada",
      id: "evidencia-1"
    });
    expect(mock.insert).toHaveBeenCalledWith(FILA);
    expect(mock.update).not.toHaveBeenCalled();
    expect(mock.insertIncidencia).not.toHaveBeenCalled();
  });

  it("un duplicado con el mismo sha256 es un reintento idempotente", async () => {
    const mock = clienteMock({
      insertError: { code: "23505", message: "duplicate key value violates unique constraint" },
      existente: { id: "evidencia-1", sha256: "hash-nuevo" }
    });

    await expect(guardarFotoEvidenciaSincronizada(mock.cliente, FILA)).resolves.toEqual({
      estado: "duplicado_identico",
      id: "evidencia-1"
    });
    // No se sobrescribe nada ni se escala a soporte.
    expect(mock.update).not.toHaveBeenCalled();
    expect(mock.insertIncidencia).not.toHaveBeenCalled();
  });

  it("un duplicado con sha256 distinto es un conflicto: marca y avisa a soporte", async () => {
    const mock = clienteMock({
      insertError: { code: "23505", message: "duplicate key value violates unique constraint" },
      existente: { id: "evidencia-1", sha256: "hash-otro" }
    });

    await expect(guardarFotoEvidenciaSincronizada(mock.cliente, FILA)).resolves.toEqual({
      estado: "conflicto",
      id: "evidencia-1",
      sha256Registrado: "hash-otro",
      sha256Recibido: "hash-nuevo"
    });
    expect(mock.update).toHaveBeenCalledWith(
      expect.objectContaining({ conflicto: true, conflicto_detalle: expect.stringContaining("hash-otro") })
    );
    expect(mock.insertIncidencia).toHaveBeenCalledWith(
      expect.objectContaining({
        traslado_id: "traslado-1",
        tipo: "conflicto_evidencia",
        momento: "durante_traslado",
        reportada_por: "sistema"
      })
    );
  });

  it("un duplicado sin sha256 comparable también es un conflicto", async () => {
    const mock = clienteMock({
      insertError: { code: "23505", message: "duplicate key value violates unique constraint" },
      existente: { id: "evidencia-1", sha256: null }
    });

    const resultado = await guardarFotoEvidenciaSincronizada(mock.cliente, FILA);

    expect(resultado.estado).toBe("conflicto");
    expect(mock.insertIncidencia).toHaveBeenCalled();
  });

  it("cualquier otro error de escritura se propaga", async () => {
    const mock = clienteMock({ insertError: { code: "42501", message: "row-level security" } });

    await expect(guardarFotoEvidenciaSincronizada(mock.cliente, FILA)).rejects.toMatchObject({
      code: "42501"
    });
    expect(mock.insertIncidencia).not.toHaveBeenCalled();
  });
});
