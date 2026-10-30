"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Aviso, Card, FinancialAmount, FinancialCard } from "@ruum/ui";
import type { EstadoEconomicoExplicito } from "@ruum/shared/constants";
import type { Database } from "@ruum/shared/types";
import { traducirErrorOperativo } from "@ruum/shared/utils";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "../../lib/supabase-browser";
import { obtenerConductorActual, obtenerGananciasConductor, type TrasladoConductorGanancia } from "@ruum/api/services";
import { PanelSupportSheet } from "../panel/PanelSupportSheet";

import { estadoLiquidacion } from "../../lib/estado-liquidacion";

type Payout = Database["public"]["Tables"]["payouts_conductor"]["Row"] & { fecha_prevista?: string|null; pagado_en?: string|null; referencia_externa_validada?: string|null };
type DatosBancarios = Database["public"]["Tables"]["datos_bancarios_conductor"]["Row"];

export type PeriodoActivo = "semana" | "mes" | "anio";

interface RegistroViajeGanancia {
  id: string;
  fecha: string;
  fechaDate: Date;
  vehiculo: string;
  origen: string;
  destino: string;
  montoGanado: number;
  precioBase: number;
  comisionRuum: number;
  gastosAutorizados: number;
  bonos: number;
  ajuste: number;
  estatusEconomico: EstadoEconomicoExplicito;
  liberacion: string;
  payoutId?: string | null;
  estadoTraslado: string;
}

// ── Helpers puros (testables) ──────────────────────────────────────

export function estatusPayout(payout: Parameters<typeof estadoLiquidacion>[0]): EstadoEconomicoExplicito {
  return estadoLiquidacion(payout);
}

export function estatusViaje(
  traslado: TrasladoConductorGanancia,
  payoutEnlazado?: Payout | null
): EstadoEconomicoExplicito {
  if (payoutEnlazado) return estatusPayout(payoutEnlazado);
  if (traslado.ganancia_conductor_congelada === null) return "sin_calcular";
  if (traslado.estado === "servicio_cerrado") return "confirmado";
  if (traslado.estado === "entrega_confirmada") return "en_validacion";
  if (
    traslado.estado === "traslado_en_curso" ||
    traslado.estado === "conductor_asignado" ||
    traslado.estado === "conductor_en_camino_al_origen" ||
    traslado.estado === "conductor_en_punto_de_recoleccion"
  ) {
    return "estimado";
  }
  if (traslado.estado === "servicio_cancelado" || traslado.estado === "traslado_fallido") return "rechazado";
  return "sin_calcular";
}

export function etiquetaEstadoUnica(estatus: EstadoEconomicoExplicito): { texto: string; clase: string } {
  switch (estatus) {
    case "pagado":
      return { texto: "Pago transferido", clase: "inline-flex min-h-[28px] items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-body text-xs font-semibold text-emerald-900" };
    case "programado":
      return { texto: "Depósito programado", clase: "inline-flex min-h-[28px] items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 font-body text-xs font-semibold text-amber-900" };
    case "confirmado":
      return { texto: "Viaje concluido", clase: "inline-flex min-h-[28px] items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-body text-xs font-semibold text-emerald-900" };
    case "en_validacion":
      return { texto: "En validación", clase: "inline-flex min-h-[28px] items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 font-body text-xs font-semibold text-amber-900" };
    case "estimado":
      return { texto: "En curso / Estimado", clase: "inline-flex min-h-[28px] items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 font-body text-xs font-semibold text-blue-900" };
    case "rechazado":
    case "retenido":
      return { texto: "En revisión / Retenido", clase: "inline-flex min-h-[28px] items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 font-body text-xs font-semibold text-rose-900" };
    default:
      return { texto: "Sin calcular", clase: "inline-flex min-h-[28px] items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-body text-xs font-semibold text-slate-900" };
  }
}

export function formatearFecha(fechaIso: string) {
  if (!fechaIso || !fechaIso.includes("-")) return fechaIso || "—";
  try {
    return new Intl.DateTimeFormat("es-MX", {
      dateStyle: "medium",
      timeZone: "America/Mexico_City"
    }).format(new Date(fechaIso.length === 10 ? `${fechaIso}T12:00:00-06:00` : fechaIso));
  } catch {
    return fechaIso;
  }
}

export function formatearFechaCorta(fechaIso: string) {
  if (!fechaIso || !fechaIso.includes("-")) return fechaIso || "—";
  try {
    return new Intl.DateTimeFormat("es-MX", {
      day: "2-digit",
      month: "short",
      timeZone: "America/Mexico_City"
    }).format(new Date(fechaIso.length === 10 ? `${fechaIso}T12:00:00-06:00` : fechaIso));
  } catch {
    return fechaIso;
  }
}

export function formatearMoneda(valor: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 2 }).format(valor);
}

export function toDateSafe(fechaIso: string | null | undefined): Date | null {
  if (!fechaIso) return null;
  const d = new Date(fechaIso.length === 10 ? `${fechaIso}T12:00:00-06:00` : fechaIso);
  return isNaN(d.getTime()) ? null : d;
}

// ── Helpers de periodo ─────────────────────────────────────────────

function inicioDeSemana(fecha: Date): Date {
  const d = new Date(fecha);
  d.setHours(12, 0, 0, 0);
  const dia = d.getDay();
  d.setDate(d.getDate() - dia);
  d.setHours(0, 0, 0, 0);
  return d;
}
function finDeSemana(fecha: Date): Date {
  const inicio = inicioDeSemana(fecha);
  const fin = new Date(inicio);
  fin.setDate(fin.getDate() + 6);
  fin.setHours(23, 59, 59, 999);
  return fin;
}
function inicioDeMes(fecha: Date): Date {
  const d = new Date(fecha);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}
function finDeMes(fecha: Date): Date {
  const d = new Date(fecha);
  d.setMonth(d.getMonth() + 1, 0);
  d.setHours(23, 59, 59, 999);
  return d;
}
function inicioDeAnio(fecha: Date): Date {
  const d = new Date(fecha);
  d.setMonth(0, 1);
  d.setHours(0, 0, 0, 0);
  return d;
}
function finDeAnio(fecha: Date): Date {
  const d = new Date(fecha);
  d.setMonth(11, 31);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function obtenerRangoPeriodo(periodo: PeriodoActivo, referencia: Date, offset: number) {
  const base = new Date(referencia);
  if (periodo === "semana") {
    base.setDate(base.getDate() + offset * 7);
    return { inicio: inicioDeSemana(base), fin: finDeSemana(base) };
  }
  if (periodo === "mes") {
    base.setMonth(base.getMonth() + offset);
    return { inicio: inicioDeMes(base), fin: finDeMes(base) };
  }
  base.setFullYear(base.getFullYear() + offset);
  return { inicio: inicioDeAnio(base), fin: finDeAnio(base) };
}

export function formatearRango(periodo: PeriodoActivo, inicio: Date, fin: Date) {
  const fmt = new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short", year: "numeric", timeZone: "America/Mexico_City" });
  const fmtMes = new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric", timeZone: "America/Mexico_City" });
  const fmtAnio = new Intl.DateTimeFormat("es-MX", { year: "numeric", timeZone: "America/Mexico_City" });
  if (periodo === "semana") {
    const a = fmt.format(inicio);
    const b = fmt.format(fin);
    return `${a} – ${b}`;
  }
  if (periodo === "mes") return fmtMes.format(inicio);
  return fmtAnio.format(inicio);
}

export function estaEnRango(fecha: Date | null, inicio: Date, fin: Date) {
  if (!fecha) return false;
  return fecha.getTime() >= inicio.getTime() && fecha.getTime() <= fin.getTime();
}

// ── Custom hook con la lógica de datos ─────────────────────────────

export interface UseEarningsLedgerResult {
  datosBancarios: DatosBancarios | null;
  payouts: Payout[];
  traslados: TrasladoConductorGanancia[];
  error: string | null;
  cargando: boolean;
  periodoActivo: PeriodoActivo;
  offsetPeriodo: number;
  viajeExpandido: string | null;
  soporteAbierto: boolean;
  infoSheet: { titulo: string; texto: string } | null;
  hoy: Date;
  registrosTraslados: RegistroViajeGanancia[];
  rangoActual: { inicio: Date; fin: Date };
  TrasladosFiltrados: RegistroViajeGanancia[];
  payoutsFiltrados: Payout[];
  resumen: {
    totalTraslados: number;
    totalVehiculos: number;
    precioBase: number;
    bonos: number;
    ajuste: number;
    comisionRuum: number;
    gananciaNeta: number;
    reembolsoGastos: number;
    retenciones: number;
    depositoAcumulado: number;
  };
  fechaDispersion: string;
  sinDatosTotales: boolean;
  cambiarPeriodo: (nuevo: PeriodoActivo) => void;
  setPeriodoActivo: (nuevo: PeriodoActivo) => void;
  setOffsetPeriodo: (o: number) => void;
  setViajeExpandido: (id: string | null) => void;
  setSoporteAbierto: (abierto: boolean) => void;
  setInfoSheet: (sheet: { titulo: string; texto: string } | null) => void;
}

export function useEarningsLedger(): UseEarningsLedgerResult {
  const [datosBancarios, setDatosBancarios] = useState<DatosBancarios | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [traslados, setTraslados] = useState<TrasladoConductorGanancia[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [periodoActivo, setPeriodoActivo] = useState<PeriodoActivo>("semana");
  const [offsetPeriodo, setOffsetPeriodo] = useState(0);
  const [viajeExpandido, setViajeExpandido] = useState<string | null>(null);
  const [soporteAbierto, setSoporteAbierto] = useState(false);
  const [infoSheet, setInfoSheet] = useState<{ titulo: string; texto: string } | null>(null);
  const [hoy] = useState(() => new Date());

  useEffect(() => {
    async function cargar() {
      if (!tieneSupabaseConfigurado()) {
        setError("Supabase no está configurado. No se pueden consultar ganancias reales.");
        setCargando(false);
        return;
      }
      try {
        const cliente = crearClienteNavegador();
        const conductor = await obtenerConductorActual(cliente);
        if (!conductor) {
          setCargando(false);
          return;
        }
        const datos = await obtenerGananciasConductor(cliente, conductor.id);
        setDatosBancarios(datos.datosBancarios);
        setPayouts(datos.payouts);
        setTraslados(datos.traslados);
      } catch (err) {
        setError(traducirErrorOperativo(err, "No pudimos cargar tus ganancias."));
      } finally {
        setCargando(false);
      }
    }
    void cargar();
  }, []);

  const mapaPayouts = useMemo(() => {
    const mapa = new Map<string, Payout>();
    payouts.forEach((p) => mapa.set(p.id, p));
    return mapa;
  }, [payouts]);

  const registrosTraslados = useMemo<RegistroViajeGanancia[]>(() => {
    return traslados.map((t) => {
      const payoutEnlazado = t.payout_id ? mapaPayouts.get(t.payout_id) : null;
      const vehiculoNombre = t.vehiculos ? `${t.vehiculos.marca} ${t.vehiculos.modelo} ${t.vehiculos.anio}` : "Vehículo trasladado";
      const montoEstimadoOGanado = Number(t.ganancia_conductor_congelada ?? 0);
      const precioBase = Number(t.precio_final ?? t.precio_cotizado ?? 0);
      const comision = precioBase > 0 ? Math.max(0, precioBase - montoEstimadoOGanado) : 0;
      const fechaStr = t.cerrado_en ?? t.actualizado_en ?? t.creado_en;
      const fechaDate = toDateSafe(fechaStr) ?? new Date(fechaStr);
      return {
        id: t.id,
        fecha: fechaStr,
        fechaDate,
        vehiculo: vehiculoNombre,
        origen: t.origen_ciudad,
        destino: t.destino_ciudad,
        montoGanado: montoEstimadoOGanado,
        precioBase,
        comisionRuum: comision,
        gastosAutorizados: 0,
        bonos: 0,
        ajuste: 0,
        estatusEconomico: estatusViaje(t, payoutEnlazado),
        liberacion: payoutEnlazado?.pagado_en?.slice(0,10) ?? payoutEnlazado?.fecha_prevista ?? "Fecha pendiente de finanzas",
        payoutId: t.payout_id,
        estadoTraslado: t.estado
      };
    });
  }, [traslados, mapaPayouts]);

  const rangoActual = useMemo(() => obtenerRangoPeriodo(periodoActivo, hoy, offsetPeriodo), [periodoActivo, hoy, offsetPeriodo]);

  const TrasladosFiltrados = useMemo(() => {
    return registrosTraslados.filter((v) => estaEnRango(v.fechaDate, rangoActual.inicio, rangoActual.fin));
  }, [registrosTraslados, rangoActual]);

  const payoutsFiltrados = useMemo(() => {
    return payouts.filter((p) => {
      const inicio = toDateSafe(p.periodo_inicio);
      const fin = toDateSafe(p.periodo_fin);
      if (!inicio || !fin) return false;
      return fin.getTime() >= rangoActual.inicio.getTime() && inicio.getTime() <= rangoActual.fin.getTime();
    });
  }, [payouts, rangoActual]);

  const resumen = useMemo(() => {
    const precioBase = TrasladosFiltrados.filter(v => v.estatusEconomico !== "sin_calcular").reduce((tot, v) => tot + v.precioBase, 0);
    const bonos = TrasladosFiltrados.reduce((tot, v) => tot + v.bonos, 0);
    const ajuste = payoutsFiltrados.reduce((tot, p) => tot + Number(p.ajustes ?? 0), 0);
    const comisionRuum = TrasladosFiltrados.filter(v => v.estatusEconomico !== "sin_calcular").reduce((tot, v) => tot + v.comisionRuum, 0);
    const reembolsoGastos = TrasladosFiltrados.reduce((tot, v) => tot + v.gastosAutorizados, 0);
    const retenciones = TrasladosFiltrados
      .filter((v) => v.estatusEconomico === "rechazado" || v.estatusEconomico === "retenido")
      .reduce((tot, v) => tot + v.montoGanado, 0);
    const gananciaNeta = precioBase + bonos + ajuste - comisionRuum;
    const depositoAcumulado = Math.max(0, precioBase + bonos + ajuste - comisionRuum + reembolsoGastos - retenciones);
    const totalVehiculos = new Set(TrasladosFiltrados.map((v) => v.vehiculo)).size;
    return {
      totalTraslados: TrasladosFiltrados.length,
      totalVehiculos: TrasladosFiltrados.length === 0 ? 0 : totalVehiculos,
      precioBase,
      bonos,
      ajuste,
      comisionRuum,
      gananciaNeta,
      reembolsoGastos,
      retenciones,
      depositoAcumulado
    };
  }, [TrasladosFiltrados, payoutsFiltrados]);

  const fechaPrevista = payoutsFiltrados.find(p => estatusPayout(p) !== "pagado" && p.fecha_prevista)?.fecha_prevista;
  const fechaDispersion = useMemo(() => {
    if (!fechaPrevista) return "por confirmar con finanzas";
    const fin = new Date(`${fechaPrevista}T12:00:00-06:00`);
    try {
      return new Intl.DateTimeFormat("es-MX", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
        timeZone: "America/Mexico_City"
      }).format(fin);
    } catch {
      return formatearFecha(fin.toISOString().slice(0, 10));
    }
  }, [fechaPrevista]);

  const sinDatosTotales = !cargando && traslados.length === 0 && payouts.length === 0 && !error;

  const cambiarPeriodo = (nuevo: PeriodoActivo) => {
    setPeriodoActivo(nuevo);
    setOffsetPeriodo(0);
    setViajeExpandido(null);
  };

  return {
    datosBancarios,
    payouts,
    traslados,
    error,
    cargando,
    periodoActivo,
    offsetPeriodo,
    viajeExpandido,
    soporteAbierto,
    infoSheet,
    hoy,
    registrosTraslados,
    rangoActual,
    TrasladosFiltrados,
    payoutsFiltrados,
    resumen,
    fechaDispersion,
    sinDatosTotales,
    cambiarPeriodo,
    setPeriodoActivo,
    setOffsetPeriodo,
    setViajeExpandido,
    setSoporteAbierto,
    setInfoSheet
  };
}

export type ResumenGanancias = {
  totalTraslados: number;
  totalVehiculos: number;
  precioBase: number;
  bonos: number;
  ajuste: number;
  comisionRuum: number;
  gananciaNeta: number;
  reembolsoGastos: number;
  retenciones: number;
  depositoAcumulado: number;
};
