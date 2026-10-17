/// <reference lib="deno.ns" />
/// <reference lib="dom" />

// Edge Function: recibe los webhooks de Stripe y actualiza pagos de usuarios
// en consecuencia (PRD §4.6).
//
// Variables de entorno requeridas en el proyecto de Supabase (Dashboard →
// Edge Functions → Secrets), nunca en el repo:
//   STRIPE_SECRET_KEY        — clave secreta de Stripe (sk_live_/sk_test_)
//   STRIPE_WEBHOOK_SECRET    — firma del endpoint (whsec_...), de Stripe Dashboard
//   SUPABASE_SERVICE_ROLE_KEY — para escribir sin pasar por RLS (es un webhook
//                               de un servidor de confianza, no de un usuario)
//
// No se pudo probar contra Stripe real ni un proyecto de Supabase desplegado en este entorno (no
// hay cuenta de Stripe ni acceso a un proyecto real desde aquí). Sí se probó este archivo completo
// (no solo logica.ts, que también está probada con `deno test`, ver logica.test.ts) corriendo de
// verdad con `deno serve` contra un mock local de PostgREST, recibiendo un evento firmado con el
// mismo esquema HMAC que usa Stripe — ver stripe-webhook/integration-test/.
// Antes de production: `stripe listen --forward-to <url>/stripe-webhook` para
// probar con eventos reales de Stripe en modo test.
import Stripe from "npm:stripe@^17";
import { createClient } from "npm:@supabase/supabase-js@2";
import { esEventoManejado } from "./logica.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2025-02-24.acacia",
  httpClient: Stripe.createFetchHttpClient()
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

async function ejecutarSupabase<T>(
  operacion: PromiseLike<{ data: T; error: { message: string } | null }>,
  contexto: string
) {
  const { data, error } = await operacion;
  if (error) throw new Error(`${contexto}: ${error.message}`);
  return data;
}

Deno.serve(async (req) => {
  const firma = req.headers.get("stripe-signature");
  const cuerpo = await req.text();

  if (!firma) {
    return new Response("Falta stripe-signature", { status: 400 });
  }

  let evento: Stripe.Event;
  try {
    evento = await stripe.webhooks.constructEventAsync(
      cuerpo,
      firma,
      Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? ""
    );
  } catch (err) {
    console.error("Firma de webhook inválida:", err);
    return new Response("Firma inválida", { status: 400 });
  }

  if (!esEventoManejado(evento.type)) {
    // 200, no 4xx/5xx: que Stripe no reintente eventos que de verdad no nos interesan.
    return new Response("Evento no manejado, ignorado", { status: 200 });
  }

  try {
    switch (evento.type) {
      case "payment_intent.succeeded":
      case "payment_intent.payment_failed": {
        const intent = evento.data.object as Stripe.PaymentIntent;
        if (intent.metadata.carga_masiva_id) {
          if (evento.type === "payment_intent.succeeded") {
            await ejecutarSupabase(supabase.rpc("confirmar_checkout_masivo", {
              p_id: intent.metadata.carga_masiva_id,
              p_intent: intent.id,
              p_monto: intent.amount_received,
              p_moneda: intent.currency,
            }), "No se pudo confirmar la carga masiva pagada");
          }
          break;
        }
        const nuevoEstado = evento.type === "payment_intent.succeeded" ? "completado" : "fallido";

        // RC-04: Usar función RPC transaccional para evitar inconsistencias
        // si falla después de marcar el evento como procesado.
        // La función es idempotente: si el evento ya fue procesado y el
        // traslado ya está completo, no hace nada.
        const resultado = await ejecutarSupabase(
          supabase.rpc("procesar_pago_stripe", {
            p_stripe_event_id: evento.id,
            p_stripe_payment_intent_id: intent.id,
            p_estado_pago: nuevoEstado
          }),
          "No se pudo procesar el pago de Stripe"
        );

        // Verificar si el procesamiento fue exitoso
        if (resultado && typeof resultado === 'object' && 'ok' in resultado && !resultado.ok) {
          console.warn("procesar_pago_stripe devolvió error:", resultado);
        }
        break;
      }
    }
  } catch (err) {
    console.error("Error procesando webhook de Stripe:", err);
    // 500 a propósito: Stripe reintenta automáticamente en este caso, que es
    // lo correcto si fue un error transitorio de la base de datos.
    return new Response("Error interno", { status: 500 });
  }

  return new Response("ok", { status: 200 });
});
