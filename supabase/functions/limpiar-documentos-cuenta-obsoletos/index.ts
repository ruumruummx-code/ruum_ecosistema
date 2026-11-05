/// <reference lib="deno.ns" />
/// <reference lib="dom" />

import { createClient } from "npm:@supabase/supabase-js@2";

const LIMITE_RECLAMO_LIMPIEZA = 25;

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

Deno.serve(async (req) => {
  // Fail-closed: solo se permite método POST
  if (req.method !== "POST") return json({ error: "Método no permitido." }, 405);

  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const cleanupSecret = Deno.env.get("STORAGE_CLEANUP_SECRET") ?? serviceKey;

  // Fail-closed: verificación estricta de credenciales de infraestructura
  if (!url || !serviceKey) {
    console.error("limpiar-documentos-cuenta-obsoletos: configuración de entorno ausente");
    return json({ error: "Servicio no configurado." }, 500);
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const esAutorizado =
    authHeader === `Bearer ${serviceKey}` ||
    authHeader === `Bearer ${cleanupSecret}` ||
    req.headers.get("x-cleanup-secret") === cleanupSecret;

  if (!esAutorizado) {
    console.warn("limpiar-documentos-cuenta-obsoletos: intento no autorizado bloqueado (fail-closed)");
    return json({ error: "No autorizado." }, 401);
  }

  const servicio = createClient(url, serviceKey, { auth: { persistSession: false } });

  // 1. Reclamo atómico de lote con FOR UPDATE SKIP LOCKED
  const { data: pendientes, error: errorReclamo } = await servicio.rpc(
    "reclamar_lote_limpieza_documentos",
    { p_limite: LIMITE_RECLAMO_LIMPIEZA }
  );

  if (errorReclamo) {
    console.error("Error reclamando lote de documentos", { codigo: codigoSeguro(errorReclamo) });
    return json({ error: "No fue posible iniciar el reclamo de documentos." }, 500);
  }

  let eliminados = 0;
  let errores = 0;
  let escaladosDlq = 0;

  for (const doc of pendientes ?? []) {
    // 2. Eliminación física en el bucket correspondiente
    const { error: errorStorage } = await servicio.storage
      .from(doc.bucket)
      .remove([doc.storage_path]);

    if (!errorStorage) {
      eliminados += 1;
      await servicio.rpc("registrar_resultado_limpieza_documento", {
        p_id: doc.id,
        p_exito: true,
      });
      continue;
    }

    // 3. Registro de error y backoff o DLQ
    errores += 1;
    const { data: resultadoError } = await servicio.rpc("registrar_resultado_limpieza_documento", {
      p_id: doc.id,
      p_exito: false,
      p_error: codigoSeguro(errorStorage),
    });

    if (resultadoError?.estado === "error_permanente_dlq") {
      escaladosDlq += 1;
    }

    console.error("Fallo eliminando documento en Storage", {
      id: doc.id,
      bucket: doc.bucket,
      storage_path: doc.storage_path,
      codigo: codigoSeguro(errorStorage),
      intentos: doc.intentos + 1,
    });
  }

  return json(
    {
      procesados: (pendientes ?? []).length,
      eliminados,
      errores,
      escaladosDlq,
    },
    escaladosDlq > 0 ? 207 : 200
  );
});
