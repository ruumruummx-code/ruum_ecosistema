import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@ruum/shared/types";
import { z } from "zod";
const entrada = z.object({ id: z.string().uuid(), trasladoId: z.string().uuid().nullable(),
  motivo: z.string().trim().min(3).max(120), descripcion: z.string().trim().min(10).max(1000) });
export type EntradaTicketSoporte = z.infer<typeof entrada>;
export async function crearTicketSoporte(cliente: SupabaseClient<Database>, datos: EntradaTicketSoporte) {
  const d = entrada.parse(datos);
  const { error } = await cliente.from("tickets_soporte").upsert({ id: d.id, traslado_id: d.trasladoId,
    motivo: d.motivo, descripcion: d.descripcion }, { onConflict: "id", ignoreDuplicates: true });
  if (error) throw error;
  const { data, error: errorLeer } = await cliente.from("tickets_soporte").select("id,motivo,descripcion,traslado_id").eq("id", d.id).single();
  if (errorLeer || !data) throw errorLeer ?? new Error("No se confirmó el ticket.");
  if (data.motivo !== d.motivo || data.descripcion !== d.descripcion || data.traslado_id !== d.trasladoId) throw new Error("La solicitud anterior tiene otros datos. Actualiza el formulario.");
  return { id: data.id };
}
export async function listarTicketsSoporte(cliente: SupabaseClient<Database>) {
  const { data, error } = await cliente.from("tickets_soporte").select("*").order("creado_en", { ascending: false }).limit(100);
  if (error) throw error;
  return data ?? [];
}
export async function resolverTicketSoporte(cliente: SupabaseClient<Database>, id: string) {
  const { data, error } = await cliente.from("tickets_soporte").update({ estado: "resuelto" }).eq("id", id).select("id").single();
  if (error || !data) throw error ?? new Error("No se confirmó la resolución.");
}
