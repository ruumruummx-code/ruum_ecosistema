"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Aviso } from "@ruum/ui";
import type { Conductor } from "@ruum/shared/types";
import type { MotivoRechazo } from "@ruum/shared/constants";
import { traducirErrorOperativo, suscribirCanalSeguro } from "@ruum/shared/utils";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "../../lib/supabase-browser";
import {
  listarTrasladosDisponibles,
  listarTrasladosAceptados,
  obtenerConductorActual,
  listarHistorialTrasladosConductor,
  registrarEvento
} from "@ruum/api/services";
import { obtenerTrasladosPorIds } from "@ruum/api/transfers";
import { RejectTripDialog } from "./RejectTripDialog";
import { OfertaCard } from "./OfertaCard";
import { AcceptedTripCard } from "./AcceptedTripCard";
import { UndoRechazoToast } from "./UndoRechazoToast";
import { TrasladosMapa } from "./ViajesMapa";
import { TrasladosSearch, filterTrasladosBySearch } from "./ViajesSearch";
import type { OrdenTraslados } from "./ViajesFilters";
import {
  claveDia,
  crearCalendario,
  detalleFallback,
  normalizarVista,
  type DetalleOperativo,
  type PasaporteRow
} from "./trips-utils";
import { FechaChipSelector } from "./components/FechaChipSelector";
import { CalendarioBottomSheet } from "./components/CalendarioBottomSheet";

type RechazoPendiente = {
  viaje: PasaporteRow;
  motivo: MotivoRechazo;
};

function TripsLoadingList() {
  return (
    <output aria-label="Cargando Traslados" aria-busy="true" className="w-full flex flex-col gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-44 w-full animate-pulse rounded-2xl bg-surface-elevated" />
      ))}
    </output>
  );
}

export default function PaginaTraslados() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [diaSeleccionado, setDiaSeleccionado] = useState("");
  const [diaHoy, setDiaHoy] = useState("");
  const [disponibles, setDisponibles] = useState<PasaporteRow[]>([]);
  const [rechazados, setRechazados] = useState<string[]>([]);
  const [aceptados, setAceptados] = useState<PasaporteRow[]>([]);
  const [historial, setHistorial] = useState<PasaporteRow[]>([]);
  const [detalles, setDetalles] = useState<Record<string, DetalleOperativo>>({});
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [conductor, setConductor] = useState<Conductor | null>(null);
  const [viajeParaRechazar, setViajeParaRechazar] = useState<PasaporteRow | null>(null);
  const [rechazoPendiente, setRechazoPendiente] = useState<RechazoPendiente | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const [orden, setOrden] = useState<OrdenTraslados>(() => {
    const v = searchParams.get("orden") as OrdenTraslados | null;
    return v === "mayor_ganancia" || v === "menor_distancia" ? v : "recientes";
  });
  const [ciudadFiltro, setCiudadFiltro] = useState<string>(() => searchParams.get("ciudad") ?? "todas");
  const [modoMapa, setModoMapa] = useState<"lista" | "mapa">("lista");
  const [estaOnline, setEstaOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [calendarioAbierto, setCalendarioAbierto] = useState(false);

  const timeoutRechazoRef = useRef<number | null>(null);
  const recargaDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const vista = normalizarVista(searchParams.get("vista"));
  const queryActual = searchParams.toString();
  const rutaActual = queryActual ? `/viajes?${queryActual}` : "/viajes";

  function actualizarUrl(cambios: Partial<Record<"vista" | "fecha" | "estado" | "orden" | "ciudad", string>>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(cambios).forEach(([clave, valor]) => {
      if (!valor || valor === "todos" || valor === "recientes") {
        if (clave === "orden" && valor === "recientes") params.delete(clave);
        else if (clave === "ciudad" && (valor === "todas" || !valor)) params.delete(clave);
        else if (clave !== "orden" && clave !== "ciudad") params.delete(clave);
        else if (valor === "todos" || !valor) params.delete(clave);
      } else {
        params.set(clave, valor);
      }
    });
    const query = params.toString();
    router.replace(query ? `/viajes?${query}` : "/viajes", { scroll: false });
  }

  function hrefDetalle(viaje: PasaporteRow) {
    return `/viajes/${viaje.traslado_id}?volver=${encodeURIComponent(rutaActual)}`;
  }

  // Ciclar orden al tocar el ícono de sort en la toolbar
  function ciclarOrden() {
    const siguiente: Record<OrdenTraslados, OrdenTraslados> = {
      recientes: "mayor_ganancia",
      mayor_ganancia: "menor_distancia",
      menor_distancia: "recientes"
    };
    const nuevoOrden = siguiente[orden];
    setOrden(nuevoOrden);
    actualizarUrl({ orden: nuevoOrden });
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(10);
  }

  // Cambiar modo lista/mapa
  function cambiarModo(modo: "lista" | "mapa") {
    setModoMapa(modo);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(10);
    void (async () => {
      try {
        const { Preferences } = await import("@capacitor/preferences");
        await Preferences.set({ key: "ruum_conductor_Traslados_modo", value: modo });
      } catch {}
      try {
        localStorage.setItem("ruum_conductor_Traslados_modo", modo);
      } catch {}
    })();
  }

  // Escuchar estado de conexión
  useEffect(() => {
    const actualizar = () => setEstaOnline(navigator.onLine);
    window.addEventListener("online", actualizar);
    window.addEventListener("offline", actualizar);
    return () => {
      window.removeEventListener("online", actualizar);
      window.removeEventListener("offline", actualizar);
    };
  }, []);

  // Preferencia Lista | Mapa — Persistida en Preferences (Capacitor) + localStorage fallback
  useEffect(() => {
    let cancelado = false;
    async function cargarModo() {
      try {
        const { Preferences } = await import("@capacitor/preferences");
        const { value } = await Preferences.get({ key: "ruum_conductor_Traslados_modo" });
        if (!cancelado && (value === "mapa" || value === "lista")) setModoMapa(value);
        return;
      } catch {}
      try {
        const v = localStorage.getItem("ruum_conductor_Traslados_modo");
        if (!cancelado && (v === "mapa" || v === "lista")) setModoMapa(v as "lista" | "mapa");
      } catch {}
    }
    void cargarModo();
    return () => {
      cancelado = true;
    };
  }, []);

  // Inicializar fecha de hoy
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const hoy = claveDia(new Date());
      setDiaHoy(hoy);
      setDiaSeleccionado((actual) => actual || hoy);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRechazoRef.current) {
        window.clearTimeout(timeoutRechazoRef.current);
      }
    };
  }, []);

  // Carga principal de datos
  useEffect(() => {
    async function cargar() {
      if (!tieneSupabaseConfigurado()) {
        setAviso("Supabase no está configurado. No se pueden consultar Traslados reales.");
        setCargando(false);
        setRefrescando(false);
        return;
      }

      try {
        const cliente = crearClienteNavegador();
        const real = await obtenerConductorActual(cliente);
        const conductorActual: Conductor | null = real
          ? {
              id: real.id,
              nombre: real.nombre,
              estado: real.estado,
              calificacion_promedio: real.calificacion_promedio,
              traslados_completados: real.traslados_completados,
              suspensiones_activas: real.suspensiones_activas,
              no_presentaciones_6m: real.no_presentaciones_6m,
              cancelaciones_sin_justificacion_count: real.cancelaciones_sin_justificacion_count,
              documentos_vigentes: real.documentos_vigentes,
              certificaciones: [],
              incidencias_graves_6m: real.incidencias_graves_6m,
              incidencias_graves_12m: real.incidencias_graves_12m,
              creado_en: real.creado_en
            }
          : null;

        if (conductorActual) setConductor(conductorActual);

        const resultados = await Promise.allSettled([
          listarTrasladosDisponibles(cliente),
          conductorActual ? listarTrasladosAceptados(cliente, conductorActual.id) : Promise.resolve([] as PasaporteRow[]),
          conductorActual ? listarHistorialTrasladosConductor(cliente, conductorActual.id) : Promise.resolve([] as PasaporteRow[])
        ]);
        const listaDisponibles = resultados[0].status === "fulfilled" ? resultados[0].value : [];
        const listaAceptados = resultados[1].status === "fulfilled" ? resultados[1].value : [];
        const historialTraslados = resultados[2].status === "fulfilled" ? resultados[2].value : [];
        if (resultados.some((r) => r.status === "rejected")) {
          console.warn("Algunos listados fallaron, mostrando datos parciales", resultados);
        }

        const todos = [...listaDisponibles, ...listaAceptados];
        if (todos.length > 0) {
          const ids = todos.map((viaje) => viaje.traslado_id).filter((id): id is string => Boolean(id));
          if (ids.length > 0) {
            const filas = await obtenerTrasladosPorIds(cliente, ids);
            const detallesReales = Object.fromEntries(
              filas.map((fila) => {
                const viaje = todos.find((item) => item.traslado_id === fila.id);
                return [
                  fila.id,
                  {
                    origen: `${fila.origen_ciudad} · ${fila.origen_direccion}`,
                    destino: `${fila.destino_ciudad} · ${fila.destino_direccion}`,
                    fechaHora: fila.fecha_hora_programada ?? new Date().toISOString(),
                    tipoServicio: fila.motivo_servicio ?? fila.tipo_servicio ?? "Traslado estándar",
                    requisitos: fila.instrucciones_especiales ?? "Sin requisitos especiales.",
                    distanciaKm: viaje?.distancia_km ?? null,
                    tiempoEstimadoHoras: viaje?.tiempo_estimado_horas ?? null,
                    gananciaConductorOficial: viaje?.ganancia_conductor ?? null,
                    estadoEconomico: "sin_calcular"
                  } satisfies DetalleOperativo
                ];
              })
            );
            setDetalles((prev) => ({ ...prev, ...detallesReales }));
          }
        }

        setDisponibles(listaDisponibles);
        setAceptados(listaAceptados);
        setHistorial(historialTraslados);
        if (!conductorActual) {
          setAviso("Inicia sesión como conductor para aceptar y ver tus traslados.");
        }
      } catch (err) {
        setAviso(traducirErrorOperativo(err, "No pudimos cargar los traslados."));
      } finally {
        setCargando(false);
        setRefrescando(false);
      }
    }
    void cargar();
  }, [refreshCount]);

  // Suscripción Realtime a Traslados
  useEffect(() => {
    if (!tieneSupabaseConfigurado()) return;

    let cliente: ReturnType<typeof crearClienteNavegador>;
    try {
      cliente = crearClienteNavegador();
    } catch {
      return;
    }

    const triggerRecarga = () => {
      if (recargaDebounceRef.current) clearTimeout(recargaDebounceRef.current);
      recargaDebounceRef.current = setTimeout(() => {
        setRefrescando(true);
        setRefreshCount((prev) => prev + 1);
      }, 600);
    };

    const canalTraslados = cliente
      .channel("Traslados_lista_traslados")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "traslados" },
        () => triggerRecarga()
      );

    const desuscribir = suscribirCanalSeguro(cliente, canalTraslados, {
      onError: (err) => console.warn("[Traslados] error en canalTraslados", err)
    });

    return () => {
      if (recargaDebounceRef.current) clearTimeout(recargaDebounceRef.current);
      void desuscribir();
    };
  }, []);

  async function persistirRechazo(pendiente: RechazoPendiente) {
    if (!conductor) throw new Error("Inicia sesión como conductor para registrar el rechazo.");
    if (!pendiente.viaje.traslado_id) throw new Error("No se pudo identificar el traslado.");
    const cliente = crearClienteNavegador();
    await registrarEvento(cliente, "modificacion_traslado_activo", "conductor", conductor.id, {
      traslado_id: pendiente.viaje.traslado_id,
      accion: "rechazo_oferta_conductor",
      motivo: pendiente.motivo
    });
    setRechazoPendiente(null);
    setAviso("Rechazo registrado.");
  }

  function confirmarRechazo(motivo: MotivoRechazo) {
    if (!viajeParaRechazar || rechazoPendiente) return;
    if (!viajeParaRechazar.traslado_id) {
      setAviso("No se pudo identificar el traslado para rechazarlo.");
      setViajeParaRechazar(null);
      return;
    }

    const trasladoId = viajeParaRechazar.traslado_id;
    const pendiente = { viaje: viajeParaRechazar, motivo };
    setViajeParaRechazar(null);
    setRechazados((prev) => [...prev, trasladoId]);
    setDisponibles((prev) => prev.filter((viaje) => viaje.traslado_id !== trasladoId));
    setRechazoPendiente(pendiente);
    setAviso(null);

    timeoutRechazoRef.current = window.setTimeout(() => {
      void persistirRechazo(pendiente).catch((err) => {
        setAviso(traducirErrorOperativo(err, "No pudimos registrar el rechazo."));
      });
    }, 8000);
  }

  function deshacerRechazo() {
    if (!rechazoPendiente) return;
    if (timeoutRechazoRef.current) {
      window.clearTimeout(timeoutRechazoRef.current);
      timeoutRechazoRef.current = null;
    }

    const { viaje } = rechazoPendiente;
    setDisponibles((prev) => (prev.some((item) => item.traslado_id === viaje.traslado_id) ? prev : [viaje, ...prev]));
    setRechazados((prev) => prev.filter((id) => id !== viaje.traslado_id));
    setRechazoPendiente(null);
    setAviso("Rechazo deshecho. El traslado volvió a estar disponible.");
  }

  const disponiblesVisibles = useMemo(
    () => disponibles.filter((viaje) => viaje.traslado_id && !rechazados.includes(viaje.traslado_id)),
    [disponibles, rechazados]
  );
  const calendario = useMemo(() => crearCalendario(disponiblesVisibles, aceptados, detalles), [disponiblesVisibles, aceptados, detalles]);
  const [visibleCount, setVisibleCount] = useState(10);

  const diaCalendarioSeleccionado = calendario.find(({ dia }) => claveDia(dia) === diaSeleccionado) ?? calendario[0];

  // Lista cruda del día seleccionado
  const rawListToRender = useMemo(() => {
    if (!diaCalendarioSeleccionado) return [];
    return diaCalendarioSeleccionado.Traslados.filter((item) => {
      if (vista === "disponibles") return item.tipo === "Ofertado";
      return item.tipo !== "Ofertado";
    });
  }, [diaCalendarioSeleccionado, vista]);

  // Ciudades disponibles para el filtro
  const ciudadesDisponibles = useMemo(() => {
    const set = new Set<string>();
    rawListToRender.forEach((item) => {
      if (item.viaje.origen_ciudad) set.add(item.viaje.origen_ciudad);
    });
    return Array.from(set);
  }, [rawListToRender]);

  // Obtener query de búsqueda de URL
  const searchQuery = searchParams.get("q") ?? "";

  // Lista filtrada y ordenada
  const listToRender = useMemo(() => {
    let result = [...rawListToRender];

    // Filtrar por ciudad
    if (ciudadFiltro !== "todas") {
      result = result.filter((item) => item.viaje.origen_ciudad === ciudadFiltro);
    }

    // Filtrar por búsqueda (AI-002)
    if (searchQuery.trim()) {
      result = result.filter((item) =>
        filterTrasladosBySearch(item.viaje, searchQuery)
      );
    }

    if (orden === "mayor_ganancia") {
      result.sort((a, b) => (b.viaje.ganancia_conductor ?? 0) - (a.viaje.ganancia_conductor ?? 0));
    } else if (orden === "menor_distancia") {
      result.sort((a, b) => (a.viaje.distancia_km ?? 9999) - (b.viaje.distancia_km ?? 9999));
    }

    return result;
  }, [rawListToRender, ciudadFiltro, orden, searchQuery]);

  const tieneOfertasOtrosDias = calendario.some(
    ({ dia, Traslados }) => claveDia(dia) !== diaSeleccionado && Traslados.some((v) => v.tipo === "Ofertado")
  );
  const diaConOfertas = calendario.find(({ dia, Traslados }) => claveDia(dia) !== diaSeleccionado && Traslados.some((v) => v.tipo === "Ofertado"));
  const diaConOfertasLabel = diaConOfertas
    ? new Intl.DateTimeFormat("es-MX", { weekday: "long", day: "numeric", timeZone: "America/Mexico_City" }).format(diaConOfertas.dia)
    : "otro día";

  // Reset paginación al cambiar filtros/vista/día
  useEffect(() => {
    setVisibleCount(10);
  }, [vista, ciudadFiltro, orden, diaSeleccionado]);

  const listToRenderVisible = useMemo(() => listToRender.slice(0, visibleCount), [listToRender, visibleCount]);

  const ORDEN_LABEL: Record<OrdenTraslados, string> = {
    recientes: "Recientes",
    mayor_ganancia: "Mayor ganancia",
    menor_distancia: "Menor distancia"
  };

  // Estado vacío (variables extraídas para evitar ternarios anidados en el JSX)
  const estaVacio = listToRender.length === 0;
  const iconoVacio =
    rawListToRender.length > 0 && estaVacio
      ? "🔍"
      : vista === "disponibles"
      ? "📭"
      : "📋";
  const tituloVacio =
    rawListToRender.length > 0 && estaVacio
      ? "Sin resultados con estos filtros"
      : vista === "disponibles"
      ? "Sin traslados para este día"
      : "No tienes traslados aceptados para esta fecha";
  const textoVacio =
    rawListToRender.length > 0 && estaVacio
      ? `Hay ${rawListToRender.length} ofertas este día, pero ninguna coincide con tus filtros actuales.`
      : vista === "disponibles"
      ? "No hay ofertas programadas en esta fecha. Revisa otro día o cambia el orden."
      : "Acepta una oferta para verla aquí.";

  // Contenido principal (lista o vacío), extraído para simplificar el return
  const contenidoPrincipal = cargando ? (
    <TripsLoadingList />
  ) : estaVacio ? (
    <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
      <div className="size-10 rounded-2xl bg-surface border border-border/20 flex items-center justify-center text-3xl mb-2" aria-hidden>
        {iconoVacio}
      </div>
      <p className="font-display text-sm font-bold text-text-primary">{tituloVacio}</p>
      <p className="mt-1 font-body text-xs text-text-secondary max-w-[260px] leading-relaxed">{textoVacio}</p>
      {rawListToRender.length > 0 && estaVacio ? (
        <div className="mt-4 flex flex-col gap-2 w-full max-w-[260px]">
          <button
            type="button"
            onClick={() => {
              setCiudadFiltro("todas");
              setOrden("recientes");
              actualizarUrl({ ciudad: "todas", orden: "recientes" });
            }}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-signal text-slate-950 px-5 py-3 font-display text-sm font-black shadow-sm focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-signal"
          >
            Limpiar filtros
          </button>
        </div>
      ) : tieneOfertasOtrosDias && diaConOfertas ? (
        <div className="mt-4 flex flex-col gap-2 w-full max-w-[260px]">
          <button
            type="button"
            onClick={() => setDiaSeleccionado(claveDia(diaConOfertas.dia))}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-route-action/30 bg-route-soft px-5 py-3 font-body text-sm font-bold text-route-action hover:bg-route-soft/70 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-route-action"
          >
            Ver ofertas del {diaConOfertasLabel} →
          </button>
        </div>
      ) : null}
    </div>
  ) : (
    <div className="flex flex-col gap-3.5">
      {listToRenderVisible.map((item, index) => {
        const viaje = item.viaje;
        const trasladoId = viaje.traslado_id ?? `viaje-${index}`;
        const detalle = detalles[trasladoId] ?? detalleFallback(viaje);

        if (vista === "disponibles") {
          return (
            <OfertaCard
              key={trasladoId}
              viaje={viaje}
              detalle={detalle}
              hrefDetalle={hrefDetalle(viaje)}
            />
          );
        }

        return (
          <AcceptedTripCard
            key={trasladoId}
            viaje={viaje}
            detalle={detalle}
            onReject={(viaje) => setViajeParaRechazar(viaje)}
            hrefDetalle={hrefDetalle(viaje)}
          />
        );
      })}
      {listToRender.length > visibleCount && (
        <button
          type="button"
          onClick={() => setVisibleCount((v) => v + 10)}
          className="mt-2 inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-surface px-5 py-3 font-body text-sm font-bold text-text-primary hover:bg-surface-elevated focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-route-action"
        >
          Cargar más ({listToRender.length - visibleCount} restantes)
        </button>
      )}
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-md px-4 py-6 sm:px-6 sm:py-10 flex flex-col justify-between min-h-[calc(100vh-100px)] text-text-primary">
      <div className="w-full flex flex-col flex-1 pb-16">
        {/* Refresh bar */}
        {refrescando && (
          <div className="pointer-events-none fixed left-0 right-0 top-0 z-50 h-1 bg-signal/20" aria-hidden>
            <div className="h-full w-1/3 animate-pulse conductor-refresh-bar bg-signal" />
          </div>
        )}

        {/* ===================== HEADER LIGERO =====================
           Título + Segmented Control Ofertas / Aceptados.
           Los iconos de notificaciones y soporte viven en el header global (layout). ===================== */}
        <header className="mb-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-body text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Traslados</span>
            <span className={`h-1.5 w-1.5 rounded-full ${estaOnline ? "bg-signal animate-pulse" : "bg-danger"}`} aria-hidden />
            <span className="text-xs font-bold text-text-tertiary">{estaOnline ? "En vivo" : "Sin conexión"}</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary leading-none">
            {vista === "disponibles" ? "Ofertas" : "Aceptados"}
          </h1>

          {/* Segmented Control integrado en el Header */}
          <div
            role="tablist"
            aria-label="Vistas de traslados"
            className="mt-2 flex w-full rounded-xl border border-border/20 bg-surface-elevated p-1 select-none"
          >
            <button
              type="button"
              role="tab"
              id="tab-ofertas"
              aria-selected={vista === "disponibles"}
              aria-controls="panel-traslados"
              onClick={() => actualizarUrl({ vista: "disponibles" })}
              className={`flex-1 rounded-xl px-3 text-center text-sm font-bold transition-all duration-200 cursor-pointer min-h-11 flex items-center justify-center tabular-nums focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-route-action ${
                vista === "disponibles"
                  ? "bg-signal text-slate-950 shadow-md"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Ofertas <span className="ml-1 tabular-nums">({disponiblesVisibles.length})</span>
            </button>
            <button
              type="button"
              role="tab"
              id="tab-aceptados"
              aria-selected={vista === "mis-Traslados"}
              aria-controls="panel-traslados"
              onClick={() => actualizarUrl({ vista: "mis-Traslados" })}
              className={`flex-1 rounded-xl px-3 text-center text-sm font-bold transition-all duration-200 cursor-pointer min-h-11 flex items-center justify-center tabular-nums focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-route-action ${
                vista === "mis-Traslados"
                  ? "bg-signal text-slate-950 shadow-md"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Aceptados <span className="ml-1 tabular-nums">({aceptados.length})</span>
            </button>
          </div>
        </header>

        {/* ===================== TOOLBAR ÚNICA =====================
           Búsqueda + ícono toggle Lista/Mapa + ícono ordenamiento (Sort). ===================== */}
        <div className="mt-3 flex flex-col gap-2">
          <TrasladosSearch placeholder="Buscar ofertas..." />
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              aria-pressed={modoMapa === "mapa"}
              aria-label={modoMapa === "mapa" ? "Cambiar a vista lista" : "Cambiar a vista mapa"}
              onClick={() => cambiarModo(modoMapa === "mapa" ? "lista" : "mapa")}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/20 bg-surface-elevated text-text-primary hover:text-route-action transition-colors cursor-pointer shadow-xs focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-route-action"
            >
              {modoMapa === "mapa" ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                  <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                  <line x1="8" y1="2" x2="8" y2="18" />
                  <line x1="16" y1="6" x2="16" y2="22" />
                </svg>
              )}
              {listToRender.length > 0 && (
                <span className={`absolute -top-1 -right-1 rounded-full px-1.5 py-0.5 text-[9px] font-black tabular-nums ${
                  modoMapa === "mapa" ? "bg-slate-950 text-signal" : "bg-border text-text-tertiary"
                }`}>{listToRender.length}</span>
              )}
            </button>

            <button
              type="button"
              onClick={ciclarOrden}
              aria-label={`Ordenar por: ${ORDEN_LABEL[orden]}`}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/20 bg-surface-elevated text-text-primary hover:text-route-action transition-colors cursor-pointer shadow-xs focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-route-action"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-signal text-[9px] font-black text-slate-950 shadow-xs">
                {orden.charAt(0).toUpperCase()}
              </span>
            </button>
          </div>
        </div>

        {/* ===================== SELECTOR DE FECHA COLAPSADO =====================
           Reemplaza el carrusel de semana (DO 11, LU 12, etc.). Abre un Bottom Sheet
           de calendario al hacer tap. ===================== */}
        <FechaChipSelector
          calendario={calendario}
          diaSeleccionado={diaSeleccionado}
          diaHoy={diaHoy}
          onSelectDia={setDiaSeleccionado}
          onAbrirCalendario={() => setCalendarioAbierto(true)}
        />

        {/* Banner Modo Offline */}
        {!estaOnline && (
          <div className="mt-3">
            <Aviso tono="atencion">
              <span className="font-bold">Modo sin conexión:</span> Mostrando traslados guardados localmente. Conéctate a internet para ver y aceptar nuevas ofertas.
            </Aviso>
          </div>
        )}

        {/* Mapa de ofertas (vista geográfica) */}
        {modoMapa === "mapa" && !cargando && listToRender.length > 0 && (
          <div className="mt-3">
            <TrasladosMapa
              Traslados={listToRender.map((it) => it.viaje)}
              onSelect={(viaje) => router.push(hrefDetalle(viaje))}
              vistaId={`${vista}-${diaSeleccionado}-${orden}-${ciudadFiltro}`}
            />
            <p className="mt-2 font-body text-[11px] text-center text-text-tertiary">
              Vista geográfica · {listToRender.length} ofertas · Toca un pin o vuelve a Lista para detalle completo
            </p>
          </div>
        )}

        {/* Lista de tarjetas o estado vacío */}
        <div
          id="panel-traslados"
          role="tabpanel"
          aria-labelledby={vista === "disponibles" ? "tab-ofertas" : "tab-aceptados"}
          className={`mt-3 flex flex-col gap-3.5 ${modoMapa === "mapa" && !cargando && listToRender.length > 0 ? "hidden" : ""}`}
        >
          {contenidoPrincipal}
        </div>

        {aviso && (
          <output className="mt-4 block" aria-live="polite" aria-atomic="true">
            <Aviso tono="info">{aviso}</Aviso>
          </output>
        )}
      </div>

      {/* Toast Flotante para Deshacer Rechazo */}
      {rechazoPendiente && (
        <UndoRechazoToast
          viaje={rechazoPendiente.viaje}
          motivo={rechazoPendiente.motivo}
          onDeshacer={deshacerRechazo}
        />
      )}

      {/* Diálogo Accesible para Rechazar Traslado */}
      <RejectTripDialog
        viaje={viajeParaRechazar}
        onClose={() => setViajeParaRechazar(null)}
        onConfirm={confirmarRechazo}
      />

      {/* Bottom Sheet de Calendario (selector de fecha) */}
      <CalendarioBottomSheet
        abierto={calendarioAbierto}
        onCerrar={() => setCalendarioAbierto(false)}
        calendario={calendario}
        diaSeleccionado={diaSeleccionado}
        diaHoy={diaHoy}
        onSelectDia={setDiaSeleccionado}
      />
    </div>
  );
}
