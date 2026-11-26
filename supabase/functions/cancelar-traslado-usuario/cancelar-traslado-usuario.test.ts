import { assertEquals } from "jsr:@std/assert@1";
import { intentoPagado, traslado } from "../_shared/stripe-fixtures.ts";
import {
  conFetchSimulado,
  entornoDePrueba,
  solicitudJson,
  STRIPE,
  SUPABASE,
  USUARIO,
} from "../_shared/test-http.ts";
import { manejarCancelarTraslado } from "./handler.ts";

const rest = `${SUPABASE}/rest/v1`;
const rutaCancelar = `POST ${rest}/rpc/servidor_cancela_traslado`;
const auth = `GET ${SUPABASE}/auth/v1/user`;
const entorno = entornoDePrueba();
const solicitud = () =>
  solicitudJson({ traslado_id: traslado, motivo: "Cambio de fecha" }, {
    Authorization: "Bearer sesion-de-prueba",
  });

Deno.test("cancelar-traslado-usuario cancela el intento pendiente y aplica el reembolso parcial autorizado", async () => {
  const rutaReembolsoStripe = `POST ${STRIPE}/v1/refunds`;
  const rutaReclamo = `POST ${rest}/rpc/reclamar_reembolsos_traslado`;
  await conFetchSimulado({
    [auth]: { id: USUARIO },
    [rutaCancelar]: {
      porcentaje_cargo: 25,
      monto_cargo: 250,
      monto_pagado: 1000,
      monto_reembolso: 750,
      payment_intents_pendientes: ["pi_Pendiente"],
    },
    [`POST ${STRIPE}/v1/payment_intents/pi_Pendiente/cancel`]: {
      id: "pi_Pendiente",
      status: "canceled",
    },
    [rutaReclamo]: [{
      id: "reembolso-fase1",
      traslado_id: traslado,
      pago_id: "pago-fase1",
      stripe_payment_intent_id: intentoPagado.id,
      monto: 750,
      motivo: "cancelacion_usuario",
    }],
    [rutaReembolsoStripe]: { id: "re_Fase1", status: "succeeded" },
    [`POST ${rest}/rpc/registrar_resultado_reembolso`]: null,
  }, async (solicitudes) => {
    const respuesta = await manejarCancelarTraslado(solicitud(), entorno);
    assertEquals(respuesta.status, 200);
    const resultado = await respuesta.json();
    assertEquals([
      resultado.monto_cargo,
      resultado.monto_reembolso,
      resultado.reembolso_en_proceso,
    ], [250, 750, false]);
    assertEquals(
      JSON.parse(solicitudes.find(({ ruta }) => ruta === rutaCancelar)!.body),
      {
        p_auth_user_id: USUARIO,
        p_traslado_id: traslado,
        p_motivo: "Cambio de fecha",
      },
    );
    assertEquals(
      JSON.parse(solicitudes.find(({ ruta }) => ruta === rutaReclamo)!.body)
        .p_traslado_id,
      traslado,
    );
    const form = new URLSearchParams(
      solicitudes.find(({ ruta }) => ruta === rutaReembolsoStripe)!.body,
    );
    assertEquals([form.get("payment_intent"), form.get("amount")], [
      intentoPagado.id,
      "75000",
    ]);
  });
});

Deno.test("cancelar-traslado-usuario devuelve el rechazo de negocio sin tocar Stripe", async () => {
  await conFetchSimulado({
    [auth]: { id: USUARIO },
    [rutaCancelar]: () =>
      Response.json({
        code: "P0001",
        message: "El traslado no pertenece al usuario",
      }, { status: 400 }),
  }, async () => {
    const respuesta = await manejarCancelarTraslado(solicitud(), entorno);
    assertEquals(respuesta.status, 422);
    assertEquals(await respuesta.json(), {
      error: "El traslado no pertenece al usuario",
    });
  });
});
