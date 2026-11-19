import type { SupabaseClient } from "npm:@supabase/supabase-js@2.47.16";
import type { Stripe } from "./stripe.ts";

interface ReembolsoPendiente {
  id: string;
  traslado_id: string;
  pago_id: string;
  stripe_payment_intent_id: string;
  monto: number | string;
  motivo: string;
}

/**
 * Ejecuta en Stripe los reembolsos encolados en `reembolsos_traslado`
 * (cancelación del usuario o cobro llegado después de cancelar).
 *
 * - La clave de idempotencia es el id del reembolso: un reintento (webhook,
 *   reconciliador o la propia Edge Function) nunca duplica el reembolso.
 * - El reclamo usa FOR UPDATE SKIP LOCKED: dos workers no procesan la misma fila.
 * - Un fallo queda en `fallido` con el error y se reintenta; tras 10 intentos
 *   pasa a la cola de revisión financiera.
 */
export async function procesarReembolsosPendientes(
  db: SupabaseClient,
  stripe: Stripe,
  opciones: { trasladoId?: string; limite?: number } = {}
): Promise<{ completados: number; fallidos: { id: string; codigo: string }[] }> {
  const { data, error } = await db.rpc("reclamar_reembolsos_traslado", {
    p_limite: opciones.limite ?? 20,
    p_traslado_id: opciones.trasladoId ?? null,
  });
  if (error) throw new Error("refund_claim_failed");
  let completados = 0;
  const fallidos: { id: string; codigo: string }[] = [];
  for (const fila of (data ?? []) as ReembolsoPendiente[]) {
    try {
      const centavos = Math.round(Number(fila.monto) * 100);
      if (!Number.isSafeInteger(centavos) || centavos <= 0) throw new Error("refund_amount_invalid");
      const refund = await stripe.refunds.create(
        {
          payment_intent: fila.stripe_payment_intent_id,
          amount: centavos,
          reason: "requested_by_customer",
          metadata: { reembolso_id: fila.id, traslado_id: fila.traslado_id, motivo: fila.motivo },
        },
        { idempotencyKey: `reembolso-${fila.id}` }
      );
      if (refund.status === "failed" || refund.status === "canceled") throw new Error(`refund_${refund.status}`);
      const resultado = await db.rpc("registrar_resultado_reembolso", { p_id: fila.id, p_ok: true, p_stripe_refund_id: refund.id, p_error: null });
      if (resultado.error) throw new Error("refund_result_write_failed");
      completados++;
    } catch (err) {
      const codigo = err instanceof Error ? err.message.slice(0, 120) : "refund_failed";
      fallidos.push({ id: fila.id, codigo });
      await db.rpc("registrar_resultado_reembolso", { p_id: fila.id, p_ok: false, p_stripe_refund_id: null, p_error: codigo });
    }
  }
  return { completados, fallidos };
}

/** Cancela PaymentIntents que siguen vivos para un traslado cancelado. */
export async function cancelarIntentsPendientes(stripe: Stripe, intentIds: string[]): Promise<string[]> {
  const noCancelados: string[] = [];
  for (const id of intentIds) {
    if (!/^pi_[a-zA-Z0-9]+$/.test(id)) continue;
    try {
      await stripe.paymentIntents.cancel(id, { cancellation_reason: "abandoned" });
    } catch (err) {
      // Si ya se cobró, Stripe rechaza la cancelación: el webhook/reconciliador
      // aplicará el cobro y aplicar_verificacion_pago_stripe encolará su reembolso.
      const intent = await stripe.paymentIntents.retrieve(id).catch(() => null);
      if (intent?.status !== "canceled") noCancelados.push(id);
      console.warn("cancelar_intent_fallido", { intent_id: id, status: intent?.status, code: err instanceof Error ? err.message.slice(0, 80) : "error" });
    }
  }
  return noCancelados;
}
