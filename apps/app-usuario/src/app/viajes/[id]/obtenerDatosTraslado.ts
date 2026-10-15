import { firmarUrlsEvidencia } from "@ruum/api/services";
import type { UbicacionTraslado } from "@ruum/api/services";
import { obtenerPasaporteCompleto } from "@ruum/api/transfers";
import type {
  Calificacion,
  Disputa,
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

/**
 * FIX C2 (ticket arquitectura Fase 4): la orquestación de las 10 lecturas vive
 * en `obtenerPasaporteCompleto` (@ruum/api/transfers). Este loader solo
 * resuelve el cliente, delega y firma URLs de evidencia.
 *
 * Semántica de errores (FIX C3): `obtenerPasaporteCompleto` devuelve `null`
 * solo ante ausencia de fila (RLS/inexistente → TrasladoNoEncontrado) y lanza
 * `PasaporteError` ante fallos de red o permiso → NO se captura aquí: sube al
 * `error.tsx` boundary, que lo reporta a Sentry.
 */
export async function obtenerDatos(id: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return datosVaciosTraslado();
  }

  const { crearClienteServidor } = await import("@/lib/supabase-server");
  const cliente = await crearClienteServidor();

  const completo = await obtenerPasaporteCompleto(cliente, id);
  if (!completo) {
    return datosVaciosTraslado();
  }

  let evidenciaFirmada: FotoEvidenciaVisual[] = [];
  try {
    const fotos = completo.fotosEvidencia as FotoEvidencia[];
    evidenciaFirmada = await firmarUrlsEvidencia(cliente, fotos);
  } catch {
    evidenciaFirmada = ((completo.fotosEvidencia as FotoEvidencia[]) || []).map((f) => ({
      ...f,
      url_visual: null
    }));
  }

  return {
    pasaporte: completo.pasaporte as Pasaporte,
    traslado: completo.traslado,
    vehiculo: completo.vehiculo,
    conductor: completo.conductor,
    evidencia: evidenciaFirmada,
    incidencias: completo.incidencias as Incidencia[],
    disputas: completo.disputas as Disputa[],
    reclamosSeguro: completo.reclamosSeguro as ReclamoSeguroUsuario[],
    calificacion: completo.calificacion as Calificacion | null,
    pagos: completo.pagos as Pago[],
    ultimaUbicacion: completo.ultimaUbicacion as UbicacionTraslado | null
  };
}
