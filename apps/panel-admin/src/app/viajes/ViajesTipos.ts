import type { Dispatch, SetStateAction } from "react";
import type { Database } from "@ruum/shared/types";
import type { AdminDataTableSortState } from "../AdminDataTable";

export type PasaporteRow = Database["public"]["Views"]["pasaporte_digital"]["Row"];
export type EstadoTraslado = Database["public"]["Enums"]["estado_traslado"];
export type FiltroKpi = "activos" | "inician_60" | "sin_asignacion" | "incidencia" | "finalizados_hoy";
export type AccionOperativa = "asignar_conductor" | "registrar_incidencia";
export type EstadoConexionVista = "datos_en_vivo" | "actualizando" | "reconectando" | "sin_conexion" | "desactualizado";
export type FiltroSla = "todos" | "en_riesgo" | "vencido";
export type FiltroFecha = "todos" | "hoy" | "7d" | "30d";
export type PrioridadOperativa = "baja" | "media" | "alta" | "critica";
export type AlcanceVistaGuardada = "privada" | "compartida";
export type ModoVistaOperativa = "lista" | "kanban" | "mapa";

export type AccionMasivaId =
  | "asignar_responsable"
  | "cambiar_prioridad"
  | "escalar"
  | "exportar"
  | "etiquetar"
  | "descargar_evidencia"
  | "actualizar_estado";

export type EstadoAccionMasiva = "pendiente" | "exitoso" | "parcial" | "bloqueado";

export type PasaporteOperativo = PasaporteRow & {
  actualizado_en?: string | null;
  empresa_nombre?: string | null;
  fecha_hora_programada?: string | null;
  modalidad_programacion?: string | null;
};

export type FiltrosAvanzados = {
  estado: EstadoTraslado | "todos";
  sla: FiltroSla;
  fecha: FiltroFecha;
  empresa: string;
  conductor: string;
  vehiculo: string;
  origen: string;
  destino: string;
  incidencia: boolean;
  sinAsignacion: boolean;
  sinCoordenadas: boolean;
  proximos: boolean;
};

export type AccionMasivaConfig = {
  id: AccionMasivaId;
  etiqueta: string;
  descripcion: string;
  requiereConfirmacion?: boolean;
  destructiva?: boolean;
};

export type ResultadoAccionMasiva = {
  trasladoId: string;
  folio: string;
  estado: "aplicado" | "omitido" | "bloqueado";
  detalle: string;
};

export type AuditoriaOperacionMasiva = {
  id: string;
  accion: string;
  afectados: number;
  exitosos: number;
  omitidos: number;
  bloqueados: number;
  timestamp: string;
  detalle: string;
  folios: string[];
};

export type VistaGuardada = {
  id: string;
  nombre: string;
  alcance: AlcanceVistaGuardada;
  filtros: FiltrosAvanzados;
  busqueda: string;
  columnas: string[];
  orden: AdminDataTableSortState;
  esPredeterminada: boolean;
};

export const PESTANAS: { id: string; etiqueta: string; filtro: EstadoTraslado | "todos" }[] = [
  { id: "todos", etiqueta: "Todos", filtro: "todos" },
  { id: "pendientes", etiqueta: "Pendientes", filtro: "pendiente_de_conductor" },
  { id: "en_curso", etiqueta: "En curso", filtro: "traslado_en_curso" },
  { id: "finalizados", etiqueta: "Finalizados", filtro: "servicio_cerrado" },
  { id: "cancelados", etiqueta: "Cancelados", filtro: "servicio_cancelado" }
];

export const ESTADOS_TERMINALES: EstadoTraslado[] = ["servicio_cerrado", "servicio_cancelado", "traslado_fallido"];

export const ETIQUETA_FILTRO_KPI: Record<FiltroKpi, string> = {
  activos: "Traslados activos",
  inician_60: "Inician en 60 minutos",
  sin_asignacion: "Sin asignación",
  incidencia: "Con incidencia",
  finalizados_hoy: "Finalizados hoy"
};

export const ETIQUETA_ACCION_OPERATIVA: Record<AccionOperativa, string> = {
  asignar_conductor: "Asignar conductor",
  registrar_incidencia: "Registrar incidencia"
};

export const FILTROS_INICIALES: FiltrosAvanzados = {
  estado: "todos",
  sla: "todos",
  fecha: "todos",
  empresa: "",
  conductor: "",
  vehiculo: "",
  origen: "",
  destino: "",
  incidencia: false,
  sinAsignacion: false,
  sinCoordenadas: false,
  proximos: false
};

export const CLASE_CONTROL_FILTRO =
  "w-full rounded-lg border border-ui-line bg-ui-muted px-3 py-2 font-body text-sm text-ui-fg placeholder:text-ui-fg-muted transition-colors focus:border-ui-focus focus:outline-none focus:ring-2 focus:ring-ui-ring";

export const COLUMNAS_OPERATIVAS_INICIALES = [
  "folio",
  "inicio_programado",
  "ruta",
  "vehiculo",
  "conductor",
  "sla",
  "estatus",
  "incidencia",
  "ultima_actualizacion",
  "responsable"
];

export const ACCIONES_MASIVAS: AccionMasivaConfig[] = [
  {
    id: "asignar_responsable",
    etiqueta: "Asignar responsable",
    descripcion: "Define responsable operativo para los registros seleccionados."
  },
  {
    id: "cambiar_prioridad",
    etiqueta: "Cambiar prioridad",
    descripcion: "Marca prioridad operativa para ordenar atención interna."
  },
  {
    id: "escalar",
    etiqueta: "Escalar",
    descripcion: "Escala los traslados seleccionados a supervisión.",
    requiereConfirmacion: true
  },
  {
    id: "exportar",
    etiqueta: "Exportar",
    descripcion: "Descarga la selección en CSV."
  },
  {
    id: "etiquetar",
    etiqueta: "Etiquetar",
    descripcion: "Añade una etiqueta operativa a la selección."
  },
  {
    id: "descargar_evidencia",
    etiqueta: "Descargar evidencia",
    descripcion: "Descarga un manifiesto JSON de evidencia disponible."
  },
  {
    id: "actualizar_estado",
    etiqueta: "Actualizar estado",
    descripcion: "Prepara actualización solo para estados operativamente seguros.",
    requiereConfirmacion: true,
    destructiva: true
  }
];

export const VISTAS_PREDEFINIDAS: Array<
  Omit<VistaGuardada, "id" | "alcance" | "columnas" | "orden" | "esPredeterminada"> & { id: string }
> = [
  { id: "riesgo", nombre: "En riesgo", filtros: { ...FILTROS_INICIALES, sla: "en_riesgo" }, busqueda: "" },
  { id: "sin_conductor", nombre: "Sin conductor", filtros: { ...FILTROS_INICIALES, sinAsignacion: true }, busqueda: "" },
  { id: "inician_60", nombre: "Inician en 60 minutos", filtros: { ...FILTROS_INICIALES, proximos: true }, busqueda: "" },
  { id: "incidencia", nombre: "Con incidencia", filtros: { ...FILTROS_INICIALES, incidencia: true }, busqueda: "" },
  { id: "sin_ubicacion", nombre: "Sin ubicación", filtros: { ...FILTROS_INICIALES, sinCoordenadas: true }, busqueda: "" },
  { id: "mis_asignados", nombre: "Mis traslados asignados", filtros: { ...FILTROS_INICIALES }, busqueda: "Torre de control" }
];

export const PREF_VISTAS_GUARDADAS = "Traslados.vistas_guardadas";

export function esFiltroKpi(valor: string | null): valor is FiltroKpi {
  return (
    valor === "activos" ||
    valor === "inician_60" ||
    valor === "sin_asignacion" ||
    valor === "incidencia" ||
    valor === "finalizados_hoy"
  );
}

export function esAccionOperativa(valor: string | null): valor is AccionOperativa {
  return valor === "asignar_conductor" || valor === "registrar_incidencia";
}

export function esEstadoTraslado(valor: string | null): valor is EstadoTraslado {
  return Boolean(valor && PESTANAS.some((item) => item.filtro === valor));
}

export function esFiltroSla(valor: string | null): valor is FiltroSla {
  return valor === "todos" || valor === "en_riesgo" || valor === "vencido";
}

export function esFiltroFecha(valor: string | null): valor is FiltroFecha {
  return valor === "todos" || valor === "hoy" || valor === "7d" || valor === "30d";
}

export function actualizarEstadoFiltro(
  siguiente: EstadoTraslado | "todos",
  setFiltros: Dispatch<SetStateAction<FiltrosAvanzados>>,
  setPestana: Dispatch<SetStateAction<string>>
) {
  setFiltros((actual) => ({ ...actual, estado: siguiente }));
  const encontrada = PESTANAS.find((item) => item.filtro === siguiente);
  setPestana(encontrada?.id ?? "todos");
}

export function horasDesdeIso(fechaIso: string | null | undefined) {
  if (!fechaIso) return null;
  return (Date.now() - new Date(fechaIso).getTime()) / (1000 * 60 * 60);
}

export function coincideSla(v: PasaporteRow, filtro: FiltroSla) {
  if (filtro === "todos") return true;
  const horas = horasDesdeIso(v.creado_en);
  if (horas === null) return false;
  if (filtro === "en_riesgo") return horas >= 2 && horas < 4;
  return horas >= 4;
}

export function coincideFecha(fechaIso: string | null, filtro: FiltroFecha) {
  if (filtro === "todos" || !fechaIso) return true;
  const fecha = new Date(fechaIso);
  const ahora = new Date();
  if (filtro === "hoy") {
    return (
      fecha.getDate() === ahora.getDate() &&
      fecha.getMonth() === ahora.getMonth() &&
      fecha.getFullYear() === ahora.getFullYear()
    );
  }
  const diffDias = (ahora.getTime() - fecha.getTime()) / (1000 * 60 * 60 * 24);
  if (filtro === "7d") return diffDias <= 7;
  if (filtro === "30d") return diffDias <= 30;
  return true;
}

export function sinCoordenadas(v: PasaporteRow) {
  return v.origen_lat == null || v.origen_lng == null || v.destino_lat == null || v.destino_lng == null;
}

export function iniciaEn60Min(fechaIso: string | null | undefined) {
  if (!fechaIso) return false;
  const fecha = new Date(fechaIso).getTime();
  const ahora = Date.now();
  return fecha >= ahora && fecha <= ahora + 60 * 60 * 1000;
}

export function obtenerInicioProgramado(v: PasaporteRow) {
  const extendido = v as PasaporteRow & { fecha_hora_programada?: string | null };
  return extendido.fecha_hora_programada ?? v.creado_en;
}

export function obtenerUltimaActualizacion(v: PasaporteRow) {
  const extendido = v as PasaporteRow & { actualizado_en?: string | null };
  return extendido.actualizado_en ?? v.creado_en;
}

export function textoRuta(v: PasaporteRow) {
  return `${v.origen_ciudad ?? "Origen"} → ${v.destino_ciudad ?? "Destino"}`;
}

export function formatoFechaAbsoluta(fechaIso: string | null | undefined) {
  if (!fechaIso) return "Sin fecha";
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(fechaIso));
}

export function textoRelativo(fechaIso: string | null | undefined) {
  if (!fechaIso) return "Sin actividad";
  const diff = Date.now() - new Date(fechaIso).getTime();
  const minutos = Math.max(0, Math.floor(diff / 60000));
  if (minutos < 1) return "hace unos segundos";
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  return `hace ${dias} d`;
}

export function estadoSla(v: PasaporteRow) {
  const horas = horasDesdeIso(obtenerUltimaActualizacion(v));
  const vencido = coincideSla(v, "vencido");
  const riesgo = coincideSla(v, "en_riesgo");
  if (vencido) {
    return {
      etiqueta: "Vencido",
      detalle: horas && horas >= 1 ? `${Math.round(horas)} h sin resolver` : "Atención inmediata",
      prioridad: 3,
      clases: "border-ui-danger/35 bg-ui-danger-soft text-ui-danger",
      icono: "!"
    };
  }
  if (riesgo) {
    return {
      etiqueta: "En riesgo",
      detalle: iniciaEn60Min(obtenerInicioProgramado(v)) ? "Inicia en 60 min" : "Revisar operación",
      prioridad: 2,
      clases: "border-ui-warning/35 bg-ui-warning-soft text-ui-warning",
      icono: "!"
    };
  }
  return {
    etiqueta: "En tiempo",
    detalle: "Sin alerta crítica",
    prioridad: 1,
    clases: "border-ui-success/30 bg-ui-success-soft text-ui-success",
    icono: "OK"
  };
}

export function responsableOperativo(v: PasaporteRow) {
  if (Boolean(v.tiene_incidencia_abierta) || Number(v.incidencias_abiertas ?? 0) > 0) return "Incidencias";
  if (!v.conductor_nombre) return "Asignación";
  return "Monitoreo";
}

export function idTrasladoOperativo(v: PasaporteRow) {
  return v.traslado_id ?? `sin-folio-${v.creado_en ?? ""}-${v.vehiculo_modelo ?? ""}`;
}

export function folioCorto(v: PasaporteRow) {
  return v.traslado_id ? v.traslado_id.slice(0, 8).toUpperCase() : "SIN FOLIO";
}

export function construirResultadosAccionMasiva(
  traslados: PasaporteRow[],
  accion: AccionMasivaId
): ResultadoAccionMasiva[] {
  return traslados.map((traslado) => {
    const folio = folioCorto(traslado);
    const id = idTrasladoOperativo(traslado);
    if (accion === "escalar") {
      return {
        trasladoId: id,
        folio,
        estado: "aplicado",
        detalle: "Escalado a supervisión operativa."
      };
    }
    if (accion === "asignar_responsable") {
      return {
        trasladoId: id,
        folio,
        estado: "aplicado",
        detalle: "Responsable operativo actualizado."
      };
    }
    if (accion === "cambiar_prioridad") {
      return {
        trasladoId: id,
        folio,
        estado: "aplicado",
        detalle: "Prioridad operativa ajustada."
      };
    }
    if (accion === "etiquetar") {
      return {
        trasladoId: id,
        folio,
        estado: "aplicado",
        detalle: "Etiqueta operativa asignada."
      };
    }
    if (accion === "actualizar_estado") {
      if (traslado.estado && ESTADOS_TERMINALES.includes(traslado.estado)) {
        return {
          trasladoId: id,
          folio,
          estado: "bloqueado",
          detalle: "Estado terminal protegido contra edición masiva."
        };
      }
      return {
        trasladoId: id,
        folio,
        estado: "aplicado",
        detalle: "Transición preparada para confirmación dual."
      };
    }
    return {
      trasladoId: id,
      folio,
      estado: "aplicado",
      detalle: "Acción procesada para la selección."
    };
  });
}

export function resolverEstadoAccion(resultados: ResultadoAccionMasiva[]): EstadoAccionMasiva {
  if (resultados.length === 0) return "pendiente";
  const aplicados = resultados.filter((item) => item.estado === "aplicado").length;
  if (aplicados === resultados.length) return "exitoso";
  if (aplicados === 0) return "bloqueado";
  return "parcial";
}

export function exportarTrasladosCsv(traslados: PasaporteRow[]) {
  const encabezados = [
    "Folio",
    "Inicio programado",
    "Origen",
    "Destino",
    "Vehículo",
    "Placas",
    "Conductor",
    "Estado",
    "SLA",
    "Incidencias abiertas",
    "Monto pagado",
    "Precio final"
  ];
  const filas = traslados.map((v) => [
    v.traslado_id ?? "",
    obtenerInicioProgramado(v) ?? "",
    v.origen_ciudad ?? "",
    v.destino_ciudad ?? "",
    [v.vehiculo_marca, v.vehiculo_modelo].filter(Boolean).join(" "),
    v.vehiculo_placas ?? "",
    v.conductor_nombre ?? "",
    v.estado ?? "",
    estadoSla(v).etiqueta,
    v.incidencias_abiertas ?? 0,
    v.monto_pagado ?? 0,
    v.precio_final ?? 0
  ]);
  const csv = [encabezados, ...filas].map((fila) => fila.map(valorCsv).join(",")).join("\n");
  descargarArchivo(`traslados-operativos-${new Date().toISOString().slice(0, 10)}.csv`, "text/csv;charset=utf-8;", csv);
}

export function exportarEvidencia(traslados: PasaporteRow[]) {
  const manifiesto = {
    generado_en: new Date().toISOString(),
    total: traslados.length,
    traslados: traslados.map((v) => ({
      folio: folioCorto(v),
      traslado_id: v.traslado_id,
      estado: v.estado,
      georreferencia: sinCoordenadas(v) ? "incompleta" : "disponible",
      incidencias: v.incidencias_abiertas ?? 0
    }))
  };
  descargarArchivo(`manifiesto-evidencia-${new Date().toISOString().slice(0, 10)}.json`, "application/json", JSON.stringify(manifiesto, null, 2));
}

export function valorCsv(valor: string | number | null | undefined) {
  const texto = String(valor ?? "");
  return `"${texto.replace(/"/g, '""')}"`;
}

export function descargarArchivo(nombre: string, tipo: string, contenido: string) {
  const blob = new Blob([contenido], { type: `${tipo};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nombre;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
