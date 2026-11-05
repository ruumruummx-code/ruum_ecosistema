"use client";

import { useMemo, useState, useEffect, useTransition } from "react";
import type { Database } from "@ruum/shared/types";
import { ETIQUETA_TIPO_VEHICULO } from "@ruum/shared/constants";
import {
  clasificarEstadoTraslado,
  type CategoriaPestana,
} from "../../lib/estados-traslado-policy";
import {
  perteneceAHoy,
  perteneceASemanaCalendario,
  perteneceAMes,
  obtenerDiaCalendario,
  ZONA_HORARIA_CANONICA,
} from "../../lib/zona-horaria-traslados";

export type Pasaporte = Database["public"]["Views"]["pasaporte_digital"]["Row"];
export type Traslado = Pick<
  Database["public"]["Tables"]["traslados"]["Row"],
  "id" | "origen_direccion" | "origen_ciudad" | "destino_direccion" | "destino_ciudad" | "fecha_hora_programada"
>;

/**
 * RUUM-USR-F8-001 (CB-2 / T5): Categorías exhaustivas de navegación.
 * 'en_revision' previene fail-open de estados anómalos o huérfanos.
 */
export type PestañaTraslados = CategoriaPestana;
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

/**
 * RUUM-USR-F8-001 (CB-2 / T5): Clasificación canónica fail-closed delegada a policy.
 * NUNCA cae por defecto en 'activos'.
 */
export function pestañaDeViaje(p: Pasaporte): PestañaTraslados {
  return clasificarEstadoTraslado(
    p.estado,
    p.estado_operativo,
    p.cerrado_en,
    p.traslado_id
  );
}

export function fechaProgramada(fecha: string | null): {
  fecha: string;
  hora: string;
  diaSemana: string;
  diaNumero: string;
  mesTexto: string;
} {
  if (!fecha) {
    return { fecha: "Fecha pendiente", hora: "Hora pendiente", diaSemana: "S/F", diaNumero: "—", mesTexto: "—" };
  }
  const date = new Date(fecha);
  if (Number.isNaN(date.getTime())) {
    return { fecha: "Fecha pendiente", hora: "Hora pendiente", diaSemana: "S/F", diaNumero: "—", mesTexto: "—" };
  }

  const esHoy = perteneceAHoy(date);
  const fechaTexto = new Intl.DateTimeFormat("es-MX", {
    timeZone: ZONA_HORARIA_CANONICA,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
  const horaTexto = new Intl.DateTimeFormat("es-MX", {
    timeZone: ZONA_HORARIA_CANONICA,
    hour: "numeric",
    minute: "2-digit",
  }).format(date);

  const diaSemana = new Intl.DateTimeFormat("es-MX", {
    timeZone: ZONA_HORARIA_CANONICA,
    weekday: "short",
  }).format(date).toUpperCase().replace(".", "");
  const diaNumero = new Intl.DateTimeFormat("es-MX", {
    timeZone: ZONA_HORARIA_CANONICA,
    day: "numeric",
  }).format(date);
  const mesTexto = new Intl.DateTimeFormat("es-MX", {
    timeZone: ZONA_HORARIA_CANONICA,
    month: "short",
  }).format(date).toUpperCase().replace(".", "");

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
  /** Gasto total confirmado provisto por el servidor (CB-1) */
  gastoConfirmadoServidor?: number;
  /** Estado de sincronización en segundo plano */
  sincronizando?: boolean;
}

export function useGestionTraslados<T extends PestañaFiltro = PestañaFiltro>({
  traslados,
  pestanaInicial = "activos" as T,
  busquedaInicial = "",
  gastoConfirmadoServidor,
  sincronizando = false,
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

  // Conteos por estado (incluyendo 'en_revision')
  const conteos = useMemo(() => {
    const counts: Record<PestañaFiltro, number> = {
      todos: traslados.length,
      activos: 0,
      programados: 0,
      finalizados: 0,
      cancelados: 0,
      en_revision: 0,
    };
    for (const viaje of traslados) {
      const p = pestañaDeViaje(viaje.pasaporte);
      counts[p] = (counts[p] ?? 0) + 1;
    }
    return counts;
  }, [traslados]);

  // Tipos de vehículo disponibles en el listado
  const tiposVehiculo = useMemo(() => {
    return Array.from(new Set(traslados.map(({ pasaporte }) => vehiculoTipo(pasaporte)))).sort((a, b) =>
      a.localeCompare(b, "es")
    );
  }, [traslados]);

  // Gasto acumulado total confirmado (CB-1)
  const gastoTotal = useMemo(() => {
    if (gastoConfirmadoServidor !== undefined) {
      return gastoConfirmadoServidor;
    }
    // Fallback del cliente con rigor de pagos confirmados
    return traslados.reduce((acc, { pasaporte }) => {
      const estado = String(pasaporte.estado ?? "");
      const esCancelado = estado === "servicio_cancelado" || estado === "traslado_fallido";
      if (!esCancelado && pasaporte.monto_pagado && Number(pasaporte.monto_pagado) > 0) {
        const cat = pestañaDeViaje(pasaporte);
        const esConfirmado =
          estado === "pago_completado" ||
          estado === "servicio_confirmado" ||
          cat === "finalizados" ||
          Boolean(pasaporte.cerrado_en) ||
          pasaporte.estado_operativo === "closed";
        if (esConfirmado) {
          return acc + Number(pasaporte.monto_pagado);
        }
      }
      return acc;
    }, 0);
  }, [traslados, gastoConfirmadoServidor]);

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

    // Filtro por fecha (todas / hoy / semana / mes) usando zona horaria canónica (CB-3)
    if (filtroFecha !== "todas") {
      lista = lista.filter(({ traslado }) => {
        const fechaStr = traslado?.fecha_hora_programada;
        if (!fechaStr) return false;

        if (filtroFecha === "hoy") {
          return perteneceAHoy(fechaStr);
        }
        if (filtroFecha === "semana") {
          return perteneceASemanaCalendario(fechaStr);
        }
        if (filtroFecha === "mes") {
          return perteneceAMes(fechaStr);
        }
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
    sincronizando,
    estadoSincronizacion: sincronizando ? ("actualizando" as const) : ("sincronizado" as const),
  };
}
