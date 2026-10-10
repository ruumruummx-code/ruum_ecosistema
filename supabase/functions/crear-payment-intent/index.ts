/// <reference lib="deno.ns" />
/// <reference lib="dom" />

// Edge Function: crea un PaymentIntent de Stripe para el cobro de un

import Stripe from "npm:stripe@^17";
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import { decidirIntentExistente, montoAutorizadoParaCobro, validarRangoMontoCobro } from "./logica.ts";

const SISTEMA_ACTOR_ID = "00000000-0000-0000-0000-000000000000";

const CABECERAS_CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function respuestaJson(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CABECERAS_CORS, "Content-Type": "application/json" }
  });
}

/**
 * Concilia un cobro que Stripe ya marcó succeeded pero nuestra base aún
 * tiene pendiente. Replica lo que hace el webhook en
 * stripe-webhook/index.ts (pago -> completado, avance de estado del
 * traslado, auditoría). Si el webhook llega después, re-aplica los mismos
 * valores finales (operación idempotente por naturaleza; solo duplicaría la
 * fila de auditoría, igual que ante reintentos de Stripe).
 */
async function reconciliarPagoExitoso(
  clienteServicio: SupabaseClient,
  trasladoId: string,
  paymentIntentId: string
) {
  const { error: errorPago } = await clienteServicio
    .from("pagos")
    .update({ estado: "completado" })
    .eq("stripe_payment_intent_id", paymentIntentId)
    .eq("estado", "pendiente");
  if (errorPago) throw new Error(`No se pudo conciliar el pago: ${errorPago.message}`);

  const { data: traslado, error: errorTraslado } = await clienteServicio
    .from("traslados")
    .select("estado, tipo_pago")
    .eq("id", trasladoId)
    .maybeSingle();
  if (errorTraslado) throw new Error(`No se pudo leer el traslado a conciliar: ${errorTraslado.message}`);

  // Mismo mapa que estadoTrasladoSiguienteTrasPago en stripe-webhook/logica.ts
  // (fuente de verdad para avances por pago; duplicado aquí para no cruzar
  // imports entre funciones desplegadas por separado).
  const siguienteEstado =
    traslado?.estado === "cotizacion_aceptada" && traslado?.tipo_pago === "anticipado"
      ? "servicio_confirmado"
      : traslado?.estado === "entrega_confirmada" || traslado?.estado === "pago_pendiente"
        ? "pago_completado"
        : null;

  if (siguienteEstado) {
    const { error: errorEstado } = await clienteServicio
      .from("traslados")
      .update({ estado: siguienteEstado })
      .eq("id", trasladoId);
    if (errorEstado) throw new Error(`No se pudo avanzar el traslado conciliado: ${errorEstado.message}`);
  }

  const { error: errorAuditoria } = await clienteServicio.from("registro_auditoria").insert({
    traslado_id: trasladoId,
    evento: "registro_pago",
    actor: "sistema",
    actor_id: SISTEMA_ACTOR_ID,
    datos: {
      stripe_payment_intent_id: paymentIntentId,
      estado_pago: "completado",
      origen: "reconciliacion-crear-payment-intent"
    }
  });
  if (errorAuditoria) throw new Error(`No se pudo auditar la conciliación: ${errorAuditoria.message}`);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        ...CABECERAS_CORS,
        "Access-Control-Allow-Headers": req.headers.get("Access-Control-Request-Headers") ?? CABECERAS_CORS["Access-Control-Allow-Headers"]
      }
    });
  }

  const autorizacion = req.headers.get("Authorization");
  if (!autorizacion) {
    return respuestaJson({ error: "Falta sesión" }, 401);
  }

  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeSecretKey) {
    return respuestaJson({ error: "Stripe no está configurado en la Edge Function" }, 500);
  }

  if (!Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) {
    return respuestaJson({ error: "Falta SUPABASE_SERVICE_ROLE_KEY en la Edge Function" }, 500);
  }

  // Cliente "como el usuario" (respeta RLS) — confirma que la sesión es real
  // y que el traslado de verdad le pertenece, antes de crear ningún cobro.
  const clienteUsuario = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
    global: { headers: { Authorization: autorizacion } }
  });

  const { data: sesion, error: errorSesion } = await clienteUsuario.auth.getUser();
  if (errorSesion || !sesion.user) {
    return respuestaJson({ error: "Sesión inválida" }, 401);
  }

  const { data: usuarioActual, error: errorUsuarioActual } = await clienteUsuario
    .from("usuarios")
    .select("id, tipo_cuenta, rol, empresa_id")
    .eq("auth_user_id", sesion.user.id)
    .single();

  if (errorUsuarioActual || !usuarioActual) {
    return respuestaJson({ error: "Usuario no encontrado" }, 404);
  }

  let payload: { traslado_id?: string | number };
  try {
    payload = (await req.json()) as { traslado_id?: string | number };
  } catch {
    return respuestaJson({ error: "JSON inválido" }, 400);
  }

  const { traslado_id } = payload;
  if (!traslado_id) {
    return respuestaJson({ error: "Falta traslado_id" }, 400);
  }

  const { data: traslado, error: errorTraslado } = await clienteUsuario
    .from("traslados")
    .select("id, usuario_id, precio_cotizado, precio_final, tipo_pago, estado, cotizacion_expira_en")
    .eq("id", traslado_id)
    .single();

  if (errorTraslado || !traslado) {
    // RLS ya filtró esto: si no es tuyo, no existe para esta consulta.
    return respuestaJson({ error: "Traslado no encontrado" }, 404);
  }

  const { data: solicitante, error: errorSolicitante } = await clienteUsuario
    .from("usuarios")
    .select("id, tipo_cuenta, rol, empresa_id")
    .eq("id", traslado.usuario_id)
    .single();

  if (errorSolicitante || !solicitante) {
    return respuestaJson({ error: "No se pudo validar la cuenta que solicitó el traslado" }, 403);
  }

  const esTrasladoEmpresa =
    solicitante.tipo_cuenta === "empresa" ||
    (solicitante.empresa_id !== null && solicitante.empresa_id === usuarioActual.empresa_id);

  if (esTrasladoEmpresa && usuarioActual.rol !== "titular_empresa") {
    return respuestaJson(
      { error: "Necesitas autorización del titular de la empresa para iniciar este pago." },
      403
    );
  }

  // PRD §4.6 — "El precio puede ser dinámico": si ya hay un precio_final
  // (ajustado al cierre), ese es el monto a cobrar; si no, se usa la
  // cotización original (mismo criterio que pasaporte_digital/panel-admin).
  const montoACobrar = montoAutorizadoParaCobro(traslado);
  if (montoACobrar === null) {
    return respuestaJson({ error: "El traslado todavía no cuenta con una cotización válida." }, 422);
  }
  const validacionMonto = validarRangoMontoCobro(montoACobrar);
  if (!validacionMonto.valido) {
    return respuestaJson({ error: validacionMonto.error }, 422);
  }
  if (traslado.cotizacion_expira_en && new Date(traslado.cotizacion_expira_en).getTime() <= Date.now()) {
    return respuestaJson({ error: "La cotización ha vencido. Solicita una actualización antes de pagar." }, 422);
  }

  // Defensa adicional sobre el precio autorizado. presupuesto_usuario nunca
  // participa en este cálculo ni se selecciona en esta función.

  // El cobro anticipado se dispara al crear la solicitud (cualquier estado,
  // como hasta ahora). El cobro al cierre solo tiene sentido una vez que el
  // traslado de verdad está esperando ese pago. El conductor no resuelve
  // pagos: al cierre, el cobro puede iniciarse en entrega_confirmada o
  // servicio_cerrado (usuario/admin) y se mantiene compatibilidad con
  // pago_pendiente para traslados históricos.
  const esCobroAnticipadoValido =
    traslado.tipo_pago === "anticipado" && traslado.estado === "cotizacion_aceptada";
  const esCobroAlCierreValido =
    traslado.tipo_pago === "al_cierre" && ["entrega_confirmada", "pago_pendiente", "servicio_cerrado"].includes(traslado.estado);

  if (!esCobroAnticipadoValido && !esCobroAlCierreValido) {
    return respuestaJson(
      {
        error:
          traslado.tipo_pago === "al_cierre"
            ? "El pago al cierre solo puede iniciarse cuando la entrega está confirmada"
            : traslado.tipo_pago === "anticipado"
              ? "Acepta la cotización antes de iniciar el pago anticipado"
              : "Este traslado no tiene un cobro pendiente que iniciar"
      },
      422
    );
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2025-02-24.acacia",
    httpClient: Stripe.createFetchHttpClient()
  });

  const clienteServicio = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

  const { data: pagoPendiente, error: errorPagoPendiente } = await clienteServicio
    .from("pagos")
    .select("stripe_payment_intent_id")
    .eq("traslado_id", traslado.id)
    .eq("estado", "pendiente")
    .not("stripe_payment_intent_id", "is", null)
    .order("registrado_en", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (errorPagoPendiente) {
    return respuestaJson({ error: errorPagoPendiente.message }, 500);
  }

  if (pagoPendiente?.stripe_payment_intent_id) {
    let intentExistente: Stripe.PaymentIntent;
    try {
      intentExistente = await stripe.paymentIntents.retrieve(pagoPendiente.stripe_payment_intent_id);
    } catch (error) {
      console.error("Error recuperando PaymentIntent:", error);
      return respuestaJson({ error: "No se pudo recuperar el intento de pago" }, 502);
    }

    const decision = decidirIntentExistente(intentExistente.status);

    // PI ya cobrado en Stripe pero aún pendiente en base (webhook con lag o
    // fallido): se reconcilia aquí en vez de devolver un clientSecret que
    // Elements rechazaría ("terminal state"). El estado viene de la API de
    // Stripe con llave secreta: misma verdad que el webhook.
    if (decision.accion === "reconciliar") {
      try {
        await reconciliarPagoExitoso(clienteServicio, traslado.id, intentExistente.id);
      } catch (error) {
        console.error("Error reconciliando pago exitoso:", error);
        return respuestaJson({ error: "Tu pago ya se procesó pero no pudimos reflejarlo. Intenta de nuevo." }, 500);
      }
      return respuestaJson({ pagoConfirmado: true });
    }

    // PI muerto (cancelado/abandonado): se marca fallido y se crea uno
    // nuevo abajo, nunca se reutiliza.
    if (decision.accion === "reemplazar") {
      const { error: errorCierre } = await clienteServicio
        .from("pagos")
        .update({ estado: "fallido" })
        .eq("stripe_payment_intent_id", intentExistente.id)
        .eq("estado", "pendiente");
      if (errorCierre) {
        console.error("Error cerrando PaymentIntent cancelado:", errorCierre);
        return respuestaJson({ error: "No se pudo reiniciar el intento de pago" }, 500);
      }
    } else {
      return respuestaJson({ clientSecret: intentExistente.client_secret });
    }
  }

  let intent: Stripe.PaymentIntent;
  try {
    intent = await stripe.paymentIntents.create({
      amount: Math.round(montoACobrar * 100), // Stripe usa centavos
      currency: "mxn",
      metadata: { traslado_id: traslado.id },
      automatic_payment_methods: { enabled: true }
    });
  } catch (error) {
    console.error("Error creando PaymentIntent:", error);
    return respuestaJson({ error: "No se pudo crear el intento de pago" }, 502);
  }

  // service_role: pagos no tiene política de INSERT para usuarios (por
  // diseño, ver 0007_pagos.sql) — el cobro se registra desde un servidor de
  // confianza, no desde el cliente.
  const { error: errorPago } = await clienteServicio.from("pagos").insert({
    traslado_id: traslado.id,
    monto: montoACobrar,
    momento: traslado.tipo_pago,
    metodo: "tarjeta",
    estado: "pendiente",
    stripe_payment_intent_id: intent.id
  });

  if (errorPago) {
    return respuestaJson({ error: errorPago.message }, 500);
  }

  return respuestaJson({ clientSecret: intent.client_secret });
});
