import Stripe from "npm:stripe@23.0.0";
import type { SupabaseClient } from "npm:@supabase/supabase-js@2.47.16";
import { obtenerIntentoStripe } from "./stripe-verificacion.ts";

/** Recover paid bulk checkouts, and expire only provider-confirmed old unpaid ones. */
export async function conciliarCheckouts(db: SupabaseClient, clave: string) {
  const stripe = new Stripe(clave, { apiVersion: "2026-09-30.endive", httpClient: Stripe.createFetchHttpClient() });
  const { data, error } = await db.from("checkout_traslados_masivos")
    .select("id,stripe_payment_intent_id,monto_centavos,creado_en")
    .is("pagado_en", null).is("expirado_en", null).order("creado_en").limit(30);
  if (error) throw new Error("bulk_checkout_query_failed");
  let confirmados = 0, expirados = 0;
  const errores: { intent_id: string; codigo: string }[] = [];
  for (const checkout of data ?? []) {
    try {
      const antiguo = Date.parse(checkout.creado_en) < Date.now() - 24 * 3600000;
      if (!checkout.stripe_payment_intent_id && !antiguo) continue;
      if (checkout.stripe_payment_intent_id) {
        let intent = await obtenerIntentoStripe(clave, checkout.stripe_payment_intent_id);
        if (intent.metadata.carga_masiva_id !== checkout.id || intent.currency !== "mxn" || intent.amount !== Number(checkout.monto_centavos)) throw new Error("bulk_checkout_identity_mismatch");
        if (intent.status === "succeeded") {
          if (intent.amount_received !== Number(checkout.monto_centavos)) throw new Error("bulk_checkout_amount_mismatch");
          const result = await db.rpc("confirmar_checkout_masivo", { p_id: checkout.id, p_intent: intent.id, p_monto: intent.amount_received, p_moneda: intent.currency });
          if (result.error || result.data?.ok === false) throw new Error("bulk_checkout_confirmation_failed");
          confirmados++;
          continue;
        }
        if (!antiguo) continue;
        if (["requires_payment_method", "requires_confirmation", "requires_action", "processing"].includes(intent.status)) {
          // A failed cancellation must remain visible and retryable, never silently expire a paid checkout.
          await stripe.paymentIntents.cancel(intent.id);
          intent = await obtenerIntentoStripe(clave, intent.id);
        }
        if (intent.status !== "canceled") continue;
      }
      const result = await db.from("checkout_traslados_masivos").update({ expirado_en: new Date().toISOString() }).eq("id", checkout.id).is("pagado_en", null);
      if (result.error) throw new Error("bulk_checkout_expiration_failed");
      expirados++;
    } catch (error) {
      errores.push({ intent_id: checkout.stripe_payment_intent_id ?? checkout.id, codigo: error instanceof Error ? error.message : "bulk_checkout_failed" });
    }
  }
  return { confirmados, expirados, errores };
}
