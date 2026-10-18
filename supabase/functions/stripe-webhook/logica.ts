/**
 * Lógica pura del webhook de Stripe — sin llamadas a red ni a Postgres, así
 * se puede probar con `deno test` igual que packages/shared/src/rules (sin
 * necesitar mockear el cliente de Supabase para la parte que de verdad
 * decide algo).
 */

/**
 * Idempotencia ante reintentos de Stripe: si Stripe no recibe 200 a tiempo,
 * reintenta el mismo evento. Sin este chequeo, un PaymentIntent exitoso
 * podría procesarse dos veces.
 */
export function esEventoYaProcesado(eventoIdActual: string, eventoIdGuardado: string | null | undefined): boolean {
  return eventoIdGuardado === eventoIdActual;
}

/**
 * PRD §4.6 — el cobro al usuario debe poder rastrearse hasta el traslado
 * exacto. Sin traslado_id en metadata, no hay a qué fila de `pagos`
 * aplicarle el resultado — se descarta el evento explícitamente en vez de
 * adivinar.
 */
export function extraerTrasladoId(metadata: Record<string, string> | null | undefined): string | null {
  return metadata?.traslado_id ?? null;
}

export type TipoEventoManejado =
  | "payment_intent.succeeded"
  | "payment_intent.payment_failed"
  | "checkout.session.completed"
  | "charge.refunded"
  | "charge.refund.updated"
  | "refund.created"
  | "refund.updated";

const EVENTOS_MANEJADOS: readonly TipoEventoManejado[] = [
  "payment_intent.succeeded",
  "payment_intent.payment_failed",
  "checkout.session.completed",
  "charge.refunded",
  "charge.refund.updated",
  "refund.created",
  "refund.updated"
];

export function esEventoManejado(tipo: string): tipo is TipoEventoManejado {
  return (EVENTOS_MANEJADOS as readonly string[]).includes(tipo);
}

/** Extrae el ID del PaymentIntent desde un objeto Stripe (Session, Charge, Refund) */
export function extraerPaymentIntentDeObjeto(objeto: {
  payment_intent?: string | { id?: string } | null;
}): string | null {
  if (!objeto) return null;
  if (typeof objeto.payment_intent === "string") return objeto.payment_intent;
  if (
    objeto.payment_intent &&
    typeof objeto.payment_intent === "object" &&
    typeof objeto.payment_intent.id === "string"
  ) {
    return objeto.payment_intent.id;
  }
  return null;
}

export function estadoTrasladoSiguienteTrasPago(
  estadoActual: string | null | undefined,
  tipoPago: string | null | undefined,
  estadoPago: "pendiente" | "completado" | "reembolsado" | "fallido"
): string | null {
  if (estadoPago !== "completado") return null;
  if (tipoPago !== "anticipado" && tipoPago !== "al_cierre") return null;

  if (
    (estadoActual === "cotizacion_aceptada" || estadoActual === "cotizacion_generada") &&
    tipoPago === "anticipado"
  ) {
    return "servicio_confirmado";
  }

  // Pago anticipado al concluir la solicitud (wizard): la solicitud pagada
  // avanza a documentación. Transición válida en estado_transiciones_validas.
  if (estadoActual === "solicitud_creada" && tipoPago === "anticipado") {
    return "documentacion_pendiente";
  }

  if (estadoActual === "entrega_confirmada" || estadoActual === "pago_pendiente") {
    return "pago_completado";
  }

  return null;
}
