import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  DictamenAuditoriaRepuve,
  ResumenVerificacionRepuve,
  ResultadoRegistroVerificacionRepuve,
  ResultadoVerificacionRepuveConductor,
  VerificacionRepuve
} from "@ruum/shared/types";
import { rpcTipado } from "../supabase/funciones";
import { BUCKET_EVIDENCIA, resolverUrlEvidencia } from "./evidencia";

type Cliente = SupabaseClient<Database>;

function decodificarBase64ABytes(dataUrl: string): { bytes: Uint8Array; contentType: string; ext: string } {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
  const contentType = match?.[1] ?? "image/jpeg";
  const base64Data = match?.[2] ?? (dataUrl.split(",")[1] ?? dataUrl);
  const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";

  const binaryString =
    typeof atob !== "undefined"
      ? atob(base64Data)
      : Buffer.from(base64Data, "base64").toString("binary");

  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return { bytes, contentType, ext };
}

/**
 * Sube la captura de pantalla de la consulta REPUVE al bucket privado `evidencia`
 * respetando el aislamiento por carpeta `<auth.uid()>/<traslado_id>/repuve/...`.
 */
export async function subirCapturaRepuve(
  cliente: Cliente,
  trasladoId: string,
  archivoODataUrl: File | Blob | string
): Promise<string> {
  const { data: sesion, error: authError } = await cliente.auth.getUser();
  if (authError || !sesion?.user?.id) {
    throw new Error("Debes tener sesión activa de conductor para subir la captura REPUVE.");
  }

  const userId = sesion.user.id;
  const timestamp = Date.now();

  if (typeof archivoODataUrl === "string") {
    const { bytes, contentType, ext } = decodificarBase64ABytes(archivoODataUrl);
    const storagePath = `${userId}/${trasladoId}/repuve/repuve_${timestamp}.${ext}`;
    const { error } = await cliente.storage.from(BUCKET_EVIDENCIA).upload(storagePath, bytes, {
      contentType,
      upsert: false
    });
    if (error) {
      throw new Error(error.message || "No se pudo subir la captura de pantalla REPUVE.");
    }
    return storagePath;
  }

  const mime = archivoODataUrl.type || "image/jpeg";
  const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
  const storagePath = `${userId}/${trasladoId}/repuve/repuve_${timestamp}.${ext}`;

  const { error } = await cliente.storage.from(BUCKET_EVIDENCIA).upload(storagePath, archivoODataUrl, {
    contentType: mime,
    upsert: false
  });

  if (error) {
    throw new Error(error.message || "No se pudo subir la captura de pantalla REPUVE.");
  }

  return storagePath;
}

/**
 * Registra la verificación física (VIN y placas) y el resultado REPUVE del conductor.
 */
export async function registrarVerificacionRepuveConductor(
  cliente: Cliente,
  params: {
    trasladoId: string;
    vinFisico: string;
    placasFisicas: string;
    resultado: ResultadoVerificacionRepuveConductor;
    capturaPath: string;
  }
): Promise<ResultadoRegistroVerificacionRepuve> {
  const { data, error } = await rpcTipado(cliente, "conductor_registra_verificacion_repuve", {
    p_traslado_id: params.trasladoId,
    p_vin_fisico: params.vinFisico.trim(),
    p_placas_fisicas: params.placasFisicas.trim(),
    p_resultado: params.resultado,
    p_captura_path: params.capturaPath.trim()
  });

  if (error) throw error;
  const resultado = data as unknown as ResultadoRegistroVerificacionRepuve | null;
  if (!resultado || !resultado.id) {
    throw new Error("Respuesta inválida al registrar la verificación REPUVE.");
  }
  return resultado;
}

/**
 * Consulta el estatus resumido de REPUVE (apto para usuario dueño, conductor y admin).
 */
export async function obtenerResumenVerificacionRepuve(
  cliente: Cliente,
  trasladoId: string
): Promise<ResumenVerificacionRepuve> {
  const { data, error } = await rpcTipado(cliente, "obtener_resumen_verificacion_repuve", {
    p_traslado_id: trasladoId
  });
  if (error) throw error;
  return data as unknown as ResumenVerificacionRepuve;
}

/**
 * Lista el historial de verificaciones REPUVE de un traslado (para el conductor asignado o admin)
 * e incluye URLs firmadas temporales para las capturas de pantalla.
 */
export async function obtenerVerificacionesRepuveTraslado(
  cliente: Cliente,
  trasladoId: string
): Promise<VerificacionRepuve[]> {
  const { data, error } = await cliente
    .from("vehiculo_verificaciones_repuve")
    .select("*")
    .eq("traslado_id", trasladoId)
    .order("creado_en", { ascending: false });

  if (error) throw error;
  const filas = (data ?? []) as unknown as VerificacionRepuve[];

  return Promise.all(
    filas.map(async (fila) => ({
      ...fila,
      url_captura_firmada: fila.captura_path
        ? await resolverUrlEvidencia(cliente, fila.captura_path)
        : null
    }))
  );
}

/**
 * Autoriza un override administrativo de verificación REPUVE con motivo obligatorio y auditoría.
 */
export async function autorizarOverrideRepuveAdmin(
  cliente: Cliente,
  params: {
    trasladoId: string;
    motivo: string;
    verificacionOrigenId?: string | null;
  }
) {
  const motivoLimpio = params.motivo.trim();
  if (motivoLimpio.length < 10) {
    throw new Error("El motivo de autorización excepcional debe tener al menos 10 caracteres.");
  }

  const { data, error } = await rpcTipado(cliente, "admin_override_verificacion_repuve", {
    p_traslado_id: params.trasladoId,
    p_motivo: motivoLimpio,
    p_verificacion_origen_id: params.verificacionOrigenId ?? null
  });

  if (error) throw error;
  return data as unknown as {
    id: string;
    traslado_id: string;
    resultado: "override_admin";
    es_override_admin: true;
    motivo_override: string;
    creado_en: string;
  };
}

/**
 * Registra el dictamen de soporte/admin sobre una verificación REPUVE seleccionada por muestreo.
 */
export async function dictaminarAuditoriaRepuveAdmin(
  cliente: Cliente,
  params: {
    verificacionId: string;
    dictamen: Exclude<DictamenAuditoriaRepuve, "pendiente">;
    notas?: string | null;
  }
) {
  const { data, error } = await rpcTipado(cliente, "admin_dictaminar_auditoria_repuve", {
    p_verificacion_id: params.verificacionId,
    p_dictamen: params.dictamen,
    p_notas: params.notas?.trim() || null
  });

  if (error) throw error;
  return data as unknown as {
    id: string;
    traslado_id: string;
    auditoria_dictamen: Exclude<DictamenAuditoriaRepuve, "pendiente">;
    auditoria_notas: string | null;
    auditoria_revisada_en: string;
  };
}

export type FiltroColaRepuveAdmin = "excepciones" | "auditoria" | "todas";

/**
 * Lista las verificaciones REPUVE para la cola de excepciones y la cola de auditoría por muestreo en Panel Admin.
 */
export async function listarColaVerificacionesRepuveAdmin(
  cliente: Cliente,
  filtro: FiltroColaRepuveAdmin = "todas",
  limite = 60
): Promise<VerificacionRepuve[]> {
  const { data, error } = await cliente
    .from("vehiculo_verificaciones_repuve")
    .select("*")
    .order("creado_en", { ascending: false })
    .limit(limite);

  if (error) throw error;
  let filas = (data ?? []) as unknown as VerificacionRepuve[];

  if (filtro === "excepciones") {
    const trasladosConOverride = new Set(
      filas.filter((f) => f.es_override_admin).map((f) => f.traslado_id)
    );
    filas = filas.filter(
      (f) =>
        !f.es_override_admin &&
        (!f.coincide || f.resultado !== "limpio") &&
        !trasladosConOverride.has(f.traslado_id)
    );
  } else if (filtro === "auditoria") {
    filas = filas.filter(
      (f) => f.requiere_auditoria && (!f.auditoria_dictamen || f.auditoria_dictamen === "pendiente")
    );
  }

  return Promise.all(
    filas.map(async (fila) => ({
      ...fila,
      url_captura_firmada: fila.captura_path
        ? await resolverUrlEvidencia(cliente, fila.captura_path)
        : null
    }))
  );
}
