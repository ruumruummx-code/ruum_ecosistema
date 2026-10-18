/// <reference lib="deno.ns" />
/// <reference lib="dom" />

// Edge Function / Cron Job: Reconciliación periódica de pagos de Stripe.
//
// Consulta la API de Stripe para detectar PaymentIntents que ya alcanzaron
// el estado "succeeded" (o "canceled" / reembolsados) pero que no fueron
// aplicados en nuestra base de datos (por ejemplo, por pérdida de webhook,
// latencia extrema o fallos temporales de red).
//
// Invocable periódicamente por cron (pg_cron o scheduler de Supabase)
// usando autenticación Bearer SUPABASE_SERVICE_ROLE_KEY.

import Stripe from "npm:stripe@^17";
import { createClient } from "npm:@supabase/supabase-js@2";
import { decidirAccionPagoIntent, decidirAccionCheckoutHuerfano } from "./logica.ts";

function respuestaJson(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST" && req.method !== "GET") {
    return respuestaJson({ error: "Método no permitido." }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");

  if (!supabaseUrl || !serviceRoleKey || !stripeSecretKey) {
    return respuestaJson({ error: "Variables de entorno no configuradas." }, 500);
  }

  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${serviceRoleKey}`) {
    return respuestaJson({ error: "No autorizado. Se requiere service_role key." }, 401);
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2025-02-24.acacia",
    httpClient: Stripe.createFetchHttpClient()
  });

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
  });

  // 1. Obtener pagos pendientes que tienen un stripe_payment_intent_id asignado
  const { data: pagosPendientes, error: errorPagos } = await supabase
    .from("pagos")
    .select("id, traslado_id, stripe_payment_intent_id, monto, registrado_en")
    .not("stripe_payment_intent_id", "is", null)
    .eq("estado", "pendiente")
    .order("registrado_en", { ascending: true })
    .limit(50);

  if (errorPagos) {
    console.error("[reconciliar-pagos-stripe] Error consultando pagos pendientes:", errorPagos);
    return respuestaJson({ error: `Error en base de datos: ${errorPagos.message}` }, 500);
  }

  const pagos = pagosPendientes ?? [];
  let reconciliados = 0;
  let reembolsados = 0;
  let fallidos = 0;
  let ignorados = 0;
  const errores: Array<{ pago_id: string; intent_id: string; error: string }> = [];

  for (const pago of pagos) {
    const intentId = pago.stripe_payment_intent_id;
    if (!intentId) continue;

    try {
      const intent = await stripe.paymentIntents.retrieve(intentId);
      const accion = decidirAccionPagoIntent(intent);

      if (accion.tipo === "ignorar") {
        ignorados += 1;
        continue;
      }

      const eventoIdGenerado = `reconciliacion_cron_${intent.id}_${Date.now()}`;

      if (accion.tipo === "completar") {
        if (accion.cargaMasivaId) {
          const { error: errRpc } = await supabase.rpc("confirmar_checkout_masivo", {
            p_id: accion.cargaMasivaId,
            p_intent: intent.id,
            p_monto: intent.amount_received ?? Math.round(Number(pago.monto) * 100),
            p_moneda: intent.currency ?? "mxn"
          });
          if (errRpc) throw errRpc;
        } else {
          const { error: errRpc } = await supabase.rpc("procesar_pago_stripe", {
            p_stripe_event_id: eventoIdGenerado,
            p_stripe_payment_intent_id: intent.id,
            p_estado_pago: "completado"
          });
          if (errRpc) throw errRpc;
        }
        reconciliados += 1;
        console.log(`[reconciliar-pagos-stripe] Pago reconciliado exitosamente: intent ${intent.id}, pago ${pago.id}`);
      } else if (accion.tipo === "reembolsar") {
        const { error: errRpc } = await supabase.rpc("procesar_pago_stripe", {
          p_stripe_event_id: eventoIdGenerado,
          p_stripe_payment_intent_id: intent.id,
          p_estado_pago: "reembolsado"
        });
        if (errRpc) throw errRpc;
        reembolsados += 1;
        console.log(`[reconciliar-pagos-stripe] Reembolso aplicado: intent ${intent.id}, pago ${pago.id}`);
      } else if (accion.tipo === "fallar") {
        const { error: errRpc } = await supabase.rpc("procesar_pago_stripe", {
          p_stripe_event_id: eventoIdGenerado,
          p_stripe_payment_intent_id: intent.id,
          p_estado_pago: "fallido"
        });
        if (errRpc) throw errRpc;
        fallidos += 1;
        console.log(`[reconciliar-pagos-stripe] Pago marcado como fallido: intent ${intent.id}, pago ${pago.id}`);
      }
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : String(err);
      console.error(`[reconciliar-pagos-stripe] Error procesando intent ${intentId}:`, mensaje);
      errores.push({ pago_id: pago.id, intent_id: intentId, error: mensaje });
    }
  }

  // 2. Reconciliar y cancelar/expirar checkouts masivos huérfanos (> 24 horas sin pagar)
  let checkoutsExpirados = 0;
  let checkoutsReconciliados = 0;

  const limiteHoras = 24;
  const fechaCorte = new Date(Date.now() - limiteHoras * 3600 * 1000).toISOString();

  const { data: checkoutsHuerfanos, error: errorHuerfanos } = await supabase
    .from("checkout_traslados_masivos")
    .select("id, stripe_payment_intent_id, monto_centavos, auth_user_id, creado_en")
    .is("pagado_en", null)
    .is("expirado_en", null)
    .lt("creado_en", fechaCorte)
    .limit(30);

  if (!errorHuerfanos && checkoutsHuerfanos) {
    for (const ch of checkoutsHuerfanos) {
      try {
        if (!ch.stripe_payment_intent_id) {
          await supabase
            .from("checkout_traslados_masivos")
            .update({ expirado_en: new Date().toISOString() })
            .eq("id", ch.id);
          checkoutsExpirados += 1;
          continue;
        }

        const intent = await stripe.paymentIntents.retrieve(ch.stripe_payment_intent_id);
        const accion = decidirAccionCheckoutHuerfano(intent);

        if (accion.tipo === "confirmar") {
          const { error: errRpc } = await supabase.rpc("confirmar_checkout_masivo", {
            p_id: ch.id,
            p_intent: intent.id,
            p_monto: intent.amount_received ?? ch.monto_centavos,
            p_moneda: intent.currency ?? "mxn"
          });
          if (errRpc) throw errRpc;
          checkoutsReconciliados += 1;
          console.log(`[reconciliar-pagos-stripe] Checkout masivo huérfano confirmado: ${ch.id}`);
        } else if (accion.tipo === "cancelar_stripe_y_expirar") {
          try {
            await stripe.paymentIntents.cancel(intent.id);
          } catch {
            // Ya cancelado en Stripe o no cancelable
          }
          await supabase
            .from("checkout_traslados_masivos")
            .update({ expirado_en: new Date().toISOString() })
            .eq("id", ch.id);
          checkoutsExpirados += 1;
          console.log(`[reconciliar-pagos-stripe] Checkout masivo huérfano cancelado y expirado: ${ch.id}`);
        } else if (accion.tipo === "expirar") {
          await supabase
            .from("checkout_traslados_masivos")
            .update({ expirado_en: new Date().toISOString() })
            .eq("id", ch.id);
          checkoutsExpirados += 1;
          console.log(`[reconciliar-pagos-stripe] Checkout masivo huérfano marcado como expirado: ${ch.id}`);
        }
      } catch (err) {
        const mensaje = err instanceof Error ? err.message : String(err);
        console.error(`[reconciliar-pagos-stripe] Error procesando checkout huérfano ${ch.id}:`, mensaje);
      }
    }
  }

  const resumen = {
    ok: true,
    pendientes_encontrados: pagos.length,
    reconciliados,
    reembolsados,
    fallidos,
    ignorados,
    checkouts_expirados: checkoutsExpirados,
    checkouts_reconciliados: checkoutsReconciliados,
    errores_count: errores.length,
    errores
  };

  console.log("[reconciliar-pagos-stripe] Resumen de ejecución:", resumen);
  return respuestaJson(resumen, 200);
});
