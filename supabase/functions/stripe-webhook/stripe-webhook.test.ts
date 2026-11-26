import { assertEquals } from "jsr:@std/assert@1";
import {
  conFetchSimulado,
  entornoDePrueba,
  STRIPE,
  SUPABASE,
} from "../_shared/test-http.ts";
import {
  cargoParcial,
  eventoStripe,
  intentoPagado,
  reembolsoParcial,
  solicitudStripe,
  traslado,
} from "../_shared/stripe-fixtures.ts";
import { crearWebhookStripe } from "./handler.ts";

const entorno = entornoDePrueba();
const secreto = entorno.get("STRIPE_WEBHOOK_SECRET");
const rest = `${SUPABASE}/rest/v1`;

Deno.test("stripe-webhook rechaza la firma inválida antes de consultar Stripe o escribir en BD", async () => {
  await conFetchSimulado({}, async (solicitudes) => {
    const responder = crearWebhookStripe(entorno);
    const evento = eventoStripe("payment_intent.succeeded", intentoPagado);
    const respuesta = await responder(
      solicitudStripe(evento, "firma-incorrecta"),
    );
    assertEquals(respuesta.status, 400);
    assertEquals(await respuesta.text(), "Firma inválida");
    assertEquals(solicitudes.length, 0);
  });
});

Deno.test("stripe-webhook concilia el estado actual y conserva la clave de idempotencia en reentregas", async () => {
  const evento = eventoStripe("payment_intent.payment_failed", {
    ...intentoPagado,
    status: "requires_payment_method",
  });
  let veces = 0;
  await conFetchSimulado({
    [`GET ${STRIPE}/v1/payment_intents/${intentoPagado.id}`]: intentoPagado,
    [`POST ${rest}/rpc/aplicar_verificacion_pago_stripe`]: () => ({
      ok: true,
      duplicado: veces++ > 0,
    }),
  }, async (solicitudes) => {
    const responder = crearWebhookStripe(entorno);
    for (let entrega = 0; entrega < 2; entrega++) {
      const respuesta = await responder(solicitudStripe(evento, secreto));
      assertEquals(respuesta.status, 200);
      assertEquals(await respuesta.text(), "ok");
    }
    const escrituras = solicitudes.filter(({ ruta }) => ruta.includes("/rpc/"));
    const esperada = {
      p_datos: {
        id: evento.id,
        intent_id: intentoPagado.id,
        traslado_id: traslado,
        estado_proveedor: "succeeded",
        monto_centavos: 100_000,
        monto_recibido: 100_000,
        moneda: "mxn",
        livemode: false,
        modo_esperado: false,
        origen: "webhook",
      },
    };
    assertEquals(escrituras.map(({ body }) => JSON.parse(body)), [
      esperada,
      esperada,
    ]);
  });
});

Deno.test("stripe-webhook registra 234.56 MXN de reembolso parcial sin marcar el pago como reembolsado", async () => {
  const evento = eventoStripe(
    "refund.updated",
    reembolsoParcial,
    "evt_Parcial",
  );
  const rutaRegistro = `POST ${rest}/rpc/registrar_reembolso_parcial_stripe`;
  await conFetchSimulado({
    [`GET ${STRIPE}/v1/refunds/${reembolsoParcial.id}`]: reembolsoParcial,
    [`GET ${STRIPE}/v1/charges/${cargoParcial.id}`]: cargoParcial,
    [rutaRegistro]: { ok: true, requiere_revision: false },
  }, async (solicitudes) => {
    const respuesta = await crearWebhookStripe(entorno)(
      solicitudStripe(evento, secreto),
    );
    assertEquals(respuesta.status, 200);
    assertEquals(solicitudes.map(({ ruta }) => ruta), [
      `GET ${STRIPE}/v1/refunds/${reembolsoParcial.id}`,
      `GET ${STRIPE}/v1/charges/${cargoParcial.id}`,
      rutaRegistro,
    ]);
    assertEquals(JSON.parse(solicitudes[2].body), {
      p_evento_id: evento.id,
      p_intent_id: intentoPagado.id,
      p_charge_id: cargoParcial.id,
      p_monto_reembolsado_centavos: 23_456,
      p_monto_cargo_centavos: 100_000,
      p_livemode: false,
    });
  });
});

Deno.test("stripe-webhook distingue el reembolso completo y pide reintento si falla el registro", async () => {
  const cargo = { ...cargoParcial, refunded: true, amount_refunded: 100_000 };
  const evento = eventoStripe("charge.refunded", cargo, "evt_Completo");
  const rutaPago = `POST ${rest}/rpc/procesar_pago_stripe`;
  await conFetchSimulado({
    [`GET ${STRIPE}/v1/charges/${cargo.id}`]: cargo,
    [rutaPago]: { ok: false },
  }, async (solicitudes) => {
    const respuesta = await crearWebhookStripe(entorno)(
      solicitudStripe(evento, secreto),
    );
    assertEquals(respuesta.status, 500);
    assertEquals(
      JSON.parse(solicitudes.find(({ ruta }) => ruta === rutaPago)!.body),
      {
        p_stripe_event_id: evento.id,
        p_stripe_payment_intent_id: intentoPagado.id,
        p_estado_pago: "reembolsado",
      },
    );
  });
});

Deno.test("stripe-webhook confirma un checkout masivo con el importe que recuperó de Stripe", async () => {
  const checkoutId = "cs_test_Fase1";
  const lote = "carga-fase1";
  const evento = eventoStripe("checkout.session.completed", {
    id: checkoutId,
    object: "checkout.session",
  });
  const checkpoint = `POST ${rest}/rpc/registrar_checkout_pago_confirmado`;
  const confirmar = `POST ${rest}/rpc/confirmar_checkout_masivo`;
  await conFetchSimulado({
    [`GET ${STRIPE}/v1/checkout/sessions/${checkoutId}`]: {
      payment_status: "paid",
      payment_intent: intentoPagado.id,
    },
    [`GET ${STRIPE}/v1/payment_intents/${intentoPagado.id}`]: {
      ...intentoPagado,
      metadata: { carga_masiva_id: lote },
    },
    [checkpoint]: null,
    [confirmar]: { ok: true },
  }, async (solicitudes) => {
    const respuesta = await crearWebhookStripe(entorno)(
      solicitudStripe(evento, secreto),
    );
    assertEquals(respuesta.status, 200);
    const escrituras = solicitudes.filter(({ ruta }) => ruta.includes("/rpc/"));
    assertEquals(escrituras.map(({ ruta }) => ruta), [checkpoint, confirmar]);
    assertEquals(JSON.parse(escrituras[1].body), {
      p_id: lote,
      p_intent: intentoPagado.id,
      p_monto: 100_000,
      p_moneda: "mxn",
    });
  });
});
