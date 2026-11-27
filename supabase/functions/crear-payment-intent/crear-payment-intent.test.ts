import { assertEquals } from "jsr:@std/assert@1";
import { intentoPagado, traslado } from "../_shared/stripe-fixtures.ts";
import {
  conFetchSimulado,
  entornoDePrueba,
  type RutasSimuladas,
  solicitudJson,
  STRIPE,
  SUPABASE,
  USUARIO,
} from "../_shared/test-http.ts";
import { manejarCrearPaymentIntent } from "./handler.ts";

const rest = `${SUPABASE}/rest/v1`;
const entorno = entornoDePrueba();
const usuario = {
  id: USUARIO,
  tipo_cuenta: "personal",
  rol: "usuario",
  empresa_id: null,
};
const consultaIntent = `GET ${STRIPE}/v1/payment_intents/${intentoPagado.id}`;
const crearIntent = `POST ${STRIPE}/v1/payment_intents`;
const registrarPago = `POST ${rest}/pagos`;
const cotizacion = {
  id: traslado,
  usuario_id: usuario.id,
  precio_cotizado: 900,
  precio_final: 1000.25,
  tipo_pago: "al_cierre",
  estado: "entrega_confirmada",
  cotizacion_expira_en: null,
};
const intento = {
  ...intentoPagado,
  status: "requires_payment_method",
  client_secret: "client-secret-fixture",
};
const solicitud = () =>
  solicitudJson({ traslado_id: traslado, monto: 1 }, {
    Authorization: "Bearer sesion-de-prueba",
  });
const sinContenido = () => new Response(null, { status: 204 });

function rutasPago(cambios: RutasSimuladas = {}): RutasSimuladas {
  return {
    [`GET ${SUPABASE}/auth/v1/user`]: { id: USUARIO },
    [`POST ${rest}/rpc/consumir_rate_limit`]: [{ permitido: true, reintentar_en: 0 }],
    [`GET ${rest}/usuarios`]: usuario,
    [`GET ${rest}/traslados`]: cotizacion,
    [`POST ${rest}/rpc/piso_cobro_traslado`]: 699,
    ...cambios,
  };
}

Deno.test("crear-payment-intent cobra el precio final autorizado y registra el mismo monto en MXN", async () => {
  await conFetchSimulado(
    rutasPago({
      [`GET ${rest}/pagos`]: [],
      [`GET ${rest}/billetera_clientes_stripe`]: [{
        stripe_customer_id: "cus_Fase1",
      }],
      [crearIntent]: intento,
      [registrarPago]: sinContenido,
    }),
    async (solicitudes) => {
      const respuesta = await manejarCrearPaymentIntent(solicitud(), entorno);
      assertEquals(respuesta.status, 200);
      assertEquals(await respuesta.json(), {
        clientSecret: intento.client_secret,
      });
      const cobro = solicitudes.find(({ ruta }) => ruta === crearIntent)!;
      const form = new URLSearchParams(cobro.body);
      assertEquals(form.get("amount"), "100025");
      assertEquals(form.get("currency"), "mxn");
      assertEquals(form.get("metadata[traslado_id]"), traslado);
      assertEquals(form.get("customer"), "cus_Fase1");
      assertEquals(
        cobro.headers.get("idempotency-key"),
        `traslado-${traslado}-100025`,
      );
      assertEquals(
        JSON.parse(
          solicitudes.find(({ ruta }) => ruta === registrarPago)!.body,
        ),
        {
          traslado_id: traslado,
          monto: 1000.25,
          momento: "al_cierre",
          metodo: "tarjeta",
          estado: "pendiente",
          stripe_payment_intent_id: intento.id,
        },
      );
    },
  );
});

for (
  const caso of [
    {
      nombre: "cotización vencida",
      cambios: { cotizacion_expira_en: "2000-01-01T00:00:00Z" },
      piso: 699,
    },
    {
      nombre: "importe debajo del piso configurado",
      cambios: { precio_final: 710 },
      piso: 750,
    },
    {
      nombre: "importe debajo del piso de respaldo",
      cambios: { precio_final: 1 },
      piso: null,
    },
    {
      nombre: "entrega sin confirmar",
      cambios: { estado: "traslado_en_curso" },
      piso: 699,
    },
  ]
) {
  Deno.test(`crear-payment-intent no crea un cobro con ${caso.nombre}`, async () => {
    await conFetchSimulado(
      rutasPago({
        [`GET ${rest}/traslados`]: { ...cotizacion, ...caso.cambios },
        [`POST ${rest}/rpc/piso_cobro_traslado`]: caso.piso,
      }),
      async () => {
        assertEquals(
          (await manejarCrearPaymentIntent(solicitud(), entorno)).status,
          422,
        );
      },
    );
  });
}

Deno.test("crear-payment-intent rechaza un pago corporativo si el usuario no es el titular", async () => {
  const miembro = {
    ...usuario,
    tipo_cuenta: "empresa",
    empresa_id: "empresa-fase1",
  };
  await conFetchSimulado(
    rutasPago({ [`GET ${rest}/usuarios`]: miembro }),
    async () => {
      assertEquals(
        (await manejarCrearPaymentIntent(solicitud(), entorno)).status,
        403,
      );
    },
  );
});

const pagoPendiente = [{
  id: "pago-fase1",
  stripe_payment_intent_id: intento.id,
  estado: "pendiente",
}];

Deno.test("crear-payment-intent confirma un pago ya registrado de un traslado cerrado sin volver a cobrarlo", async () => {
  const pagos = `GET ${rest}/pagos`;
  await conFetchSimulado(
    rutasPago({
      [`GET ${rest}/traslados`]: { ...cotizacion, estado: "servicio_cerrado" },
      [pagos]: [{ ...pagoPendiente[0], estado: "completado" }],
    }),
    async (solicitudes) => {
      const respuesta = await manejarCrearPaymentIntent(solicitud(), entorno);
      assertEquals(respuesta.status, 200);
      assertEquals(await respuesta.json(), { pagoConfirmado: true });
      const { searchParams } =
        solicitudes.find(({ ruta }) => ruta === pagos)!.url;
      assertEquals(searchParams.get("momento"), "eq.al_cierre");
      assertEquals(searchParams.get("metodo"), "neq.cargo_cancelacion");
      assertEquals(searchParams.get("order"), "estado.desc,registrado_en.desc");
      assertEquals(
        searchParams.get("or"),
        "(estado.eq.completado,and(estado.eq.pendiente,stripe_payment_intent_id.not.is.null))",
      );
    },
  );
});

Deno.test("crear-payment-intent corrige el monto pendiente en Stripe y en pagos antes de devolver el client secret", async () => {
  const actualizarIntent = `POST ${STRIPE}/v1/payment_intents/${intento.id}`;
  const actualizarPago = `PATCH ${rest}/pagos`;
  await conFetchSimulado(
    rutasPago({
      [`GET ${rest}/pagos`]: pagoPendiente,
      [consultaIntent]: intento,
      [actualizarIntent]: { ...intento, amount: 100_025 },
      [actualizarPago]: sinContenido,
    }),
    async (solicitudes) => {
      const respuesta = await manejarCrearPaymentIntent(solicitud(), entorno);
      assertEquals(respuesta.status, 200);
      assertEquals(await respuesta.json(), {
        clientSecret: intento.client_secret,
      });
      const escrituras = solicitudes.filter(({ ruta }) =>
        [actualizarIntent, actualizarPago].includes(ruta)
      );
      assertEquals(escrituras.map(({ ruta }) => ruta), [
        actualizarIntent,
        actualizarPago,
      ]);
      assertEquals(
        new URLSearchParams(escrituras[0].body).get("amount"),
        "100025",
      );
      assertEquals(JSON.parse(escrituras[1].body), { monto: 1000.25 });
      assertEquals(
        escrituras[1].url.searchParams.get("estado"),
        "eq.pendiente",
      );
    },
  );
});

Deno.test("crear-payment-intent bloquea el reajuste si el cobro anterior está en proceso", async () => {
  await conFetchSimulado(
    rutasPago({
      [`GET ${rest}/pagos`]: pagoPendiente,
      [consultaIntent]: { ...intento, status: "processing" },
    }),
    async () => {
      assertEquals(
        (await manejarCrearPaymentIntent(solicitud(), entorno)).status,
        409,
      );
    },
  );
});

Deno.test("crear-payment-intent reemplaza un intento cancelado con una nueva clave de idempotencia", async () => {
  await conFetchSimulado(
    rutasPago({
      [`GET ${rest}/pagos`]: pagoPendiente,
      [consultaIntent]: { ...intento, status: "canceled" },
      [`PATCH ${rest}/pagos`]: sinContenido,
      [`GET ${rest}/billetera_clientes_stripe`]: [],
      [crearIntent]: { ...intento, id: "pi_Nuevo" },
      [registrarPago]: sinContenido,
    }),
    async (solicitudes) => {
      assertEquals(
        (await manejarCrearPaymentIntent(solicitud(), entorno)).status,
        200,
      );
      assertEquals(
        solicitudes.find(({ ruta }) => ruta === crearIntent)!.headers.get(
          "idempotency-key",
        ),
        `traslado-${traslado}-reemplazo-${intento.id}-100025`,
      );
      assertEquals(
        JSON.parse(
          solicitudes.find(({ ruta }) => ruta === `PATCH ${rest}/pagos`)!.body,
        ),
        { estado: "fallido" },
      );
    },
  );
});

Deno.test("crear-payment-intent concilia un cobro ya realizado en Stripe sin crear otro", async () => {
  const verificarPago = `POST ${rest}/rpc/aplicar_verificacion_pago_stripe`;
  await conFetchSimulado(
    rutasPago({
      [`GET ${rest}/pagos`]: pagoPendiente,
      [consultaIntent]: {
        ...intentoPagado,
        amount: 100_025,
        amount_received: 100_025,
      },
      [verificarPago]: { ok: true, duplicado: false },
    }),
    async (solicitudes) => {
      const respuesta = await manejarCrearPaymentIntent(solicitud(), entorno);
      assertEquals(respuesta.status, 200);
      assertEquals(await respuesta.json(), { pagoConfirmado: true });
      const { p_datos } = JSON.parse(
        solicitudes.find(({ ruta }) => ruta === verificarPago)!.body,
      );
      assertEquals([p_datos.monto_recibido, p_datos.origen], [
        100_025,
        "conciliacion",
      ]);
    },
  );
});
