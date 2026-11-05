/// <reference lib="deno.ns" />
/// <reference lib="dom" />
import { createClient } from "npm:@supabase/supabase-js@2";
import { TAMANO_MAXIMO, validarDocumento } from "../_shared/validacion-documento.ts";
import { leerFormularioLimitado } from "../_shared/multipart-limitado.ts";
import { consumirRateLimit } from "../_shared/rate-limit.ts";
import { construirCabecerasCors } from "../_shared/cors-documentos.ts";

const BUCKET = "documentos-cuenta";
const TIPOS = new Set(["comprobante", "constancia"]);

function respuestaJson(req: Request, body: unknown, status = 200) {
  const cors = construirCabecerasCors(req);
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  const cors = construirCabecerasCors(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }
  if (req.method !== "POST") {
    return respuestaJson(req, { error: "Método no permitido." }, 405);
  }

  const authorization = req.headers.get("Authorization");
  if (!authorization) {
    return respuestaJson(req, { error: "Inicia sesión para continuar." }, 401);
  }

  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anon || !key) {
    return respuestaJson(req, { error: "Servicio temporalmente no disponible." }, 503);
  }

  const cliente = createClient(url, anon, {
    global: { headers: { Authorization: authorization } },
  });
  const { data: sesion, error: errorSesion } = await cliente.auth.getUser();
  if (errorSesion || !sesion?.user) {
    return respuestaJson(req, { error: "La sesión no es válida." }, 401);
  }

  const { data: perfil, error: errorPerfil } = await cliente
    .from("usuarios")
    .select("id")
    .eq("auth_user_id", sesion.user.id)
    .single();

  if (errorPerfil || !perfil) {
    return respuestaJson(req, { error: "No se encontró tu perfil." }, 409);
  }

  const servicio = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    // 1. Operación de consulta (listar)
    if (req.headers.get("Content-Type")?.includes("application/json")) {
      const { data, error } = await cliente
        .from("documentos_cuenta_usuario")
        .select("tipo,ruta,estado,subido_en,motivo_rechazo,expira_en")
        .eq("usuario_id", perfil.id)
        .in("tipo", [...TIPOS]);

      if (error) {
        return respuestaJson(req, { error: "No pudimos consultar tus documentos." }, 503);
      }
      return respuestaJson(req, { documentos: data });
    }

    // 2. Operación de mutación (subida/reemplazo)
    const limite = await consumirRateLimit(servicio, "documentos-cuenta-usuario", sesion.user.id, 10, 600);
    if (!limite.permitido) {
      return respuestaJson(req, { error: "Demasiados intentos. Espera unos minutos." }, 429);
    }

    const form = await leerFormularioLimitado(req, TAMANO_MAXIMO);
    const tipo = form.get("tipo");
    const archivo = form.get("archivo");
    if (typeof tipo !== "string" || !TIPOS.has(tipo) || !(archivo instanceof File)) {
      return respuestaJson(req, { error: "Documento o archivo inválido." }, 400);
    }

    let validado;
    try {
      validado = validarDocumento(
        new Uint8Array(await archivo.arrayBuffer()),
        archivo.name,
        new Set(["jpeg", "png", "pdf"] as const)
      );
    } catch (error) {
      return respuestaJson(
        req,
        { error: error instanceof Error ? error.message : "Archivo inválido." },
        422
      );
    }

    // SAGA PASO 1: Identificar ruta anterior (si existe)
    const { data: anterior, error: errorAnterior } = await servicio
      .from("documentos_cuenta_usuario")
      .select("ruta")
      .eq("usuario_id", perfil.id)
      .eq("tipo", tipo)
      .maybeSingle();

    if (errorAnterior) {
      return respuestaJson(req, { error: "No pudimos consultar el documento anterior." }, 503);
    }

    // SAGA PASO 2: Subir archivo nuevo con ruta inmutable versionada
    const rutaNueva = `${sesion.user.id}/${tipo}/${crypto.randomUUID()}.${validado.extension}`;
    const { error: errorCarga } = await servicio.storage
      .from(BUCKET)
      .upload(rutaNueva, validado.bytes, {
        upsert: false,
        contentType: validado.mime,
      });

    if (errorCarga) {
      return respuestaJson(req, { error: "No pudimos guardar el archivo." }, 503);
    }

    // SAGA PASO 3: Registrar referencia en base de datos
    const subido_en = new Date().toISOString();
    const { data: documento, error: errorGuardar } = await servicio
      .from("documentos_cuenta_usuario")
      .upsert(
        {
          usuario_id: perfil.id,
          tipo,
          ruta: rutaNueva,
          estado: "recibido",
          subido_en,
          motivo_rechazo: null,
          actualizado_en: subido_en,
        },
        { onConflict: "usuario_id,tipo" }
      )
      .select("tipo,ruta,estado,subido_en")
      .single();

    // SAGA PASO 3.1: Compensación inmediata y durable si falla la DB
    if (errorGuardar || !documento) {
      const { error: errorCompensacion } = await servicio.storage.from(BUCKET).remove([rutaNueva]);
      if (errorCompensacion) {
        // Encolar huérfano en cola de limpieza durable
        try {
          await servicio.rpc("encolar_limpieza_documento", {
            p_usuario_id: perfil.id,
            p_bucket: BUCKET,
            p_storage_path: rutaNueva,
            p_motivo: "compensacion_fallida",
          });
        } catch {
          console.error("documentos-cuenta-usuario: fallo al encolar compensacion_fallida");
        }
      }
      return respuestaJson(req, { error: "No pudimos registrar el documento. Inténtalo de nuevo." }, 503);
    }

    // Registrar en historial de estados de documentos
    try {
      await servicio.from("historial_estados_documentos_cuenta").insert({
        documento_id: (documento as { id?: string }).id,
        usuario_id: perfil.id,
        tipo,
        estado_anterior: anterior?.ruta ? "reemplazado" : "sin_cargar",
        estado_nuevo: "recibido",
        actor: "usuario",
        actor_id: perfil.id,
        motivo: "Carga de documento por usuario",
      });
    } catch {
      // no bloqueante
    }

    // SAGA PASO 4: Limpieza del documento anterior y encolado durable si falla
    if (anterior?.ruta && anterior.ruta !== rutaNueva) {
      const { error: errorLimpieza } = await servicio.storage.from(BUCKET).remove([anterior.ruta]);
      if (errorLimpieza) {
        try {
          await servicio.rpc("encolar_limpieza_documento", {
            p_usuario_id: perfil.id,
            p_bucket: BUCKET,
            p_storage_path: anterior.ruta,
            p_motivo: "reemplazo",
          });
        } catch {
          console.error("documentos-cuenta-usuario: fallo al encolar limpieza de reemplazo anterior");
        }
      }
    }

    return respuestaJson(req, documento, 201);
  } catch {
    return respuestaJson(req, { error: "No pudimos procesar la solicitud. Inténtalo de nuevo." }, 503);
  }
});
