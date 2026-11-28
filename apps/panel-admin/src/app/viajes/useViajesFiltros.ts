"use client";

import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { ETIQUETA_TIPO_VEHICULO } from "@ruum/shared/constants";
import type { TrazabilidadMasivaTraslado } from "@ruum/api/services";
import type {
  PasaporteRow,
  FiltrosAvanzados,
  FiltroKpi,
  AccionOperativa
} from "./ViajesTipos";
import {
  PESTANAS,
  ESTADOS_TERMINALES,
  FILTROS_INICIALES,
  esFiltroKpi,
  esAccionOperativa,
  esEstadoTraslado,
  esFiltroSla,
  esFiltroFecha,
  actualizarEstadoFiltro,
  coincideSla,
  coincideFecha,
  sinCoordenadas,
  iniciaEn60Min,
  obtenerInicioProgramado
} from "./ViajesTipos";

export function useViajesFiltros({
  traslados,
  setPestana,
  trazabilidadPorTraslado,
  limpiarParamsFiltroUrl
}: {
  traslados: PasaporteRow[];
  pestana: string;
  setPestana: Dispatch<SetStateAction<string>>;
  trazabilidadPorTraslado: Map<string, TrazabilidadMasivaTraslado>;
  limpiarParamsFiltroUrl: () => void;
}) {
  const [busqueda, setBusqueda] = useState("");
  const [filtroKpi, setFiltroKpi] = useState<FiltroKpi | null>(null);
  const [accionOperativa, setAccionOperativa] = useState<AccionOperativa | null>(null);
  const [filtros, setFiltros] = useState<FiltrosAvanzados>(FILTROS_INICIALES);
  const [filtrosAvanzadosAbiertos, setFiltrosAvanzadosAbiertos] = useState(false);
  const [detalleAbiertoId, setDetalleAbiertoId] = useState<string | null>(null);
  const filtrosInicializados = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const parametro = params.get("filtro");
    if (esFiltroKpi(parametro)) {
      setFiltroKpi(parametro);
      setPestana("todos");
    }
    const accion = params.get("accion");
    if (esAccionOperativa(accion)) setAccionOperativa(accion);
    const estadoUrl = params.get("estado");
    const estado = esEstadoTraslado(estadoUrl) ? estadoUrl : "todos";
    const slaUrl = params.get("sla");
    const fechaUrl = params.get("fecha");
    setFiltros({
      estado,
      sla: esFiltroSla(slaUrl) ? slaUrl : "todos",
      fecha: esFiltroFecha(fechaUrl) ? fechaUrl : "todos",
      empresa: params.get("empresa") ?? "",
      conductor: params.get("conductor") ?? "",
      vehiculo: params.get("vehiculo") ?? "",
      origen: params.get("origen") ?? "",
      destino: params.get("destino") ?? "",
      incidencia: params.get("incidencia") === "1",
      sinAsignacion: params.get("sin_asignacion") === "1",
      sinCoordenadas: params.get("sin_coordenadas") === "1",
      proximos: params.get("proximos") === "1"
    });
    if (estado !== "todos") {
      const pestanaEstado = PESTANAS.find((item) => item.filtro === estado);
      setPestana(pestanaEstado?.id ?? "todos");
    }
    setBusqueda(params.get("q") ?? "");
    setDetalleAbiertoId(params.get("detalle"));
    filtrosInicializados.current = true;
  }, [setPestana]);

  useEffect(() => {
    if (!filtrosInicializados.current) return;
    const params = new URLSearchParams();
    if (busqueda.trim()) params.set("q", busqueda.trim());
    if (filtroKpi) params.set("filtro", filtroKpi);
    if (accionOperativa) params.set("accion", accionOperativa);
    if (filtros.estado !== "todos") params.set("estado", filtros.estado);
    if (filtros.sla !== "todos") params.set("sla", filtros.sla);
    if (filtros.fecha !== "todos") params.set("fecha", filtros.fecha);
    if (filtros.empresa) params.set("empresa", filtros.empresa);
    if (filtros.conductor) params.set("conductor", filtros.conductor);
    if (filtros.vehiculo) params.set("vehiculo", filtros.vehiculo);
    if (filtros.origen) params.set("origen", filtros.origen);
    if (filtros.destino) params.set("destino", filtros.destino);
    if (filtros.incidencia) params.set("incidencia", "1");
    if (filtros.sinAsignacion) params.set("sin_asignacion", "1");
    if (filtros.sinCoordenadas) params.set("sin_coordenadas", "1");
    if (filtros.proximos) params.set("proximos", "1");
    if (detalleAbiertoId) params.set("detalle", detalleAbiertoId);
    const query = params.toString();
    window.history.replaceState(null, "", query ? `/viajes?${query}` : "/viajes");
  }, [accionOperativa, busqueda, detalleAbiertoId, filtroKpi, filtros]);

  const trasladosPorKpi = useMemo(() => {
    if (!filtroKpi) return traslados;
    const ahora = Date.now();
    const en60Min = ahora + 60 * 60 * 1000;
    const inicioHoy = new Date();
    inicioHoy.setHours(0, 0, 0, 0);

    return traslados.filter((v) => {
      const extendido = v as PasaporteRow & {
        fecha_hora_programada?: string | null;
        modalidad_programacion?: string | null;
        actualizado_en?: string | null;
      };
      if (filtroKpi === "activos") return v.estado ? !ESTADOS_TERMINALES.includes(v.estado) : false;
      if (filtroKpi === "sin_asignacion") return v.estado === "pendiente_de_conductor";
      if (filtroKpi === "incidencia") return Boolean(extendido.tiene_incidencia_abierta) || Number(extendido.incidencias_abiertas ?? 0) > 0;
      if (filtroKpi === "finalizados_hoy") {
        const fechaCierre = extendido.actualizado_en ? new Date(extendido.actualizado_en).getTime() : 0;
        return v.estado === "servicio_cerrado" && fechaCierre >= inicioHoy.getTime();
      }
      if (filtroKpi === "inician_60") {
        const fechaProgramada = extendido.fecha_hora_programada ? new Date(extendido.fecha_hora_programada).getTime() : 0;
        return extendido.modalidad_programacion === "programado" && fechaProgramada >= ahora && fechaProgramada <= en60Min;
      }
      return true;
    });
  }, [filtroKpi, traslados]);

  const opcionesFiltros = useMemo(() => {
    const empresas = new Map<string, string>();
    const conductores = new Set<string>();
    const vehiculos = new Set<string>();
    for (const traslado of traslados) {
      if (traslado.conductor_nombre) conductores.add(traslado.conductor_nombre);
      if (traslado.vehiculo_tipo) vehiculos.add(traslado.vehiculo_tipo);
      if (traslado.traslado_id) {
        const trazabilidad = trazabilidadPorTraslado.get(traslado.traslado_id);
        if (trazabilidad?.carga.empresa_id) empresas.set(trazabilidad.carga.empresa_id, trazabilidad.carga.empresa_id.slice(0, 8).toUpperCase());
      }
    }
    return {
      empresas: Array.from(empresas.entries()),
      conductores: Array.from(conductores).sort(),
      vehiculos: Array.from(vehiculos).sort()
    };
  }, [traslados, trazabilidadPorTraslado]);

  const sugerenciasBusqueda = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (q.length < 2) return [];
    const sugerencias = new Set<string>();
    for (const traslado of traslados) {
      const candidatos = [
        traslado.traslado_id?.slice(0, 8).toUpperCase(),
        traslado.vehiculo_placas,
        [traslado.vehiculo_marca, traslado.vehiculo_modelo].filter(Boolean).join(" "),
        traslado.conductor_nombre,
        traslado.origen_ciudad,
        traslado.destino_ciudad
      ].filter((valor): valor is string => Boolean(valor));
      for (const candidato of candidatos) {
        if (candidato.toLowerCase().includes(q)) sugerencias.add(candidato);
        if (sugerencias.size >= 6) break;
      }
      if (sugerencias.size >= 6) break;
    }
    return Array.from(sugerencias);
  }, [busqueda, traslados]);

  const trasladosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return trasladosPorKpi.filter((v) => {
      const extendido = v as PasaporteRow & { fecha_hora_programada?: string | null; actualizado_en?: string | null };
      const trazabilidad = v.traslado_id ? trazabilidadPorTraslado.get(v.traslado_id) : null;
      const textoBusqueda = [
        v.traslado_id?.slice(0, 8),
        v.vehiculo_marca,
        v.vehiculo_modelo,
        v.vehiculo_placas,
        v.conductor_nombre,
        v.origen_ciudad,
        v.origen_direccion,
        v.destino_ciudad,
        v.destino_direccion
      ].join(" ").toLowerCase();
      if (q && !textoBusqueda.includes(q)) return false;
      if (filtros.estado !== "todos" && v.estado !== filtros.estado) return false;
      if (filtros.empresa && trazabilidad?.carga.empresa_id !== filtros.empresa) return false;
      if (filtros.conductor && v.conductor_nombre !== filtros.conductor) return false;
      if (filtros.vehiculo && v.vehiculo_tipo !== filtros.vehiculo) return false;
      if (filtros.origen && !`${v.origen_ciudad ?? ""} ${v.origen_direccion ?? ""}`.toLowerCase().includes(filtros.origen.toLowerCase())) return false;
      if (filtros.destino && !`${v.destino_ciudad ?? ""} ${v.destino_direccion ?? ""}`.toLowerCase().includes(filtros.destino.toLowerCase())) return false;
      if (filtros.incidencia && !v.tiene_incidencia_abierta && Number(v.incidencias_abiertas ?? 0) === 0) return false;
      if (filtros.sinAsignacion && v.estado !== "pendiente_de_conductor") return false;
      if (filtros.sinCoordenadas && !sinCoordenadas(v)) return false;
      if (filtros.proximos && !iniciaEn60Min(extendido.fecha_hora_programada)) return false;
      if (filtros.fecha !== "todos" && !coincideFecha(v.creado_en, filtros.fecha)) return false;
      if (filtros.sla !== "todos" && !coincideSla(v, filtros.sla)) return false;
      return true;
    });
  }, [busqueda, filtros, trazabilidadPorTraslado, trasladosPorKpi]);

  const chips = useMemo(() => {
    const activos: Array<{ id: string; label: string; onRemove: () => void }> = [];
    if (busqueda.trim()) activos.push({ id: "q", label: `Búsqueda: ${busqueda.trim()}`, onRemove: () => setBusqueda("") });
    if (filtros.estado !== "todos") activos.push({ id: "estado", label: `Estado: ${PESTANAS.find((item) => item.filtro === filtros.estado)?.etiqueta ?? filtros.estado}`, onRemove: () => actualizarEstadoFiltro("todos", setFiltros, setPestana) });
    if (filtros.sla !== "todos") activos.push({ id: "sla", label: `SLA: ${filtros.sla === "en_riesgo" ? "En riesgo" : "Vencido"}`, onRemove: () => setFiltros((actual) => ({ ...actual, sla: "todos" })) });
    if (filtros.fecha !== "todos") activos.push({ id: "fecha", label: `Fecha: ${filtros.fecha === "hoy" ? "Hoy" : filtros.fecha === "7d" ? "Últimos 7 días" : "Últimos 30 días"}`, onRemove: () => setFiltros((actual) => ({ ...actual, fecha: "todos" })) });
    if (filtros.empresa) activos.push({ id: "empresa", label: `Empresa: ${opcionesFiltros.empresas.find(([id]) => id === filtros.empresa)?.[1] ?? filtros.empresa.slice(0, 8).toUpperCase()}`, onRemove: () => setFiltros((actual) => ({ ...actual, empresa: "" })) });
    if (filtros.conductor) activos.push({ id: "conductor", label: `Conductor: ${filtros.conductor}`, onRemove: () => setFiltros((actual) => ({ ...actual, conductor: "" })) });
    if (filtros.vehiculo) activos.push({ id: "vehiculo", label: `Vehículo: ${ETIQUETA_TIPO_VEHICULO[filtros.vehiculo as keyof typeof ETIQUETA_TIPO_VEHICULO] ?? filtros.vehiculo}`, onRemove: () => setFiltros((actual) => ({ ...actual, vehiculo: "" })) });
    if (filtros.origen) activos.push({ id: "origen", label: `Origen: ${filtros.origen}`, onRemove: () => setFiltros((actual) => ({ ...actual, origen: "" })) });
    if (filtros.destino) activos.push({ id: "destino", label: `Destino: ${filtros.destino}`, onRemove: () => setFiltros((actual) => ({ ...actual, destino: "" })) });
    if (filtros.incidencia) activos.push({ id: "incidencia", label: "Con incidencia", onRemove: () => setFiltros((actual) => ({ ...actual, incidencia: false })) });
    if (filtros.sinAsignacion) activos.push({ id: "sinAsignacion", label: "Sin asignación", onRemove: () => setFiltros((actual) => ({ ...actual, sinAsignacion: false })) });
    if (filtros.sinCoordenadas) activos.push({ id: "sinCoordenadas", label: "Sin coordenadas", onRemove: () => setFiltros((actual) => ({ ...actual, sinCoordenadas: false })) });
    if (filtros.proximos) activos.push({ id: "proximos", label: "Próximos a iniciar", onRemove: () => setFiltros((actual) => ({ ...actual, proximos: false })) });
    return activos;
  }, [busqueda, filtros, opcionesFiltros.empresas, setPestana]);

  const hayFiltrosActivos = chips.length > 0 || Boolean(filtroKpi) || Boolean(accionOperativa);

  const metricasOperativas = useMemo(() => {
    const fuente = trasladosPorKpi;
    return {
      total: fuente.length,
      riesgo: fuente.filter((traslado) => coincideSla(traslado, "en_riesgo")).length,
      vencidos: fuente.filter((traslado) => coincideSla(traslado, "vencido")).length,
      sinConductor: fuente.filter((traslado) => traslado.estado === "pendiente_de_conductor" || !traslado.conductor_nombre).length,
      inician60: fuente.filter((traslado) => iniciaEn60Min(obtenerInicioProgramado(traslado))).length,
      incidencia: fuente.filter((traslado) => Boolean(traslado.tiene_incidencia_abierta) || Number(traslado.incidencias_abiertas ?? 0) > 0).length,
      sinUbicacion: fuente.filter(sinCoordenadas).length
    };
  }, [trasladosPorKpi]);

  const columnasKanban = useMemo(
    () => [
      {
        id: "riesgo",
        titulo: "En riesgo",
        descripcion: "SLA vencido o atención prioritaria",
        filas: trasladosFiltrados.filter((traslado) => coincideSla(traslado, "en_riesgo"))
      },
      {
        id: "sin_conductor",
        titulo: "Sin conductor",
        descripcion: "Pendientes de asignación",
        filas: trasladosFiltrados.filter((traslado) => traslado.estado === "pendiente_de_conductor" || !traslado.conductor_nombre)
      },
      {
        id: "en_curso",
        titulo: "En curso",
        descripcion: "Traslados activos",
        filas: trasladosFiltrados.filter((traslado) => traslado.estado === "traslado_en_curso")
      },
      {
        id: "cierre",
        titulo: "Cierre",
        descripcion: "Finalizados o por cerrar",
        filas: trasladosFiltrados.filter(
          (traslado) =>
            traslado.estado === "servicio_cerrado" ||
            traslado.estado === "servicio_cancelado" ||
            traslado.estado === "traslado_fallido"
        )
      }
    ],
    [trasladosFiltrados]
  );

  function limpiarFiltrosVista() {
    setBusqueda("");
    setFiltroKpi(null);
    setAccionOperativa(null);
    setPestana("todos");
    setFiltros(FILTROS_INICIALES);
    limpiarParamsFiltroUrl();
  }

  return {
    busqueda,
    setBusqueda,
    filtroKpi,
    setFiltroKpi,
    accionOperativa,
    setAccionOperativa,
    filtros,
    setFiltros,
    filtrosAvanzadosAbiertos,
    setFiltrosAvanzadosAbiertos,
    detalleAbiertoId,
    setDetalleAbiertoId,
    trasladosFiltrados,
    opcionesFiltros,
    sugerenciasBusqueda,
    chips,
    hayFiltrosActivos,
    metricasOperativas,
    columnasKanban,
    limpiarFiltrosVista
  };
}
