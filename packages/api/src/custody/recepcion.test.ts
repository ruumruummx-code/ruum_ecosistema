import { describe, expect, it, vi } from "vitest";
import { consultarAcuseRecepcion, guardarAcuseRecepcion } from "./recepcion";

describe("Dominio Custodia — Acuse de Recepción y Firma Digital", () => {
  it("consultarAcuseRecepcion detecta evento con firma en custodia", async () => {
    const clienteMock = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [
                {
                  id: "ev-1",
                  tipo: "vehicle_delivered",
                  firma_metodo: "digital_canvas",
                  firma_referencia: "user123/trip1/final/firma.png",
                  metadata: {
                    receptor_nombre: "Juan Pérez",
                    mecanismo: "firma",
                    firma_guardada: true,
                  },
                  ocurrido_en: "2026-11-01T15:00:00Z",
                },
              ],
              error: null,
            }),
          }),
        }),
      }),
    };

    const resultado = await consultarAcuseRecepcion(clienteMock as never, "trip-123");
    expect(resultado.persistido).toBe(true);
    expect(resultado.receptorNombre).toBe("Juan Pérez");
    expect(resultado.referenciaFirma).toBe("user123/trip1/final/firma.png");
  });

  it("consultarAcuseRecepcion retorna false si no hay eventos de firma", async () => {
    const clienteMock = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      }),
    };

    const resultado = await consultarAcuseRecepcion(clienteMock as never, "trip-empty");
    expect(resultado.persistido).toBe(false);
  });

  it("guardarAcuseRecepcion valida nombre obligatorio y persiste en Storage y Custodia", async () => {
    const uploadMock = vi.fn().mockResolvedValue({ error: null });
    const rpcMock = vi.fn().mockResolvedValue({ data: "evento-uuid-1", error: null });

    const clienteMock = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "conductor-auth-1" } } }),
      },
      storage: {
        from: vi.fn().mockReturnValue({
          upload: uploadMock,
        }),
      },
      rpc: rpcMock,
      from: vi.fn().mockReturnValue({
        upsert: vi.fn().mockResolvedValue({ error: null }),
      }),
    };

    const res = await guardarAcuseRecepcion(clienteMock as never, {
      trasladoId: "93000000-0000-4000-8000-000000000001",
      receptorNombre: "Carlos Santana",
      receptorTelefono: "5512345678",
      firmaDataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      odometro: 12500,
      combustible: "100%",
    });

    expect(res.ok).toBe(true);
    expect(uploadMock).toHaveBeenCalled();
    expect(rpcMock).toHaveBeenCalledWith(
      "registrar_evento_custodia",
      expect.objectContaining({
        p_tipo: "vehicle_delivered",
        p_firma_metodo: "digital_canvas",
        p_metadata: expect.objectContaining({
          mecanismo: "firma",
          receptor_nombre: "Carlos Santana",
          firma_guardada: true,
        }),
      })
    );
  });

  it("guardarAcuseRecepcion rechaza nombres vacíos o menores a 2 caracteres", async () => {
    const clienteMock = {};
    await expect(
      guardarAcuseRecepcion(clienteMock as never, {
        trasladoId: "trip-1",
        receptorNombre: " ",
        firmaDataUrl: "data:image/png;base64,abc",
      })
    ).rejects.toThrow(/nombre de quien recibe el vehículo es obligatorio/i);
  });
});
