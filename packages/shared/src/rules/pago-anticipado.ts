import type { Usuario } from "../types/usuario";
import type { MomentoPago } from "../types/pago";

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
 * No existen excepciones por historial ni por tipo de cuenta: los estados
 * 'al_cierre' que aún circulan pertenecen a traslados históricos y el gate
 * de base de datos los exime.
 */
export function determinarMomentoPago(_usuario: Usuario): ResultadoMomentoPago {
  return {
    momento: "anticipado",
    razon: "Todo traslado se cobra por medios electrónicos de forma anticipada, antes de operar."
  };
}
