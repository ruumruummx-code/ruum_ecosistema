import type { SupabaseClient } from "@supabase/supabase-js";

export interface PuntoTelemetriaCapturado {
  localId: string; deviceTimestamp: string; lat: number; lng: number;
  precisionM: number | null; velocidadMps: number | null; fuente: "web_foreground"; online: boolean;
}
export async function registrarLoteTelemetria(cliente: SupabaseClient, trasladoId: string, puntos: PuntoTelemetriaCapturado[]): Promise<{ aceptados?: string[]; duplicadosIds?: string[] } | null> {
  const { data, error } = await cliente.rpc("registrar_telemetria_lote", { p_traslado_id: trasladoId, p_puntos: puntos });
  if (error) throw error;
  return data;
}
