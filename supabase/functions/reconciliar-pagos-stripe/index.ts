import { createClient } from "npm:@supabase/supabase-js@2.47.16";
import { datosVerificacion, modoStripe, obtenerIntentoStripe } from "../_shared/stripe-verificacion.ts";

const db = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Método no permitido", { status: 405 });
  let id: string | undefined;
  let autorizado = false;
  try {
    const body = await req.json();
    if (typeof body.ejecucion_id !== "string" || !/^[0-9a-f-]{36}$/.test(body.ejecucion_id) || typeof body.nonce !== "string" || !/^[0-9a-f]{64}$/.test(body.nonce)) return new Response("Solicitud inválida", { status: 400 });
    id = body.ejecucion_id;
    const claim = await db.rpc("tomar_ejecucion_conciliacion", { p_id: id, p_nonce: body.nonce });
    if (claim.error) throw new Error("reconciliation_claim_failed");
    if (!claim.data) return new Response("No autorizado", { status: 401 });
    autorizado = true;
    const clave = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
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
          const resultado = await db.rpc("aplicar_verificacion_pago_stripe", { p_datos: datosVerificacion(intent,modo,"conciliacion") });
          if (resultado.error) throw new Error("payment_verification_rejected");
          if (resultado.data?.requiere_revision) throw new Error("provider_state_requires_review");
          verificados++;
        } catch (error) {
          errores.push({ intent_id: intentId, codigo: error instanceof Error ? error.message : "reconciliation_failed" });
        }
      }));
    }
    const resultado = { verificados, errores, livemode: modo, candidatos: filas.length };
    const update = await db.from("stripe_conciliacion_ejecuciones").update({ estado: errores.length ? "fallida" : "completada", finalizada_en: new Date().toISOString(), resultado }).eq("id",id);
    if (update.error) throw new Error("reconciliation_result_write_failed");
    return Response.json(resultado, { status: errores.length ? 502 : 200 });
  } catch (error) {
    const codigo = error instanceof Error ? error.message : "reconciliation_failed";
    if (id && autorizado) await db.from("stripe_conciliacion_ejecuciones").update({ estado: "fallida", finalizada_en: new Date().toISOString(), resultado: { error: codigo } }).eq("id",id);
    return Response.json({ error: codigo }, { status: 500 });
  }
});
