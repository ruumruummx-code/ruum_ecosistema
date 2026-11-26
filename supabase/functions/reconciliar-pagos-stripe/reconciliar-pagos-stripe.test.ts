import { assertEquals } from "jsr:@std/assert@1";
import { cargoParcial, intentoPagado } from "../_shared/stripe-fixtures.ts";
import {
  conFetchSimulado,
  entornoDePrueba,
  type RutasSimuladas,
  SERVICIO,
  solicitudJson,
  STRIPE,
  SUPABASE,
} from "../_shared/test-http.ts";
import { crearReconciliadorStripe } from "./handler.ts";

const rest = `${SUPABASE}/rest/v1`;
const ejecuciones = `${rest}/stripe_conciliacion_ejecuciones`;
const entorno = entornoDePrueba();
const nonce = "1".repeat(64);
const idEjecucion = "11000000-0000-4000-8000-000000000050";
const solicitudManual = () =>
  solicitudJson({}, { Authorization: `Bearer ${SERVICIO}` });
const sinContenido = () => new Response(null, { status: 204 });

function rutasConciliacion(cambios: RutasSimuladas): RutasSimuladas {
  return {
    [`POST ${ejecuciones}`]: sinContenido,
    [`PATCH ${ejecuciones}`]: sinContenido,
    [`GET ${rest}/pagos`]: [],
    [`GET ${rest}/checkout_traslados_masivos`]: [],
    [`POST ${rest}/rpc/reclamar_reembolsos_traslado`]: [],
    ...cambios,
  };
}

Deno.test("reconciliar-pagos-stripe rechaza un nonce ya consumido antes de consultar Stripe", async () => {
  const reclamo = `POST ${rest}/rpc/tomar_ejecucion_conciliacion`;
  await conFetchSimulado({ [reclamo]: false }, async (solicitudes) => {
    const respuesta = await crearReconciliadorStripe(entorno)(
      solicitudJson({ ejecucion_id: idEjecucion, nonce }),
    );
    assertEquals(respuesta.status, 401);
    assertEquals(solicitudes.map(({ body }) => JSON.parse(body)), [{
      p_id: idEjecucion,
      p_nonce: nonce,
    }]);
  });
});

Deno.test("reconciliar-pagos-stripe solo marca reembolsado el cargo completo y recupera un checkout pagado", async () => {
  const intentCompleto = "pi_Completo";
  const cargoCompleto = "ch_Completo";
  const intentMasivo = "pi_Masivo";
  const lote = "lote-fase1";
  const verificar = `POST ${rest}/rpc/aplicar_verificacion_pago_stripe`;
  const reembolsar = `POST ${rest}/rpc/procesar_pago_stripe`;
  const confirmar = `POST ${rest}/rpc/confirmar_checkout_masivo`;
  await conFetchSimulado(
    rutasConciliacion({
      [`GET ${rest}/pagos`]: ({ url }) =>
        url.searchParams.has("traslados.estado") ? [] : [
          { stripe_payment_intent_id: intentoPagado.id },
          { stripe_payment_intent_id: intentCompleto },
        ],
      [`GET ${STRIPE}/v1/payment_intents/${intentoPagado.id}`]: {
        ...intentoPagado,
        latest_charge: cargoParcial.id,
      },
      [`GET ${STRIPE}/v1/charges/${cargoParcial.id}`]: cargoParcial,
      [`GET ${STRIPE}/v1/payment_intents/${intentCompleto}`]: {
        ...intentoPagado,
        id: intentCompleto,
        latest_charge: cargoCompleto,
      },
      [`GET ${STRIPE}/v1/charges/${cargoCompleto}`]: {
        ...cargoParcial,
        id: cargoCompleto,
        payment_intent: intentCompleto,
        refunded: true,
        amount_refunded: 100_000,
      },
      [verificar]: { ok: true },
      [reembolsar]: { ok: true },
      [`GET ${rest}/checkout_traslados_masivos`]: [{
        id: lote,
        stripe_payment_intent_id: intentMasivo,
        monto_centavos: 100_000,
        creado_en: "2000-01-01T00:00:00Z",
      }],
      [`GET ${STRIPE}/v1/payment_intents/${intentMasivo}`]: {
        ...intentoPagado,
        id: intentMasivo,
        metadata: { carga_masiva_id: lote },
      },
      [`POST ${rest}/rpc/registrar_checkout_pago_confirmado`]: null,
      [confirmar]: { ok: true },
    }),
    async (solicitudes) => {
      const respuesta = await crearReconciliadorStripe(entorno)(
        solicitudManual(),
      );
      assertEquals(respuesta.status, 200);
      const resultado = await respuesta.json();
      assertEquals([
        resultado.verificados,
        resultado.checkouts_confirmados,
        resultado.errores,
      ], [2, 1, []]);
      function parametros(rutaBuscada: string) {
        return solicitudes.filter(({ ruta }) => ruta === rutaBuscada).map((
          { body },
        ) => JSON.parse(body));
      }
      assertEquals(parametros(reembolsar), [{
        p_stripe_event_id: `conciliacion_reembolso_${cargoCompleto}`,
        p_stripe_payment_intent_id: intentCompleto,
        p_estado_pago: "reembolsado",
      }]);
      assertEquals(parametros(verificar).map(({ p_datos }) => p_datos.id), [
        `reconcile:${intentoPagado.id}:succeeded:100000:false`,
      ]);
      assertEquals(parametros(confirmar), [{
        p_id: lote,
        p_intent: intentMasivo,
        p_monto: 100_000,
        p_moneda: "mxn",
      }]);
      assertEquals(parametros(`PATCH ${ejecuciones}`)[0].estado, "completada");
    },
  );
});

Deno.test("reconciliar-pagos-stripe registra fallo y rechaza un entorno inconsistente", async () => {
  await conFetchSimulado(
    rutasConciliacion({
      [`GET ${rest}/pagos`]: ({ url }) =>
        url.searchParams.has("traslados.estado") ? [] : [
          { stripe_payment_intent_id: intentoPagado.id },
        ],
      [`GET ${STRIPE}/v1/payment_intents/${intentoPagado.id}`]: {
        ...intentoPagado,
        livemode: true,
      },
    }),
    async (solicitudes) => {
      const respuesta = await crearReconciliadorStripe(entorno)(
        solicitudManual(),
      );
      assertEquals(respuesta.status, 502);
      const resultado = await respuesta.json();
      assertEquals(resultado.verificados, 0);
      assertEquals(resultado.errores, [{
        intent_id: intentoPagado.id,
        codigo: "stripe_environment_mismatch",
      }]);
      const cierre = JSON.parse(
        solicitudes.find(({ ruta }) => ruta === `PATCH ${ejecuciones}`)!.body,
      );
      assertEquals(cierre.estado, "fallida");
      assertEquals(cierre.resultado, resultado);
    },
  );
});

Deno.test("reconciliar-pagos-stripe reintenta reembolsos encolados con una clave estable por fila", async () => {
  const reembolso = {
    id: "reembolso-fase1",
    traslado_id: "traslado-fase1",
    pago_id: "pago-fase1",
    stripe_payment_intent_id: intentoPagado.id,
    monto: "234.56",
    motivo: "cancelacion_usuario",
  };
  const resultadoReembolso = `POST ${rest}/rpc/registrar_resultado_reembolso`;
  const rutaStripe = `POST ${STRIPE}/v1/refunds`;
  let falloAlGuardar = true;
  await conFetchSimulado(
    rutasConciliacion({
      [`POST ${rest}/rpc/reclamar_reembolsos_traslado`]: [reembolso],
      [rutaStripe]: { id: "re_Fase1", status: "succeeded" },
      [resultadoReembolso]: ({ body }) => {
        if (falloAlGuardar && JSON.parse(body).p_ok) {
          falloAlGuardar = false;
          return Response.json({ message: "Escritura interrumpida" }, {
            status: 500,
          });
        }
        return null;
      },
    }),
    async (solicitudes) => {
      const responder = crearReconciliadorStripe(entorno);
      const fallido = await responder(solicitudManual());
      assertEquals(fallido.status, 502);
      assertEquals((await fallido.json()).errores, [{
        intent_id: reembolso.id,
        codigo: "refund_result_write_failed",
      }]);
      const reintento = await responder(solicitudManual());
      assertEquals(reintento.status, 200);
      assertEquals((await reintento.json()).reembolsos_completados, 1);
      const llamadas = solicitudes.filter(({ ruta }) => ruta === rutaStripe);
      assertEquals(
        llamadas.map(({ headers }) => headers.get("idempotency-key")),
        [
          `reembolso-${reembolso.id}`,
          `reembolso-${reembolso.id}`,
        ],
      );
      assertEquals(
        llamadas.map(({ body }) => new URLSearchParams(body).get("amount")),
        ["23456", "23456"],
      );
      assertEquals(
        solicitudes.filter(({ ruta }) => ruta === resultadoReembolso).map((
          { body },
        ) => JSON.parse(body)),
        [
          {
            p_id: reembolso.id,
            p_ok: true,
            p_stripe_refund_id: "re_Fase1",
            p_error: null,
          },
          {
            p_id: reembolso.id,
            p_ok: false,
            p_stripe_refund_id: null,
            p_error: "refund_result_write_failed",
          },
          {
            p_id: reembolso.id,
            p_ok: true,
            p_stripe_refund_id: "re_Fase1",
            p_error: null,
          },
        ],
      );
    },
  );
});
