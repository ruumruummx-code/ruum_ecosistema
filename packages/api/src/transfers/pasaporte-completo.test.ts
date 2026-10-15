import { describe, expect, it, vi } from "vitest";
import { obtenerPasaporteCompleto, PasaporteError } from "./pasaporte";

const ID = "00000000-0000-0000-0000-000000000001";

function filaPasaporte() {
  return {
    traslado_id: ID,
    usuario_id: "u1",
    vehiculo_id: "v1",
    conductor_id: "c1",
    estado: "traslado_en_curso",
    monto_pagado: 0,
    precio_cotizado: 1800,
    precio_final: null,
    creado_en: "2026-01-01T00:00:00Z",
    actualizado_en: "2026-01-01T00:00:00Z"
  };
}

/** Cliente fake: vista + detalle; error inyectable por tabla. */
function clienteFake({ errorEn }: { errorEn?: string } = {}) {
  const terminal = (tabla: string) => {
    if (errorEn === tabla) return { data: null, error: new Error(`fallo ${tabla}`) };
    if (tabla === "pasaporte_digital") return { data: filaPasaporte(), error: null };
    if (tabla === "traslados") {
      return {
        data: {
          origen_direccion: "O",
          origen_ciudad: "CDMX",
          destino_direccion: "D",
          destino_ciudad: "CDMX",
          contacto_entrega_nombre: "A",
          contacto_entrega_telefono: "1",
          contacto_recepcion_nombre: "B",
          contacto_recepcion_telefono: "2",
          fecha_hora_programada: null,
          cotizacion_expira_en: null,
          tipo_servicio: null,
          motivo_servicio: null,
          ventana_recoleccion: null,
          ventana_entrega: null
        },
        error: null
      };
    }
    if (tabla === "vehiculos") return { data: { tipo: "sedan", marca: "X", modelo: "Y", anio: 2020 }, error: null };
    if (tabla === "conductores") return { data: { id: "c1", nombre: "N" }, error: null };
    return { data: null, error: null };
  };
  const cadena = (tabla: string): Record<string, unknown> => {
    const exterior: Record<string, unknown> = {};
    exterior.select = vi.fn().mockReturnValue(exterior);
    exterior.eq = vi.fn().mockReturnValue(exterior);
    exterior.in = vi.fn().mockResolvedValue(terminal(tabla));
    exterior.order = vi.fn().mockReturnValue(exterior);
    exterior.limit = vi.fn().mockReturnValue(exterior);
    exterior.maybeSingle = vi.fn().mockResolvedValue(terminal(tabla));
    // Los builders reales son thenables: al awaitarlos resuelven {data, error}.
    exterior.then = vi.fn((resolver: (v: unknown) => void) => Promise.resolve(terminal(tabla)).then(resolver));
    return exterior;
  };
  return { from: vi.fn((tabla: string) => cadena(tabla)) };
}

describe("obtenerPasaporteCompleto (FIX C2+C3 Fase 4)", () => {
  it("agrega las lecturas y deriva el monto pagado", async () => {
    const completo = await obtenerPasaporteCompleto(clienteFake() as never, ID);
    expect(completo?.pasaporte.traslado_id).toBe(ID);
    expect(completo?.traslado?.origen_ciudad).toBe("CDMX");
    expect(completo?.pagos).toEqual([]);
    expect(completo?.ultimaUbicacion).toBeNull();
  });

  it("devuelve null ante fila ausente (RLS/inexistente → NoEncontrado, no throw)", async () => {
    const cliente = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null })
          })
        })
      })
    };
    await expect(obtenerPasaporteCompleto(cliente as never, ID)).resolves.toBeNull();
  });

  it("lanza PasaporteError ante fallo de transporte (→ boundary + Sentry)", async () => {
    const causa = obtenerPasaporteCompleto(clienteFake({ errorEn: "pagos" }) as never, ID);
    await expect(causa).rejects.toBeInstanceOf(PasaporteError);
    await expect(causa).rejects.toMatchObject({ trasladoId: ID, operacion: "pagos" });
  });

  it("degrada la ubicación a null sin tumbar el pasaporte", async () => {
    const completo = await obtenerPasaporteCompleto(clienteFake({ errorEn: "ubicaciones_traslado" }) as never, ID);
    expect(completo?.pasaporte.traslado_id).toBe(ID);
    expect(completo?.ultimaUbicacion).toBeNull();
  });
});
