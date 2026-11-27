/// <reference lib="deno.ns" />
/// <reference lib="dom" />

// Edge Function: crea (o reutiliza) el PaymentIntent de Stripe del cobro de
// un traslado y registra la fila `pagos` en estado pendiente.

import { createClient } from "npm:@supabase/supabase-js@2.47.16";
import { crearStripe, type Stripe } from "../_shared/stripe.ts";
import { datosVerificacion, modoStripe, obtenerIntentoStripe } from "../_shared/stripe-verificacion.ts";
import {
  claveIdempotenciaCobro,
  decidirAjusteMonto,
  decidirIntentExistente,
  montoAutorizadoParaCobro,
  PISO_COBRO_MXN,
  validarRangoMontoCobro
} from "./logica.ts";
import { construirCabecerasCors, manejarCors } from "../_shared/cors-documentos.ts";
import { consumirRateLimit } from "../_shared/rate-limit.ts";

function respuestaJson(
  req: Request,
  body: Record<string, unknown>,
  status = 200,
  extraHeaders?: Record<string, string>,
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...construirCabecerasCors(req),
      "Content-Type": "application/json",
      ...extraHeaders,
    },
  });
}

/** Error interno: el detalle va al log con un id de traza, nunca al cliente. */
function errorInterno(
  req: Request,
  traza: string,
  codigo: string,
  detalle: unknown,
  mensaje = "No pudimos iniciar el pago. Intenta de nuevo.",
) {
  console.error("crear_payment_intent_error", {
    traza,
    codigo,
    detalle: detalle instanceof Error ? detalle.message.slice(0, 200) : (detalle as { code?: string } | null)?.code ?? null
  });
  return respuestaJson(req, { error: mensaje, traza }, 500);
}

export async function manejarCrearPaymentIntent(req: Request, entorno: Pick<typeof Deno.env, "get"> = Deno.env) {
  const rechazoCors = manejarCors(req);
  if (rechazoCors) return rechazoCors;
  if (req.method !== "POST") {
    return respuestaJson(req, { error: "Método no permitido" }, 405);
  }

  const traza = crypto.randomUUID();
  const autorizacion = req.headers.get("Authorization");
  if (!autorizacion) {
    return respuestaJson(req, { error: "Falta sesión" }, 401);
  }

  const stripeSecretKey = entorno.get("STRIPE_SECRET_KEY");
  const serviceKey = entorno.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!stripeSecretKey || !serviceKey) {
    console.error("crear_payment_intent_config_incompleta", { traza });
    return respuestaJson(req, { error: "El servicio de pagos no está disponible temporalmente.", traza }, 503);
  }

  // Cliente "como el usuario" (respeta RLS) — confirma que la sesión es real
  // y que el traslado de verdad le pertenece, antes de crear ningún cobro.
  const supabaseUrl = entorno.get("SUPABASE_URL") ?? "";
  const clienteUsuario = createClient(supabaseUrl, entorno.get("SUPABASE_ANON_KEY") ?? "", {
    global: { headers: { Authorization: autorizacion } }
  });

  const { data: sesion, error: errorSesion } = await clienteUsuario.auth.getUser();
  if (errorSesion || !sesion.user) {
    return respuestaJson(req, { error: "Sesión inválida" }, 401);
  }

  const clienteServicio = createClient(supabaseUrl, serviceKey);

  try {
    const limite = await consumirRateLimit(
      clienteServicio,
      "crear-payment-intent",
      sesion.user.id,
      15,
      300,
    );
    if (!limite.permitido) {
      return respuestaJson(
        req,
        { error: "Demasiados intentos de pago. Intenta nuevamente en unos minutos." },
        429,
        { "Retry-After": String(limite.reintentarEn) },
      );
    }
  } catch (errorLimite) {
    console.error("crear_payment_intent_rate_limit", {
      traza,
      detalle: errorLimite instanceof Error ? errorLimite.message.slice(0, 120) : null,
    });
    return respuestaJson(req, { error: "El servicio de pagos no está disponible temporalmente.", traza }, 503);
  }

  const { data: usuarioActual, error: errorUsuarioActual } = await clienteUsuario
    .from("usuarios")
    .select("id, tipo_cuenta, rol, empresa_id")
    .eq("auth_user_id", sesion.user.id)
    .single();

  if (errorUsuarioActual || !usuarioActual) {
    return respuestaJson(req, { error: "Usuario no encontrado" }, 404);
  }

  let payload: { traslado_id?: string | number };
  try {
    payload = (await req.json()) as { traslado_id?: string | number };
  } catch {
    return respuestaJson(req, { error: "JSON inválido" }, 400);
  }

  const { traslado_id } = payload;
  if (!traslado_id) {
    return respuestaJson(req, { error: "Falta traslado_id" }, 400);
  }

  const { data: traslado, error: errorTraslado } = await clienteUsuario
    .from("traslados")
    .select("id, usuario_id, precio_cotizado, precio_final, tipo_pago, estado, cotizacion_expira_en")
    .eq("id", traslado_id)
    .single();

  if (errorTraslado || !traslado) {
    // RLS ya filtró esto: si no es tuyo, no existe para esta consulta.
    return respuestaJson(req, { error: "Traslado no encontrado" }, 404);
  }

  const { data: solicitante, error: errorSolicitante } = await clienteUsuario
    .from("usuarios")
    .select("id, tipo_cuenta, rol, empresa_id")
    .eq("id", traslado.usuario_id)
    .single();

  if (errorSolicitante || !solicitante) {
    return respuestaJson(req, { error: "No se pudo validar la cuenta que solicitó el traslado" }, 403);
  }

  const esTrasladoEmpresa =
    solicitante.tipo_cuenta === "empresa" ||
    (solicitante.empresa_id !== null && solicitante.empresa_id === usuarioActual.empresa_id);

  if (esTrasladoEmpresa && usuarioActual.rol !== "titular_empresa") {
    return respuestaJson(
      req,
      { error: "Necesitas autorización del titular de la empresa para iniciar este pago." },
      403
    );
  }

  // PRD §4.6 — si ya hay un precio_final (ajustado al cierre), ese es el monto
  // a cobrar; si no, la cotización original.
  const montoACobrar = montoAutorizadoParaCobro(traslado);
  if (montoACobrar === null) {
    return respuestaJson(req, { error: "El traslado todavía no cuenta con una cotización válida." }, 422);
  }
  // Mismo piso que calcular_tarifa_traslado (tarifas_config.piso_cobro).
  const { data: pisoConfigurado } = await clienteServicio.rpc("piso_cobro_traslado");
  const piso = pisoConfigurado == null ? PISO_COBRO_MXN : Number(pisoConfigurado);
  const validacionMonto = validarRangoMontoCobro(montoACobrar, Number.isFinite(piso) ? piso : PISO_COBRO_MXN);
  if (!validacionMonto.valido) {
    return respuestaJson(req, { error: validacionMonto.error }, 422);
  }
  if (traslado.cotizacion_expira_en && new Date(traslado.cotizacion_expira_en).getTime() <= Date.now()) {
    return respuestaJson(req, { error: "La cotización ha vencido. Solicita una actualización antes de pagar." }, 422);
  }
  const montoCentavos = Math.round(montoACobrar * 100);

  const esCobroAnticipadoValido =
    traslado.tipo_pago === "anticipado" && traslado.estado === "cotizacion_aceptada";
  const esCobroAlCierreValido =
    traslado.tipo_pago === "al_cierre" && ["entrega_confirmada", "pago_pendiente", "servicio_cerrado"].includes(traslado.estado);

  if (!esCobroAnticipadoValido && !esCobroAlCierreValido) {
    return respuestaJson(
      req,
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

  const stripe = crearStripe(stripeSecretKey);
  const modo = modoStripe(stripeSecretKey);

  const { data: pagoExistente, error: errorConsultaPago } = await clienteServicio
    .from("pagos")
    .select("id, stripe_payment_intent_id, estado")
    .eq("traslado_id", traslado.id)
    .eq("momento", traslado.tipo_pago)
    .neq("metodo", "cargo_cancelacion")
    .or("estado.eq.completado,and(estado.eq.pendiente,stripe_payment_intent_id.not.is.null)")
    .order("estado", { ascending: false })
    .order("registrado_en", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (errorConsultaPago) {
    return errorInterno(req, traza, "consulta_pago", errorConsultaPago);
  }
  if (pagoExistente?.estado === "completado") {
    return respuestaJson(req, { pagoConfirmado: true });
  }

  // RC-05: clave de idempotencia estable por operación de cobro (incluye el
  // monto para que un cambio de precio no reciba el PI cacheado anterior).
  let idempotencyKey = claveIdempotenciaCobro(traslado.id, montoCentavos);

  if (pagoExistente?.stripe_payment_intent_id) {
    let intentExistente: Stripe.PaymentIntent;
    try {
      intentExistente = await stripe.paymentIntents.retrieve(pagoExistente.stripe_payment_intent_id);
    } catch (error) {
      console.error("crear_payment_intent_retrieve", { traza, code: error instanceof Error ? error.message.slice(0, 120) : null });
      return respuestaJson(req, { error: "No se pudo recuperar el intento de pago", traza }, 502);
    }

    const decision = decidirIntentExistente(intentExistente.status);

    // PI ya cobrado en Stripe pero pendiente en base (webhook con lag o
    // fallido): se concilia con la RPC canónica, que valida monto, moneda,
    // livemode y traslado, aplica guarda optimista y no duplica auditoría.
    if (decision.accion === "reconciliar") {
      try {
        const verificado = await obtenerIntentoStripe(stripeSecretKey, intentExistente.id);
        const { data, error } = await clienteServicio.rpc("aplicar_verificacion_pago_stripe", {
          p_datos: datosVerificacion(verificado, modo, "conciliacion")
        });
        if (error) throw error;
        if (data?.requiere_revision) throw new Error("provider_state_requires_review");
      } catch (error) {
        return errorInterno(req, traza, "conciliacion_fallida", error, "Tu pago ya se procesó pero no pudimos reflejarlo. Intenta de nuevo en unos minutos.");
      }
      return respuestaJson(req, { pagoConfirmado: true });
    }

    let reemplazar = decision.accion === "reemplazar";

    if (decision.accion === "reutilizar") {
      // El precio vigente puede haber cambiado desde que se creó el PI.
      const ajuste = decidirAjusteMonto(intentExistente.status, intentExistente.amount, montoCentavos);
      if (ajuste.accion === "en_proceso") {
        return respuestaJson(req, { error: "Tu pago anterior se está procesando. Espera unos minutos antes de intentarlo de nuevo." }, 409);
      }
      if (ajuste.accion === "actualizar") {
        try {
          await stripe.paymentIntents.update(intentExistente.id, { amount: montoCentavos });
          const { error } = await clienteServicio.from("pagos").update({ monto: montoACobrar })
            .eq("id", pagoExistente.id).eq("estado", "pendiente");
          if (error) throw error;
        } catch (error) {
          return errorInterno(req, traza, "actualizar_monto_fallido", error);
        }
      }
      if (ajuste.accion === "reemplazar") {
        try {
          await stripe.paymentIntents.cancel(intentExistente.id, { cancellation_reason: "abandoned" });
        } catch (error) {
          return errorInterno(req, traza, "cancelar_intent_monto_viejo", error);
        }
        reemplazar = true;
      }
      if (!reemplazar) {
        return respuestaJson(req, { clientSecret: intentExistente.client_secret });
      }
    }

    // PI muerto o con monto viejo cancelado: se marca fallido y se crea uno
    // nuevo abajo con una clave que incluye el PI reemplazado.
    const { error: errorCierre } = await clienteServicio
      .from("pagos")
      .update({ estado: "fallido" })
      .eq("stripe_payment_intent_id", intentExistente.id)
      .eq("estado", "pendiente");
    if (errorCierre) {
      return errorInterno(req, traza, "cerrar_intent_fallido", errorCierre);
    }
    idempotencyKey = claveIdempotenciaCobro(traslado.id, montoCentavos, intentExistente.id);
  }

  let intent: Stripe.PaymentIntent;
  try {
    const { data: billetera, error: errorBilletera } = await clienteServicio.from("billetera_clientes_stripe")
      .select("stripe_customer_id").eq("auth_user_id", sesion.user.id)
      .eq("modo", modo ? "live" : "test").maybeSingle();
    if (errorBilletera) throw errorBilletera;
    intent = await stripe.paymentIntents.create({
      ...(billetera ? { customer: billetera.stripe_customer_id } : {}),
      amount: montoCentavos, // Stripe usa centavos
      currency: "mxn",
      metadata: { traslado_id: traslado.id },
      // Solo tarjeta: OXXO/SPEI dejan el PI en requires_action con una ficha
      // que la UI no sabía manejar y que podía vencer después de la cotización.
      allowed_payment_method_types: ["card"]
    }, {
      idempotencyKey
    });
  } catch (error) {
    console.error("crear_payment_intent_create", { traza, code: error instanceof Error ? error.message.slice(0, 120) : null });
    return respuestaJson(req, { error: "No se pudo crear el intento de pago", traza }, 502);
  }

  // service_role: pagos no tiene política de INSERT para usuarios.
  const { error: errorPago } = await clienteServicio.from("pagos").insert({
    traslado_id: traslado.id,
    monto: montoACobrar,
    momento: traslado.tipo_pago,
    metodo: "tarjeta",
    estado: "pendiente",
    stripe_payment_intent_id: intent.id
  });

  if (errorPago) {
    // RC-05: carrera. Otra petición concurrente ya registró este mismo PI.
    if ((errorPago as { code?: string }).code === "23505") {
      return respuestaJson(req, { clientSecret: intent.client_secret });
    }
    return errorInterno(req, traza, "registrar_pago_fallido", errorPago);
  }

  return respuestaJson(req, { clientSecret: intent.client_secret });
}
