"use client";

import { useEffect, useRef, useDeferredValue, useState } from "react";
import {
  obtenerEstadoTrasladoRealtime,
  obtenerUltimaUbicacionTraslado,
  suscribirEstadoTraslado,
  suscribirUbicacionTraslado,
  type UbicacionTraslado
} from "@ruum/api/services";
import { ETIQUETA_ESTADO_TRASLADO } from "@ruum/shared/states";
import { limpiarCanalesSeguros } from "@ruum/shared/utils";
import { MapaPasaporte } from "./MapaPasaporte";
import styles from "./pasaporte.module.css";
import type { Database } from "@ruum/shared/types";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "@/lib/supabase-browser";

import { useTrasladoRealtime } from "@/state/AppStateProvider";

type EstadoTraslado = Database["public"]["Enums"]["estado_traslado"];

interface PuntoMapa {
  lat: number | null;
  lng: number | null;
}

interface SeguimientoTrasladoTiempoRealProps {
  trasladoId: string;
  estado: EstadoTraslado | null;
  actualizadoEn?: string | null;
  origen: PuntoMapa;
  destino: PuntoMapa;
  ubicacionInicial: UbicacionTraslado | null;
  activo?: boolean;
}

const ESTADOS_VISIBLES: EstadoTraslado[] = [
  "conductor_asignado",
  "conductor_en_camino_al_origen",
  "conductor_en_punto_de_recoleccion",
  "verificacion_vehiculo_en_proceso",
  "evidencia_inicial_en_proceso",
  "evidencia_inicial_completada",
  "vehiculo_recibido",
  "traslado_en_curso",
  "incidencia_reportada",
  "llegada_a_destino",
  "evidencia_final_en_proceso",
  "evidencia_final_completada",
  "entrega_confirmada",
  "servicio_cerrado"
];

function formatoHora(fechaIso: string | null | undefined) {
  if (!fechaIso) return "Sin actualización";
  try {
    const d = new Date(fechaIso);
    if (isNaN(d.getTime())) return "Sin actualización";
    return new Intl.DateTimeFormat("es-MX", {
      timeStyle: "short",
      dateStyle: "medium",
      timeZone: "America/Mexico_City"
    }).format(d);
  } catch {
    return "Sin actualización";
  }
}

export function SeguimientoTrasladoTiempoReal({
  trasladoId,
  estado,
  actualizadoEn,
  origen,
  destino,
  ubicacionInicial,
  activo = true
}: SeguimientoTrasladoTiempoRealProps) {
  const { ubicacion, estadoRealtime, estadoActualizadoEn, cargando, inicializar, actualizar, limpiar } = useTrasladoRealtime(trasladoId);
  // R12: debounce refrescar + última vez para evitar spam
  const ultimoRefreshRef = useRef<number>(0);
  // Fix A1: throttle de 5s para llegada de coordenadas por WebSockets
  const ultimoUpdateUbicacionRef = useRef<number>(0);
  const pendienteUbicacionRef = useRef<UbicacionTraslado | null>(null);
  const timerThrottleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [eta, setEta] = useState<number | null>(null);
  const servidorMasReciente = actualizadoEn && estadoActualizadoEn && Date.parse(actualizadoEn) > Date.parse(estadoActualizadoEn);
  const estadoEnVivo = servidorMasReciente ? estado : estadoRealtime ?? estado;
  // Fix A1: diferir recálculo de mapa estático para evitar recargar imágenes pesadas en móviles
  const ubicacionDiferida = useDeferredValue(ubicacion);

  useEffect(() => {
    inicializar(ubicacionInicial);
    if (!tieneSupabaseConfigurado()) return;

    const cliente = crearClienteNavegador();
    let canalEstado: ReturnType<typeof suscribirEstadoTraslado> | null = null;
    let canalUbicacion: ReturnType<typeof suscribirUbicacionTraslado> | null = null;
    let cancelado = false;

    try {
      canalEstado = suscribirEstadoTraslado(
        cliente,
        trasladoId,
        (traslado) => {
          if (cancelado) return;
          actualizar({ estadoRealtime: traslado.estado, estadoActualizadoEn: traslado.actualizado_en });
        },
        {
          onError: (err) => {
            if (!cancelado) console.warn("[SeguimientoTiempoReal] error canalEstado", err);
          }
        }
      );
      canalUbicacion = suscribirUbicacionTraslado(
        cliente,
        trasladoId,
        (u) => {
          if (cancelado) return;
          const ahora = Date.now();
          const tiempoDesdeUltimo = ahora - ultimoUpdateUbicacionRef.current;
          if (tiempoDesdeUltimo < 5000) {
            pendienteUbicacionRef.current = u;
            if (!timerThrottleRef.current) {
              timerThrottleRef.current = setTimeout(() => {
                timerThrottleRef.current = null;
                if (cancelado) return;
                ultimoUpdateUbicacionRef.current = Date.now();
                if (pendienteUbicacionRef.current) {
                  actualizar({ ubicacion: pendienteUbicacionRef.current });
                  pendienteUbicacionRef.current = null;
                }
              }, 5000 - tiempoDesdeUltimo);
            }
            return;
          }

          if (timerThrottleRef.current) {
            clearTimeout(timerThrottleRef.current);
            timerThrottleRef.current = null;
          }
          pendienteUbicacionRef.current = null;
          ultimoUpdateUbicacionRef.current = ahora;
          actualizar({ ubicacion: u });
        },
        {
          onError: (err) => {
            if (!cancelado) console.warn("[SeguimientoTiempoReal] error canalUbicacion", err);
          }
        }
      );
    } catch (err) {
      console.warn("[SeguimientoTiempoReal] suscripción fallida", err);
    }

    void obtenerEstadoTrasladoRealtime(cliente, trasladoId)
      .then((traslado) => {
        if (cancelado || !traslado) return;
        actualizar({ estadoRealtime: traslado.estado, estadoActualizadoEn: traslado.actualizado_en });
      })
      .catch((err) => console.warn("[SeguimientoTiempoReal] fetch estado fallido", err));

    return () => {
      cancelado = true;
      if (timerThrottleRef.current) {
        clearTimeout(timerThrottleRef.current);
        timerThrottleRef.current = null;
      }
      // Libera ubicación/estado del reducer al salir del traslado (ver Chat).
      limpiar();
      // Cleanup resiliente garantizado con limpiarCanalesSeguros
      void limpiarCanalesSeguros(cliente, [canalEstado, canalUbicacion]);
    };
  }, [actualizar, inicializar, limpiar, trasladoId, ubicacionInicial]);

  async function refrescar() {
    if (!tieneSupabaseConfigurado()) return;
    // R12: debounce 800ms + loading disable para evitar spam de clicks
    const ahora = Date.now();
    if (ahora - ultimoRefreshRef.current < 800 || cargando) return;
    ultimoRefreshRef.current = ahora;

    actualizar({ cargando: true });
    try {
      const cliente = crearClienteNavegador();
      const [ultimaUbicacion, estadoActual] = await Promise.all([
        obtenerUltimaUbicacionTraslado(cliente, trasladoId),
        obtenerEstadoTrasladoRealtime(cliente, trasladoId)
      ]);
      actualizar({ ubicacion: ultimaUbicacion });
      if (estadoActual) {
        actualizar({ estadoRealtime: estadoActual.estado, estadoActualizadoEn: estadoActual.actualizado_en });
      }
    } catch (err) {
      console.warn("[SeguimientoTiempoReal] refrescar fallido", err);
    } finally {
      actualizar({ cargando: false });
    }
  }

  return <div className={styles.panel}>
    <MapaPasaporte origen={origen} destino={destino} ubicacion={ubicacionDiferida} activo={activo} haciaOrigen={estadoEnVivo === "conductor_en_camino_al_origen"} seguirUbicacion={estadoEnVivo === "traslado_en_curso" || estadoEnVivo === "conductor_en_camino_al_origen"} onEta={setEta} />
    <div className={styles.tools}><button type="button" onClick={refrescar} disabled={cargando}>{cargando ? "Actualizando…" : "↻ Actualizar"}</button></div>
    <div className={styles.status} role="status" aria-live="polite">
      <progress aria-label="Progreso del traslado" max={ESTADOS_VISIBLES.length} value={Math.max(0, ESTADOS_VISIBLES.indexOf(estadoEnVivo as EstadoTraslado) + 1)} />
      <p>{estadoEnVivo === "traslado_en_curso" ? "En camino al destino" : estadoEnVivo ? ETIQUETA_ESTADO_TRASLADO[estadoEnVivo] : "Buscando conductor"}{eta !== null ? ` · ETA: ${eta} min` : ""}</p>
      <small>Actualizado {formatoHora(estadoActualizadoEn ?? ubicacion?.registrado_en)}</small>
    </div>
  </div>;
}
