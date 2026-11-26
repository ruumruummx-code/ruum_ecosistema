/// <reference lib="deno.ns" />
/// <reference lib="dom" />

import { createClient } from "npm:@supabase/supabase-js@2.47.16";
import { normalizarEstadoDidit } from "../_shared/didit-estados.ts";
import { timingSafeEqual } from "../_shared/timing-safe.ts";

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function codigoSeguro(error: unknown) {
  if (!error || typeof error !== "object") return "desconocido";
  const valor = error as { code?: unknown; status?: unknown; name?: unknown; message?: unknown };
  if (typeof valor.code === "string" && /^[A-Za-z0-9_-]{1,40}$/.test(valor.code)) return valor.code;
  if (typeof valor.status === "number") return `http_${valor.status}`;
  if (typeof valor.name === "string" && /^[A-Za-z0-9_-]{1,40}$/.test(valor.name)) return valor.name;
  if (typeof valor.message === "string") return valor.message.slice(0, 100);
  return "desconocido";
}

export async function manejarConciliacionDidit(req: Request, entorno: Pick<typeof Deno.env, "get"> = Deno.env) {
  // Fail-closed: sólo se admite método POST
  if (req.method !== "POST") return json({ error: "Método no permitido." }, 405);

  const url = entorno.get("SUPABASE_URL") ?? "";
  const serviceKey = entorno.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const reconcilerSecret = entorno.get("DIDIT_RECONCILER_SECRET") || serviceKey;
  const diditApiKey = entorno.get("DIDIT_API_KEY");

  // Fail-closed: credenciales base de infraestructura
  if (!url || !serviceKey) {
    console.error("reconciliar-verificaciones-didit: configuración base ausente");
    return json({ error: "Servicio no configurado." }, 500);
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const secretHeader = req.headers.get("x-reconciler-secret") ?? "";
  const esAutorizado =
    timingSafeEqual(authHeader, `Bearer ${serviceKey}`) ||
    timingSafeEqual(authHeader, `Bearer ${reconcilerSecret}`) ||
    timingSafeEqual(secretHeader, reconcilerSecret);

  if (!esAutorizado) {
    console.warn("reconciliar-verificaciones-didit: intento no autorizado bloqueado (fail-closed)");
    return json({ error: "No autorizado." }, 401);
  }
  if (!diditApiKey) return json({ error: "Servicio no configurado." }, 503);

  const servicio = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1. Obtener sesiones pendientes que superen 5 minutos sin webhook recibido
  const limiteTiempo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  const { data: pendientes, error: errorConsulta } = await servicio
    .from("verificaciones_identidad_didit")
    .select("id, session_id, estado, creado_en, usuario_id, solicitud_id")
    .in("estado", ["pendiente", "en_revision"])
    .is("procesado_en", null)
    .lt("creado_en", limiteTiempo)
    .limit(50);

  if (errorConsulta) {
    console.error("Error consultando sesiones Didit pendientes", { codigo: codigoSeguro(errorConsulta) });
    return json({ error: "Fallo consultando sesiones pendientes." }, 500);
  }

  let reconciliadas = 0;
  let errores = 0;

  for (const reg of pendientes ?? []) {
    try {
      const res = await fetch(`https://verification.didit.me/v3/session/${reg.session_id}/decision`, {
        headers: { "x-api-key": diditApiKey, Accept: "application/json" },
      });
      if (!res.ok && res.status !== 404) {
        errores += 1;
        console.warn("Didit no confirmó el estado de la sesión", { codigo: `http_${res.status}` });
        continue;
      }
      const datos = res.ok ? await res.json() : { status: "expired" };
      const decision = normalizarEstadoDidit(datos.status ?? datos.event ?? datos.decision);
      if (decision === "pendiente" || decision === "en_revision" || decision === "error") continue;

      // 3. Aplicar reconciliación atómica mediante RPC del Flujo 5
      const { data: resultado, error: errorRpc } = await servicio.rpc(
        "reconciliar_verificacion_didit_resultado",
        {
          p_session_id: reg.session_id,
          p_decision: decision,
        }
      );

      if (errorRpc || !resultado?.ok) {
        errores += 1;
        console.error(`Fallo reconciliando sesión Didit ${reg.session_id}`, {
          error: errorRpc?.message || resultado?.error,
        });
      } else {
        reconciliadas += 1;
      }
    } catch (err) {
      errores += 1;
      console.error(`Excepción no controlada reconciliando ${reg.session_id}`, { error: codigoSeguro(err) });
    }
  }

  return json({
    procesadas: (pendientes ?? []).length,
    reconciliadas,
    errores,
    frecuencia: "cada_10_minutos",
  });
}
