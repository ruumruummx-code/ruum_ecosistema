import { assertEquals } from "jsr:@std/assert@1";
import {
  conFetchSimulado,
  DIDIT,
  entornoDePrueba,
  type RutasSimuladas,
  solicitudJson,
  SUPABASE,
  USUARIO,
} from "../_shared/test-http.ts";
import { manejarInicioDidit } from "./handler.ts";

const entorno = entornoDePrueba();
const rest = `${SUPABASE}/rest/v1`;
const tabla = `${rest}/verificaciones_identidad_didit`;
const rateLimit = `POST ${rest}/rpc/consumir_rate_limit`;
const crearSesion = `POST ${DIDIT}/v3/session/`;
const guardarSesion = `POST ${tabla}`;
const expirarSesiones = `PATCH ${tabla}`;
const sessionId = "sesion-didit-fase1";
const urlVerificacion = "https://verify.didit.me/session/sesion-didit-fase1";
const solicitud = (body: unknown = { tipo: "usuario" }) =>
  solicitudJson(body, { Authorization: "Bearer sesion-de-prueba" });

function rutasInicio(cambios: RutasSimuladas = {}): RutasSimuladas {
  return {
    [`GET ${SUPABASE}/auth/v1/user`]: { id: USUARIO },
    [`GET ${rest}/usuarios`]: [{
      id: USUARIO,
      foto_url: null,
      estado_verificacion: "pendiente",
    }],
    [rateLimit]: [{ permitido: true, reintentar_en: 0 }],
    ...cambios,
  };
}

Deno.test("iniciar-verificacion-didit registra la sesión del usuario antes de expirar las anteriores", async () => {
  const creadoEn = "2026-11-26T10:00:00Z";
  await conFetchSimulado(
    rutasInicio({
      [crearSesion]: { session_id: sessionId, url: urlVerificacion },
      [guardarSesion]: { creado_en: creadoEn },
      [expirarSesiones]: () => new Response(null, { status: 204 }),
    }),
    async (solicitudes) => {
      const respuesta = await manejarInicioDidit(solicitud(), entorno);
      assertEquals(respuesta.status, 201);
      assertEquals(await respuesta.json(), {
        session_id: sessionId,
        url: urlVerificacion,
      });
      const cambios = solicitudes.filter(({ ruta }) =>
        [rateLimit, crearSesion, guardarSesion, expirarSesiones].includes(ruta)
      );
      assertEquals(cambios.map(({ ruta }) => ruta), [
        rateLimit,
        crearSesion,
        guardarSesion,
        expirarSesiones,
      ]);
      const payload = JSON.parse(cambios[1].body);
      assertEquals(payload.vendor_data, `usuario:${USUARIO}`);
      assertEquals(payload.callback, entorno.get("DIDIT_CALLBACK_URL"));
      assertEquals(JSON.parse(cambios[2].body), {
        solicitud_id: null,
        usuario_id: USUARIO,
        session_id: sessionId,
        workflow_id: entorno.get("DIDIT_WORKFLOW_ID"),
        estado: "pendiente",
        decision: null,
        procesado_en: null,
      });
      assertEquals(
        cambios[3].url.searchParams.get("creado_en"),
        `lt.${creadoEn}`,
      );
      const expiracion = JSON.parse(cambios[3].body);
      assertEquals(expiracion.estado, "expirado");
      assertEquals(typeof expiracion.procesado_en, "string");
    },
  );
});

Deno.test("iniciar-verificacion-didit respeta el rate limit sin invalidar una sesión existente", async () => {
  await conFetchSimulado(
    rutasInicio({
      [rateLimit]: [{ permitido: false, reintentar_en: 120 }],
    }),
    async () => {
      const respuesta = await manejarInicioDidit(solicitud(), entorno);
      assertEquals(respuesta.status, 429);
      assertEquals(respuesta.headers.get("Retry-After"), "120");
    },
  );
});

Deno.test("iniciar-verificacion-didit rechaza una solicitud de conductor que no pertenece al usuario", async () => {
  await conFetchSimulado(
    rutasInicio({
      [`GET ${rest}/solicitudes_conductor`]: [],
    }),
    async (solicitudes) => {
      const respuesta = await manejarInicioDidit(
        solicitud({ solicitud_id: USUARIO }),
        entorno,
      );
      assertEquals(respuesta.status, 404);
      const consulta = solicitudes.find(({ url }) =>
        url.pathname.endsWith("/solicitudes_conductor")
      )!;
      assertEquals(
        consulta.url.searchParams.get("auth_user_id"),
        `eq.${USUARIO}`,
      );
      assertEquals(solicitudes.length, 2);
    },
  );
});

Deno.test("iniciar-verificacion-didit conserva la verificación anterior al recibir una respuesta incompleta", async () => {
  await conFetchSimulado(
    rutasInicio({ [crearSesion]: { session_id: sessionId } }),
    async () => {
      assertEquals(
        (await manejarInicioDidit(solicitud(), entorno)).status,
        502,
      );
    },
  );
});
