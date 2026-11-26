import { assertEquals } from "jsr:@std/assert@1";
import { createHmac } from "node:crypto";
import {
  conFetchSimulado,
  entornoDePrueba,
  solicitudJson,
  SUPABASE,
  USUARIO,
} from "../_shared/test-http.ts";
import { manejarWebhookDidit } from "./handler.ts";

const entorno = entornoDePrueba();
const secreto = entorno.get("DIDIT_WEBHOOK_SECRET");
const sessionId = "sesion-didit-fase1";
const tabla = `${SUPABASE}/rest/v1/verificaciones_identidad_didit`;
const aprobar =
  `POST ${SUPABASE}/rest/v1/rpc/aprobar_usuario_por_verificacion_sistema`;

function solicitud(
  status: string,
  clave = secreto,
  tiempo = Math.floor(Date.now() / 1000),
) {
  const evento = {
    decision: { id: "decision-fase1" },
    session_id: sessionId,
    status,
    timestamp: tiempo,
    webhook_type: "status.updated",
  };
  const firma = createHmac("sha256", clave).update(JSON.stringify(evento))
    .digest("hex");
  return solicitudJson(evento, {
    "x-signature-v2": firma,
    "x-timestamp": String(tiempo),
  });
}

Deno.test("webhook-didit rechaza firmas inválidas o vencidas antes de escribir", async () => {
  await conFetchSimulado({}, async (solicitudes) => {
    const firmaInvalida = await manejarWebhookDidit(
      solicitud("Approved", "incorrecta"),
      entorno,
    );
    const firmaVencida = await manejarWebhookDidit(
      solicitud("Approved", secreto, 1),
      entorno,
    );
    assertEquals([firmaInvalida.status, firmaVencida.status], [401, 401]);
    assertEquals(solicitudes, []);
  });
});

Deno.test("webhook-didit conserva la decisión frente a estados fuera de orden y duplicados", async () => {
  const fila = {
    id: "verificacion-fase1",
    usuario_id: USUARIO,
    solicitud_id: null,
    estado: "pendiente",
    reintentos_webhook: 0,
    procesado_en: null as string | null,
    decision: null as { id: string } | null,
  };
  await conFetchSimulado({
    [`PATCH ${tabla}`]: ({ url, body }) => {
      const filtros = url.searchParams;
      assertEquals(filtros.get("session_id"), `eq.${sessionId}`);
      assertEquals(filtros.get("procesado_en"), "is.null");
      const anteriores = filtros.get("estado")?.slice(4, -1).split(",") ?? [];
      if (fila.procesado_en || !anteriores.includes(fila.estado)) return null;
      Object.assign(fila, JSON.parse(body));
      return fila;
    },
    [`GET ${tabla}`]: () => [fila],
    [aprobar]: () => {
      fila.procesado_en = "2026-11-26T10:00:00Z";
      return null;
    },
  }, async (solicitudes) => {
    const enRevision = await manejarWebhookDidit(
      solicitud("In Review"),
      entorno,
    );
    assertEquals(await enRevision.json(), {
      recibido: true,
      estado: "en_revision",
    });
    const pendienteTardio = await manejarWebhookDidit(
      solicitud("Not Started"),
      entorno,
    );
    assertEquals(await pendienteTardio.json(), {
      recibido: true,
      ignorado: true,
      estado: "en_revision",
    });

    const aprobado = await manejarWebhookDidit(solicitud("Approved"), entorno);
    assertEquals(await aprobado.json(), { recibido: true, estado: "aprobado" });
    for (const estado of ["In Review", "Declined", "Approved"]) {
      const tardio = await manejarWebhookDidit(solicitud(estado), entorno);
      assertEquals(tardio.status, 200);
      assertEquals(await tardio.json(), {
        recibido: true,
        duplicado: true,
        estado: "aprobado",
      });
    }
    assertEquals(
      solicitudes.filter(({ ruta }) => ruta === aprobar).map(({ body }) =>
        JSON.parse(body)
      ),
      [
        { p_usuario_id: USUARIO, p_verificacion_id: fila.id },
      ],
    );
    assertEquals(fila.estado, "aprobado");
    assertEquals(fila.decision, { id: "decision-fase1" });
  });
});

Deno.test("webhook-didit aplica rechazo de conductor y omite decision si la firma autentica solo el estado", async () => {
  const timestamp = Math.floor(Date.now() / 1000);
  const firma = createHmac("sha256", secreto).update(
    `${timestamp}:${sessionId}:Declined:status.updated`,
  ).digest("hex");
  const req = solicitudJson({
    session_id: sessionId,
    status: "Declined",
    timestamp,
    webhook_type: "status.updated",
    decision: { noFirmado: true },
  }, { "x-signature-simple": firma, "x-timestamp": String(timestamp) });
  const rechazar =
    `POST ${SUPABASE}/rest/v1/rpc/rechazar_solicitud_por_verificacion_sistema`;
  await conFetchSimulado({
    [`PATCH ${tabla}`]: {
      id: "verificacion-fase1",
      solicitud_id: "solicitud-fase1",
      usuario_id: null,
    },
    [rechazar]: null,
  }, async (solicitudes) => {
    const respuesta = await manejarWebhookDidit(req, entorno);
    assertEquals(respuesta.status, 200);
    assertEquals(JSON.parse(solicitudes[0].body), {
      estado: "rechazado",
      decision: null,
    });
    assertEquals(JSON.parse(solicitudes[1].body), {
      p_solicitud_id: "solicitud-fase1",
      p_verificacion_id: "verificacion-fase1",
    });
  });
});
