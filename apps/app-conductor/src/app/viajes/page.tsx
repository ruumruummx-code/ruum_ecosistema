"use client";

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
import { UndoRechazoToast } from "./UndoRechazoToast";
import { TrasladosMapa } from "./ViajesMapa";
import { filterTrasladosBySearch } from "./ViajesSearch";
import { PanelSupportSheet } from "../panel/PanelSupportSheet";
import {
  claveDia,
  crearCalendario,
  detalleFallback,
  normalizarVista,
  type DetalleOperativo,
  type PasaporteRow
} from "./trips-utils";

type RechazoPendiente = {
  viaje: PasaporteRow;
  motivo: MotivoRechazo;
};

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
  const [soporteAbierto, setSoporteAbierto] = useState(false);
  const [notificacionesCount, setNotificacionesCount] = useState(0);
  const [orden, setOrden] = useState<OrdenTraslados>(() => {
    const v = searchParams.get("orden") as OrdenTraslados | null;
    return v === "mayor_ganancia" || v === "menor_distancia" ? v : "recientes";
  });
  const [ciudadFiltro, setCiudadFiltro] = useState<string>(() => searchParams.get("ciudad") ?? "todas");
  const [modoMapa, setModoMapa] = useState<"lista" | "mapa">("lista");
  const [estaOnline, setEstaOnline] = useState(true);

  const timeoutRechazoRef = useRef<number | null>(null);
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
        setAviso("No pudimos consultar los traslados. Inténtalo más tarde.");
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
  const calendario = useMemo(() => diaSeleccionado ? crearCalendario(disponiblesVisibles, aceptados, detalles, new Date(`${diaSeleccionado}T12:00:00Z`)) : [], [disponiblesVisibles, aceptados, detalles, diaSeleccionado]);
  const [paginaActual, setPaginaActual] = useState(0);

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

  useEffect(() => { setPaginaActual(0); }, [vista, ciudadFiltro, orden, diaSeleccionado, searchQuery]);
  const indiceTarjeta = Math.min(paginaActual, Math.max(0, listToRender.length - 1));
  const item = listToRender[indiceTarjeta];

  return <>
    <DriverTrasladosView
      online={estaOnline} refreshing={refrescando} loading={cargando} notifications={notificacionesCount}
      offers={disponiblesVisibles.length} accepted={aceptados.length} showingOffers={vista === "disponibles"}
      filtered={Boolean(searchQuery.trim()) || ciudadFiltro !== "todas"}
      calendar={calendario} selectedDay={diaSeleccionado} today={diaHoy}
      onSelectDay={(fecha) => { setDiaSeleccionado(fecha); actualizarUrl({ fecha }); }}
      onTab={(ofertas) => actualizarUrl({ vista: ofertas ? "disponibles" : "mis-Traslados" })}
      onRefresh={() => { setRefrescando(true); setRefreshCount((prev) => prev + 1); }}
      onHelp={() => setSoporteAbierto(true)}
      onSort={() => { setOrden("mayor_ganancia"); actualizarUrl({ orden: "mayor_ganancia" }); }}
      sortActive={orden === "mayor_ganancia"}
      onClear={() => { setCiudadFiltro("todas"); setOrden("recientes"); actualizarUrl({ ciudad: "todas", orden: "recientes", q: "" }); }}
      notice={!estaOnline ? "Sin conexión. Conéctate a internet para actualizar las ofertas." : aviso}
      filters={<>
        <div role="group" aria-label="Vista Lista o Mapa" className={styles.modeSwitch}>
          <button type="button" aria-pressed={modoMapa === "lista"} onClick={() => cambiarModo("lista")}>Lista</button>
          <button type="button" aria-pressed={modoMapa === "mapa"} onClick={() => cambiarModo("mapa")}>Mapa</button>
        </div>
        <TrasladosFilters orden={orden} onCambiarOrden={(valor) => { setOrden(valor); actualizarUrl({ orden: valor }); }} ciudadFiltro={ciudadFiltro}
        onCambiarCiudad={(valor) => { setCiudadFiltro(valor); actualizarUrl({ ciudad: valor }); }} ciudadesDisponibles={ciudadesDisponibles} /></>}
    >
      {item ? <div className={styles.results}>
        {modoMapa === "mapa" && vista !== "disponibles" && <div className={styles.map}><TrasladosMapa Traslados={listToRender.map((it) => it.viaje)} onSelect={(viaje) => router.push(hrefDetalle(viaje))} vistaId={rutaActual} /></div>}
        <p className="sr-only">{listToRender.length} {vista === "disponibles" ? listToRender.length === 1 ? "oferta disponible" : "ofertas disponibles" : listToRender.length === 1 ? "traslado aceptado" : "traslados aceptados"}</p>
        {vista === "disponibles" ? <OfertaCard compact viaje={item.viaje} detalle={detalles[item.viaje.traslado_id ?? ""] ?? detalleFallback(item.viaje)} hrefDetalle={hrefDetalle(item.viaje)} mapPreview={modoMapa === "mapa" ? <TrasladosMapa Traslados={listToRender.map((it) => it.viaje)} onSelect={(viaje) => router.push(hrefDetalle(viaje))} vistaId={rutaActual} /> : undefined} />
          : <AcceptedTripCard compact viaje={item.viaje} detalle={detalles[item.viaje.traslado_id ?? ""] ?? detalleFallback(item.viaje)} hrefDetalle={hrefDetalle(item.viaje)} onReject={setViajeParaRechazar} />}
        {listToRender.length > 1 && <div className={styles.pagination} role="group" aria-label="Paginación de traslados">
          <button type="button" disabled={indiceTarjeta === 0} onClick={() => setPaginaActual(indiceTarjeta - 1)}>Anterior</button>
          <output aria-live="polite">{indiceTarjeta + 1} de {listToRender.length}</output>
          <button type="button" disabled={indiceTarjeta === listToRender.length - 1} onClick={() => setPaginaActual(indiceTarjeta + 1)}>Siguiente</button>
        </div>}
      </div> : undefined}
    </DriverTrasladosView>
    {rechazoPendiente && <UndoRechazoToast viaje={rechazoPendiente.viaje} motivo={rechazoPendiente.motivo} onDeshacer={deshacerRechazo} />}
    <RejectTripDialog viaje={viajeParaRechazar} onClose={() => setViajeParaRechazar(null)} onConfirm={confirmarRechazo} />
    <PanelSupportSheet abierto={soporteAbierto} onCerrar={() => setSoporteAbierto(false)} />
  </>;
}
