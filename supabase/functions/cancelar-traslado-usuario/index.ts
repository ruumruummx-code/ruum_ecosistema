/// <reference lib="deno.ns" />
/// <reference lib="dom" />

// Edge Function: cancelación de un traslado por su usuario.
//
// Sustituye la llamada directa a la RPC usuario_cancela_traslado, que
// cancelaba traslados ya pagados sin reembolso, creaba OTRO cargo pendiente y
// dejaba vivos los PaymentIntent (el usuario podía pagar un traslado
// cancelado). Flujo:
//   1. Valida la sesión (fail-closed 401).
//   2. servidor_cancela_traslado (service_role, transaccional): cambia el
//      estado, calcula la penalización y, si ya se cobró, encola el reembolso
//      (100 % menos penalización) en vez de crear un cargo nuevo.
//   3. Cancela en Stripe los PaymentIntent pendientes.
//   4. Ejecuta los reembolsos con idempotencia por fila. Si Stripe falla, el
//      reembolso queda encolado y lo reintenta reconciliar-pagos-stripe.

import { createClient } from "npm:@supabase/supabase-js@2.47.16";
import { crearStripe } from "../_shared/stripe.ts";
import { cancelarIntentsPendientes, procesarReembolsosPendientes } from "../_shared/reembolsos.ts";
import { construirCabecerasCors, manejarCors } from "../_shared/cors-documentos.ts";

function respuestaJson(req: Request, body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...construirCabecerasCors(req), "Content-Type": "application/json" }
  });
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  const rechazoCors = manejarCors(req);
  if (rechazoCors) return rechazoCors;
  if (req.method !== "POST") return respuestaJson(req, { error: "Método no permitido" }, 405);

  const traza = crypto.randomUUID();
  const autorizacion = req.headers.get("Authorization");
  if (!autorizacion) return respuestaJson(req, { error: "Falta sesión" }, 401);

  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
  if (!url || !serviceKey || !stripeKey) {
    console.error("cancelar_traslado_config_incompleta", { traza });
    return respuestaJson(req, { error: "Servicio no disponible temporalmente.", traza }, 503);
  }

  const clienteUsuario = createClient(url, Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
    global: { headers: { Authorization: autorizacion } },
  });
  const { data: sesion, error: errorSesion } = await clienteUsuario.auth.getUser();
  if (errorSesion || !sesion.user) return respuestaJson(req, { error: "Sesión inválida" }, 401);

  let payload: { traslado_id?: unknown; motivo?: unknown };
  try {
    payload = await req.json();
  } catch {
    return respuestaJson(req, { error: "JSON inválido" }, 400);
  }
  const trasladoId = typeof payload.traslado_id === "string" ? payload.traslado_id : "";
  if (!UUID.test(trasladoId)) return respuestaJson(req, { error: "Falta traslado_id" }, 400);
  const motivo = typeof payload.motivo === "string" && payload.motivo.trim()
    ? payload.motivo.trim().slice(0, 500)
    : "Cancelación solicitada por usuario";

  const db = createClient(url, serviceKey);
  const { data: resultado, error } = await db.rpc("servidor_cancela_traslado", {
    p_auth_user_id: sesion.user.id,
    p_traslado_id: trasladoId,
    p_motivo: motivo,
  });
  if (error) {
    // Los RAISE de negocio (P0001/23514) traen un mensaje para el usuario;
    // cualquier otro error se oculta tras un id de traza.
    if (error.code === "P0001" || error.code === "23514") return respuestaJson(req, { error: error.message }, 422);
    console.error("cancelar_traslado_rpc_fallida", { traza, code: error.code });
    return respuestaJson(req, { error: "No pudimos cancelar el traslado. Intenta de nuevo.", traza }, 500);
  }

  const stripe = crearStripe(stripeKey);
  const intents = Array.isArray(resultado?.payment_intents_pendientes) ? (resultado.payment_intents_pendientes as string[]) : [];
  const intentsVivos = await cancelarIntentsPendientes(stripe, intents);

  let reembolsoEnProceso = false;
  if (Number(resultado?.monto_reembolso ?? 0) > 0) {
    try {
      const { fallidos } = await procesarReembolsosPendientes(db, stripe, { trasladoId });
      reembolsoEnProceso = fallidos.length > 0;
      if (fallidos.length) console.error("cancelar_traslado_reembolso_pendiente", { traza, fallidos });
    } catch (err) {
      reembolsoEnProceso = true;
      console.error("cancelar_traslado_reembolso_error", { traza, code: err instanceof Error ? err.message : "error" });
    }
  }
  if (intentsVivos.length) console.error("cancelar_traslado_intents_vivos", { traza, intents: intentsVivos });

  return respuestaJson(req, {
    porcentaje_cargo: Number(resultado?.porcentaje_cargo ?? 0),
    monto_cargo: Number(resultado?.monto_cargo ?? 0),
    monto_pagado: Number(resultado?.monto_pagado ?? 0),
    monto_reembolso: Number(resultado?.monto_reembolso ?? 0),
    reembolso_en_proceso: reembolsoEnProceso,
    mensaje: String(resultado?.mensaje ?? "Traslado cancelado."),
  });
});
