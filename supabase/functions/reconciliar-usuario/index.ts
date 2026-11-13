import { createClient } from "npm:@supabase/supabase-js@2.47.16";
import { modoStripe, obtenerIntentoStripe } from "../_shared/stripe-verificacion.ts";

const url = Deno.env.get("SUPABASE_URL") ?? "";
const db = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

async function rpc(nombre: string, args: Record<string, unknown>) {
  const { data, error } = await db.rpc(nombre, args);
  if (error || data?.ok === false) throw new Error(`rpc_failed:${nombre}`);
  return data;
}

async function reconciliarMasivos() {
  const clave = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
  const live = modoStripe(clave);
  if (Deno.env.get("RUUM_STRIPE_MODE") !== (live ? "live" : "test")) {
    throw new Error("stripe_environment_mismatch");
  }
  const candidatos = await rpc("reclamar_checkpoints_checkout_masivo", { p_lote: 25 }) ?? [];
  let confirmados = 0;
  let fallidos = 0;
  const marcar = (id: string, estado: string, error: string | null, espera: number) =>
    rpc("marcar_checkpoint_checkout_masivo", {
      p_id: id, p_estado: estado, p_error: error,
      p_reintentar_en: espera ? new Date(Date.now() + espera).toISOString() : null,
    });
  for (let i = 0; i < candidatos.length; i += 5) {
    await Promise.all(candidatos.slice(i, i + 5).map(async (candidato: {checkout_id: string; intent_id: string; intentos: number}) => {
      const { checkout_id: id, intent_id, intentos } = candidato;
      try {
        const intent = await obtenerIntentoStripe(clave, intent_id);
        if (intent.metadata?.carga_masiva_id !== id || intent.currency !== "mxn") {
          throw new Error("stripe_identity_or_currency_mismatch");
        }
        if (intent.status !== "succeeded") {
          await marcar(id, "error_reconciliable", `stripe_status:${intent.status}`, 120_000);
          return;
        }
        if (!Number.isSafeInteger(intent.amount_received) || intent.amount_received <= 0 || intent.amount_received !== intent.amount) {
          throw new Error("stripe_amount_invalid");
        }
        await rpc("registrar_checkout_pago_confirmado", { p_id: id, p_intent: intent.id });
        await rpc("confirmar_checkout_masivo", { p_id: id, p_intent: intent.id, p_monto: intent.amount_received, p_moneda: intent.currency });
        await marcar(id, "completado", null, 0);
        confirmados++;
      } catch (error) {
        fallidos++;
        const codigo = error instanceof Error ? error.message : "reconciliation_failed";
        const permanente = intentos >= 5 || /identity|currency|amount|idempotency/.test(codigo);
        await marcar(id, permanente ? "error_permanente" : "error_reconciliable", codigo,
          permanente ? 0 : Math.min(intentos * 60_000, 900_000));
      }
    }));
  }
  return { reclamados: candidatos.length, confirmados, fallidos };
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response(null, { status: 405 });
  const body = await request.json().catch(() => null);
  const tipo = body?.tipo;
  if ((tipo !== "individual" && tipo !== "masivo") ||
      typeof body?.nonce !== "string" || !/^[a-f0-9]{64}$/.test(body.nonce)) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    if (!await rpc("tomar_reconciliacion_usuario", { p_tipo: tipo, p_nonce: body.nonce })) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }
    const resultado = tipo === "individual"
      ? await rpc("reconciliar_saga_traslados_individuales", { p_limite: 50 })
      : await reconciliarMasivos();
    const ok = !(resultado.errores || resultado.fallidos);
    console[ok ? "info" : "error"]("reconciliacion_usuario", { tipo, ...resultado });
    return Response.json({ ok, ...resultado }, { status: ok ? 200 : 500 });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "";
    const codigo = /^(stripe_environment_mismatch|stripe_key_mode_unknown|rpc_failed:[a-z_]+)$/.test(mensaje)
      ? mensaje
      : "reconciliation_failed";
    console.error("reconciliacion_usuario_fallida", { tipo, codigo });
    return Response.json({ error: "Error de reconciliación" }, { status: 500 });
  }
});
