import { describe, expect, it, vi } from "vitest";
import { guardarFotoEvidenciaSincronizada } from "./evidencia";

const fila = {
  id: "evidencia-1", traslado_id: "traslado-1", tipo: "inicial" as const,
  angulo: "frente" as const, url: "user/traslado-1/inicial/evidencia-1-frente.jpg",
  capturada_en: "2026-10-21T12:00:00.000Z", sincronizada: true, sha256: "a".repeat(64)
};

describe("registro atómico de evidencia", () => {
  it.each([false, true])("conserva el contrato de resultado al registrar o reintentar (duplicada=%s)", async duplicada => {
    const rpc = vi.fn(async () => ({ data: { ok: true, duplicada }, error: null }));
    await expect(guardarFotoEvidenciaSincronizada({ rpc } as never, fila)).resolves.toEqual({
      estado: duplicada ? "duplicado_identico" : "registrada", id: fila.id
    });
    expect(rpc).toHaveBeenCalledWith("registrar_foto_idempotente", { p_foto: fila });
  });
  it("un conflicto confirmado por servidor nunca se convierte en sincronización exitosa", async () => {
    const rpc = vi.fn(async () => ({ data: { ok: false, conflicto: true }, error: null }));
    await expect(guardarFotoEvidenciaSincronizada({ rpc } as never, fila)).resolves.toMatchObject({
      estado: "conflicto", id: fila.id, sha256Recibido: fila.sha256
    });
  });
  it("propaga rechazos sin aplicar un fallback de insert directo", async () => {
    const error = { code: "42501", message: "row-level security" };
    const rpc = vi.fn(async () => ({ data: null, error }));
    const from = vi.fn();
    await expect(guardarFotoEvidenciaSincronizada({ rpc, from } as never, fila)).rejects.toEqual(error);
    expect(from).not.toHaveBeenCalled();
  });
  it("una respuesta incompleta no acredita éxito ni conflicto resuelto", async () => {
    const rpc = vi.fn(async () => ({ data: null, error: null }));
    await expect(guardarFotoEvidenciaSincronizada({ rpc } as never, fila)).rejects.toThrow("evidence_registration_invalid_response");
  });
});
