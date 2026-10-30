/// <reference lib="deno.ns" />
import Stripe from "npm:stripe@23.0.0";
import { createClient } from "npm:@supabase/supabase-js@2.47.16";
import { datosVerificacion, modoStripe, obtenerIntentoStripe } from "../_shared/stripe-verificacion.ts";
const clave = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const stripe = new Stripe(clave, { apiVersion: "2026-09-30.endive", httpClient: Stripe.createFetchHttpClient() });
const db = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Método no permitido", { status: 405 });
  let event: Stripe.Event;
  try { event = await stripe.webhooks.constructEventAsync(await req.text(), req.headers.get("stripe-signature") ?? "", Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? ""); }
  catch { return new Response("Firma inválida", { status: 400 }); }
  if (!["payment_intent.succeeded", "payment_intent.payment_failed", "payment_intent.processing", "payment_intent.canceled"].includes(event.type)) return new Response("Evento no manejado", { status: 200 });
  try {
    if (event.livemode !== modoStripe(clave)) throw new Error("stripe_environment_mismatch");
    // Consultar el estado actual evita aplicar snapshots fallidos fuera de orden.
    const snapshot = event.data.object as Stripe.PaymentIntent;
    const intent = await obtenerIntentoStripe(clave,snapshot.id);
    if (intent.metadata.carga_masiva_id) {
      if (intent.status === "succeeded") {
        const result = await db.rpc("confirmar_checkout_masivo", { p_id: intent.metadata.carga_masiva_id, p_intent: intent.id, p_monto: intent.amount_received, p_moneda: intent.currency });
        if (result.error) throw new Error("bulk_checkout_reconciliation_failed");
      }
    } else {
      const result = await db.rpc("aplicar_verificacion_pago_stripe", { p_datos: datosVerificacion(intent,modoStripe(clave),"webhook",event.id) });
      if (result.error) throw new Error("payment_verification_rejected");
      if (result.data?.requiere_revision) throw new Error("provider_state_requires_review");
    }
    return new Response("ok", { status: 200 });
  } catch (error) {
    console.error("stripe_webhook_failed", { event_id: event.id, code: error instanceof Error ? error.message : "processing_failed" });
    return new Response("Error procesando pago; se requiere reintento", { status: 500 });
  }
});
