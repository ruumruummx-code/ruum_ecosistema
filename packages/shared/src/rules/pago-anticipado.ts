import type { Usuario } from "../types/usuario";
import type { MomentoPago } from "../types/pago";

// PRD §4.6 — "Historial positivo se define como al menos 2 traslados
// completados sin incidencias de pago; Admin puede ajustar este umbral."
// Se conserva por compatibilidad histórica (traslados al_cierre creados
// antes de la política estricta); la creación vigente ya no lo usa.
export const UMBRAL_HISTORIAL_POSITIVO = 2;

export interface ResultadoMomentoPago {
  momento: MomentoPago;
  razon: string;
}

/**
 * Política estricta de cobro (regla de negocio vigente):
 * SOLO pago por medios electrónicos y de forma anticipada. Todo traslado
 * nuevo nace con tipo_pago = 'anticipado' (forzado en el servidor por
 * usuario_crea_traslado) y no puede operar sin un pago completado en
 * Stripe — ver migración gate_pago_anticipado_antes_de_operar.
 *
 * Los historiales 'al_cierre' (empresa titular o historial positivo) dejan
 * de otorgarse: existen únicamente para traslados históricos y el gate de
 * base de datos los exime. La firma se conserva para no romper callers.
 */
export function determinarMomentoPago(
  _usuario: Usuario,
  _umbralHistorialPositivo: number = UMBRAL_HISTORIAL_POSITIVO
): ResultadoMomentoPago {
  return {
    momento: "anticipado",
    razon: "Todo traslado se cobra por medios electrónicos de forma anticipada, antes de operar."
  };
}
