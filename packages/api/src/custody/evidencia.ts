import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@ruum/shared/types";
import { assertAdminAnyPermission, assertAdminPermission } from "../services/permisos-admin";
import { withIdempotentRetry } from "../operations/infrastructure/retry";

type Cliente = SupabaseClient<Database>;

/** Bucket de Storage donde vive la evidencia del conductor. */
export const BUCKET_EVIDENCIA = "evidencia";

export interface EvidenciaVehiculoTraslado {
  traslado_id: string;
  traslado_estado: string;
  fotos: Array<{
    id: string;
    tipo: string;
    angulo: string;
    url: string | null;
    capturada_en: string;
    sincronizada: boolean;
  }>;
}

/**
 * Obtiene la evidencia (fotos) asociada a un vehículo a través de sus traslados.
 */

export async function obtenerEvidenciaVehiculo(
  cliente: Cliente,
  vehiculoId: string
): Promise<EvidenciaVehiculoTraslado[]> {
  await assertAdminPermission(cliente, "Traslados:leer");
  const rpc = cliente.rpc.bind(cliente) as unknown as (
    fn: "admin_obtener_evidencia_vehiculo",
    args: { p_vehiculo_id: string }
  ) => Promise<{ data: EvidenciaVehiculoTraslado[] | null; error: unknown }>;
  const { data, error } = await rpc("admin_obtener_evidencia_vehiculo", {
    p_vehiculo_id: vehiculoId
  });
  if (error) throw error;
  return data ?? [];
}

export async function exportarEvidenciaFirmada(
  cliente: Cliente,
  trasladoIds: string[]
): Promise<{ evidencia: Array<{ traslado_id: string; fotos: Array<{ id: string; tipo: string; angulo: string; storage_path: string; capturada_en: string }> }>; total: number }> {
  await assertAdminPermission(cliente, "Traslados:gestionar");
  return withIdempotentRetry(async () => {
    const rpc = cliente.rpc.bind(cliente) as unknown as (
      fn: "admin_exportar_evidencia_firmada",
      args: { p_traslado_ids: string[] }
    ) => Promise<{ data: { evidencia: Array<{ traslado_id: string; fotos: Array<{ id: string; tipo: string; angulo: string; storage_path: string; capturada_en: string }> }>; total: number } | null; error: unknown }>;
    const { data, error } = await rpc("admin_exportar_evidencia_firmada", { p_traslado_ids: trasladoIds });
    if (error) throw error;
    if (!data) return { evidencia: [], total: 0 };
    return data;
  });
}

/**
 * Sube el binario de la evidencia al bucket `evidencia`.
 *
 * Vive en @ruum/api para que las apps no toquen Storage directamente
 * (frontera FASE 6) y para que el bucket y las opciones de subida estén
 * definidos en un solo sitio.
 */
export async function subirArchivoEvidenciaStorage(
  cliente: Cliente,
  ruta: string,
  archivo: Blob,
  opciones: { upsert?: boolean; contentType?: string } = {}
): Promise<{ error: unknown | null }> {
  const { error } = await cliente.storage.from(BUCKET_EVIDENCIA).upload(ruta, archivo, {
    upsert: opciones.upsert ?? false,
    contentType: opciones.contentType
  });
  return { error: error ?? null };
}

/**
 * Resultado de persistir la evidencia ya subida a Storage.
 *
 * - `registrada`: la fila se creó (primera subida).
 * - `duplicado_identico`: la fila ya existía con el MISMO sha256 → reintento
 *   idempotente de la cola. Se trata como éxito.
 * - `conflicto`: la fila ya existía con un sha256 distinto (o sin sha256
 *   comparable) → se rompe la cadena de custodia. La evidencia NO se
 *   sobrescribe: se marca en conflicto y se avisa a soporte.
 */
export type ResultadoGuardadoEvidencia =
  | { estado: "registrada"; id: string }
  | { estado: "duplicado_identico"; id: string }
  | {
      estado: "conflicto";
      id: string;
      sha256Registrado: string | null;
      sha256Recibido: string | null;
    };

const CODIGO_DUPLICADO = "23505";

/**
 * FASE 6 cierre — persistencia idempotente de foto ya subida a Storage.
 *
 * La escritura es insert-only: la evidencia registrada nunca se sobrescribe.
 * El "ya existe" se trata como éxito sólo si el sha256 del archivo coincide con
 * el registrado (reintento de cola); si no coincide, la evidencia queda marcada
 * en conflicto y se abre una incidencia para soporte.
 */
export async function guardarFotoEvidenciaSincronizada(
  cliente: Cliente,
  fila: Database["public"]["Tables"]["evidencia_fotos"]["Insert"]
): Promise<ResultadoGuardadoEvidencia> {
  const id = typeof fila.id === "string" ? fila.id : "";
  const sha256Recibido = typeof fila.sha256 === "string" ? fila.sha256 : null;

  const { error } = await cliente.from("evidencia_fotos").insert(fila);
  if (!error) return { estado: "registrada", id };

  if ((error as { code?: string }).code !== CODIGO_DUPLICADO) throw error;

  // Ya existe: sólo es idempotencia si el contenido es idéntico.
  const { data: existente, error: errorLectura } = await cliente
    .from("evidencia_fotos")
    .select("id,sha256")
    .eq("id", id)
    .maybeSingle();
  if (errorLectura) throw errorLectura;

  const sha256Registrado = (existente as { sha256?: string | null } | null)?.sha256 ?? null;
  if (sha256Registrado && sha256Recibido && sha256Registrado === sha256Recibido) {
    return { estado: "duplicado_identico", id };
  }

  await marcarConflictoEvidencia(cliente, {
    id,
    trasladoId: typeof fila.traslado_id === "string" ? fila.traslado_id : "",
    sha256Registrado,
    sha256Recibido
  });

  return { estado: "conflicto", id, sha256Registrado, sha256Recibido };
}

/**
 * Marca la evidencia en conflicto (sin tocar el archivo ni la fila original) y
 * abre una incidencia para que la Torre de Control la revise.
 */
export async function marcarConflictoEvidencia(
  cliente: Cliente,
  params: {
    id: string;
    trasladoId: string;
    sha256Registrado: string | null;
    sha256Recibido: string | null;
  }
): Promise<void> {
  const detalle = `sha256 registrado ${params.sha256Registrado ?? "desconocido"} / sha256 recibido ${
    params.sha256Recibido ?? "desconocido"
  }`;

  const { error: errorMarca } = await cliente
    .from("evidencia_fotos")
    .update({
      conflicto: true,
      conflicto_detalle: detalle,
      conflicto_detectado_en: new Date().toISOString()
    })
    .eq("id", params.id);
  if (errorMarca) throw errorMarca;

  if (!params.trasladoId) return;
  const { error: errorIncidencia } = await cliente.from("incidencias").insert({
    traslado_id: params.trasladoId,
    tipo: "conflicto_evidencia",
    momento: "durante_traslado",
    reportada_por: "sistema",
    descripcion:
      "Conflicto de cadena de custodia: se intentó registrar evidencia ya existente con un contenido distinto. " +
      `La evidencia no se sobrescribió y requiere revisión manual. ${detalle}`
  });
  if (errorIncidencia) throw errorIncidencia;
}
