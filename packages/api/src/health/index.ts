import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@ruum/shared/types";

export interface HealthCheckOptions {
  tabla?: keyof Database["public"]["Tables"];
  signal?: AbortSignal;
}

/**
 * Verifica la conectividad y respuesta operativa de Supabase desde @ruum/api.
 */
export async function verificarSaludSupabase(
  cliente: SupabaseClient<Database>,
  opciones?: HealthCheckOptions
): Promise<{ error: { message?: string } | null }> {
  const tabla = (opciones?.tabla ?? "conductores") as "conductores";
  const query = cliente.from(tabla).select("id").limit(1).maybeSingle();
  const cancelableQuery = query as unknown as { abortSignal?: (signal: AbortSignal) => unknown };
  if (opciones?.signal && typeof cancelableQuery.abortSignal === "function") {
    cancelableQuery.abortSignal(opciones.signal);
  }
  const { error } = await query;
  return { error };
}
