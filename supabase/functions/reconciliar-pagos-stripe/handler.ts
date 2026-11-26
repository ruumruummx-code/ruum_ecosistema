import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.47.16";
import { timingSafeEqual } from "../_shared/timing-safe.ts";
import { conciliarCheckouts } from "../_shared/stripe-checkouts.ts";
import { crearStripe } from "../_shared/stripe.ts";
import { cancelarIntentsPendientes, procesarReembolsosPendientes } from "../_shared/reembolsos.ts";
import { datosVerificacion, modoStripe, obtenerIntentoStripe, obtenerReembolsoCompletoStripe } from "../_shared/stripe-verificacion.ts";

export function crearReconciliadorStripe(entorno: Pick<typeof Deno.env, "get"> = Deno.env) {
  const db = createClient(entorno.get("SUPABASE_URL") ?? "", entorno.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
  return (req: Request) => manejarConciliacion(req, db, entorno);
}

async function manejarConciliacion(req: Request, db: SupabaseClient, entorno: Pick<typeof Deno.env, "get">) {
  if (req.method !== "POST" && req.method !== "GET") return new Response("Método no permitido", { status: 405 });
  let id: string | undefined;
  let autorizado = false;
  try {
    const serviceKey = entorno.get("SUPABASE_SERVICE_ROLE_KEY");
    if (serviceKey && timingSafeEqual(req.headers.get("Authorization"), `Bearer ${serviceKey}`)) {
      id = crypto.randomUUID();
      const result = await db.from("stripe_conciliacion_ejecuciones").insert({ id, nonce_hash: "manual_service_role", estado: "procesando" });
      if (result.error) throw new Error("reconciliation_result_create_failed");
      autorizado = true;
    } else {
    if (req.method !== "POST") return new Response("No autorizado", { status: 401 });
    const body = await req.json();
    if (typeof body.ejecucion_id !== "string" || !/^[0-9a-f-]{36}$/.test(body.ejecucion_id) || typeof body.nonce !== "string" || !/^[0-9a-f]{64}$/.test(body.nonce)) return new Response("Solicitud inválida", { status: 400 });
    id = body.ejecucion_id;
    const claim = await db.rpc("tomar_ejecucion_conciliacion", { p_id: id, p_nonce: body.nonce });
    if (claim.error) throw new Error("reconciliation_claim_failed");
    if (!claim.data) return new Response("No autorizado", { status: 401 });
    autorizado = true;
    }
    const clave = entorno.get("STRIPE_SECRET_KEY") ?? "";
    const modo = modoStripe(clave);
    const pagos = await db.from("pagos").select("stripe_payment_intent_id")
      .not("stripe_payment_intent_id", "is", null).not("traslado_id", "is", null)
      .or("estado.in.(pendiente,fallido),stripe_verificado_en.is.null")
      .order("stripe_verificado_en", { ascending: true, nullsFirst: true }).limit(50);
    if (pagos.error) throw new Error("reconciliation_query_failed");
    let verificados = 0;
    const errores: { intent_id: string; codigo: string }[] = [];
    const filas = pagos.data ?? [];
    for (let start = 0; start < filas.length; start += 5) {
      await Promise.all(filas.slice(start,start+5).map(async (pago) => {
        const intentId = pago.stripe_payment_intent_id as string;
        try {
          const intent = await obtenerIntentoStripe(clave,intentId);
          const reembolso = await obtenerReembolsoCompletoStripe(clave, intent);
          if (reembolso) {
            const result = await db.rpc("procesar_pago_stripe", { p_stripe_event_id: `conciliacion_reembolso_${reembolso}`, p_stripe_payment_intent_id: intent.id, p_estado_pago: "reembolsado" });
            if (result.error || result.data?.ok === false) throw new Error("refund_reconciliation_failed");
            verificados++;
            return;
          }
          const resultado = await db.rpc("aplicar_verificacion_pago_stripe", { p_datos: datosVerificacion(intent,modo,"conciliacion") });
          if (resultado.error) throw new Error("payment_verification_rejected");
          if (resultado.data?.requiere_revision) throw new Error("provider_state_requires_review");
          verificados++;
        } catch (error) {
          errores.push({ intent_id: intentId, codigo: error instanceof Error ? error.message : "reconciliation_failed" });
        }
      }));
    }
    const checkouts = await conciliarCheckouts(db, clave);
    errores.push(...checkouts.errores);

    // Traslados cancelados: PaymentIntents aún vivos y reembolsos encolados
    // (cancelación sin respuesta de Stripe, cobros tardíos, fallos previos).
    const stripe = crearStripe(clave);
    const vivos = await db.from("pagos").select("stripe_payment_intent_id, traslados!inner(estado)")
      .eq("estado", "pendiente").neq("metodo", "cargo_cancelacion").not("stripe_payment_intent_id", "is", null)
      .eq("traslados.estado", "servicio_cancelado").limit(50);
    if (vivos.error) errores.push({ intent_id: "-", codigo: "cancelled_intents_query_failed" });
    const intentsVivos = (vivos.data ?? []).map((fila) => fila.stripe_payment_intent_id as string);
    const noCancelados = await cancelarIntentsPendientes(stripe, intentsVivos);
    for (const intentId of noCancelados) errores.push({ intent_id: intentId, codigo: "cancelled_transfer_intent_alive" });
    const reembolsos = await procesarReembolsosPendientes(db, stripe, { limite: 50 });
    for (const fallo of reembolsos.fallidos) errores.push({ intent_id: fallo.id, codigo: fallo.codigo });

    const resultado = { verificados, errores, livemode: modo, candidatos: filas.length, checkouts_confirmados: checkouts.confirmados, checkouts_expirados: checkouts.expirados,
      intents_cancelados: intentsVivos.length - noCancelados.length, reembolsos_completados: reembolsos.completados };
    const update = await db.from("stripe_conciliacion_ejecuciones").update({ estado: errores.length ? "fallida" : "completada", finalizada_en: new Date().toISOString(), resultado }).eq("id",id);
    if (update.error) throw new Error("reconciliation_result_write_failed");
    return Response.json(resultado, { status: errores.length ? 502 : 200 });
  } catch (error) {
    const codigo = error instanceof Error ? error.message : "reconciliation_failed";
    if (id && autorizado) await db.from("stripe_conciliacion_ejecuciones").update({ estado: "fallida", finalizada_en: new Date().toISOString(), resultado: { error: codigo } }).eq("id",id);
    return Response.json({ error: codigo }, { status: 500 });
  }
}
