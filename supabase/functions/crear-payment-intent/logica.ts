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

/**
 * Ajuste de un PaymentIntent reutilizable cuyo monto ya no coincide con el
 * precio vigente (precio_final ?? precio_cotizado). Antes se devolvía su
 * client_secret sin comparar: se cobraba el monto viejo y el webhook dejaba el
 * traslado en «requiere revisión».
 * - Estados editables: se actualiza el monto (paymentIntents.update).
 * - requires_action: se cancela y se crea otro con clave de idempotencia nueva.
 * - processing / requires_capture: el cobro ya está en curso; no se toca.
 */
export type AjusteMonto = { accion: "ninguno" } | { accion: "actualizar" } | { accion: "reemplazar" } | { accion: "en_proceso" };

export function decidirAjusteMonto(status: string, montoActualCentavos: number, montoVigenteCentavos: number): AjusteMonto {
  if (montoActualCentavos === montoVigenteCentavos) return { accion: "ninguno" };
  if (status === "requires_payment_method" || status === "requires_confirmation") return { accion: "actualizar" };
  if (status === "requires_action") return { accion: "reemplazar" };
  return { accion: "en_proceso" };
}

/**
 * `piso` viene de tarifas_config.piso_cobro (RPC piso_cobro_traslado): el mismo
 * valor que aplica calcular_tarifa_traslado. PISO_COBRO_MXN es solo respaldo.
 */
export function validarRangoMontoCobro(
  monto: number | null,
  piso: number = PISO_COBRO_MXN
): { valido: true } | { valido: false; error: string } {
  if (monto === null || monto <= 0) {
    return { valido: false, error: "El traslado todavía no cuenta con una cotización válida." };
  }

  if (monto < piso || monto > TECHO_COBRO_MXN) {
    return {
      valido: false,
      error: `El monto a cobrar ($${monto} MXN) está fuera del rango esperado ($${piso}-${TECHO_COBRO_MXN} MXN). Revísalo en panel-admin antes de cobrar.`
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

/**
 * RC-05 — clave de idempotencia para `stripe.paymentIntents.create`.
 *
 * Es estable por operación de cobro: dos pestañas o reintentos concurrentes
 * del mismo traslado obtienen el MISMO PaymentIntent en Stripe en lugar de
 * crear dos.
 *
 * IMPORTANTE: al reemplazar un PI muerto (cancelado), la clave debe CAMBIAR
 * porque Stripe cachea la respuesta 24 h por clave y devolvería el PI
 * cancelado. Por eso se incluye el id del PI reemplazado.
 */
export function claveIdempotenciaStripe(trasladoId: string, intentReemplazadoId?: string | null): string {
  return intentReemplazadoId
    ? `traslado-${trasladoId}-reemplazo-${intentReemplazadoId}`
    : `traslado-${trasladoId}`;
}

/**
 * Clave para un PI nuevo cuando NO hay uno pendiente en base. Incluye el monto
 * en centavos: si el precio cambió, Stripe no devuelve el PI cacheado (24 h)
 * con el monto anterior.
 */
export function claveIdempotenciaCobro(trasladoId: string, montoCentavos: number, intentReemplazadoId?: string | null): string {
  return `${claveIdempotenciaStripe(trasladoId, intentReemplazadoId)}-${montoCentavos}`;
}
