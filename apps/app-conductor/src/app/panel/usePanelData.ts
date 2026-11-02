"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Conductor } from "@ruum/shared/types";
import { traducirErrorOperativo, suscribirCanalSeguro, limpiarCanalesSeguros } from "@ruum/shared/utils";
import {
  guardarDisponibilidadConductor,
  listarTrasladosAceptados,
  listarTrasladosDisponibles,
  obtenerConductorActual,
  obtenerDisponibilidadConductor,
  obtenerSolicitudConductorActual
} from "@ruum/api/services";
import { contarNotificacionesNoLeidas, listarDocumentosSolicitud, listarDocumentosConductor, listarGananciasCerradasConductorDesde } from "@ruum/api/drivers";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "../../lib/supabase-browser";
import { viajeEsOperacionActiva } from "../ViajeActivoContext";
import type { DriverAvailability } from "./DriverAvailabilityControl";
import type { DocumentoConductorRow, PanelReviewState, PasaporteRow } from "./panel-utils";

export type Disponibilidad = DriverAvailability;

export type DocumentosStatus = "vigentes" | "por_vencer" | "bloqueantes";

export interface FallosParcialesPanel {
  aceptados?: boolean;
  disponibles?: boolean;
  disponibilidad?: boolean;
  notificaciones?: boolean;
  ganancias?: boolean;
  documentos?: boolean;
}

export interface ActualizacionesPorModulo {
  aceptados: Date | null;
  disponibles: Date | null;
  disponibilidad: Date | null;
  notificaciones: Date | null;
  ganancias: Date | null;
  documentos: Date | null;
}

function conductorOperativo(
  real: Awaited<ReturnType<typeof obtenerConductorActual>>,
  email?: string | null
): Conductor | null {
  if (!real) return null;
  return {
    id: real.id,
    nombre: real.nombre,
    email: email ?? null,
    telefono: real.telefono ?? null,
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
  };
}

export function usePanelData() {
  const router = useRouter();
  const [disponibilidad, setDisponibilidad] = useState<Disponibilidad>("disponible");
  const [disponibilidadPendiente, setDisponibilidadPendiente] = useState<Disponibilidad | null>(null);
  const [persistiendoDisponibilidad, setPersistiendoDisponibilidad] = useState(false);
  const [errorDisponibilidad, setErrorDisponibilidad] = useState<string | null>(null);
  const [conductor, setConductor] = useState<Conductor | null>(null);
  const [TrasladosAceptados, setTrasladosAceptados] = useState<PasaporteRow[]>([]);
  const [TrasladosDisponibles, setTrasladosDisponibles] = useState<PasaporteRow[]>([]);
  const [enRevision, setEnRevision] = useState<PanelReviewState | null>(null);
  const [documentos, setDocumentos] = useState<DocumentoConductorRow[]>([]);
  const [notificacionesCount, setNotificacionesCount] = useState(0);
  const [gananciasHoy, setGananciasHoy] = useState<number | null>(0);
  const [trasladosHoy, setTrasladosHoy] = useState<number | null>(0);
  const [gananciasHoyEstimadas, setGananciasHoyEstimadas] = useState(false);
  const [gananciasHoyIncompletas, setGananciasHoyIncompletas] = useState(false);
  const [gananciasHoyDesconocidas, setGananciasHoyDesconocidas] = useState(false);
  const [fallosParciales, setFallosParciales] = useState<FallosParcialesPanel>({});
  const [actualizacionesPorModulo, setActualizacionesPorModulo] = useState<ActualizacionesPorModulo>({
    aceptados: null,
    disponibles: null,
    disponibilidad: null,
    notificaciones: null,
    ganancias: null,
    documentos: null,
  });
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date | null>(null);
  const aceptadosRef = useRef<PasaporteRow[]>([]);
  const disponiblesRef = useRef<PasaporteRow[]>([]);
  const ultimoTriggerDisponibilidadRef = useRef(0);
  const recargaDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const cargar = useCallback(async (esRefrescoSilencioso = false) => {
    if (!tieneSupabaseConfigurado()) {
      setErrorDisponibilidad("Supabase no está configurado. No se puede cargar tu información operativa.");
      setCargando(false);
      setRefrescando(false);
      return;
    }

    if (esRefrescoSilencioso) {
      setRefrescando(true);
    }

    try {
      const cliente = crearClienteNavegador();
      const { data: sesion } = await cliente.auth.getUser();
      if (!sesion.user) {
        router.replace("/login");
        return;
      }

      const real = await obtenerConductorActual(cliente);
      if (!real) {
        const solicitud = await obtenerSolicitudConductorActual(cliente);
        if (!solicitud) {
          router.replace("/registro");
          return;
        }
        if (["borrador", "correo_pendiente", "datos_incompletos", "documentos_pendientes"].includes(solicitud.estado)) {
          router.replace("/registro");
          return;
        }
        const docs = await listarDocumentosSolicitud(cliente, solicitud.id);
        const personales = solicitud.datos_personales as { nombre?: string };
        setEnRevision({
          solicitudId: solicitud.id,
          nombre: personales.nombre ?? "Conductor",
          documentos: docs,
          estado: solicitud.estado,
          enviadoEn: solicitud.enviado_en
        });
        return;
      }

      if (real.estado_expediente !== "aprobado" || !["activo", "modo_prueba_supervisada"].includes(real.estado)) {
        const docs = await listarDocumentosConductor(cliente, real.id);
        setEnRevision({ conductorId: real.id, nombre: real.nombre, documentos: docs, estado: real.estado_expediente });
        return;
      }

      const conductorActual = conductorOperativo(real, sesion.user?.email);
      setConductor(conductorActual);

      const inicioHoy = new Date();
      inicioHoy.setHours(0, 0, 0, 0);
      const resultados = await Promise.allSettled([
        listarTrasladosAceptados(cliente, real.id),
        listarTrasladosDisponibles(cliente),
        obtenerDisponibilidadConductor(cliente, real.id),
        contarNotificacionesNoLeidas(cliente),
        listarGananciasCerradasConductorDesde(cliente, real.id, inicioHoy.toISOString()),
        listarDocumentosConductor(cliente, real.id)
      ]);

      const [resAceptados, resDisponibles, resDisponibilidad, resNotificaciones, resGanancias, resDocs] = resultados;

      const fallos: FallosParcialesPanel = {};
      if (resAceptados.status === "rejected") fallos.aceptados = true;
      if (resDisponibles.status === "rejected") fallos.disponibles = true;
      if (resDisponibilidad.status === "rejected") fallos.disponibilidad = true;
      if (resNotificaciones.status === "rejected") fallos.notificaciones = true;
      if (resGanancias.status === "rejected") fallos.ganancias = true;
      if (resDocs.status === "rejected") fallos.documentos = true;

      setFallosParciales(fallos);

      const ahora = new Date();
      const updatesModulo: Partial<ActualizacionesPorModulo> = {};

      if (resAceptados.status === "fulfilled") {
        aceptadosRef.current = resAceptados.value;
        setTrasladosAceptados(resAceptados.value);
        updatesModulo.aceptados = ahora;
      }

      if (resDisponibles.status === "fulfilled") {
        disponiblesRef.current = resDisponibles.value;
        setTrasladosDisponibles(resDisponibles.value);
        updatesModulo.disponibles = ahora;
      }

      const enViaje = aceptadosRef.current.some((viaje) => viaje.estado === "traslado_en_curso");
      if (resDisponibilidad.status === "fulfilled") {
        setDisponibilidad(enViaje ? "en_viaje" : resDisponibilidad.value);
        updatesModulo.disponibilidad = ahora;
      } else if (enViaje) {
        setDisponibilidad("en_viaje");
      }

      if (resNotificaciones.status === "fulfilled") {
        setNotificacionesCount(resNotificaciones.value);
        updatesModulo.notificaciones = ahora;
      }

      if (resDocs.status === "fulfilled") {
        setDocumentos(resDocs.value);
        updatesModulo.documentos = ahora;
      }

      if (resGanancias.status === "fulfilled") {
        updatesModulo.ganancias = ahora;
        const trasladosDelDia = resGanancias.value;
        setTrasladosHoy(trasladosDelDia.length);

        let tieneIncompletas = false;
        let gananciaCongeladaTotal = 0;
        let hayGananciaCongelada = false;

        for (const t of trasladosDelDia) {
          if (t.ganancia_conductor_congelada != null) {
            gananciaCongeladaTotal += Number(t.ganancia_conductor_congelada);
            hayGananciaCongelada = true;
          } else {
            // H09: NUNCA multiplicar por 0.85 ni estimar porcentajes fijos.
            // Si el viaje no tiene ganancia congelada, se marca explícitamente como incompleto / en conciliación.
            tieneIncompletas = true;
          }
        }

        if (trasladosDelDia.length > 0 && !hayGananciaCongelada) {
          // Hay viajes concluidos hoy pero ninguno tiene ganancia congelada aún
          setGananciasHoy(null);
          setGananciasHoyEstimadas(false);
          setGananciasHoyIncompletas(true);
          setGananciasHoyDesconocidas(false);
        } else {
          setGananciasHoy(gananciaCongeladaTotal);
          setGananciasHoyEstimadas(false);
          setGananciasHoyIncompletas(tieneIncompletas);
          setGananciasHoyDesconocidas(false);
        }
      } else {
        setGananciasHoy((prev) => {
          if (prev === null) setGananciasHoyDesconocidas(true);
          return prev;
        });
      }

      if (Object.keys(updatesModulo).length > 0) {
        setActualizacionesPorModulo((prev: ActualizacionesPorModulo) => ({ ...prev, ...updatesModulo }));
      }

      const numFallos = Object.keys(fallos).length;
      if (numFallos === resultados.length) {
        setErrorDisponibilidad("No se pudo cargar la información del panel. Conservando datos previos.");
        // H09: NO actualizar ultimaActualizacion si todo falló
      } else if (numFallos > 0) {
        const nombres: string[] = [];
        if (fallos.aceptados) nombres.push("viajes activos");
        if (fallos.disponibles) nombres.push("viajes disponibles");
        if (fallos.disponibilidad) nombres.push("disponibilidad");
        if (fallos.notificaciones) nombres.push("notificaciones");
        if (fallos.ganancias) nombres.push("ganancias de hoy");
        if (fallos.documentos) nombres.push("documentos");
        setErrorDisponibilidad(`No se pudieron sincronizar algunos datos (${nombres.join(", ")}). Se conservan los últimos datos conocidos.`);
        // H09: NO actualizar ultimaActualizacion global si hubo fallos parciales; cada módulo conserva su propia fecha
      } else {
        setErrorDisponibilidad(null);
        setUltimaActualizacion(ahora);
      }
    } catch (err) {
      setErrorDisponibilidad(traducirErrorOperativo(err, "No pudimos cargar tu información operativa."));
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, [router]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  // Suscripción Realtime a Traslados y Notificaciones
  useEffect(() => {
    if (!conductor?.id || !tieneSupabaseConfigurado()) return;

    let cliente: ReturnType<typeof crearClienteNavegador>;
    try {
      cliente = crearClienteNavegador();
    } catch {
      return;
    }
    if (!cliente || typeof cliente.channel !== "function") return;

    const triggerRecarga = () => {
      if (recargaDebounceRef.current) clearTimeout(recargaDebounceRef.current);
      recargaDebounceRef.current = setTimeout(() => {
        void cargar(true);
      }, 800);
    };

    const canalTraslados = cliente
      .channel(`panel_traslados_${conductor.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "traslados" },
        () => triggerRecarga()
      );

    const canalNotificaciones = cliente
      .channel(`panel_notificaciones_${conductor.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notificaciones_conductor",
          filter: `conductor_id=eq.${conductor.id}`
        },
        () => triggerRecarga()
      );

    const desuscribirTraslados = suscribirCanalSeguro(cliente, canalTraslados, {
      onError: (err) => console.warn("[usePanelData] error en canalTraslados", err)
    });
    const desuscribirNotificaciones = suscribirCanalSeguro(cliente, canalNotificaciones, {
      onError: (err) => console.warn("[usePanelData] error en canalNotificaciones", err)
    });

    return () => {
      if (recargaDebounceRef.current) clearTimeout(recargaDebounceRef.current);
      void Promise.allSettled([desuscribirTraslados(), desuscribirNotificaciones()]);
      void limpiarCanalesSeguros(cliente, [canalTraslados, canalNotificaciones]);
    };
  }, [conductor?.id, cargar]);

  const viajeActivoPrincipal = useMemo(
    () => TrasladosAceptados.find((viaje) => viaje.estado && viajeEsOperacionActiva(viaje.estado)) ?? null,
    [TrasladosAceptados]
  );
  const proximoViaje = useMemo(
    () => TrasladosAceptados.find((viaje) => !viaje.estado || !viajeEsOperacionActiva(viaje.estado)) ?? null,
    [TrasladosAceptados]
  );

  const documentoBloqueante = Boolean(conductor && !conductor.documentos_vigentes);

  const documentoPorVencer = useMemo(() => {
    if (documentoBloqueante) return false;
    const ahora = Date.now();
    const quinceDiasMs = 15 * 24 * 60 * 60 * 1000;
    return documentos.some((doc) => {
      if (!doc.expira_en) return false;
      const fechaExp = new Date(doc.expira_en).getTime();
      return fechaExp > ahora && fechaExp - ahora <= quinceDiasMs;
    });
  }, [documentos, documentoBloqueante]);

  const persistirDisponibilidad = useCallback(
    async (nuevaDisponibilidad: Exclude<Disponibilidad, "en_viaje">) => {
      const anterior = disponibilidad;
      setDisponibilidad(nuevaDisponibilidad);
      setPersistiendoDisponibilidad(true);
      setErrorDisponibilidad(null);

      try {
        if (!conductor) throw new Error("Inicia sesión como conductor para cambiar tu disponibilidad.");
        const cliente = crearClienteNavegador();
        await guardarDisponibilidadConductor(cliente, conductor.id, nuevaDisponibilidad);
      } catch (err) {
        setDisponibilidad(anterior);
        setErrorDisponibilidad(traducirErrorOperativo(err, "No pudimos actualizar tu disponibilidad. Restauramos el estado anterior."));
      } finally {
        setPersistiendoDisponibilidad(false);
        setDisponibilidadPendiente(null);
      }
    },
    [disponibilidad, conductor]
  );

  const seleccionarDisponibilidad = useCallback(
    (nuevaDisponibilidad: Disponibilidad) => {
      const ahora = Date.now();
      if (ahora - ultimoTriggerDisponibilidadRef.current < 500) return;
      ultimoTriggerDisponibilidadRef.current = ahora;

      if (disponibilidad === "en_viaje" || nuevaDisponibilidad === "en_viaje" || persistiendoDisponibilidad) return;
      if (disponibilidad === nuevaDisponibilidad) return;

      if (nuevaDisponibilidad === "no_disponible") {
        setDisponibilidadPendiente(nuevaDisponibilidad);
        return;
      }

      void persistirDisponibilidad(nuevaDisponibilidad);
    },
    [disponibilidad, persistiendoDisponibilidad, persistirDisponibilidad]
  );

  return {
    cargando,
    refrescando,
    ultimaActualizacion,
    conductor,
    disponibilidad,
    disponibilidadPendiente,
    persistiendoDisponibilidad,
    TrasladosDisponibles,
    enRevision,
    viajeActivoPrincipal,
    proximoViaje,
    documentoBloqueante,
    documentoPorVencer,
    documentos,
    notificacionesCount,
    gananciasHoy,
    trasladosHoy,
    gananciasHoyEstimadas,
    gananciasHoyIncompletas,
    gananciasHoyDesconocidas,
    fallosParciales,
    actualizacionesPorModulo,
    errorDisponibilidad,
    seleccionarDisponibilidad,
    persistirDisponibilidad,
    setDisponibilidadPendiente,
    recargar: () => cargar(true)
  };
}
