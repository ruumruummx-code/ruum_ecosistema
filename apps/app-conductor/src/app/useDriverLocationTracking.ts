"use client";

import { useEffect } from "react";
import { encolarPuntoTelemetria, sincronizarColaTelemetria } from "../lib/cola-telemetria-offline";
import { createLogger, errorCode } from "@ruum/shared/utils";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "../lib/supabase-browser";
import { iniciarTrackingNativo, detenerTrackingNativo, solicitarUbicacionSegundoPlanoNativa, soportaTrackingNativo } from "../lib/background-tracking";
import { distanciaMetrosEntre, observarUbicacionActual, obtenerUbicacionActual, type Coordenadas } from "../lib/ubicacion";
import { type ViajeActivo, viajePermiteSeguimientoUbicacion } from "./active-trip-state";

const INTERVALO_RESPALDO_UBICACION_MS = 30_000;
const INTERVALO_MINIMO_REPORTE_MS = 10_000;
const DISTANCIA_MINIMA_REPORTE_M = 50;
const logger = createLogger("driver_location");

function isOnline() {
  if (typeof navigator === "undefined") return null;
  return navigator.onLine;
}

export function useDriverLocationTracking(viajeActivo: ViajeActivo | null) {
  const trasladoId = viajeActivo?.trasladoId;
  const estado = viajeActivo?.estado;
  const folio = viajeActivo?.folio;
  useEffect(() => {
    if (!trasladoId || !estado || !viajePermiteSeguimientoUbicacion(estado) || !tieneSupabaseConfigurado()) {
      if (soportaTrackingNativo()) void detenerTrackingNativo().catch(() => undefined);
      return;
    }

    let cancelado = false;
    const viaje = { trasladoId, estado, folio: folio ?? "" };
    const trasladoIdActual = viaje.trasladoId;
    const cliente = crearClienteNavegador();

    if (soportaTrackingNativo()) {
      void (async () => {
        try {
          // Detener tracking previo antes de iniciar uno nuevo
          await detenerTrackingNativo().catch(() => undefined);
          if (cancelado) return;

          const { data } = await cliente.auth.getSession();
          if (cancelado) return;

          const accessToken = data.session?.access_token;
          const userId = data.session?.user.id;
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
          if (!userId || !accessToken || !supabaseUrl || !anonKey || cancelado) return;

          try {
            const background = await solicitarUbicacionSegundoPlanoNativa();
            if (cancelado) return;
            if (!background.granted) {
              logger.warn(
                "background_location_not_granted",
                { state: background.state, tripId: trasladoIdActual },
                "authorization"
              );
            }
          } catch (error) {
            if (cancelado) return;
            logger.warn(
              "background_location_request_failed",
              { tripId: trasladoIdActual, errorCode: errorCode(error) },
              "authorization"
            );
          }

          if (cancelado) return;

          await iniciarTrackingNativo({
            userId,
            tripId: trasladoIdActual,
            tripCode: viaje.folio,
            tripState: viaje.estado,
            supabaseUrl,
            anonKey,
            accessToken,
            refreshToken: data.session?.refresh_token
          });
        } catch (error) {
          if (!cancelado) {
            logger.warn(
              "native_tracking_start_failed",
              { tripId: trasladoIdActual, errorCode: errorCode(error) },
              "integration_failure"
            );
          }
        }
      })();

      return () => {
        cancelado = true;
        void detenerTrackingNativo().catch(() => undefined);
      };
    }

    let ultimaReportada: Coordenadas | null = null;
    let ultimoReporteMs = 0;
    const usuarioActual = cliente.auth.getSession().then(({ data }) => data.session?.user.id);
    let trabajo = Promise.resolve();
    const publicarEstado = (ultimoEnvio?: number) => window.dispatchEvent(new CustomEvent("ruum:tracking-web", { detail: { active: true, lastSentAt: ultimoEnvio } }));
    publicarEstado();
    async function reportar(ubicacion: Coordenadas | null) {
      if (!ubicacion || cancelado) return;
      const captura = ubicacion.capturedAt ?? new Date().toISOString();
      trabajo = trabajo.then(async () => {
      if (cancelado) return;
      try {
        const usuarioId = await usuarioActual;
        if (!usuarioId || cancelado) return;
        await encolarPuntoTelemetria(viaje.trasladoId, ubicacion, { usuarioId, deviceTimestamp: captura });
        await sincronizarColaTelemetria(cliente);
        ultimaReportada = ubicacion;
        ultimoReporteMs = Date.now();
        publicarEstado(ultimoReporteMs);
      } catch (error) {
        logger.warn("driver_location_report_failed", { tripId: viaje.trasladoId, isOnline: isOnline(), errorCode: errorCode(error), precisionM: ubicacion.precisionM ?? null }, "connectivity");
      }
      });
      await trabajo;
    }
    function debeReportar(ubicacion: Coordenadas) {
      if (!ultimaReportada) return true;
      const tiempo = Date.now() - ultimoReporteMs;
      return tiempo >= INTERVALO_MINIMO_REPORTE_MS || distanciaMetrosEntre(ultimaReportada, ubicacion) >= DISTANCIA_MINIMA_REPORTE_M;
    }
    void obtenerUbicacionActual().then(reportar);
    let cancelarObservacion: (() => void) | null = null;
    void observarUbicacionActual((ubicacion) => { if (debeReportar(ubicacion)) void reportar(ubicacion); }).then((cancelar) => { if (cancelado) cancelar?.(); else cancelarObservacion = cancelar; });
    const respaldo = window.setInterval(() => void obtenerUbicacionActual().then(reportar), INTERVALO_RESPALDO_UBICACION_MS);
    const reconectar = () => { trabajo = trabajo.then(async () => { try { await sincronizarColaTelemetria(cliente, { ignoreBackoff: true }); } catch { /* La cola conserva los puntos hasta recibir ACK. */ } }); void obtenerUbicacionActual().then(reportar); };
    window.addEventListener("online", reconectar);
    return () => { cancelado = true; cancelarObservacion?.(); window.clearInterval(respaldo); window.removeEventListener("online", reconectar); window.dispatchEvent(new CustomEvent("ruum:tracking-web", { detail: { active: false } })); };
  }, [trasladoId, estado, folio]);
}
