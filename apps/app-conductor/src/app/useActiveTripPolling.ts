"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * useActiveTripPolling
 *
 * Hook que mantiene sincronizado el viaje activo del conductor mediante
 * **polling HTTP** (no Realtime/Supabase Realtime Channel).
 *
 * ¿Por qué polling y no Realtime?
 * 1. Cobertura intermitente: el conductor circula con red móvil inestable;
 *    los canales Realtime se rompen en background y su reconexión es costosa
 *    en batería y datos. El polling con intervalo fijo (45s) es más predecible.
 * 2. Control total del backoff: ante error de red, el hook conserva el último
 *    viaje conocido en caché (offline-active-trip-cache) y marca
 *    `viajeActivoSinActualizar`, sin derribar la UI. Un canal Realtime caído
 *    forzaría a limpiar el estado o a mostrar spinners innecesarios.
 * 3. Simplicidad operativa: no requiere mantener suscripciones por canal
 *    (`ubicaciones-traslado-${id}`, `estado-traslado-${id}`) ni gestionar
 *    `onstatechange` de clientes Realtime en pestañas múltiples.
 * 4. Compatibilidad PWA: el Service Worker cachea respuestas de las rutas API
 *    de listado de traslados, de modo que el polling puede servirse desde
 *    caché incluso sin red.
 *
 * Compensación consciente: la latencia de detección de cambios es de hasta
 * INTERVALO_REFRESCO_VIAJE_ACTIVO_MS (45s). Para el flujo del conductor esto
 * es aceptable; los cambios críticos de estado (llegada, entrega) se
 * confirman explícitamente mediante acciones del conductor, no por Realtime.
 */

import { App } from "@capacitor/app";
import { listarTrasladosAceptados, obtenerConductorActual } from "@ruum/api/services";
import { createLogger, errorCode } from "@ruum/shared/utils";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "../lib/supabase-browser";
import { esNativo } from "../lib/capacitor";
import {
  normalizarViajeActivo,
  type RegistroViajeActivoInput,
  type ViajeActivo,
  viajeActivoDesdePasaporte,
  viajeEsOperacionActiva
} from "./active-trip-state";
import { leerCacheViajeActivo } from "../lib/offline-active-trip-cache";

const RUTAS_SIN_VIAJE_ACTIVO = new Set(["/login", "/registro", "/onboarding"]);
const INTERVALO_REFRESCO_VIAJE_ACTIVO_MS = 45_000;
const logger = createLogger("active_trip");

export function useActiveTripPolling(pathname: string) {
  const [viajeActivo, setViajeActivo] = useState<ViajeActivo | null>(null);
  const [viajeActivoSinActualizar, setViajeActivoSinActualizar] = useState(false);
  const [pasaporteActivo, setPasaporteActivo] = useState<Awaited<ReturnType<typeof listarTrasladosAceptados>>[number] | null>(null);
  const rutaSinViajeActivo = RUTAS_SIN_VIAJE_ACTIVO.has(pathname);
  const registrarViajeActivo = useCallback((viaje: RegistroViajeActivoInput | null) => {
    setViajeActivo((previo) => (viaje ? normalizarViajeActivo(viaje, previo) : null));
    setViajeActivoSinActualizar(false);
  }, []);

  useEffect(() => {
    if (!tieneSupabaseConfigurado()) return;
    if (rutaSinViajeActivo) return;

    let cancelado = false;

    async function cargarViajeActivo() {
      try {
        const cliente = crearClienteNavegador();
        const conductor = await obtenerConductorActual(cliente);
        if (!conductor) {
          if (!cancelado) {
            setViajeActivo(null);
            setPasaporteActivo(null);
            setViajeActivoSinActualizar(false);
          }
          return;
        }

        const Traslados = await listarTrasladosAceptados(cliente, conductor.id);
        const activo = Traslados.find((viaje) => viaje.estado && viajeEsOperacionActiva(viaje.estado));
        if (!cancelado) {
          setViajeActivo(activo ? viajeActivoDesdePasaporte(activo) : null);
          setPasaporteActivo(activo ?? null);
          setViajeActivoSinActualizar(false);
        }
      } catch (error) {
        const cache = await leerCacheViajeActivo();
        logger.warn(
          "active_trip_refresh_failed",
          {
            errorCode: errorCode(error),
            isOnline: typeof navigator === "undefined" ? null : navigator.onLine
          },
          "connectivity"
        );
        if (!cancelado) {
          if (cache) {
            setViajeActivo({
              trasladoId: cache.trasladoId,
              estado: cache.estado,
              folio: cache.folio,
              etapa: cache.siguienteAccion.label,
              destinoActual: cache.siguienteAccion.nextStep ?? cache.siguienteAccion.instruction
            });
          }
          setViajeActivoSinActualizar(true);
        }
      }
    }

    void cargarViajeActivo();
    const intervalo = window.setInterval(() => void cargarViajeActivo(), INTERVALO_REFRESCO_VIAJE_ACTIVO_MS);
    const alVolver = () => {
      if (document.visibilityState === "visible") void cargarViajeActivo();
    };
    document.addEventListener("visibilitychange", alVolver);

    let limpiarAppState: (() => void) | null = null;
    if (esNativo()) {
      void App.addListener("appStateChange", ({ isActive }) => {
        if (isActive) void cargarViajeActivo();
      }).then((handle) => {
        if (cancelado) {
          void handle.remove();
        } else {
          limpiarAppState = () => handle.remove();
        }
      });
    }

    return () => {
      cancelado = true;
      window.clearInterval(intervalo);
      document.removeEventListener("visibilitychange", alVolver);
      limpiarAppState?.();
    };
  }, [rutaSinViajeActivo]);

  return {
    viajeActivo: rutaSinViajeActivo ? null : viajeActivo,
    viajeActivoSinActualizar: rutaSinViajeActivo ? false : viajeActivoSinActualizar,
    pasaporteActivo: rutaSinViajeActivo ? null : pasaporteActivo,
    registrarViajeActivo
  };
}
