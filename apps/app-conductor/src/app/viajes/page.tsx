"use client";

import { Button as BaseButton } from "@ruum/ui/base";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { contarNotificacionesNoLeidas } from "@ruum/api/drivers";
import { obtenerTrasladosPorIds } from "@ruum/api/transfers";
import { RejectTripDialog } from "./RejectTripDialog";
import { OfertaCard } from "./OfertaCard";
import { AcceptedTripCard } from "./AcceptedTripCard";
import { DriverTrasladosView } from "./DriverTrasladosView";
import styles from "./traslados.module.css";
import { TrasladosFilters, type OrdenTraslados } from "./ViajesFilters";
import { TrasladosMapa } from "./ViajesMapa";
import { filterTrasladosBySearch } from "./ViajesSearch";
import {
  claveDia,
  crearCalendario,
  detalleFallback,
  esTrasladoAceptado,
  listarViajesDeVista,
  normalizarVista,
  type DetalleOperativo,
  type PasaporteRow
} from "./trips-utils";

export default function PaginaTraslados() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [diaSeleccionado, setDiaSeleccionado] = useState("");
  const [diaHoy, setDiaHoy] = useState("");
  const [disponibles, setDisponibles] = useState<PasaporteRow[]>([]);
  const [aceptados, setAceptados] = useState<PasaporteRow[]>([]);
  const [historial, setHistorial] = useState<PasaporteRow[]>([]);
  const [detalles, setDetalles] = useState<Record<string, DetalleOperativo>>({});
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [conductor, setConductor] = useState<Conductor | null>(null);
  const [viajeParaRechazar, setViajeParaRechazar] = useState<PasaporteRow | null>(null);
  const [enviandoLiberacion, setEnviandoLiberacion] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  const [notificacionesCount, setNotificacionesCount] = useState(0);
  const [orden, setOrden] = useState<OrdenTraslados>(() => {
    const v = searchParams.get("orden") as OrdenTraslados | null;
    return v === "mayor_ganancia" || v === "menor_distancia" ? v : "recientes";
  });
  const [ciudadFiltro, setCiudadFiltro] = useState<string>(() => searchParams.get("ciudad") ?? "todas");
  const [modoMapa, setModoMapa] = useState<"lista" | "mapa">("lista");
  const [estaOnline, setEstaOnline] = useState(true);

  const recargaDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const vista = normalizarVista(searchParams.get("vista"));
  const queryActual = searchParams.toString();
  const rutaActual = queryActual ? `/viajes?${queryActual}` : "/viajes";

  function actualizarUrl(cambios: Partial<Record<"vista" | "fecha" | "estado" | "orden" | "ciudad" | "q", string>>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(cambios).forEach(([clave, valor]) => {
      if (!valor || valor === "todos" || (clave === "orden" && valor === "recientes") || (clave === "ciudad" && valor === "todas")) {
        params.delete(clave);
      } else {
        params.set(clave, valor);
      }
    });
    const query = params.toString();
    // Los filtros son locales; History sincroniza useSearchParams sin pedir otra página al servidor.
    window.history.replaceState(null, "", query ? `/viajes?${query}` : "/viajes");
  }

  function hrefDetalle(viaje: PasaporteRow) {
    return `/viajes/${viaje.traslado_id}?volver=${encodeURIComponent(rutaActual)}`;
  }

  // Escuchar estado de conexión
  useEffect(() => {
    const actualizar = () => setEstaOnline(navigator.onLine);
    actualizar();
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
        // Intentar Preferences (nativo)
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

  // Notificaciones no leídas
  useEffect(() => {
    async function cargarNotificacionesCount() {
      if (!tieneSupabaseConfigurado()) return;
      try {
        setNotificacionesCount(await contarNotificacionesNoLeidas(crearClienteNavegador()));
      } catch {
        // Ignorar
      }
    }
    void cargarNotificacionesCount();
    const actualizar = () => void cargarNotificacionesCount();
    window.addEventListener("ruum:notificaciones-actualizar", actualizar);
    return () => window.removeEventListener("ruum:notificaciones-actualizar", actualizar);
  }, []);

  const fechaUrl = searchParams.get("fecha");
  // Mantiene la fecha seleccionada al navegar y permite cambiar de semana.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const hoy = claveDia(new Date());
      setDiaHoy(hoy);
      const fecha = fechaUrl && /^\d{4}-\d{2}-\d{2}$/.test(fechaUrl) ? new Date(`${fechaUrl}T12:00:00Z`) : null;
      setDiaSeleccionado(fecha && !Number.isNaN(fecha.getTime()) && claveDia(fecha) === fechaUrl ? fechaUrl : hoy);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fechaUrl]);

  // Carga principal de datos
  useEffect(() => {
    async function cargar() {
      if (!tieneSupabaseConfigurado()) {
        setErrorCarga("No pudimos consultar los traslados. Inténtalo más tarde.");
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
        const fallidos = resultados.filter((r) => r.status === "rejected").length;
        if (fallidos > 0) {
          console.warn("Algunos listados fallaron, mostrando datos parciales", resultados);
        }
        // Una consulta fallida nunca debe parecer una lista vacía.
        setErrorCarga(
          fallidos === resultados.length
            ? "No pudimos cargar los traslados. Revisa tu conexión e inténtalo de nuevo."
            : fallidos > 0
              ? "No pudimos cargar todos los traslados. Lo que ves puede estar incompleto."
              : null
        );

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
                    fechaHoraProgramada: fila.fecha_hora_programada,
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
        setAceptados(listaAceptados.filter(esTrasladoAceptado));
        setHistorial(historialTraslados);
        if (!conductorActual) {
          setAviso("Inicia sesión como conductor para aceptar y ver tus traslados.");
        }
      } catch (err) {
        setErrorCarga(traducirErrorOperativo(err, "No pudimos cargar los traslados."));
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

  async function confirmarLiberacion(motivo: MotivoRechazo) {
    if (!viajeParaRechazar || enviandoLiberacion) return;
    const trasladoId = viajeParaRechazar.traslado_id;
    if (!conductor || !trasladoId) {
      setAviso("No pudimos identificar el traslado. Recarga la lista e inténtalo de nuevo.");
      setViajeParaRechazar(null);
      return;
    }

    // Se envía al momento: el conductor no puede desasignarse solo, así que
    // operación recibe la solicitud y el traslado sigue en "Mis traslados".
    setEnviandoLiberacion(true);
    try {
      await registrarEvento(crearClienteNavegador(), "modificacion_traslado_activo", "conductor", conductor.id, {
        traslado_id: trasladoId,
        accion: "rechazo_oferta_conductor",
        motivo
      });
      setViajeParaRechazar(null);
      setAviso("Solicitud de liberación enviada. Operación te confirmará; mientras tanto, el traslado sigue asignado a ti.");
    } catch (err) {
      setViajeParaRechazar(null);
      setAviso(traducirErrorOperativo(err, "No pudimos enviar la solicitud de liberación. Inténtalo de nuevo o contacta a soporte."));
    } finally {
      setEnviandoLiberacion(false);
    }
  }

  const disponiblesVisibles = useMemo(
    () => disponibles.filter((viaje) => Boolean(viaje.traslado_id)),
    [disponibles]
  );
  const calendario = useMemo(() => diaSeleccionado ? crearCalendario(disponiblesVisibles, aceptados, detalles, new Date(`${diaSeleccionado}T12:00:00Z`)) : [], [disponiblesVisibles, aceptados, detalles, diaSeleccionado]);

  const fechaFiltro = fechaUrl && /^\d{4}-\d{2}-\d{2}$/.test(fechaUrl) ? diaSeleccionado : null;
  const rawListToRender = useMemo(() => {
    if (vista === "historial") {
      return historial.map((viaje) => ({ viaje, tipo: "Historial" }));
    }
    return listarViajesDeVista(
      disponiblesVisibles, aceptados, detalles, vista, fechaFiltro
    );
  }, [disponiblesVisibles, aceptados, historial, detalles, vista, fechaFiltro]);

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


  return <>
    <DriverTrasladosView
      online={estaOnline} refreshing={refrescando} loading={cargando} notifications={notificacionesCount}
      offers={disponiblesVisibles.length} accepted={aceptados.length} history={historial.length} showingOffers={vista === "disponibles"} vista={vista}
      filtered={Boolean(searchQuery.trim()) || ciudadFiltro !== "todas"}
      calendar={calendario} selectedDay={diaSeleccionado} today={diaHoy}
      allDates={!fechaFiltro} onAllDates={() => actualizarUrl({ fecha: "" })}
      onSelectDay={(fecha) => { setDiaSeleccionado(fecha); actualizarUrl({ fecha }); }}
      onTab={(tab) => actualizarUrl({ vista: typeof tab === "string" ? tab : tab ? "disponibles" : "mis-Traslados" })}
      onRefresh={() => { setRefrescando(true); setRefreshCount((prev) => prev + 1); }}
      onSort={() => { setOrden("mayor_ganancia"); actualizarUrl({ orden: "mayor_ganancia" }); }}
      sortActive={orden === "mayor_ganancia"}
      onClear={() => { setCiudadFiltro("todas"); setOrden("recientes"); actualizarUrl({ ciudad: "todas", orden: "recientes", q: "" }); }}
      notice={!estaOnline ? "Sin conexión. Conéctate a internet para actualizar las ofertas." : aviso}
      error={errorCarga}
      filters={<>
        <div role="group" aria-label="Vista Lista o Mapa" className={styles.modeSwitch}>
          <BaseButton variant="ghost" type="button" aria-pressed={modoMapa === "lista"} onClick={() => cambiarModo("lista")}>Lista</BaseButton>
          <BaseButton variant="ghost" type="button" aria-pressed={modoMapa === "mapa"} onClick={() => cambiarModo("mapa")}>Mapa</BaseButton>
        </div>
        <TrasladosFilters orden={orden} onCambiarOrden={(valor) => { setOrden(valor); actualizarUrl({ orden: valor }); }} ciudadFiltro={ciudadFiltro}
        onCambiarCiudad={(valor) => { setCiudadFiltro(valor); actualizarUrl({ ciudad: valor }); }} ciudadesDisponibles={ciudadesDisponibles} /></>}
    >
      {listToRender.length > 0 ? <div className={styles.results}>
        <p className={styles.resultsCount} aria-live="polite">{listToRender.length} {vista === "disponibles" ? listToRender.length === 1 ? "oferta disponible" : "ofertas disponibles" : vista === "historial" ? listToRender.length === 1 ? "traslado en el historial" : "traslados en el historial" : listToRender.length === 1 ? "traslado aceptado" : "traslados aceptados"}</p>
        {/* Todas las tarjetas a la vista para poder comparar ofertas; el mapa acompaña a la primera. */}
        {listToRender.map((item, indice) => {
          const mapa = indice === 0 && modoMapa === "mapa" ? <TrasladosMapa onReturnToList={() => cambiarModo("lista")} Traslados={listToRender.map((it) => it.viaje)} onSelect={(viaje) => router.push(hrefDetalle(viaje))} vistaId={rutaActual} /> : undefined;
          const detalle = detalles[item.viaje.traslado_id ?? ""] ?? detalleFallback(item.viaje);
          return <div key={item.viaje.traslado_id ?? indice} className={styles.resultCard}>
            {vista === "disponibles" ? <OfertaCard compact viaje={item.viaje} detalle={detalle} hrefDetalle={hrefDetalle(item.viaje)} mapPreview={mapa} />
              : <AcceptedTripCard compact viaje={item.viaje} detalle={detalle} hrefDetalle={hrefDetalle(item.viaje)} onReject={setViajeParaRechazar} mapPreview={mapa} />}
          </div>;
        })}
      </div> : undefined}
    </DriverTrasladosView>
    <RejectTripDialog viaje={viajeParaRechazar} enviando={enviandoLiberacion} onClose={() => setViajeParaRechazar(null)} onConfirm={(motivo) => void confirmarLiberacion(motivo)} />
  </>;
}
