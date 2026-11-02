import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@ruum/shared/types";

type Cliente = SupabaseClient<Database>;
type VehiculoRow = Database["public"]["Tables"]["vehiculos"]["Row"];

// El INSERT directo sigue cerrado. El registro sin traslado se realiza mediante
// usuario_registra_vehiculo (@ruum/api/vehicles), con propietario y validación
// derivados en servidor. usuario_crea_traslado conserva sus candados al reutilizarlo.

export async function listarVehiculosDeUsuario(cliente: Cliente, usuarioId: string): Promise<VehiculoRow[]> {
  const { data, error } = await cliente
    .from("vehiculos")
    .select("*")
    .eq("usuario_id", usuarioId)
    .order("creado_en", { ascending: false });

  if (error) throw error;
  return data ?? [];
}
