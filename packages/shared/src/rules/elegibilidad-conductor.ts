import type { Conductor, NivelCONCER } from "../types/conductor";
import type { TipoVehiculo } from "../types/vehiculo";
import {
  NIVELES_CONCER,
  REQUISITOS_NIVEL_CONCER,
  type TipoRuta,
  type RequisitosNivel
} from "../constants/niveles-concer";
import { nivelPorCalificacion } from "./calificacion-nivel";

export type { TipoRuta };

/**
 * PRD §4.3 — Matriz de elegibilidad de conductores.
 * Devuelve el nivel más alto cuyos requisitos de experiencia/certificación
 * cumple el conductor (traslados completados, certificaciones vigentes y
 * ausencia de incidencias graves en la ventana correspondiente).
 *
 * @deprecated Métrica histórica. Desde 2026-10-29 no limita el nivel operativo;
 * el nivel se determina únicamente por las calificaciones de los usuarios.
 */
export function nivelPorExperienciaYCertificacion(
  conductor: Conductor,
  requisitos: Record<NivelCONCER, RequisitosNivel> = REQUISITOS_NIVEL_CONCER
): NivelCONCER {
  let nivelAlcanzado: NivelCONCER = "basico";

  for (const nivel of NIVELES_CONCER) {
    const req = requisitos[nivel];

    const cumpleTraslados = conductor.traslados_completados >= req.traslados_completados_min;
    const cumpleCalificacion = conductor.calificacion_promedio >= req.calificacion_min;
    const cumpleCertificaciones = req.certificaciones_requeridas.every((tipo) =>
      conductor.certificaciones.some((c) => c.tipo === tipo && c.vigente)
    );

    const incidenciasEnVentana =
      req.ventana_meses_sin_incidencias_graves <= 6
        ? conductor.incidencias_graves_6m
        : conductor.incidencias_graves_12m;
    const sinIncidenciasGraves =
      req.ventana_meses_sin_incidencias_graves === 0 || incidenciasEnVentana === 0;

    if (cumpleTraslados && cumpleCalificacion && cumpleCertificaciones && sinIncidenciasGraves) {
      nivelAlcanzado = nivel;
    } else {
      // La matriz es acumulativa (cada nivel exige lo del anterior + más),
      // así que en cuanto un nivel falla, los superiores también fallan.
      break;
    }
  }

  return nivelAlcanzado;
}

/**
 * Política 2026-10-29: todos ingresan con 5.0 y nivel máximo (Concer 4).
 * Las calificaciones reales de usuarios mantienen o reducen el nivel.
 * Experiencia y certificaciones históricas no limitan este cálculo.
 * Devuelve null si la calificación está por debajo de 4.0 (pierde elegibilidad).
 */
export function nivelOperativoVigente(
  conductor: Conductor,
  _requisitos: Record<NivelCONCER, RequisitosNivel> = REQUISITOS_NIVEL_CONCER
): NivelCONCER | null {
  return nivelPorCalificacion(conductor.calificacion_promedio);
}

export function vehiculosPermitidos(
  nivel: NivelCONCER,
  requisitos: Record<NivelCONCER, RequisitosNivel> = REQUISITOS_NIVEL_CONCER
): TipoVehiculo[] {
  return requisitos[nivel].vehiculos_permitidos;
}

export function rutasPermitidas(
  nivel: NivelCONCER,
  requisitos: Record<NivelCONCER, RequisitosNivel> = REQUISITOS_NIVEL_CONCER
): TipoRuta[] {
  return requisitos[nivel].rutas_permitidas;
}

export interface ResultadoElegibilidad {
  elegible: boolean;
  motivo?: string;
}

/**
 * PRD §4.3 — "El conductor puede ver Traslados disponibles solo si cumple
 * criterios de elegibilidad." Función principal que decide si un viaje debe
 * mostrarse a un conductor dado su estado, documentos, nivel operativo
 * vigente, tipo de vehículo del traslado y tipo de ruta.
 */
export function esElegibleParaViaje(
  conductor: Conductor,
  tipoVehiculo: TipoVehiculo,
  tipoRuta: TipoRuta,
  requisitos: Record<NivelCONCER, RequisitosNivel> = REQUISITOS_NIVEL_CONCER
): ResultadoElegibilidad {
  if (conductor.estado !== "activo" && conductor.estado !== "modo_prueba_supervisada") {
    return { elegible: false, motivo: `Conductor en estado: ${conductor.estado}` };
  }

  if (!conductor.documentos_vigentes) {
    return { elegible: false, motivo: "Documentos vencidos o incompletos" };
  }

  // Modelo 11.3 (MAIC) — filtro obligatorio: sin identidad y licencia
  // validadas y vigentes ningún conductor es asignable, aunque el resto pase.
  const extendido = conductor as Conductor & {
    identidad_validada?: boolean;
    licencia_validada?: boolean;
    licencia_vigente?: boolean;
  };
  if (
    extendido.identidad_validada === false ||
    extendido.licencia_validada === false ||
    extendido.licencia_vigente === false
  ) {
    return { elegible: false, motivo: "MAIC: identidad o licencia sin validar/vigente" };
  }

  if (conductor.suspensiones_activas > 0) {
    return { elegible: false, motivo: "Suspensión activa" };
  }

  // Las incidencias bloquean la operación; no cambian el nivel por calificación.
  const nivelRequerido = tipoVehiculo === "coleccion" ? 4
    : tipoVehiculo === "luxury" || tipoRuta === "interurbana_mas_100km" ? 3
    : tipoVehiculo === "pick_up" || tipoVehiculo === "van" || tipoRuta === "interurbana_menos_100km" ? 2 : 1;
  if ((nivelRequerido >= 2 && conductor.incidencias_graves_6m > 0)
    || (nivelRequerido >= 3 && conductor.incidencias_graves_12m > 0)) {
    return { elegible: false, motivo: "Incidencias graves en la ventana operativa" };
  }

  const nivel = nivelOperativoVigente(conductor, requisitos);
  if (!nivel) {
    return {
      elegible: false,
      motivo: `Calificación ${conductor.calificacion_promedio} por debajo del mínimo (4.0)`
    };
  }

  if (!vehiculosPermitidos(nivel, requisitos).includes(tipoVehiculo)) {
    return { elegible: false, motivo: `Nivel ${nivel} no autorizado para vehículo ${tipoVehiculo}` };
  }

  if (!rutasPermitidas(nivel, requisitos).includes(tipoRuta)) {
    return { elegible: false, motivo: `Nivel ${nivel} no autorizado para ruta ${tipoRuta}` };
  }

  return { elegible: true };
}
