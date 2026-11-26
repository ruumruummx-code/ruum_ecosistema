import { assertEquals } from "jsr:@std/assert@1";
import {
  conFetchSimulado,
  DIDIT,
  entornoDePrueba,
  solicitudJson,
  SUPABASE,
} from "../_shared/test-http.ts";
import { manejarConciliacionDidit } from "./handler.ts";

const entorno = entornoDePrueba();
const rest = `${SUPABASE}/rest/v1`;
const rpc = `POST ${rest}/rpc/reconciliar_verificacion_didit_resultado`;
const autorizada = () =>
  solicitudJson({}, {
    "x-reconciler-secret": entorno.get("DIDIT_RECONCILER_SECRET"),
  });

Deno.test("reconciliar-verificaciones-didit rechaza llamadas sin credenciales válidas", async () => {
  await conFetchSimulado({}, async (solicitudes) => {
    const respuesta = await manejarConciliacionDidit(
      solicitudJson({}, { "x-reconciler-secret": "incorrecto" }),
      entorno,
    );
    assertEquals(respuesta.status, 401);
    assertEquals(solicitudes, []);
  });
});

Deno.test("reconciliar-verificaciones-didit aplica resultados terminales y conserva sesiones ante estados en curso o errores", async () => {
  const sesiones = ["aprobada", "revision", "expirada", "error-temporal"];
  await conFetchSimulado({
    [`GET ${rest}/verificaciones_identidad_didit`]: sesiones.map((
      session_id,
    ) => ({ session_id })),
    [`GET ${DIDIT}/v3/session/aprobada/decision`]: { status: "Approved" },
    [`GET ${DIDIT}/v3/session/revision/decision`]: { status: "In Review" },
    [`GET ${DIDIT}/v3/session/expirada/decision`]: { status: "KYC Expired" },
    [`GET ${DIDIT}/v3/session/error-temporal/decision`]: () =>
      new Response(null, { status: 503 }),
    [rpc]: { ok: true },
  }, async (solicitudes) => {
    const respuesta = await manejarConciliacionDidit(autorizada(), entorno);
    assertEquals(respuesta.status, 200);
    assertEquals(await respuesta.json(), {
      procesadas: 4,
      reconciliadas: 2,
      errores: 1,
      frecuencia: "cada_10_minutos",
    });
    assertEquals(
      solicitudes[0].url.searchParams.get("procesado_en"),
      "is.null",
    );
    assertEquals(
      solicitudes[0].url.searchParams.get("estado"),
      "in.(pendiente,en_revision)",
    );
    assertEquals(
      solicitudes.filter(({ ruta }) => ruta === rpc).map(({ body }) =>
        JSON.parse(body)
      ),
      [
        { p_session_id: "aprobada", p_decision: "aprobado" },
        { p_session_id: "expirada", p_decision: "expirado" },
      ],
    );
  });
});

Deno.test("reconciliar-verificaciones-didit acepta que la RPC descarte decisiones tardías de sesiones procesadas", async () => {
  await conFetchSimulado({
    [`GET ${rest}/verificaciones_identidad_didit`]: [{
      session_id: "ya-procesada",
    }],
    [`GET ${DIDIT}/v3/session/ya-procesada/decision`]: { status: "Declined" },
    [rpc]: { ok: true, ya_procesado: true, estado: "aprobado" },
  }, async (solicitudes) => {
    const respuesta = await manejarConciliacionDidit(autorizada(), entorno);
    assertEquals(respuesta.status, 200);
    assertEquals((await respuesta.json()).errores, 0);
    assertEquals(solicitudes.filter(({ ruta }) => ruta === rpc).length, 1);
  });
});
