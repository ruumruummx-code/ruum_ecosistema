import { firmarUrlsEvidencia, obtenerPasaporteDigital, obtenerUltimaUbicacionTraslado } from "@ruum/api/services";
import type { UbicacionTraslado } from "@ruum/api/services";
import {
  listarDisputasTraslado,
  listarFotosEvidencia,
  listarIncidenciasTraslado,
  listarPagosTraslado,
  listarReclamosTraslado,
  obtenerCalificacionTraslado,
  obtenerConductorTraslado,
  obtenerResumenTraslado,
  obtenerTrasladoConRelaciones,
  obtenerVehiculoTraslado
} from "@ruum/api/transfers";
import type { Database } from "@ruum/shared/types";
import type {
  Calificacion,
  Disputa,
  EstadoTraslado,
  FotoEvidencia,
  FotoEvidenciaVisual,
  Incidencia,
  Pago,
  Pasaporte,
  ReclamoSeguroUsuario,
} from "./tipos-pasaporte";

/** Objeto vacío de 13 campos: antes triplicado en cada salida temprana de
 * `obtenerDatos` (sin env, sin pasaporte, catch). Una sola fábrica. */
export function datosVaciosTraslado() {
  return {
    pasaporte: null,
    traslado: null,
    vehiculo: null,
    conductor: null,
    evidencia: [] as FotoEvidenciaVisual[],
    incidencias: [] as Incidencia[],
    disputas: [] as Disputa[],
    reclamosSeguro: [] as ReclamoSeguroUsuario[],
    calificacion: null as Calificacion | null,
    pagos: [] as Pago[],
    ultimaUbicacion: null as UbicacionTraslado | null,
  };
}

export type DatosTraslado = Awaited<ReturnType<typeof obtenerDatos>>;

export async function obtenerDatos(id: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return datosVaciosTraslado();
  }

  try {
    const { crearClienteServidor } = await import("@/lib/supabase-server");
    const cliente = await crearClienteServidor();

    // 1. Intentar obtener el pasaporte digital desde la vista oficial
    let pasaporte: Pasaporte | null = null;
    try {
      pasaporte = await obtenerPasaporteDigital(cliente, id);
    } catch (err) {
      console.warn("[obtenerDatos] Error en obtenerPasaporteDigital, probando fallback directo:", err);
    }

    // 2. Fallback resiliente: consultar tabla traslados directamente si la vista no devuelve datos
    if (!pasaporte) {
      let tRow: Record<string, unknown> | null = null;
      try {
        const rel = await obtenerTrasladoConRelaciones(cliente, id);
        tRow = rel.traslado
          ? ({ ...rel.traslado, vehiculos: rel.vehiculo, conductores: rel.conductor } as unknown as Record<string, unknown>)
          : null;
      } catch {
        tRow = null;
      }

      if (tRow) {
        const v = tRow.vehiculos as any;
        const c = tRow.conductores as any;
        pasaporte = {
          traslado_id: tRow.id as string,
          usuario_id: tRow.usuario_id as string,
          vehiculo_id: (tRow.vehiculo_id as string) ?? null,
          conductor_id: (tRow.conductor_id as string) ?? null,
          estado: tRow.estado as EstadoTraslado,
          tiene_incidencia_abierta: (tRow.tiene_incidencia_abierta as boolean) ?? false,
          tipo_pago: (tRow.tipo_pago as Database["public"]["Enums"]["tipo_pago"]) ?? null,
          causa_fallido: (tRow.causa_fallido as Database["public"]["Enums"]["causa_fallido"]) ?? null,
          precio_cotizado: (tRow.precio_cotizado as number) ?? null,
          precio_final: (tRow.precio_final as number) ?? null,
          creado_en: tRow.creado_en as string,
          actualizado_en: tRow.actualizado_en as string,
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
          origen_lat: (tRow.origen_lat as number) ?? null,
          origen_lng: (tRow.origen_lng as number) ?? null,
          destino_lat: (tRow.destino_lat as number) ?? null,
          destino_lng: (tRow.destino_lng as number) ?? null,
          distancia_km: (tRow.distancia_km as number) ?? null,
          tiempo_estimado_horas: (tRow.tiempo_estimado_horas as number) ?? null,
          vehiculo_categoria_tarifa: v?.categoria_tarifa ?? null,
          vehiculo_gama: v?.gama ?? null,
          vehiculo_condicion: v?.condicion ?? null,
          origen_direccion: (tRow.origen_direccion as string) ?? null,
          origen_ciudad: (tRow.origen_ciudad as string) ?? null,
          origen_referencias: (tRow.origen_referencias as string) ?? null,
          destino_direccion: (tRow.destino_direccion as string) ?? null,
          destino_ciudad: (tRow.destino_ciudad as string) ?? null,
          destino_referencias: (tRow.destino_referencias as string) ?? null,
          contacto_entrega_nombre: (tRow.contacto_entrega_nombre as string) ?? null,
          contacto_entrega_telefono: (tRow.contacto_entrega_telefono as string) ?? null,
          contacto_recepcion_nombre: (tRow.contacto_recepcion_nombre as string) ?? null,
          contacto_recepcion_telefono: (tRow.contacto_recepcion_telefono as string) ?? null,
          vehiculo_color: v?.color ?? null,
          vehiculo_placas: v?.placas ?? null,
          vehiculo_vin: v?.vin ?? null,
          ganancia_conductor: null
        };
      }
    }

    if (!pasaporte) {
      return datosVaciosTraslado();
    }

    const vehiculoId = pasaporte.vehiculo_id;
    const conductorId = pasaporte.conductor_id;

    const [
      trasladoRes,
      vehiculoRes,
      conductorRes,
      fotosEvidencia,
      incidencias,
      disputas,
      reclamosSeguro,
      calificacion,
      pagos,
      ultimaUbicacion
    ] = await Promise.all([
      obtenerResumenTraslado(cliente, id).then((data) => ({ data })),
      obtenerVehiculoTraslado(cliente, vehiculoId).then((data) => ({ data })),
      obtenerConductorTraslado(cliente, conductorId).then((data) => ({ data })),
      listarFotosEvidencia(cliente, id).then((data) => ({ data })),
      listarIncidenciasTraslado(cliente, id).then((data) => ({ data })),
      listarDisputasTraslado(cliente, id).then((data) => ({ data })),
      listarReclamosTraslado(cliente, id).then((data) => ({ data })),
      obtenerCalificacionTraslado(cliente, id).then((data) => ({ data })),
      listarPagosTraslado(cliente, id).then((data) => ({ data })),
      obtenerUltimaUbicacionTraslado(cliente, id).catch(() => null)
    ]);

    let evidenciaFirmada: FotoEvidenciaVisual[] = [];
    try {
      const fotos = (fotosEvidencia?.data ?? []) as FotoEvidencia[];
      evidenciaFirmada = await firmarUrlsEvidencia(cliente, fotos);
    } catch {
      evidenciaFirmada = (((fotosEvidencia?.data ?? []) as FotoEvidencia[]) || []).map((f) => ({
        ...f,
        url_visual: null
      }));
    }

    return {
      pasaporte,
      traslado: trasladoRes?.data ?? null,
      vehiculo: vehiculoRes?.data ?? null,
      conductor: conductorRes?.data ?? null,
      evidencia: evidenciaFirmada,
      incidencias: (incidencias?.data ?? []) as Incidencia[],
      disputas: (disputas?.data ?? []) as Disputa[],
      reclamosSeguro: (reclamosSeguro?.data ?? []) as ReclamoSeguroUsuario[],
      calificacion: calificacion?.data ?? null,
      pagos: (pagos?.data ?? []) as Pago[],
      ultimaUbicacion: ultimaUbicacion ?? null
    };
  } catch (error) {
    console.error("[obtenerDatos]", error);
    return datosVaciosTraslado();
  }
}
