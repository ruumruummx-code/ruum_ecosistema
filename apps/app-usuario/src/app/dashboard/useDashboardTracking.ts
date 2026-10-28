"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { obtenerEstadoTrasladoRealtime, obtenerUltimaUbicacionTraslado, suscribirEstadoTraslado, suscribirUbicacionTraslado, type UbicacionTraslado } from "@ruum/api/tracking";
import { limpiarCanalesSeguros } from "@ruum/shared/utils";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "../../lib/supabase-browser";

/** La API existente conserva la autorización por traslado y los filtros de Realtime. */
export function useDashboardTracking(id: string, estado: string | null, enabled = true) {
  const router = useRouter();
  const [ubicacion, setUbicacion] = useState<UbicacionTraslado | null>(null);
  const [error, setError] = useState(false);
  const [realtime, setRealtime] = useState(false);
  const [actualizado, setActualizado] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (!enabled || !id || !tieneSupabaseConfigurado()) return;
    const cliente = crearClienteNavegador();
    let cancelado = false;
    let consultando = false;
    const canales: ReturnType<typeof suscribirEstadoTraslado>[] = [];
    const recibirUbicacion = (valor: UbicacionTraslado) => {
      if (cancelado) return;
      setUbicacion(valor);
      setActualizado(valor.registrado_en);
      setError(false);
    };
    const recibirEstado = (valor: Awaited<ReturnType<typeof obtenerEstadoTrasladoRealtime>>) => {
      if (!cancelado && valor && valor.estado !== estado) router.refresh();
    };
    const consultar = async () => {
      if (consultando || document.visibilityState === "hidden") return;
      consultando = true;
      const resultados = await Promise.allSettled([
        obtenerUltimaUbicacionTraslado(cliente, id),
        obtenerEstadoTrasladoRealtime(cliente, id),
      ]);
      consultando = false;
      if (cancelado) return;
      const [gps, estadoActual] = resultados;
      if (gps.status === "fulfilled") {
        if (gps.value) recibirUbicacion(gps.value);
        setError(false);
      } else setError(true);
      if (estadoActual.status === "fulfilled") recibirEstado(estadoActual.value);
    };
    const conectados = new Set<string>();
    const alFallar = () => { if (!cancelado) setRealtime(false); };
    const conexion = (nombre: string) => (status: string) => {
      if (cancelado) return;
      if (status === "SUBSCRIBED") conectados.add(nombre);
      else conectados.delete(nombre);
      setRealtime(conectados.size === 2);
    };
    try {
      canales.push(suscribirUbicacionTraslado(cliente, id, recibirUbicacion, { onError: alFallar, onStatusChange: conexion("gps"), reintentar: false }));
      canales.push(suscribirEstadoTraslado(cliente, id, recibirEstado, { onError: alFallar, onStatusChange: conexion("estado"), reintentar: false }));
    } catch { alFallar(); }
    void consultar();
    const intervalo = window.setInterval(() => void consultar(), 20_000);
    const actualizar = () => void consultar();
    window.addEventListener("online", actualizar);
    document.addEventListener("visibilitychange", actualizar);
    return () => {
      cancelado = true;
      window.clearInterval(intervalo);
      window.removeEventListener("online", actualizar);
      document.removeEventListener("visibilitychange", actualizar);
      void limpiarCanalesSeguros(cliente, canales);
    };
  }, [id, estado, router, revision, enabled]);

  return { ubicacion, error, realtime, actualizado, refrescar: () => setRevision(v => v + 1) };
}
