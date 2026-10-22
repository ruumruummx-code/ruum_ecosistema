import {
  eliminarJsonLocalSeguro,
  guardarJsonLocalSeguro,
  leerJsonLocalSeguro
} from "./almacenamiento-seguro-local";
import { recordOperationalEvent } from "./observability";

export interface EvidenciaDescartada {
  localId: string;
  trasladoId: string;
  razon: "ttl_expirado" | "max_reintentos" | string;
  fecha: string;
  angulo?: string;
  tipo?: string;
}

export const CLAVE_EVIDENCIAS_DESCARTADAS = "ruum_evidencias_descartadas";

/**
 * Lee la lista de evidencias descartadas desde almacenamiento seguro local.
 */
export async function leerEvidenciasDescartadas(): Promise<EvidenciaDescartada[]> {
  try {
    const data = await leerJsonLocalSeguro<EvidenciaDescartada[]>(CLAVE_EVIDENCIAS_DESCARTADAS);
    if (Array.isArray(data)) return data;
    return [];
  } catch {
    return [];
  }
}

/**
 * Registra una evidencia descartada de forma persistente e informa a observabilidad/soporte.
 */
export async function registrarEvidenciaDescartada(item: EvidenciaDescartada): Promise<void> {
  try {
    const actuales = await leerEvidenciasDescartadas();
    const yaExiste = actuales.some((e) => e.localId === item.localId);
    if (!yaExiste) {
      actuales.push(item);
      await guardarJsonLocalSeguro(CLAVE_EVIDENCIAS_DESCARTADAS, actuales);
    }

    // Notificación operativa a soporte / observabilidad
    void recordOperationalEvent(
      "evidence_discarded",
      {
        localId: item.localId,
        trasladoId: item.trasladoId,
        razon: item.razon,
        angulo: item.angulo,
        tipo: item.tipo,
        fecha: item.fecha
      },
      "error"
    );
  } catch {
    // Almacenamiento no debe interrumpir el flujo principal
  }
}

/**
 * Obtiene las evidencias descartadas correspondientes a un traslado específico.
 */
export async function obtenerEvidenciasDescartadasPorTraslado(
  trasladoId: string
): Promise<EvidenciaDescartada[]> {
  const todas = await leerEvidenciasDescartadas();
  return todas.filter((e) => e.trasladoId === trasladoId);
}

/**
 * Resuelve/descarta el aviso de una evidencia específica tras confirmación.
 */
export async function resolverEvidenciaDescartada(localId: string): Promise<void> {
  try {
    const actuales = await leerEvidenciasDescartadas();
    const filtradas = actuales.filter((e) => e.localId !== localId);
    await guardarJsonLocalSeguro(CLAVE_EVIDENCIAS_DESCARTADAS, filtradas);
  } catch {
    // ignorar fallo de almacenamiento
  }
}

/**
 * Limpia todas las evidencias descartadas registradas.
 */
export async function limpiarTodasEvidenciasDescartadas(): Promise<void> {
  try {
    await eliminarJsonLocalSeguro(CLAVE_EVIDENCIAS_DESCARTADAS);
  } catch {
    // ignorar fallo de almacenamiento
  }
}
