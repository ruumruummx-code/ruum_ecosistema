export interface TrasladoParaCobro {
  precio_cotizado: number | null;
  precio_final: number | null;
}

export const PISO_COBRO_MXN = 699;
export const TECHO_COBRO_MXN = 100000;

export function montoAutorizadoParaCobro(traslado: TrasladoParaCobro): number | null {
  const monto = traslado.precio_final ?? traslado.precio_cotizado;
  return typeof monto === "number" && Number.isFinite(monto) ? monto : null;
}

export function validarRangoMontoCobro(monto: number | null): { valido: true } | { valido: false; error: string } {
  if (monto === null || monto <= 0) {
    return { valido: false, error: "El traslado todavía no cuenta con una cotización válida." };
  }

  if (monto < PISO_COBRO_MXN || monto > TECHO_COBRO_MXN) {
    return {
      valido: false,
      error: `El monto a cobrar ($${monto} MXN) está fuera del rango esperado ($${PISO_COBRO_MXN}-${TECHO_COBRO_MXN} MXN). Revísalo en panel-admin antes de cobrar.`
    };
  }

  return { valido: true };
}

/**
 * Decisión ante un PaymentIntent existente reutilizable (fila pagos en
 * estado pendiente). Stripe rechaza inicializar Elements con un PI en
 * estado terminal ("This PaymentIntent is in a terminal state..."), así que
 * no basta con devolver su client_secret:
 * - succeeded: el cobro SÍ ocurrió (el webhook aún no lo refleja o falló).
 *   Se reconcilia en base y se avisa al cliente, en vez de romper Elements.
 * - canceled: el intento murió; se marca fallido y se crea uno nuevo abajo.
 * - cualquier otro estado (requires_payment_method, requires_action,
 *   processing, requires_confirmation, requires_capture): reutilizable.
 */
export type DecisionIntentExistente =
  | { accion: "reutilizar" }
  | { accion: "reconciliar" }
  | { accion: "reemplazar" };

export function decidirIntentExistente(status: string | null | undefined): DecisionIntentExistente {
  if (status === "succeeded") return { accion: "reconciliar" };
  if (status === "canceled") return { accion: "reemplazar" };
  return { accion: "reutilizar" };
}
