/**
 * Lógica pura de reconciliación de pagos de Stripe — evalúa el estado del
 * PaymentIntent devuelto por la API de Stripe contra el estado esperado en BD.
 */

export type AccionReconciliacion =
  | { tipo: "completar"; pagoEstado: "completado"; cargaMasivaId?: string }
  | { tipo: "reembolsar"; pagoEstado: "reembolsado" }
  | { tipo: "fallar"; pagoEstado: "fallido" }
  | { tipo: "ignorar"; motivo: string };

export interface PaymentIntentMinimo {
  id: string;
  status: string;
  amount_received?: number;
  currency?: string;
  metadata?: Record<string, string>;
  charges?: { data?: Array<{ refunded?: boolean; amount_refunded?: number }> };
}

export function decidirAccionPagoIntent(intent: PaymentIntentMinimo): AccionReconciliacion {
  if (intent.status === "canceled") {
    return { tipo: "fallar", pagoEstado: "fallido" };
  }

  if (intent.status !== "succeeded") {
    return { tipo: "ignorar", motivo: `PaymentIntent en status '${intent.status}' (no completado en Stripe)` };
  }

  // Verificar si hubo reembolso en el cargo asociado
  const cargos = intent.charges?.data ?? [];
  const cargoReembolsado = cargos.some((c) => c.refunded === true);
  if (cargoReembolsado) {
    return { tipo: "reembolsar", pagoEstado: "reembolsado" };
  }

  if (intent.metadata?.carga_masiva_id) {
    return {
      tipo: "completar",
      pagoEstado: "completado",
      cargaMasivaId: intent.metadata.carga_masiva_id
    };
  }

  return { tipo: "completar", pagoEstado: "completado" };
}

export type AccionCheckoutHuerfano =
  | { tipo: "confirmar" }
  | { tipo: "cancelar_stripe_y_expirar" }
  | { tipo: "expirar" }
  | { tipo: "ignorar" };

export function decidirAccionCheckoutHuerfano(intent: { status: string }): AccionCheckoutHuerfano {
  if (intent.status === "succeeded") {
    return { tipo: "confirmar" };
  }
  if (intent.status === "canceled") {
    return { tipo: "expirar" };
  }
  if (["requires_payment_method", "requires_confirmation", "requires_action", "processing"].includes(intent.status)) {
    return { tipo: "cancelar_stripe_y_expirar" };
  }
  return { tipo: "ignorar" };
}

