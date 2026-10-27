"use client";

import { useMemo, useState, useEffect, useTransition } from "react";
import type { Database } from "@ruum/shared/types";
import { ETIQUETA_TIPO_VEHICULO } from "@ruum/shared/constants";

export type Pasaporte = Database["public"]["Views"]["pasaporte_digital"]["Row"];
export type Traslado = Pick<
  Database["public"]["Tables"]["traslados"]["Row"],
  "id" | "origen_direccion" | "origen_ciudad" | "destino_direccion" | "destino_ciudad" | "fecha_hora_programada"
>;

export type PestañaTraslados = "activos" | "programados" | "finalizados" | "cancelados";
export type PestañaFiltro = "todos" | PestañaTraslados;

export interface ViajeLista {
  pasaporte: Pasaporte;
  traslado: Traslado | null;
}

export function folioCorto(trasladoId: string | null | undefined): string {
  return trasladoId ? `#RR-${trasladoId.slice(0, 4).toUpperCase()}` : "#RR-—";
}

export function formatoDuracion(horas: number | null | undefined): string | null {
  if (horas == null || Number.isNaN(Number(horas))) return null;
  const totalMin = Math.round(Number(horas) * 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h <= 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

export function formatoGastado(total: number): string {
  if (total >= 1000) {
    const miles = total / 1000;
    return `$${miles >= 100 ? Math.round(miles).toString() : miles.toFixed(1).replace(/\.0$/, "")}k`;
  }
  return `$${Math.round(total).toLocaleString("es-MX")}`;
}

export function vehiculoNombre(p: Pasaporte): string {
  const partes = [p.vehiculo_marca, p.vehiculo_modelo, p.vehiculo_anio].filter(Boolean);
  return partes.length > 0 ? partes.join(" ") : "Vehículo";
}

export function vehiculoTipo(p: Pasaporte): string {
  if (!p.vehiculo_tipo) return "Tipo no disponible";
  return ETIQUETA_TIPO_VEHICULO[p.vehiculo_tipo] ?? p.vehiculo_tipo;
}

export function pestañaDeViaje(p: Pasaporte): PestañaTraslados {
  const estado = String(p.estado ?? "");
  if (estado === "servicio_cancelado" || estado === "traslado_fallido") return "cancelados";
  if (["servicio_cerrado", "reclamo_resuelto", "disputa_resuelta", "cierre_operativo_con_incidencia_abierta"].includes(estado)) return "finalizados";
  if ([
    "solicitud_creada",
    "documentacion_pendiente",
    "documentacion_en_revision",
    "documentacion_validada",
    "cotizacion_generada",
    "cotizacion_aceptada",
    "servicio_confirmado",
    "pendiente_de_conductor",
  ].includes(estado)) return "programados";
  return "activos";
}

const ZONA_HORARIA = "America/Mexico_City";
function diaCalendario(fecha: Date): string {
  const partes = new Intl.DateTimeFormat("en-CA", { timeZone: ZONA_HORARIA, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(fecha);
  return ["year", "month", "day"].map(tipo => partes.find(p => p.type === tipo)!.value).join("-");
}

export function fechaProgramada(fecha: string | null): { fecha: string; hora: string; diaSemana: string; diaNumero: string; mesTexto: string } {
  if (!fecha) {
    return { fecha: "Fecha pendiente", hora: "Hora pendiente", diaSemana: "S/F", diaNumero: "—", mesTexto: "—" };
  }
  const date = new Date(fecha);
  if (Number.isNaN(date.getTime())) {
    return { fecha: "Fecha pendiente", hora: "Hora pendiente", diaSemana: "S/F", diaNumero: "—", mesTexto: "—" };
  }

  const hoy = new Date();
  const esHoy = diaCalendario(date) === diaCalendario(hoy);
  const fechaTexto = new Intl.DateTimeFormat("es-MX", { timeZone: ZONA_HORARIA, day: "numeric", month: "short", year: "numeric" }).format(date);
  const horaTexto = new Intl.DateTimeFormat("es-MX", { timeZone: ZONA_HORARIA, hour: "numeric", minute: "2-digit" }).format(date);
  
  const diaSemana = new Intl.DateTimeFormat("es-MX", { timeZone: ZONA_HORARIA, weekday: "short" }).format(date).toUpperCase().replace(".", "");
  const diaNumero = new Intl.DateTimeFormat("es-MX", { timeZone: ZONA_HORARIA, day: "numeric" }).format(date);
  const mesTexto = new Intl.DateTimeFormat("es-MX", { timeZone: ZONA_HORARIA, month: "short" }).format(date).toUpperCase().replace(".", "");

  return {
    fecha: esHoy ? `Hoy, ${fechaTexto}` : fechaTexto,
    hora: horaTexto,
    diaSemana,
    diaNumero,
    mesTexto,
  };
}

export interface UseGestionTrasladosOptions<T extends PestañaFiltro = PestañaFiltro> {
  traslados: ViajeLista[];
  pestanaInicial?: T;
  /** Término proveniente del buscador global (`/mis-viajes?buscar=...`). */
  busquedaInicial?: string;
}

export function useGestionTraslados<T extends PestañaFiltro = PestañaFiltro>({
  traslados,
  pestanaInicial = "activos" as T,
  busquedaInicial = "",
}: UseGestionTrasladosOptions<T>) {
  const [pestana, setPestana] = useState<T>(pestanaInicial);
  const [busquedaInput, setBusquedaInput] = useState(busquedaInicial);
  const [busqueda, setBusqueda] = useState(busquedaInicial);
  const [buscando, setBuscando] = useState(false);
  const [filtroAbierto, setFiltroAbierto] = useState(false);
  const [tipoVehiculoSeleccionado, setTipoVehiculoSeleccionado] = useState("");
  const [filtroFecha, setFiltroFecha] = useState<string>("todas");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [, startTransition] = useTransition();

  useEffect(() => { setPestana(pestanaInicial); }, [pestanaInicial]);
  useEffect(() => { setBusquedaInput(busquedaInicial); setBusqueda(busquedaInicial); setBuscando(false); }, [busquedaInicial]);

  // Debounce búsqueda 300ms
  useEffect(() => {
    if (busquedaInput === busqueda) return;
    setBuscando(true);
    const t = setTimeout(() => {
      startTransition(() => {
        setBusqueda(busquedaInput);
        setBuscando(false);
      });
    }, 300);
    return () => clearTimeout(t);
  }, [busquedaInput, busqueda]);

  // Conteos por estado
  const conteos = useMemo(() => {
    const counts: Record<PestañaFiltro, number> = {
      todos: traslados.length,
      activos: 0,
      programados: 0,
      finalizados: 0,
      cancelados: 0,
    };
    for (const viaje of traslados) {
      const p = pestañaDeViaje(viaje.pasaporte);
      counts[p]++;
    }
    return counts;
  }, [traslados]);

  // Tipos de vehículo disponibles en el listado
  const tiposVehiculo = useMemo(() => {
    return Array.from(new Set(traslados.map(({ pasaporte }) => vehiculoTipo(pasaporte)))).sort((a, b) =>
      a.localeCompare(b, "es")
    );
  }, [traslados]);

  // Gasto acumulado total
  const gastoTotal = useMemo(() => {
    return traslados.reduce((acc, { pasaporte }) => acc + (Number(pasaporte.monto_pagado) || 0), 0);
  }, [traslados]);

  // Lista filtrada
  const filtrados = useMemo(() => {
    let lista = traslados;

    // Filtro por pestaña activa
    if ((pestana as string) !== "todos") {
      lista = lista.filter(({ pasaporte }) => pestañaDeViaje(pasaporte) === (pestana as unknown as PestañaTraslados));
    }

    // Filtro por estado específico (selector dropdown en desktop)
    if (filtroEstado !== "todos") {
      lista = lista.filter(({ pasaporte }) => pestañaDeViaje(pasaporte) === filtroEstado);
    }

    // Filtro por tipo de vehículo
    if (tipoVehiculoSeleccionado) {
      lista = lista.filter(({ pasaporte }) => vehiculoTipo(pasaporte) === tipoVehiculoSeleccionado);
    }

    // Filtro por fecha (todas / hoy / semana / mes)
    if (filtroFecha !== "todas") {
      const ahora = new Date();
      lista = lista.filter(({ traslado }) => {
        const fechaStr = traslado?.fecha_hora_programada;
        if (!fechaStr) return false;
        const fecha = new Date(fechaStr);
        if (Number.isNaN(fecha.getTime())) return false;

        const dia = diaCalendario(fecha);
        const hoy = diaCalendario(ahora);
        if (filtroFecha === "hoy") return dia === hoy;
        if (filtroFecha === "semana") {
          const inicio = new Date(hoy + "T00:00:00Z");
          inicio.setUTCDate(inicio.getUTCDate() - (inicio.getUTCDay() + 6) % 7);
          const fin = new Date(inicio);
          fin.setUTCDate(fin.getUTCDate() + 7);
          return dia >= inicio.toISOString().slice(0, 10) && dia < fin.toISOString().slice(0, 10);
        }
        if (filtroFecha === "mes") return dia.slice(0, 7) === hoy.slice(0, 7);
        return true;
      });
    }

    // Filtro por búsqueda de texto
    if (busqueda.trim()) {
      const q = busqueda.trim().toLowerCase();
      lista = lista.filter(({ pasaporte, traslado }) => {
        const folio = `${pasaporte.traslado_id ?? ""} ${folioCorto(pasaporte.traslado_id)}`.toLowerCase();
        const veh = vehiculoNombre(pasaporte).toLowerCase();
        const origen = `${pasaporte.origen_ciudad ?? ""} ${pasaporte.origen_direccion ?? ""} ${traslado?.origen_ciudad ?? ""} ${traslado?.origen_direccion ?? ""}`.toLowerCase();
        const destino = `${pasaporte.destino_ciudad ?? ""} ${pasaporte.destino_direccion ?? ""} ${traslado?.destino_ciudad ?? ""} ${traslado?.destino_direccion ?? ""}`.toLowerCase();
        const conductor = (pasaporte.conductor_nombre ?? "").toLowerCase();
        const placas = (pasaporte.vehiculo_placas ?? "").toLowerCase();
        return (
          folio.includes(q) ||
          veh.includes(q) ||
          origen.includes(q) ||
          destino.includes(q) ||
          conductor.includes(q) ||
          placas.includes(q)
        );
      });
    }

    return lista;
  }, [traslados, pestana, filtroEstado, tipoVehiculoSeleccionado, filtroFecha, busqueda]);

  function limpiarFiltros() {
    setBusquedaInput("");
    setBusqueda("");
    setTipoVehiculoSeleccionado("");
    setFiltroFecha("todas");
    setFiltroEstado("todos");
    setBuscando(false);
  }

  function handlePestanaChange(nueva: T) {
    startTransition(() => setPestana(nueva));
  }

  return {
    pestana,
    setPestana: handlePestanaChange,
    busquedaInput,
    setBusquedaInput,
    busqueda,
    buscando,
    filtroAbierto,
    setFiltroAbierto,
    tipoVehiculoSeleccionado,
    setTipoVehiculoSeleccionado,
    filtroFecha,
    setFiltroFecha,
    filtroEstado,
    setFiltroEstado,
    conteos,
    tiposVehiculo,
    gastoTotal,
    gastoFormateado: formatoGastado(gastoTotal),
    filtrados,
    limpiarFiltros,
  };
}
