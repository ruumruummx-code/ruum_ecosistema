/// <reference lib="deno.ns" />
/// <reference lib="dom" />

// Recibe los webhooks de Didit (status.updated / decision.updated) y
// resuelve automáticamente la solicitud del conductor o la cuenta del usuario.

import { createClient } from "npm:@supabase/supabase-js@2";
import { normalizarEstadoDidit } from "../_shared/didit-estados.ts";
import { validarFirmaWebhookDidit } from "../_shared/didit-webhook.ts";
import { construirCabecerasCors, manejarCors } from "../_shared/cors-documentos.ts";

function json(body: Record<string, unknown>, status = 200, req?: Request) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...construirCabecerasCors(req), "Content-Type": "application/json" },
  });
}

export async function manejarWebhookDidit(req: Request, entorno: Pick<typeof Deno.env, "get"> = Deno.env) {
  const rechazoCors = manejarCors(req);
  if (rechazoCors) return rechazoCors;
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405, req);

  const url = entorno.get("SUPABASE_URL") ?? "";
  const serviceKey = entorno.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const webhookSecret = entorno.get("DIDIT_WEBHOOK_SECRET") ?? "";
  if (!url || !serviceKey || !webhookSecret) {
    console.error("webhook-didit sin configurar");
    return json({ error: "Servicio no configurado." }, 500);
  }

  const payloadCrudo = await req.text();
  let evento: {
    event_id?: string;
    webhook_type?: string;
    timestamp?: number | string;
    session_id?: string;
    sessionId?: string;
    id?: string;
    status?: string;
    event?: string;
    vendor_data?: string;
    vendorData?: string;
    decision?: unknown;
  };
  try {
    evento = JSON.parse(payloadCrudo);
  } catch {
    return json({ error: "JSON inválido." }, 400);
  }

  const timestamp = req.headers.get("x-timestamp");
  const validacionFirma = await validarFirmaWebhookDidit({
    payloadCrudo,
    evento,
    firmaV2: req.headers.get("x-signature-v2"),
    firmaRaw: req.headers.get("x-signature"),
    firmaSimple: req.headers.get("x-signature-simple"),
    timestamp,
    secreto: webhookSecret,
  });
  if (!validacionFirma.valida) {
    console.error("Firma de webhook Didit inválida");
    return json({ error: "Firma inválida." }, 401);
  }

  if (
    evento.webhook_type &&
    !["status.updated", "data.updated"].includes(evento.webhook_type)
  ) {
    return json({ recibido: true, ignorado: true }, 200);
  }

  const sessionId = evento.session_id ?? evento.sessionId ?? evento.id;
  if (!sessionId) {
    return json({ error: "Payload incompleto (falta sessionId)." }, 400);
  }

  const servicio = createClient(url, serviceKey);

  const estadoInterno = normalizarEstadoDidit(evento.status ?? evento.event);
  const esAprobado = estadoInterno === "aprobado";
  const esRechazado = estadoInterno === "rechazado";
  const esTerminal = ["expirado", "cancelado", "error"].includes(estadoInterno);
  // La condición se evalúa al escribir. También protege contra dos entregas
  // concurrentes y permite reintentar una decisión que aún no se pudo aplicar.
  const estadosPrevios = estadoInterno === "pendiente"
    ? ["pendiente"]
    : [...new Set(["pendiente", "en_revision", estadoInterno])];

  const { data: verificacion, error: errorUpdate } = await servicio
    .from("verificaciones_identidad_didit")
    .update({
      estado: estadoInterno,
      // X-Signature-Simple no firma decision. No persistir esa parte del
      // payload cuando se usa el fallback compatible con middleware.
      decision: validacionFirma.decisionAutenticada
        ? evento.decision ?? evento
        : null,
    })
    .eq("session_id", sessionId)
    .is("procesado_en", null)
    .in("estado", estadosPrevios)
    .select("id,solicitud_id,usuario_id,estado,reintentos_webhook")
    .maybeSingle();

  if (errorUpdate) {
    console.error("Error actualizando verificación Didit", errorUpdate.code);
    return json({ error: "No se pudo actualizar la verificación." }, 503);
  }

  if (!verificacion) {
    const { data: vigente, error } = await servicio
      .from("verificaciones_identidad_didit")
      .select("estado,procesado_en")
      .eq("session_id", sessionId)
      .maybeSingle();
    if (error) return json({ error: "No se pudo consultar la verificación." }, 503);
    if (!vigente) return json({ error: "Verificación no encontrada." }, 404);
    return json({
      recibido: true,
      ...(vigente.procesado_en ? { duplicado: true } : { ignorado: true }),
      estado: vigente.estado,
    }, 200);
  }

  try {
    if (esTerminal) {
      const { error } = await servicio.from("verificaciones_identidad_didit")
        .update({ procesado_en: new Date().toISOString() })
        .eq("id", verificacion.id)
        .eq("estado", estadoInterno)
        .is("procesado_en", null);
      if (error) throw error;
    } else if (verificacion.usuario_id) {
      // Flujo de usuario / pasajero
      if (esAprobado) {
        const { error } = await servicio.rpc(
          "aprobar_usuario_por_verificacion_sistema",
          {
            p_usuario_id: verificacion.usuario_id,
            p_verificacion_id: verificacion.id,
          },
        );
        if (error) throw error;
      } else if (esRechazado) {
        const { error } = await servicio.rpc(
          "rechazar_usuario_por_verificacion_sistema",
          {
            p_usuario_id: verificacion.usuario_id,
            p_verificacion_id: verificacion.id,
          },
        );
        if (error) throw error;
      }
    } else if (verificacion.solicitud_id) {
      // Flujo de conductor
      if (esAprobado) {
        const { error } = await servicio.rpc(
          "aprobar_solicitud_conductor_sistema",
          {
            p_solicitud_id: verificacion.solicitud_id,
            p_verificacion_id: verificacion.id,
          },
        );
        if (error) throw error;
      } else if (esRechazado) {
        const { error } = await servicio.rpc(
          "rechazar_solicitud_por_verificacion_sistema",
          {
            p_solicitud_id: verificacion.solicitud_id,
            p_verificacion_id: verificacion.id,
          },
        );
        if (error) throw error;
      }
    }
  } catch (error) {
    const mensajeError = error instanceof Error ? error.message : String(error);
    console.error(
      "Error aplicando decisión Didit",
      mensajeError,
    );

    const reintentos = verificacion.reintentos_webhook + 1;
    const esExcesoReintentos = reintentos >= 5;

    // Actualizar métricas de reintento y error
    await servicio.from("verificaciones_identidad_didit").update({
      reintentos_webhook: reintentos,
      ultimo_error_webhook: mensajeError.slice(0, 500),
      ultimo_intento_webhook: new Date().toISOString(),
      estado: esExcesoReintentos ? "error" : verificacion.estado,
    }).eq("id", verificacion.id).eq("estado", estadoInterno).is("procesado_en", null);

    // Si excede el umbral de reintentos, enviar a Dead Letter Queue (DLQ) en auditoría
    if (esExcesoReintentos) {
      await servicio.from("registro_auditoria").insert({
        evento: "webhook_didit_dlq",
        actor: "sistema",
        actor_id: "00000000-0000-4000-8000-000000000001",
        datos: {
          session_id: sessionId,
          verificacion_id: verificacion.id,
          reintentos,
          error: mensajeError,
          estado_intentado: estadoInterno,
        },
      });
      // Retornar 200 para frenar el reenvío de Didit tras agotar el ciclo
      return json({ recibido: true, dlq: true, error_procesando: mensajeError }, 200);
    }

    // Retornar 503 para que el proveedor Didit reintente la entrega del webhook
    return json({ error: "Fallo transitorio aplicando decisión. Reintentar.", reintentos }, 503);
  }

  return json({ recibido: true, estado: estadoInterno }, 200);
}
