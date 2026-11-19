/// <reference lib="deno.ns" />
import { crearStripe, type Stripe } from "../_shared/stripe.ts";
import { procesarReembolsosPendientes } from "../_shared/reembolsos.ts";
import { createClient } from "npm:@supabase/supabase-js@2.47.16";
import { datosVerificacion, modoStripe, obtenerIntentoStripe, obtenerReembolsoCompletoStripe } from "../_shared/stripe-verificacion.ts";
const clave = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const stripe = crearStripe(clave);
const db = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Método no permitido", { status: 405 });
  let event: Stripe.Event;
  try { event = await stripe.webhooks.constructEventAsync(await req.text(), req.headers.get("stripe-signature") ?? "", Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? ""); }
  catch { return new Response("Firma inválida", { status: 400 }); }
  if (!["payment_intent.succeeded", "payment_intent.payment_failed", "payment_intent.processing", "payment_intent.canceled", "checkout.session.completed", "charge.refunded", "charge.refund.updated", "refund.created", "refund.updated"].includes(event.type)) return new Response("Evento no manejado", { status: 200 });
  try {
    if (event.livemode !== modoStripe(clave)) throw new Error("stripe_environment_mismatch");
    // Consultar el estado actual evita aplicar snapshots fallidos fuera de orden.
    let intentId: string | null = null;
    const snapshot = event.data.object as { id: string; payment_intent?: string | { id: string } | null };
    if (event.type.startsWith("payment_intent.")) intentId = snapshot.id;
    else if (event.type === "checkout.session.completed") {
      const session = await stripe.checkout.sessions.retrieve(snapshot.id);
      if (session.payment_status !== "paid") return new Response("Pago pendiente", { status: 200 });
      intentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;
    } else {
      // Preserve refunds; consult the provider and only mark full completed refunds.
      const refundEvent = event.type.startsWith("refund.") || event.type === "charge.refund.updated";
      const refund = refundEvent ? await stripe.refunds.retrieve(snapshot.id) : null;
      if (refund && refund.status !== "succeeded") return new Response("Reembolso pendiente", { status: 200 });
      const chargeId = refund ? (typeof refund.charge === "string" ? refund.charge : refund.charge?.id) : snapshot.id;
      if (!chargeId) throw new Error("refund_charge_missing");
      const charge = await stripe.charges.retrieve(chargeId);
      if (charge.livemode !== modoStripe(clave)) throw new Error("stripe_environment_mismatch");
      intentId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id ?? null;
      if (!intentId) throw new Error("refund_intent_missing");
      if (!charge.refunded) {
        // Reembolso parcial (p. ej. cancelación con penalización retenida): se
        // registra y, si no coincide con lo que emitimos, entra a la cola de
        // revisión de Finanzas. Antes respondía 200 sin guardar nada.
        const parcial = await db.rpc("registrar_reembolso_parcial_stripe", {
          p_evento_id: event.id, p_intent_id: intentId, p_charge_id: charge.id,
          p_monto_reembolsado_centavos: charge.amount_refunded, p_monto_cargo_centavos: charge.amount, p_livemode: charge.livemode,
        });
        if (parcial.error) throw new Error("partial_refund_record_failed");
        if (parcial.data?.requiere_revision) {
          console.error("stripe_reembolso_parcial_requiere_revision", { event_id: event.id, intent_id: intentId, alerta: "finanzas" });
        }
        return new Response("ok", { status: 200 });
      }
      const result = await db.rpc("procesar_pago_stripe", { p_stripe_event_id: event.id, p_stripe_payment_intent_id: intentId, p_estado_pago: "reembolsado" });
      if (result.error || result.data?.ok === false) throw new Error("refund_reconciliation_failed");
      return new Response("ok", { status: 200 });
    }
    if (!intentId) throw new Error("payment_intent_missing");
    const intent = await obtenerIntentoStripe(clave,intentId);
    const reembolso = await obtenerReembolsoCompletoStripe(clave, intent);
    if (reembolso) {
      const result = await db.rpc("procesar_pago_stripe", { p_stripe_event_id: `conciliacion_reembolso_${reembolso}`, p_stripe_payment_intent_id: intent.id, p_estado_pago: "reembolsado" });
      if (result.error || result.data?.ok === false) throw new Error("refund_reconciliation_failed");
      return new Response("ok", { status: 200 });
    }
    if (intent.metadata.carga_masiva_id) {
      if (intent.status === "succeeded") {
        const checkpoint = await db.rpc("registrar_checkout_pago_confirmado", { p_id: intent.metadata.carga_masiva_id, p_intent: intent.id });
        if (checkpoint.error) throw new Error("bulk_checkout_checkpoint_failed");
        const result = await db.rpc("confirmar_checkout_masivo", { p_id: intent.metadata.carga_masiva_id, p_intent: intent.id, p_monto: intent.amount_received, p_moneda: intent.currency });
        if (result.error || result.data?.ok === false) throw new Error("bulk_checkout_reconciliation_failed");
      } else if (["canceled", "requires_payment_method"].includes(intent.status)) {
        const result = await db.from("checkout_traslados_masivos").update({ expirado_en: new Date().toISOString() }).eq("id", intent.metadata.carga_masiva_id).is("pagado_en", null);
        if (result.error) throw new Error("bulk_checkout_expiration_failed");
      }
    } else {
      const result = await db.rpc("aplicar_verificacion_pago_stripe", { p_datos: datosVerificacion(intent,modoStripe(clave),"webhook",event.id) });
      if (result.error) throw new Error("payment_verification_rejected");
      if (result.data?.requiere_revision) throw new Error("provider_state_requires_review");
      if (result.data?.reembolso_encolado) {
        // Cobro recibido sobre un traslado ya cancelado: reembolso inmediato
        // (si falla, queda encolado para reconciliar-pagos-stripe).
        const reembolsos = await procesarReembolsosPendientes(db, stripe, { trasladoId: intent.metadata.traslado_id });
        if (reembolsos.fallidos.length) console.error("stripe_webhook_reembolso_pendiente", { event_id: event.id, fallidos: reembolsos.fallidos });
      }
    }
    return new Response("ok", { status: 200 });
  } catch (error) {
    console.error("stripe_webhook_failed", { event_id: event.id, code: error instanceof Error ? error.message : "processing_failed" });
    return new Response("Error procesando pago; se requiere reintento", { status: 500 });
  }
});
