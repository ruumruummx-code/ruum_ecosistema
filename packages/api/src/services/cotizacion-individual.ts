import { rpcTipado } from "../supabase/funciones";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@ruum/shared/types";
import type { DatosNuevoTraslado, DatosParadaParaTraslado, DatosVehiculoParaTraslado } from "./traslados";

export interface SolicitudCotizadaIndividual {
  vehiculo: DatosVehiculoParaTraslado;
  traslado: DatosNuevoTraslado;
  paradas: DatosParadaParaTraslado[];
}

/** El cliente debe ser exclusivo del servidor con service_role; SQL revoca acceso a otros roles. */
export async function emitirCotizacionIndividualServidor(
  cliente: SupabaseClient<Database>, authUserId: string, solicitud: SolicitudCotizadaIndividual,
) {
  const { data, error } = await rpcTipado(cliente, "servidor_cotizar_traslado_individual", {
    p_auth_user_id: authUserId,
    p_vehiculo_id: "vehiculoId" in solicitud.vehiculo ? solicitud.vehiculo.vehiculoId : null,
    p_vehiculo: ("vehiculo" in solicitud.vehiculo ? solicitud.vehiculo.vehiculo : null) as unknown as Json,
    p_traslado: solicitud.traslado as unknown as Json,
    p_paradas: solicitud.paradas as unknown as Json,
  });
  if (error) throw error;
  if (!data || typeof data !== "object" || Array.isArray(data) ||
      typeof data.monto !== "number" || !Number.isFinite(data.monto) || data.monto <= 0 ||
      typeof data.nonce !== "string") {
    throw new Error("La cotización no devolvió un importe válido.");
  }
  return { ...solicitud, traslado: { ...solicitud.traslado, snapshot_tarifa: data } };
}
