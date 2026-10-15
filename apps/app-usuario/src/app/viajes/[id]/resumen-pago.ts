import type { Database } from "@ruum/shared/types";
import { humanizar } from "./piezas-pasaporte";
import type { Pago, Pasaporte } from "./tipos-pasaporte";

/**
 * FIX A1 (ticket arquitectura Fase 4): resumen de pago extraído de
 * `PasaporteDigitalSegmentado` (god-component). Lógica pura y testeable:
 * el componente solo consume el resultado para pintar la pestaña Recibo.
 */
export interface ResumenPagoPasaporte {
  metodoPago: string | null;
  totalPagado: number;
  pagoRealizado: boolean;
  montoMostrado: number;
  saldoPendiente: number;
  estadoPago: "Pagado" | "Pago parcial" | "Pendiente";
}

const ESTADOS_POST_PAGO_CONFIRMADO: Database["public"]["Enums"]["estado_traslado"][] = [
  "servicio_confirmado",
  "pendiente_de_conductor",
  "conductor_asignado",
  "conductor_en_camino_al_origen",
  "conductor_en_punto_de_recoleccion",
  "verificacion_vehiculo_en_proceso",
  "evidencia_inicial_en_proceso",
  "evidencia_inicial_completada",
  "vehiculo_recibido",
  "traslado_en_curso",
  "incidencia_reportada",
  "llegada_a_destino",
  "evidencia_final_en_proceso",
  "evidencia_final_completada",
  "entrega_confirmada",
  "pago_completado",
  "servicio_cerrado",
];

export function resumirPagoPasaporte(
  pasaporte: Pasaporte,
  pagos: Pago[],
  precioBase: number,
  estado: Database["public"]["Enums"]["estado_traslado"]
): ResumenPagoPasaporte {
  const metodoPago =
    pagos.length > 0 && pagos[0]?.metodo
      ? humanizar(String(pagos[0].metodo))
      : (humanizar(pasaporte.tipo_pago) ?? "Por definir");
  const totalPagosCompletados = pagos
    .filter((p) => p.estado === "completado")
    .reduce((sum, p) => sum + (p.monto ?? 0), 0);

  const totalPagado = Math.max(pasaporte.monto_pagado ?? 0, totalPagosCompletados);

  const pagoRealizado =
    totalPagado > 0 ||
    pagos.some((p) => p.estado === "completado") ||
    ESTADOS_POST_PAGO_CONFIRMADO.includes(estado);

  const montoMostrado = pagoRealizado && totalPagado === 0 && precioBase > 0 ? precioBase : totalPagado;
  const saldoPendiente = Math.max(0, precioBase - montoMostrado);

  const estadoPago =
    pagoRealizado || (precioBase > 0 && montoMostrado >= precioBase)
      ? "Pagado"
      : montoMostrado > 0
        ? "Pago parcial"
        : "Pendiente";

  return { metodoPago, totalPagado, pagoRealizado, montoMostrado, saldoPendiente, estadoPago };
}
