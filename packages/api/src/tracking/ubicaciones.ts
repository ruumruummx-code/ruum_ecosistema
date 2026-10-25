import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@ruum/shared/types";
import { z } from "zod";
import { suscribirCanalSeguro, type OpcionesSuscripcionSegura } from "@ruum/shared/utils";
import { rpcValidado, esquemaUuid } from "../services/_rpc-validado";

type Cliente = SupabaseClient<Database>;

// Esquema de validación estricta para el RPC de telemetría por lote.
// Se valida en cliente antes de enviar a Supabase; el servidor (RPC)
// valida definitivamente que auth.uid() sea el conductor dueño del traslado.
export const esquemaPuntoTelemetria = z.object({
  localId: esquemaUuid,
  lat: z.number().min(-90).max(90, "lat fuera de rango"),
  lng: z.number().min(-180).max(180, "lng fuera de rango"),
  precisionM: z.number().min(0).max(10000).nullable().optional(),
  velocidadMps: z.number().min(0).max(120).nullable().optional(),
  direccionGrados: z.number().min(0).max(360).nullable().optional(),
  altitudM: z.number().nullable().optional(),
  bateriaPct: z.number().min(0).max(100).nullable().optional(),
  online: z.boolean().nullable().optional(),
  fuente: z.string().max(64).optional(),
  estadoViaje: z.string().max(64).optional(),
  deviceTimestamp: z.string().datetime({ offset: true }).optional(),
});

export const esquemaRegistrarTelemetriaLote = z.object({
  p_traslado_id: esquemaUuid,
  p_puntos: z.array(esquemaPuntoTelemetria).min(1, "El lote debe contener al menos 1 punto").max(100, "El lote no puede exceder 100 puntos"),
});

/**
 * Registra un lote de puntos de telemetría mediante el RPC de Supabase.
 *
 * Validación de seguridad en servidor: el RPC `registrar_telemetria_lote`
 * (security definer) exige que `auth.uid()` coincida con
 * `conductores.auth_user_id` del conductor asignado al `traslado_id`,
 * rechazando la operación con código 42501 si el conductor autenticado
 * no es el dueño legítimo del viaje.
 */
export async function registrarTelemetriaLote(
  cliente: Cliente,
  datos: { trasladoId: string; puntos: Array<{
    localId: string;
    lat: number;
    lng: number;
    precisionM?: number | null;
    velocidadMps?: number | null;
    direccionGrados?: number | null;
    altitudM?: number | null;
    bateriaPct?: number | null;
    online?: boolean | null;
    fuente?: string;
    estadoViaje?: string;
    deviceTimestamp?: string;
  }> }
) {
  const validado = esquemaRegistrarTelemetriaLote.parse({
    p_traslado_id: datos.trasladoId,
    p_puntos: datos.puntos.map((p) => ({
      localId: p.localId,
      lat: p.lat,
      lng: p.lng,
      precisionM: p.precisionM ?? null,
      velocidadMps: p.velocidadMps ?? null,
      direccionGrados: p.direccionGrados ?? null,
      altitudM: p.altitudM ?? null,
      bateriaPct: p.bateriaPct ?? null,
      online: p.online ?? null,
      fuente: p.fuente ?? null,
      estadoViaje: p.estadoViaje ?? null,
      deviceTimestamp: p.deviceTimestamp ?? null,
    })),
  });

  const { data, error } = await rpcValidado(cliente, "registrar_telemetria_lote", esquemaRegistrarTelemetriaLote, validado);

  if (error) throw error;
  return data;
}
type EstadoTraslado = Database["public"]["Enums"]["estado_traslado"];

export interface UbicacionTraslado {
  id: string;
  traslado_id: string;
  conductor_id: string;
  lat: number;
  lng: number;
  precision_m: number | null;
  velocidad_mps: number | null;
  registrado_en: string;
}

export interface DatosUbicacionTraslado {
  trasladoId: string;
  lat: number;
  lng: number;
  precisionM?: number | null;
  velocidadMps?: number | null;
}

export interface EstadoTrasladoRealtime {
  id: string;
  estado: EstadoTraslado;
  actualizado_en: string;
}

function tablaUbicaciones(cliente: Cliente) {
  return (cliente as unknown as SupabaseClient).from("ubicaciones_traslado");
}

function tablaTrasladosRealtime(cliente: Cliente) {
  return (cliente as unknown as SupabaseClient).from("traslados");
}

async function obtenerConductorIdActual(cliente: Cliente): Promise<string> {
  const { data: sesion } = await cliente.auth.getUser();
  if (!sesion.user) {
    throw new Error("Inicia sesión como conductor para reportar ubicación.");
  }

  const { data, error } = await cliente.from("conductores").select("id").eq("auth_user_id", sesion.user.id).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("No se encontró el conductor autenticado.");
  return data.id;
}

export async function registrarUbicacionTraslado(cliente: Cliente, datos: DatosUbicacionTraslado) {
  const conductorId = await obtenerConductorIdActual(cliente);
  const { data, error } = await tablaUbicaciones(cliente)
    .insert({
      traslado_id: datos.trasladoId,
      conductor_id: conductorId,
      lat: datos.lat,
      lng: datos.lng,
      precision_m: datos.precisionM ?? null,
      velocidad_mps: datos.velocidadMps ?? null
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as UbicacionTraslado;
}

export async function obtenerUltimaUbicacionTraslado(cliente: Cliente, trasladoId: string): Promise<UbicacionTraslado | null> {
  const { data, error } = await tablaUbicaciones(cliente)
    .select("*")
    .eq("traslado_id", trasladoId)
    .order("registrado_en", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data as UbicacionTraslado | null) ?? null;
}

export function suscribirUbicacionTraslado(
  cliente: Cliente,
  trasladoId: string,
  alRecibir: (ubicacion: UbicacionTraslado) => void,
  opciones?: OpcionesSuscripcionSegura
): RealtimeChannel {
  const canal = cliente
    .channel(`ubicaciones-traslado-${trasladoId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "ubicaciones_traslado",
        filter: `traslado_id=eq.${trasladoId}`
      },
      (payload) => alRecibir(payload.new as UbicacionTraslado)
    );

  // FIX A1: reintento con backoff (el socket móvil muere en background/sin
  // cobertura); el llamador puede desactivarlo con { reintentar: false }.
  suscribirCanalSeguro(cliente, canal, { reintentar: true, ...opciones });
  return canal;
}

export async function obtenerEstadoTrasladoRealtime(cliente: Cliente, trasladoId: string): Promise<EstadoTrasladoRealtime | null> {
  const { data, error } = await tablaTrasladosRealtime(cliente)
    .select("id, estado, actualizado_en")
    .eq("id", trasladoId)
    .maybeSingle();

  if (error) throw error;
  return (data as EstadoTrasladoRealtime | null) ?? null;
}

export function suscribirEstadoTraslado(
  cliente: Cliente,
  trasladoId: string,
  alRecibir: (estado: EstadoTrasladoRealtime) => void,
  opciones?: OpcionesSuscripcionSegura
): RealtimeChannel {
  const canal = cliente
    .channel(`estado-traslado-${trasladoId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "traslados",
        filter: `id=eq.${trasladoId}`
      },
      (payload) => alRecibir(payload.new as EstadoTrasladoRealtime)
    );

  // FIX A1: ver comentario en suscribirUbicacionTraslado.
  suscribirCanalSeguro(cliente, canal, { reintentar: true, ...opciones });
  return canal;
}

