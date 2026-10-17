import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@ruum/shared/types";

/**
 * FIX C1 (ticket arquitectura Fase 4): registro explícito de las RPC que usa
 * el flujo de usuario, con args y retorno tipados.
 *
 * Motivación: `cliente.rpc("nombre" as never, args as never)` anula al
 * compilador — un rename o cambio de firma en Postgres rompía en runtime.
 * Con este registro, el nombre y los args se verifican en `tsc` y el retorno
 * llega tipado al call site. La única excepción al sistema de tipos vive en
 * `rpcTipado` (un solo cast contenido y documentado), no regada por servicios.
 *
 * Fuente de verdad del esquema: `packages/shared/src/types/supabase.ts`
 * (generado por CLI, ver `pnpm db:types`). Este registro NO duplica tablas,
 * solo nombra las funciones del flujo usuario + sus formas de retorno ya
 * validadas en runtime por cada servicio.
 */
export interface FuncionesRpc {
  usuario_previsualizar_tarifas_masivas: {
    args: { p_filas: Json };
    ret: Json;
  };
  usuario_crea_traslado: {
    args: {
      p_vehiculo_id: string | null;
      p_vehiculo: Json | null;
      p_traslado: Json;
      p_clave_idempotencia: string;
      p_paradas?: Json;
    };
    ret: Json;
  };
  usuario_acepta_cotizacion: {
    args: { p_traslado_id: string };
    ret: Database["public"]["Enums"]["estado_traslado"];
  };
  /** Sobrecarga vigente (Fase 2/C3): calcula el cargo en el servidor. */
  usuario_cancela_traslado: {
    args: { p_traslado_id: string; p_motivo: string };
    ret: Json;
  };
  conductor_solicita_asignacion: {
    args: { p_traslado_id: string; p_lat: number | null; p_lng: number | null };
    ret: Json;
  };
  conductor_avanza_traslado: {
    args: { p_traslado_id: string; p_evento: string };
    ret: Database["public"]["Enums"]["estado_traslado"];
  };
  conductor_confirmar_llegada_destino: {
    args: { p_traslado_id: string; p_fuera_geocerca?: boolean; p_distancia_m?: number };
    ret: Database["public"]["Enums"]["estado_traslado"];
  };
  usuario_previsualizar_tarifa: {
    args: {
      p_marca: string;
      p_modelo: string;
      p_distancia_km: number;
      p_tiempo_estimado_horas: number;
      p_fecha_hora?: string;
      p_condicion: Database["public"]["Enums"]["condicion_vehiculo"];
    };
    ret: Json;
  };
  actualizar_datos_facturacion: {
    args: {
      p_rfc?: string | null;
      p_razon_social?: string | null;
      p_regimen_fiscal?: string | null;
      p_codigo_postal_fiscal?: string | null;
      p_uso_cfdi?: string | null;
      p_correo_facturacion?: string | null;
    };
    ret: Json;
  };
  registrar_consentimiento_usuario: {
    args: { p_version: number; p_canal: string; p_version_app: string; p_aceptado_en?: string };
    ret: Json;
  };
}

export type NombreFuncionRpc = keyof FuncionesRpc;

/**
 * Invoca una RPC del registro con args verificados en compilación.
 * El cast interno es el ÚNICO punto donde se relaja el genérico de
 * supabase-js (sus sobrecargas no resuelven uniones de Args generados);
 * los call sites quedan 100% tipados y sin `as never`.
 */
export async function rpcTipado<Nombre extends NombreFuncionRpc>(
  cliente: SupabaseClient<Database>,
  nombre: Nombre,
  args: FuncionesRpc[Nombre]["args"]
): Promise<{ data: FuncionesRpc[Nombre]["ret"] | null; error: unknown }> {
  const { data, error } = await cliente.rpc(
    nombre as unknown as never,
    args as unknown as never
  );
  return { data: data as FuncionesRpc[Nombre]["ret"] | null, error };
}
