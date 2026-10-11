import { describe, expect, it } from "vitest";
import { ESTADOS_TRASLADO } from "@ruum/shared/states";
import { CATEGORIA_POR_ESTADO, ETIQUETA_CATEGORIA } from "./estado-visual";
import { ETAPAS_TRASLADO, indiceEtapaActual } from "./etapas";
import { estadoVisualDesdeTecnico, type EstadoVisualTraslado } from "./status-mapping";

// Mapa exhaustivo esperado técnico -> visual (derivado del switch; si cambia el
// switch, este test obliga a actualizar la expectativa de forma consciente).
const ESPERADO: Record<string, EstadoVisualTraslado> = {
  usuario_pendiente_verificacion: "solicitado",
  usuario_verificado: "solicitado",
  solicitud_creada: "solicitado",
  documentacion_pendiente: "pendiente-conductor",
  documentacion_en_revision: "pendiente-conductor",
  documentacion_validada: "evidencia-inicial-completa",
  cotizacion_generada: "cotizacion-confirmada",
  cotizacion_aceptada: "cotizacion-confirmada",
  servicio_confirmado: "cotizacion-confirmada",
  pendiente_de_conductor: "pendiente-conductor",
  conductor_asignado: "conductor-asignado",
  conductor_en_camino_al_origen: "conductor-asignado",
  conductor_en_punto_de_recoleccion: "conductor-asignado",
  verificacion_vehiculo_en_proceso: "en-ruta",
  evidencia_inicial_en_proceso: "en-ruta",
  evidencia_inicial_completada: "evidencia-inicial-completa",
  vehiculo_recibido: "evidencia-inicial-completa",
  traslado_en_curso: "en-ruta",
  incidencia_reportada: "incidente-abierto",
  llegada_a_destino: "en-ruta",
  evidencia_final_en_proceso: "evidencia-pendiente",
  evidencia_final_completada: "entrega-confirmada",
  entrega_confirmada: "entrega-confirmada",
  pago_pendiente: "evidencia-pendiente",
  pago_completado: "cerrado",
  servicio_cerrado: "cerrado",
  servicio_cancelado: "cancelado",
  traslado_fallido: "cancelado",
  dano_no_reportado_en_revision: "incidente-abierto",
  reclamo_abierto: "incidente-abierto",
  reclamo_resuelto: "cerrado",
  cierre_operativo_con_incidencia_abierta: "incidente-abierto",
  disputa_abierta: "incidente-abierto",
  disputa_resuelta: "cerrado",
};

describe("status-mapping — cobertura total de los 34 estados", () => {
  it("cubre exactamente los 34 estados técnicos", () => {
    expect(Object.keys(ESPERADO).sort()).toEqual([...ESTADOS_TRASLADO].sort());
    for (const estado of ESTADOS_TRASLADO) {
      expect(estadoVisualDesdeTecnico(estado), estado).toBe(ESPERADO[estado]);
    }
  });

  it("estados desconocidos caen al valor seguro 'solicitado'", () => {
    expect(estadoVisualDesdeTecnico("estado_inexistente")).toBe("solicitado");
    expect(estadoVisualDesdeTecnico("")).toBe("solicitado");
  });
});

describe("etapas — stepper lineal", () => {
  it("los ids de etapa son únicos y ordenados", () => {
    const ids = ETAPAS_TRASLADO.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(["solicitud", "confirmacion", "conductor", "recoleccion", "transito", "entrega", "cierre"]);
  });

  it("indiceEtapaActual resuelve el camino feliz y -1 fuera de él", () => {
    expect(indiceEtapaActual("solicitud_creada")).toBe(0);
    expect(indiceEtapaActual("conductor_asignado")).toBe(2);
    expect(indiceEtapaActual("traslado_en_curso")).toBe(4);
    expect(indiceEtapaActual("servicio_cerrado")).toBe(6);
    expect(indiceEtapaActual("servicio_cancelado")).toBe(-1);
    expect(indiceEtapaActual("disputa_abierta")).toBe(-1);
  });
});

describe("estado-visual — etiquetas de categoría", () => {
  it("toda categoría tiene etiqueta no vacía", () => {
    const categorias = new Set(Object.values(CATEGORIA_POR_ESTADO));
    expect(Object.keys(ETIQUETA_CATEGORIA).sort()).toEqual([...categorias].sort());
    for (const etiqueta of Object.values(ETIQUETA_CATEGORIA)) {
      expect(etiqueta.trim().length).toBeGreaterThan(0);
    }
  });
});
