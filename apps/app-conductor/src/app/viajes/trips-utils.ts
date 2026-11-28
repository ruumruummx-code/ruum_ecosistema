import { ETIQUETA_TIPO_VEHICULO, GLOSARIO_OPERATIVO, type EstadoEconomicoExplicito } from "@ruum/shared/constants";
import type { Database } from "@ruum/shared/types";

export type PasaporteRow = Database["public"]["Views"]["pasaporte_digital"]["Row"];
type EstadoTraslado = Database["public"]["Enums"]["estado_traslado"];
type VistaTraslados = "disponibles" | "mis-Traslados" | "historial";
type GrupoMisTraslados = "en-curso" | "proximos" | "por-cerrar";

export interface DetalleOperativo {
  origen: string;
  destino: string;
  fechaHora: string;
  fechaHoraProgramada?: string | null;
  tipoServicio: string;
  requisitos: string;
  distanciaKm: number | null;
  tiempoEstimadoHoras: number | null;
  gananciaConductorOficial: number | null;
  estadoEconomico: EstadoEconomicoExplicito;
}

type ViajeCalendario = { viaje: PasaporteRow; tipo: string };
export type DiaCalendario = { dia: Date; Traslados: ViajeCalendario[] };

// Los expedientes en revisión siguen accesibles desde el panel, pero no son viajes aceptados.
export function esTrasladoAceptado(viaje: PasaporteRow) {
  return Boolean(viaje.estado) && !ESTADOS_FINALIZADOS.has(viaje.estado as EstadoTraslado) &&
    !["pendiente_de_conductor", "disputa_abierta", "reclamo_abierto",
      "dano_no_reportado_en_revision", "cierre_operativo_con_incidencia_abierta"].includes(viaje.estado!);
}

export function listarViajesDeVista(disponibles: PasaporteRow[], aceptados: PasaporteRow[],
  detalles: Record<string, DetalleOperativo>, vista: VistaTraslados, fecha: string | null) {
  const viajes = vista === "disponibles" ? disponibles : aceptados.filter(esTrasladoAceptado);
  return viajes.filter((viaje) => !fecha || claveDia(
    (viaje.traslado_id ? detalles[viaje.traslado_id] : null)?.fechaHora ?? detalleFallback(viaje).fechaHora
  ) === fecha).map((viaje) => ({ viaje, tipo: vista === "disponibles" ? "Ofertado" : GLOSARIO_OPERATIVO.aceptado }));
}

const ZONA_HORARIA_VIAJE = "America/Mexico_City";

const VISTAS: { id: VistaTraslados; etiqueta: string }[] = [
  { id: "disponibles", etiqueta: "Disponibles" },
  { id: "mis-Traslados", etiqueta: "Mis Traslados" },
  { id: "historial", etiqueta: "Historial" }
];

const ESTADOS_FINALIZADOS = new Set<EstadoTraslado>([
  "servicio_cerrado",
  "servicio_cancelado",
  "traslado_fallido",
  "reclamo_resuelto",
  "disputa_resuelta"
]);

const ESTADOS_PROXIMOS = new Set<EstadoTraslado>(["conductor_asignado"]);

const ESTADOS_POR_CERRAR = new Set<EstadoTraslado>([
  "llegada_a_destino",
  "evidencia_final_en_proceso",
  "evidencia_final_completada",
  "entrega_confirmada",
  "pago_pendiente",
  "pago_completado",
  "dano_no_reportado_en_revision",
  "reclamo_abierto",
  "cierre_operativo_con_incidencia_abierta",
  "disputa_abierta"
]);

function estadoEconomicoDeViaje(viaje: PasaporteRow): EstadoEconomicoExplicito {
  if (viaje.estado === "servicio_cancelado" || viaje.estado === "traslado_fallido") return "rechazado";
  if (viaje.estado === "servicio_cerrado" || viaje.estado === "pago_pendiente" || viaje.estado === "pago_completado") return "en_validacion";
  if (viaje.estado === "conductor_asignado" || viaje.estado === "pendiente_de_conductor") return "programado";
  return "sin_calcular";
}

export function detalleFallback(viaje: PasaporteRow): DetalleOperativo {
  return {
    origen: "Origen por confirmar",
    destino: "Destino por confirmar",
    fechaHora: viaje.creado_en ?? viaje.actualizado_en ?? new Date().toISOString(),
    fechaHoraProgramada: null,
    tipoServicio: "Traslado estándar",
    requisitos: viaje.vehiculo_tipo ? `Nivel compatible con ${ETIQUETA_TIPO_VEHICULO[viaje.vehiculo_tipo]}.` : "Sin requisitos especiales.",
    distanciaKm: viaje.distancia_km,
    tiempoEstimadoHoras: viaje.tiempo_estimado_horas,
    gananciaConductorOficial: null,
    estadoEconomico: estadoEconomicoDeViaje(viaje)
  };
}

export function claveDia(fecha: string | Date) {
  const partes = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: ZONA_HORARIA_VIAJE
  }).formatToParts(fecha instanceof Date ? fecha : new Date(fecha));
  const valor = Object.fromEntries(partes.map((parte) => [parte.type, parte.value]));
  return `${valor.year}-${valor.month}-${valor.day}`;
}

export function formatearDistancia(km: number | null) {
  if (km == null || !Number.isFinite(km)) return "Por confirmar";
  return `${new Intl.NumberFormat("es-MX", { maximumFractionDigits: km < 10 ? 1 : 0 }).format(km)} km`;
}

export function formatearDuracion(horas: number | null) {
  if (horas == null || !Number.isFinite(horas)) return "Por confirmar";
  const totalMin = Math.max(1, Math.round(horas * 60));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function partesFechaMexico(fecha: string | Date) {
  const partes = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: ZONA_HORARIA_VIAJE
  }).formatToParts(fecha instanceof Date ? fecha : new Date(fecha));
  const valor = Object.fromEntries(partes.map((parte) => [parte.type, parte.value]));
  return {
    year: Number(valor.year),
    month: Number(valor.month),
    day: Number(valor.day)
  };
}

function fechaUtcMediodiaDesdePartes({ year, month, day }: { year: number; month: number; day: number }) {
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

function inicioSemanaDomingo(fecha = new Date()) {
  const fechaMexico = fechaUtcMediodiaDesdePartes(partesFechaMexico(fecha));
  fechaMexico.setUTCDate(fechaMexico.getUTCDate() - fechaMexico.getUTCDay());
  return fechaMexico;
}

function diasSemanaActual(referencia = new Date()) {
  const inicio = inicioSemanaDomingo(referencia);
  return Array.from({ length: 7 }, (_, i) => {
    const dia = new Date(inicio);
    dia.setUTCDate(inicio.getUTCDate() + i);
    return dia;
  });
}

function mismoDia(a: string, b: Date) {
  return claveDia(a) === claveDia(b);
}

export function nombreVehiculo(viaje: PasaporteRow) {
  return [viaje.vehiculo_marca, viaje.vehiculo_modelo, viaje.vehiculo_anio].filter(Boolean).join(" ") || "Vehículo";
}

export function normalizarVista(valor: string | null): VistaTraslados {
  return VISTAS.some((vista) => vista.id === valor) ? (valor as VistaTraslados) : "disponibles";
}

export function clasificarMisTraslados(viaje: PasaporteRow): GrupoMisTraslados | null {
  if (!viaje.estado) return null;
  const estado = viaje.estado as EstadoTraslado;
  if (ESTADOS_FINALIZADOS.has(estado)) return null;
  if (ESTADOS_PROXIMOS.has(estado)) return "proximos";
  if (ESTADOS_POR_CERRAR.has(estado)) return "por-cerrar";
  return "en-curso";
}

export function crearCalendario(
  disponibles: PasaporteRow[],
  aceptados: PasaporteRow[],
  detalles: Record<string, DetalleOperativo>,
  referencia = new Date()
) {
  const todos = [
    ...disponibles.map((viaje) => ({ viaje, tipo: "Ofertado" })),
    ...aceptados.map((viaje) => ({ viaje, tipo: GLOSARIO_OPERATIVO.aceptado }))
  ];
  return diasSemanaActual(referencia).map((dia) => ({
    dia,
    Traslados: todos.filter(({ viaje }) => {
      const fecha = (viaje.traslado_id ? detalles[viaje.traslado_id] : null)?.fechaHora ?? detalleFallback(viaje).fechaHora;
      return mismoDia(fecha, dia);
    })
  }));
}
