import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@ruum/shared/types";

// FASE 6 (cierre) — Lecturas del pasaporte de traslado para usuario y
// conductor. Sustituyen los `.from()` directos en
// app-usuario/.../viajes/[id]/page.tsx y el detalle por ids en
// app-conductor/.../viajes/page.tsx. Son tolerantes: ante error devuelven
// null/[] (la UI decide el fallback), nunca lanzan por datos.

type Cliente = SupabaseClient<Database>;
type TrasladoRow = Database["public"]["Tables"]["traslados"]["Row"];
type VehiculoRow = Database["public"]["Tables"]["vehiculos"]["Row"];
type PasaporteRow = Database["public"]["Views"]["pasaporte_digital"]["Row"];
/** Solo las columnas de evidencia que el pasaporte proyecta (RT-68 añadió conflicto/sha256). */
type FotoRow = Pick<
  Database["public"]["Tables"]["evidencia_fotos"]["Row"],
  | "id"
  | "traslado_id"
  | "tipo"
  | "angulo"
  | "url"
  | "local_path"
  | "capturada_en"
  | "lat"
  | "lng"
  | "sincronizada"
  | "conflicto"
>;
type IncidenciaRow = Database["public"]["Tables"]["incidencias"]["Row"];
type DisputaRow = Database["public"]["Tables"]["disputas"]["Row"];
type ReclamoRow = Database["public"]["Tables"]["reclamos_seguro"]["Row"];
type CalificacionRow = Database["public"]["Tables"]["calificaciones_traslado"]["Row"];
type PagoRow = Database["public"]["Tables"]["pagos"]["Row"];

export type ResumenTraslado = Pick<
  TrasladoRow,
  | "origen_direccion"
  | "origen_ciudad"
  | "destino_direccion"
  | "destino_ciudad"
  | "contacto_entrega_nombre"
  | "contacto_entrega_telefono"
  | "contacto_recepcion_nombre"
  | "contacto_recepcion_telefono"
  | "fecha_hora_programada"
  | "cotizacion_expira_en"
  | "tipo_servicio"
  | "motivo_servicio"
  | "ventana_recoleccion"
  | "ventana_entrega"
>;

export type VehiculoTraslado = Pick<
  VehiculoRow,
  | "tipo"
  | "marca"
  | "modelo"
  | "anio"
  | "vin"
  | "condicion"
  | "color"
  | "transmision"
  | "placas"
  | "tiene_tarjeta_circulacion"
  | "tiene_verificacion"
  | "tiene_placas"
  | "puede_circular_rodando"
>;

export type ConductorTraslado = {
  id: string;
  estado: Database["public"]["Enums"]["estado_conductor"] | null;
  nivel_operativo_vigente: Database["public"]["Enums"]["nivel_concer"] | null;
  calificacion_promedio: number | null;
  nombre?: string | null;
  traslados_completados?: number | null;
  foto_perfil_url?: string | null;
};

export type ReclamoTraslado = Pick<
  ReclamoRow,
  "id" | "traslado_id" | "estado" | "abierto_en" | "resuelto_en"
>;

export type DetalleTrasladoConductor = Pick<
  TrasladoRow,
  | "id"
  | "origen_ciudad"
  | "origen_direccion"
  | "destino_ciudad"
  | "destino_direccion"
  | "fecha_hora_programada"
  | "tipo_servicio"
  | "motivo_servicio"
  | "instrucciones_especiales"
>;

async function uno<T>(promesa: PromiseLike<{ data: T | null; error: unknown }>): Promise<T | null> {
  try {
    const res = await promesa;
    if (res.error) return null;
    return res.data ?? null;
  } catch {
    return null;
  }
}

async function varios<T>(promesa: PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  try {
    const res = await promesa;
    if (res.error) return [];
    return res.data ?? [];
  } catch {
    return [];
  }
}

export function obtenerResumenTraslado(cliente: Cliente, trasladoId: string): Promise<ResumenTraslado | null> {
  return uno(
    cliente
      .from("traslados")
      .select(
        "origen_direccion, origen_ciudad, destino_direccion, destino_ciudad, contacto_entrega_nombre, contacto_entrega_telefono, contacto_recepcion_nombre, contacto_recepcion_telefono, fecha_hora_programada, cotizacion_expira_en, tipo_servicio, motivo_servicio, ventana_recoleccion, ventana_entrega"
      )
      .eq("id", trasladoId)
      .maybeSingle()
  );
}

export function obtenerVehiculoTraslado(
  cliente: Cliente,
  vehiculoId: string | null
): Promise<VehiculoTraslado | null> {
  if (!vehiculoId) return Promise.resolve(null);
  return uno(
    cliente
      .from("vehiculos")
      .select(
        "tipo, marca, modelo, anio, vin, condicion, color, transmision, placas, tiene_tarjeta_circulacion, tiene_verificacion, tiene_placas, puede_circular_rodando"
      )
      .eq("id", vehiculoId)
      .maybeSingle()
  );
}

export function obtenerConductorTraslado(
  cliente: Cliente,
  conductorId: string | null
): Promise<ConductorTraslado | null> {
  if (!conductorId) return Promise.resolve(null);
  return uno(
    cliente
      .from("conductores_publicos")
      .select("id, estado, nivel_operativo_vigente, calificacion_promedio")
      .eq("id", conductorId)
      .maybeSingle()
  );
}

export function listarFotosEvidencia(cliente: Cliente, trasladoId: string): Promise<FotoRow[]> {
  return varios(
    cliente
      .from("evidencia_fotos")
      .select("id, traslado_id, tipo, angulo, url, local_path, capturada_en, lat, lng, sincronizada, conflicto")
      .eq("traslado_id", trasladoId)
      .order("capturada_en", { ascending: true })
  );
}

export function listarIncidenciasTraslado(cliente: Cliente, trasladoId: string): Promise<IncidenciaRow[]> {
  return varios(
    cliente
      .from("incidencias")
      .select("id, traslado_id, tipo, momento, reportada_por, descripcion, resuelta, creada_en, resuelta_en, severidad, estado, responsable_admin_id, asignada_en, nivel_escalamiento, escalada_en, sla_horas, sla_vence_en")
      .eq("traslado_id", trasladoId)
      .order("creada_en", { ascending: false })
  );
}

export function listarDisputasTraslado(cliente: Cliente, trasladoId: string): Promise<DisputaRow[]> {
  return varios(
    cliente
      .from("disputas")
      .select("id, traslado_id, abierta_por, tipo, estado, resolucion, abierta_en, resuelta_en, escalada_en, descripcion, resolucion_detalle")
      .eq("traslado_id", trasladoId)
      .order("abierta_en", { ascending: false })
  );
}

export function listarReclamosTraslado(cliente: Cliente, trasladoId: string): Promise<ReclamoTraslado[]> {
  return varios(
    cliente
      .from("reclamos_seguro")
      .select("id, traslado_id, estado, abierto_en, resuelto_en")
      .eq("traslado_id", trasladoId)
      .order("abierto_en", { ascending: false })
  );
}

export function obtenerCalificacionTraslado(cliente: Cliente, trasladoId: string): Promise<CalificacionRow | null> {
  return uno(
    cliente
      .from("calificaciones_traslado")
      .select("traslado_id, conductor_id, estrellas, comentario, calificado_en")
      .eq("traslado_id", trasladoId)
      .maybeSingle()
  );
}

export function listarPagosTraslado(cliente: Cliente, trasladoId: string): Promise<PagoRow[]> {
  return varios(
    cliente
      .from("pagos")
      .select("id, traslado_id, monto, momento, estado, metodo, registrado_en, stripe_payment_intent_id, stripe_event_id, comision_mxn, checkout_masivo_id")
      .eq("traslado_id", trasladoId)
      .order("registrado_en", { ascending: false })
  );
}

export function obtenerTrasladosPorIds(
  cliente: Cliente,
  trasladoIds: string[]
): Promise<DetalleTrasladoConductor[]> {
  if (trasladoIds.length === 0) return Promise.resolve([]);
  return varios(
    cliente
      .from("traslados")
      .select(
        "id, origen_ciudad, origen_direccion, destino_ciudad, destino_direccion, fecha_hora_programada, tipo_servicio, motivo_servicio, instrucciones_especiales"
      )
      .in("id", trasladoIds)
  );
}

export interface TrasladoConRelaciones {
  traslado: TrasladoRow | null;
  vehiculo: (VehiculoTraslado & Pick<VehiculoRow, "categoria_tarifa" | "gama">) | null;
  conductor: ConductorTraslado | null;
}

/** Fallback resiliente cuando la vista pasaporte_digital no devuelve fila.
 * Proyecta explícitamente vehiculos y conductores_publicos (nunca `*` ni `conductores(*)`):
 * evita filtrar datos PII confidenciales de conductores y mitiga restricciones RLS. */
export async function obtenerTrasladoConRelaciones(
  cliente: Cliente,
  trasladoId: string
): Promise<TrasladoConRelaciones> {
  const vacio: TrasladoConRelaciones = { traslado: null, vehiculo: null, conductor: null };
  try {
    const res = await cliente
      .from("traslados")
      .select(
        "id, usuario_id, vehiculo_id, conductor_id, estado, origen_direccion, origen_ciudad, origen_lat, origen_lng, destino_direccion, destino_ciudad, destino_lat, destino_lng, fecha_hora_programada, tipo_servicio, motivo_servicio, instrucciones_especiales, precio_cotizado, precio_final, distancia_km, tiempo_estimado_horas, creado_en, actualizado_en, version, ventana_recoleccion, ventana_entrega, contacto_entrega_nombre, contacto_entrega_telefono, contacto_recepcion_nombre, contacto_recepcion_telefono, cotizacion_expira_en, vehiculos (tipo, marca, modelo, anio, vin, condicion, categoria_tarifa, gama, color, transmision, placas, tiene_tarjeta_circulacion, tiene_verificacion, tiene_placas, puede_circular_rodando)"
      )
      .eq("id", trasladoId)
      .maybeSingle();
    if (res.error || !res.data) return vacio;
    const fila = res.data as unknown as TrasladoRow & {
      vehiculos: (VehiculoTraslado & Pick<VehiculoRow, "categoria_tarifa" | "gama">) | null;
    };
    const { vehiculos, ...traslado } = fila;

    let conductor: ConductorTraslado | null = null;
    if (traslado.conductor_id) {
      conductor = await obtenerConductorTraslado(cliente, traslado.conductor_id);
    }

    return { traslado: traslado as unknown as TrasladoRow, vehiculo: vehiculos ?? null, conductor };
  } catch {
    return vacio;
  }
}

/** FASE 6 cierre — versión optimista del traslado bajo RLS. */
export async function obtenerVersionTraslado(cliente: Cliente, trasladoId: string): Promise<number | null> {
  const { data, error } = await cliente.from("traslados").select("version").eq("id", trasladoId).maybeSingle();
  if (error) throw error;
  return data?.version ?? null;
}

export interface DatosOperativosTraslado { ventana_recoleccion: string | null; ventana_entrega: string | null; usuario_id: string | null }
/** FASE 6 cierre — campos operativos mínimos que no proyecta el pasaporte. */
export async function obtenerDatosOperativosTraslado(cliente: Cliente, trasladoId: string): Promise<DatosOperativosTraslado | null> {
  const { data, error } = await cliente.from("traslados").select("ventana_recoleccion, ventana_entrega, usuario_id").eq("id", trasladoId).maybeSingle();
  if (error) throw error;
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// FIX C2 + C3 (ticket arquitectura Fase 4): agregación del Pasaporte Completo
// en el paquete, con errores explícitos.
//
// Antes, `apps/app-usuario/.../obtenerDatosTraslado.ts` orquestaba 10 queries
// en el Server Component y las lecturas tolerantes (`uno`/`varios`, que se
// conservan para compatibilidad) convertían CUALQUIER fallo — red caída,
// JWT inválido, RLS mal configurada — en `null`/`[]`, pintando un pasaporte
// incompleto sin alertar. Ahora:
//   - `obtenerPasaporteCompleto` orquesta las 10 lecturas aquí;
//   - un `error` de PostgREST lanza `PasaporteError` (→ error.tsx + Sentry);
//   - solo la ausencia de fila (RLS/ID inexistente) devuelve `null` (→
//     TrasladoNoEncontrado, sin filtrar existencia);
//   - la ubicación en vivo es degradable: si falla, viaja como `null`.
// ─────────────────────────────────────────────────────────────────────────────

export class PasaporteError extends Error {
  readonly trasladoId: string;
  readonly operacion: string;
  readonly causa: unknown;

  constructor(trasladoId: string, operacion: string, mensaje: string, causa?: unknown) {
    super(`[pasaporte:${operacion}] ${mensaje}`);
    this.name = "PasaporteError";
    this.trasladoId = trasladoId;
    this.operacion = operacion;
    this.causa = causa;
  }
}

type RespuestaUno<T> = { data: T | null; error: unknown };
type RespuestaVarios<T> = { data: T[] | null; error: unknown };

async function exigirUno<T>(
  promesa: PromiseLike<RespuestaUno<T>>,
  trasladoId: string,
  operacion: string
): Promise<T | null> {
  let res: RespuestaUno<T>;
  try {
    res = await promesa;
  } catch (cause) {
    throw new PasaporteError(trasladoId, operacion, "Sin conexión al consultar el pasaporte.", cause);
  }
  if (res.error) {
    throw new PasaporteError(trasladoId, operacion, "La base rechazó la consulta del pasaporte.", res.error);
  }
  return res.data ?? null;
}

async function exigirVarios<T>(
  promesa: PromiseLike<RespuestaVarios<T>>,
  trasladoId: string,
  operacion: string
): Promise<T[]> {
  let res: RespuestaVarios<T>;
  try {
    res = await promesa;
  } catch (cause) {
    throw new PasaporteError(trasladoId, operacion, "Sin conexión al consultar el pasaporte.", cause);
  }
  if (res.error) {
    throw new PasaporteError(trasladoId, operacion, "La base rechazó la consulta del pasaporte.", res.error);
  }
  return res.data ?? [];
}

export type UbicacionPasaporte = Pick<
  Database["public"]["Tables"]["ubicaciones_traslado"]["Row"],
  "id" | "traslado_id" | "conductor_id" | "lat" | "lng" | "precision_m" | "velocidad_mps" | "registrado_en"
>;

export interface PasaporteCompleto {
  pasaporte: PasaporteRow;
  traslado: ResumenTraslado | null;
  vehiculo: VehiculoTraslado | null;
  conductor: ConductorTraslado | null;
  fotosEvidencia: FotoRow[];
  incidencias: IncidenciaRow[];
  disputas: DisputaRow[];
  reclamosSeguro: ReclamoTraslado[];
  calificacion: CalificacionRow | null;
  pagos: PagoRow[];
  ultimaUbicacion: UbicacionPasaporte | null;
}

/**
 * Agrega las 10 lecturas del Pasaporte Digital con proyecciones explícitas.
 * Devuelve `null` solo si no hay fila visible (RLS/inexistente); cualquier
 * fallo de transporte o permiso lanza `PasaporteError` para el boundary.
 */
export async function obtenerPasaporteCompleto(
  cliente: Cliente,
  trasladoId: string
): Promise<PasaporteCompleto | null> {
  const pasaporteVista = await exigirUno(
    cliente.from("pasaporte_digital").select("*").eq("traslado_id", trasladoId).maybeSingle(),
    trasladoId,
    "pasaporte_digital"
  );

  let pasaporte: PasaporteRow | null = pasaporteVista;
  let vehiculoFallback: TrasladoConRelaciones["vehiculo"] = null;
  let conductorFallback: ConductorTraslado | null = null;

  if (!pasaporte) {
    const rel = await obtenerTrasladoConRelaciones(cliente, trasladoId);
    if (!rel.traslado) return null;
    vehiculoFallback = rel.vehiculo;
    conductorFallback = rel.conductor;
    pasaporte = construirPasaporteDesdeRelacion(rel);
  }

  const vehiculoId = pasaporte.vehiculo_id;
  const conductorId = pasaporte.conductor_id;

  const [
    traslado,
    vehiculo,
    conductor,
    fotosEvidencia,
    incidencias,
    disputas,
    reclamosSeguro,
    calificacion,
    pagos
  ] = await Promise.all([
    exigirUno(
      cliente
        .from("traslados")
        .select(
          "origen_direccion, origen_ciudad, destino_direccion, destino_ciudad, contacto_entrega_nombre, contacto_entrega_telefono, contacto_recepcion_nombre, contacto_recepcion_telefono, fecha_hora_programada, cotizacion_expira_en, tipo_servicio, motivo_servicio, ventana_recoleccion, ventana_entrega"
        )
        .eq("id", trasladoId)
        .maybeSingle(),
      trasladoId,
      "resumen_traslado"
    ),
    vehiculoId
      ? exigirUno(
          cliente
            .from("vehiculos")
            .select(
              "tipo, marca, modelo, anio, vin, condicion, color, transmision, placas, tiene_tarjeta_circulacion, tiene_verificacion, tiene_placas, puede_circular_rodando"
            )
            .eq("id", vehiculoId)
            .maybeSingle(),
          trasladoId,
          "vehiculo_traslado"
        )
      : Promise.resolve(
          vehiculoFallback
            ? {
                tipo: vehiculoFallback.tipo,
                marca: vehiculoFallback.marca,
                modelo: vehiculoFallback.modelo,
                anio: vehiculoFallback.anio,
                vin: vehiculoFallback.vin,
                condicion: vehiculoFallback.condicion,
                color: vehiculoFallback.color,
                transmision: vehiculoFallback.transmision,
                placas: vehiculoFallback.placas,
                tiene_tarjeta_circulacion: vehiculoFallback.tiene_tarjeta_circulacion,
                tiene_verificacion: vehiculoFallback.tiene_verificacion,
                tiene_placas: vehiculoFallback.tiene_placas,
                puede_circular_rodando: vehiculoFallback.puede_circular_rodando
              } satisfies VehiculoTraslado
            : null
        ),
    conductorId
      ? exigirUno(
          cliente
            .from("conductores_publicos")
            .select("id, estado, nivel_operativo_vigente, calificacion_promedio")
            .eq("id", conductorId)
            .maybeSingle(),
          trasladoId,
          "conductor_traslado"
        )
      : Promise.resolve(
          conductorFallback
            ? {
                id: conductorFallback.id,
                nombre: conductorFallback.nombre,
                estado: conductorFallback.estado,
                nivel_operativo_vigente: conductorFallback.nivel_operativo_vigente,
                calificacion_promedio: conductorFallback.calificacion_promedio,
                traslados_completados: conductorFallback.traslados_completados,
                foto_perfil_url: conductorFallback.foto_perfil_url
              } satisfies ConductorTraslado
            : null
        ),
    exigirVarios(
      cliente
        .from("evidencia_fotos")
        .select("id, traslado_id, tipo, angulo, url, sincronizada, capturada_en, lat, lng, local_path, conflicto")
        .eq("traslado_id", trasladoId)
        .order("capturada_en", { ascending: true }),
      trasladoId,
      "fotos_evidencia"
    ),
    exigirVarios(
      cliente
        .from("incidencias")
        .select("id, traslado_id, tipo, momento, reportada_por, descripcion, resuelta, creada_en, resuelta_en, severidad, estado, responsable_admin_id, asignada_en, nivel_escalamiento, escalada_en, sla_horas, sla_vence_en")
        .eq("traslado_id", trasladoId)
        .order("creada_en", { ascending: false }),
      trasladoId,
      "incidencias"
    ),
    exigirVarios(
      cliente
        .from("disputas")
        .select("id, traslado_id, abierta_por, tipo, estado, resolucion, abierta_en, resuelta_en, escalada_en, descripcion, resolucion_detalle")
        .eq("traslado_id", trasladoId)
        .order("abierta_en", { ascending: false }),
      trasladoId,
      "disputas"
    ),
    exigirVarios(
      cliente
        .from("reclamos_seguro")
        .select("id, traslado_id, estado, abierto_en, resuelto_en")
        .eq("traslado_id", trasladoId)
        .order("abierto_en", { ascending: false }),
      trasladoId,
      "reclamos_seguro"
    ),
    exigirUno(
      cliente
        .from("calificaciones_traslado")
        .select("traslado_id, conductor_id, estrellas, comentario, calificado_en")
        .eq("traslado_id", trasladoId)
        .maybeSingle(),
      trasladoId,
      "calificacion"
    ),
    exigirVarios(
      cliente
        .from("pagos")
        .select("id, traslado_id, monto, momento, estado, metodo, registrado_en, stripe_payment_intent_id, stripe_event_id, comision_mxn, checkout_masivo_id")
        .eq("traslado_id", trasladoId)
        .order("registrado_en", { ascending: false }),
      trasladoId,
      "pagos"
    )
  ]);

  // La ubicación es degradable: sin ella la página sigue siendo útil (el mapa
  // muestra "aún no disponible"). No debe tumbar el pasaporte.
  let ultimaUbicacion: UbicacionPasaporte | null = null;
  try {
    ultimaUbicacion = await exigirUno(
      (cliente as unknown as SupabaseClient)
        .from("ubicaciones_traslado")
        .select("id, traslado_id, conductor_id, lat, lng, precision_m, velocidad_mps, registrado_en")
        .eq("traslado_id", trasladoId)
        .order("registrado_en", { ascending: false })
        .limit(1)
        .maybeSingle(),
      trasladoId,
      "ultima_ubicacion"
    );
  } catch {
    ultimaUbicacion = null;
  }

  // El monto pagado se deriva de los pagos completados, no del caché de la
  // vista: si la vista va rezagada, el recibo mostraría $0 con pago real.
  const totalPagado = pagos
    .filter((pago) => pago.estado === "completado")
    .reduce((suma, pago) => suma + (pago.monto ?? 0), 0);
  const pasaporteFinal =
    (!pasaporte.monto_pagado || pasaporte.monto_pagado === 0) && totalPagado > 0
      ? { ...pasaporte, monto_pagado: totalPagado }
      : pasaporte;

  return {
    pasaporte: pasaporteFinal,
    traslado,
    vehiculo,
    conductor,
    fotosEvidencia,
    incidencias,
    disputas,
    reclamosSeguro,
    calificacion,
    pagos,
    ultimaUbicacion
  };
}

/**
 * Reconstruye la fila del pasaporte cuando la vista aún no la proyecta
 * (traslado recién creado). Solo usa columnas ya visibles por RLS.
 */
function construirPasaporteDesdeRelacion(rel: TrasladoConRelaciones): PasaporteRow {
  const t = rel.traslado as unknown as Record<string, unknown>;
  const v = rel.vehiculo;
  const c = rel.conductor;
  return {
    traslado_id: t["id"] as string,
    usuario_id: t["usuario_id"] as string,
    vehiculo_id: (t["vehiculo_id"] as string) ?? null,
    conductor_id: (t["conductor_id"] as string) ?? null,
    estado: t["estado"] as PasaporteRow["estado"],
    tiene_incidencia_abierta: (t["tiene_incidencia_abierta"] as boolean) ?? false,
    tipo_pago: (t["tipo_pago"] as PasaporteRow["tipo_pago"]) ?? null,
    causa_fallido: (t["causa_fallido"] as PasaporteRow["causa_fallido"]) ?? null,
    precio_cotizado: (t["precio_cotizado"] as number) ?? null,
    precio_final: (t["precio_final"] as number) ?? null,
    creado_en: t["creado_en"] as string,
    actualizado_en: t["actualizado_en"] as string,
    vehiculo_tipo: v?.tipo ?? null,
    vehiculo_marca: v?.marca ?? null,
    vehiculo_modelo: v?.modelo ?? null,
    vehiculo_anio: v?.anio ?? null,
    conductor_nombre: c?.nombre ?? null,
    conductor_estado: c?.estado ?? null,
    conductor_nivel: c?.nivel_operativo_vigente ?? null,
    conductor_calificacion: c?.calificacion_promedio ?? null,
    evidencia_inicial_fotos_sincronizadas: 0,
    evidencia_final_fotos_sincronizadas: 0,
    incidencias_abiertas: 0,
    monto_pagado: 0,
    origen_lat: (t["origen_lat"] as number) ?? null,
    origen_lng: (t["origen_lng"] as number) ?? null,
    destino_lat: (t["destino_lat"] as number) ?? null,
    destino_lng: (t["destino_lng"] as number) ?? null,
    distancia_km: (t["distancia_km"] as number) ?? null,
    tiempo_estimado_horas: (t["tiempo_estimado_horas"] as number) ?? null,
    vehiculo_categoria_tarifa: v?.categoria_tarifa ?? null,
    vehiculo_gama: v?.gama ?? null,
    vehiculo_condicion: v?.condicion ?? null,
    origen_direccion: (t["origen_direccion"] as string) ?? null,
    origen_ciudad: (t["origen_ciudad"] as string) ?? null,
    origen_referencias: (t["origen_referencias"] as string) ?? null,
    destino_direccion: (t["destino_direccion"] as string) ?? null,
    destino_ciudad: (t["destino_ciudad"] as string) ?? null,
    destino_referencias: (t["destino_referencias"] as string) ?? null,
    contacto_entrega_nombre: (t["contacto_entrega_nombre"] as string) ?? null,
    contacto_entrega_telefono: (t["contacto_entrega_telefono"] as string) ?? null,
    contacto_recepcion_nombre: (t["contacto_recepcion_nombre"] as string) ?? null,
    contacto_recepcion_telefono: (t["contacto_recepcion_telefono"] as string) ?? null,
    vehiculo_color: v?.color ?? null,
    vehiculo_placas: v?.placas ?? null,
    vehiculo_vin: v?.vin ?? null,
    ganancia_conductor: null
  } as PasaporteRow;
}
