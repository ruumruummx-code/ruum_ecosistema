import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@ruum/shared/types";

export async function clasificarVehiculoMasivo(cliente: SupabaseClient<Database>, marca: string, modelo: string) {
  const { data, error } = await cliente.rpc("catalogar_vehiculo_para_tarifa", { p_marca: marca, p_modelo: modelo });
  if (error) throw error;
  return data?.[0] ?? null;
}
export async function verificarUsuarioMasivo(cliente: SupabaseClient<Database>, authId: string) {
  const { data, error } = await cliente.from("usuarios").select("estado_verificacion").eq("auth_user_id", authId).single();
  if (error) throw error;
  return Boolean(data && ["aprobado", "verificado"].includes(data.estado_verificacion));
}

export interface CheckoutMasivoGuardado {
  id: string; auth_user_id: string; filas: Record<string, string>[]; cotizaciones: unknown[];
  monto_centavos: number; stripe_payment_intent_id?: string; pagado_en?: string;
}
/** Solo para rutas autenticadas de servidor que ya poseen el cliente de servicio. */
export async function guardarCheckoutMasivoServidor(cliente: SupabaseClient, datos: CheckoutMasivoGuardado) {
  const { error } = await cliente.from("checkout_traslados_masivos").upsert(datos, { onConflict: "id", ignoreDuplicates: true });
  if (error) throw error;
  return obtenerCheckoutMasivoServidor(cliente, datos.id, datos.auth_user_id);
}
export async function obtenerCheckoutMasivoServidor(cliente: SupabaseClient, id: string, authId: string): Promise<CheckoutMasivoGuardado> {
  const { data, error } = await cliente.from("checkout_traslados_masivos").select("*").eq("id", id).eq("auth_user_id", authId).single();
  if (error || !data) throw new Error("Carga no encontrada");
  return data as CheckoutMasivoGuardado;
}
export async function vincularPagoMasivoServidor(cliente: SupabaseClient, id: string, authId: string, intent: string) {
  const { error } = await cliente.from("checkout_traslados_masivos").update({ stripe_payment_intent_id: intent }).eq("id", id).eq("auth_user_id", authId);
  if (error) throw error;
}
export async function confirmarPagoMasivoServidor(cliente: SupabaseClient, id: string, intent: string, monto: number, moneda: string) {
  const { error } = await cliente.rpc("confirmar_checkout_masivo", { p_id: id, p_intent: intent, p_monto: monto, p_moneda: moneda });
  if (error) throw error;
}
