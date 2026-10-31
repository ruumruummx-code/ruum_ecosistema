/// <reference lib="deno.ns" />
/// <reference lib="dom" />
import { createClient } from "npm:@supabase/supabase-js@2";
import { TAMANO_MAXIMO, validarDocumento } from "../_shared/validacion-documento.ts";
import { leerFormularioLimitado } from "../_shared/multipart-limitado.ts";
import { consumirRateLimit } from "../_shared/rate-limit.ts";

import { CORS_DOCUMENTOS as CORS } from "../_shared/cors-documentos.ts";

const BUCKET = "documentos-cuenta";
const TIPOS = new Set(["licencia", "comprobante", "constancia"]);
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return json({ error: "Método no permitido." }, 405);
  const authorization = req.headers.get("Authorization");
  if (!authorization) return json({ error: "Inicia sesión para continuar." }, 401);
  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anon || !key) return json({ error: "Servicio temporalmente no disponible." }, 503);
  const cliente = createClient(url, anon, { global: { headers: { Authorization: authorization } } });
  const { data: sesion, error: errorSesion } = await cliente.auth.getUser();
  if (errorSesion || !sesion.user) return json({ error: "La sesión no es válida." }, 401);
  const { data: perfil, error: errorPerfil } = await cliente.from("usuarios").select("id").eq("auth_user_id", sesion.user.id).single();
  if (errorPerfil || !perfil) return json({ error: "No se encontró tu perfil." }, 409);
  const servicio = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  try {
    // Lectura siempre acotada al perfil autenticado; no se aceptan IDs del cliente.
    if (req.headers.get("Content-Type")?.includes("application/json")) {
      const { data, error } = await cliente.from("documentos_cuenta_usuario").select("tipo,ruta,estado,subido_en").eq("usuario_id", perfil.id);
      if (error) return json({ error: "No pudimos consultar tus documentos." }, 503);
      return json({ documentos: data });
    }
    const limite = await consumirRateLimit(servicio, "documentos-cuenta-usuario", sesion.user.id, 10, 600);
    if (!limite.permitido) return json({ error: "Demasiados intentos. Espera unos minutos." }, 429);
    const form = await leerFormularioLimitado(req, TAMANO_MAXIMO);
    const tipo = form.get("tipo");
    const archivo = form.get("archivo");
    if (typeof tipo !== "string" || !TIPOS.has(tipo) || !(archivo instanceof File)) return json({ error: "Documento o archivo inválido." }, 400);
    let validado;
    try {
      validado = validarDocumento(new Uint8Array(await archivo.arrayBuffer()), archivo.name, new Set(["jpeg", "png", "pdf"] as const));
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : "Archivo inválido." }, 422);
    }
    const ruta = `${sesion.user.id}/${tipo}/${crypto.randomUUID()}.${validado.extension}`;
    const { data: anterior, error: errorAnterior } = await servicio.from("documentos_cuenta_usuario")
      .select("ruta").eq("usuario_id", perfil.id).eq("tipo", tipo).maybeSingle();
    if (errorAnterior) return json({ error: "No pudimos consultar el documento anterior." }, 503);
    const { error: errorCarga } = await servicio.storage.from(BUCKET).upload(ruta, validado.bytes, { upsert: false, contentType: validado.mime });
    if (errorCarga) return json({ error: "No pudimos guardar el archivo." }, 503);
    const subido_en = new Date().toISOString();
    const { data: documento, error: errorGuardar } = await servicio.from("documentos_cuenta_usuario").upsert({
      usuario_id: perfil.id, tipo, ruta, estado: "en_revision", subido_en,
    }, { onConflict: "usuario_id,tipo" }).select("tipo,ruta,estado,subido_en").single();
    if (errorGuardar || !documento) {
      await servicio.storage.from(BUCKET).remove([ruta]);
      return json({ error: "No pudimos registrar el documento. Inténtalo de nuevo." }, 503);
    }
    // Rutas únicas e inmutables: sólo se elimina la versión leída antes del reemplazo.
    if (anterior?.ruta) {
      const { error: errorLimpieza } = await servicio.storage.from(BUCKET).remove([anterior.ruta]);
      if (errorLimpieza) console.error("documentos-cuenta-usuario: limpieza anterior pendiente");
    }
    return json(documento, 201);
  } catch {
    return json({ error: "No pudimos procesar la solicitud. Inténtalo de nuevo." }, 503);
  }
});
