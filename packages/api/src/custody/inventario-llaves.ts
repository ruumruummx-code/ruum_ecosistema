import type { SupabaseClient } from "@supabase/supabase-js";

export interface ResolucionInventarioLlaves {
  inicial: string; final: string; responsable: string; motivo: string; resuelta_en: string;
}
export async function consultarResolucionInventarioLlaves(cliente: SupabaseClient, trasladoId: string): Promise<ResolucionInventarioLlaves | null> {
  const { data, error } = await cliente.from("resoluciones_inventario_llaves")
    .select("inicial,final,responsable,motivo,resuelta_en").eq("traslado_id", trasladoId).maybeSingle();
  if (error) throw error;
  return data;
}
export async function consultarInventarioLlaves(cliente: SupabaseClient, trasladoId: string) {
  const [inspecciones, resolucion] = await Promise.all([
    cliente.from("evidencia_inspecciones").select("tipo,llaves_recibidas").eq("traslado_id", trasladoId),
    consultarResolucionInventarioLlaves(cliente, trasladoId)
  ]);
  if (inspecciones.error) throw inspecciones.error;
  const filas = (inspecciones.data ?? []) as { tipo: string; llaves_recibidas: string | null }[];
  return { inicial: filas.find(r => r.tipo === "inicial")?.llaves_recibidas ?? null, final: filas.find(r => r.tipo === "final")?.llaves_recibidas ?? null, resolucion };
}
export async function resolverInventarioLlaves(cliente: SupabaseClient, trasladoId: string, motivo: string) {
  const { error } = await cliente.rpc("resolver_inventario_llaves", { p_traslado_id: trasladoId, p_motivo: motivo.trim() });
  if (error) throw error;
  const resolucion = await consultarResolucionInventarioLlaves(cliente, trasladoId);
  if (!resolucion) throw new Error("No se encontró la resolución guardada.");
  return resolucion;
}
