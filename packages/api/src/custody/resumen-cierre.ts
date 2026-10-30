import type { SupabaseClient } from "@supabase/supabase-js";
export interface ResumenEvidenciaCierre { inicial: number; final: number; conflicto: boolean; completa: boolean }
export async function consultarResumenEvidenciaCierre(cliente: SupabaseClient, trasladoId: string): Promise<ResumenEvidenciaCierre> {
  const [fotos, conflictos] = await Promise.all([
    cliente.from("evidencia_fotos").select("tipo,angulo,sincronizada,conflicto,url").eq("traslado_id", trasladoId),
    cliente.from("evidencia_conflictos").select("captura_id").eq("traslado_id", trasladoId).is("resuelto_en", null)
  ]);
  if (fotos.error) throw fotos.error;
  if (conflictos.error) throw conflictos.error;
  const filas = (fotos.data ?? []) as { tipo: string; angulo: string; sincronizada: boolean; conflicto: boolean; url: string | null }[];
  const obligatorias = new Set(["frente", "lado_piloto", "lado_copiloto", "trasera", "tablero"]);
  const contar = (tipo: string) => new Set(filas.filter(f => f.tipo === tipo && f.sincronizada && !f.conflicto && f.url && obligatorias.has(f.angulo)).map(f => f.angulo)).size;
  const inicial = contar("inicial"), final = contar("final");
  const conflicto = filas.some(f => f.conflicto) || Boolean(conflictos.data?.length);
  // The server repeats validation, including actual Storage object existence, at transition time.
  return { inicial, final, conflicto, completa: inicial === 5 && final === 5 && !conflicto };
}
