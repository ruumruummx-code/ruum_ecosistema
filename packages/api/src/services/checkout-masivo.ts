import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@ruum/shared/types";
import { rpcTipado } from "../supabase/funciones";
import type { PrevisualizacionTarifa } from "./tarifas";
import { z } from "zod";

export interface EntradaCotizacionMasiva {
  indice: number; marca: string; modelo: string;
  condicion: Database["public"]["Enums"]["condicion_vehiculo"];
  distanciaKm: number; tiempoEstimadoHoras: number; fechaHora: string;
}
const esquemaTarifasMasivas = z.array(z.object({
  indice: z.number().int().nonnegative(), disponible: z.boolean(), motivo: z.string().optional(),
  tarifa: z.number().finite().nullable().optional(),
  categoria_tarifa: z.enum(["ligero_a", "ligero_b"]).optional(),
  gama: z.enum(["entrada", "media", "alta", "premium"]).optional(),
}));
export async function previsualizarTarifasMasivasUsuario(cliente: SupabaseClient<Database>, filas: EntradaCotizacionMasiva[]): Promise<Array<PrevisualizacionTarifa & { indice: number }>> {
  const { data, error } = await rpcTipado(cliente, "usuario_previsualizar_tarifas_masivas", { p_filas: filas as unknown as Json });
  if (error) throw error;
  const resultado = esquemaTarifasMasivas.parse(data);
  const indices = new Set(resultado.map(f => f.indice));
  if (resultado.length !== filas.length || indices.size !== filas.length || filas.some(f => !indices.has(f.indice))) throw new Error("El cotizador devolvió un lote incompleto.");
  return resultado.map(f => ({ ...f, tarifa: f.tarifa ?? undefined }));
}

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
