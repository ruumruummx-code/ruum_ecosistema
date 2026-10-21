"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useActiveTripPolling } from "./useActiveTripPolling";
import { useDriverLocationTracking } from "./useDriverLocationTracking";
import { type RegistroViajeActivoInput, type ViajeActivo, viajeEsOperacionActiva, viajePermiteEmergencia } from "./active-trip-state";
import type { PasaporteRow, OfflineActiveTripCache } from "../lib/offline-active-trip-cache";
import { crearCacheViajeActivoDesdePasaporte, guardarCacheViajeActivo, leerCacheViajeActivo, limpiarCacheViajeActivo } from "../lib/offline-active-trip-cache";

type ViajeActivoContextValue = {
  viajeActivo: ViajeActivo | null;
  viajeActivoSinActualizar: boolean;
  registrarViajeActivo: (viaje: RegistroViajeActivoInput | null) => void;
  cacheViajeActivo: OfflineActiveTripCache | null;
  cachearPasaporteActivo: (pasaporte: PasaporteRow) => Promise<void>;
  limpiarViajeActivoGlobal: () => Promise<void>;
};

const ViajeActivoContext = createContext<ViajeActivoContextValue | null>(null);

export { viajeEsOperacionActiva, viajePermiteEmergencia };

export function ViajeActivoProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { viajeActivo, viajeActivoSinActualizar, pasaporteActivo, registrarViajeActivo } = useActiveTripPolling(pathname);
  const [cacheViajeActivo, setCacheViajeActivo] = useState<OfflineActiveTripCache | null>(null);
  // Ref para evitar limpiar el caché offline durante el montaje inicial mientras la
  // promesa del servidor aún está pendiente. Solo se permite limpiar después de que
  // la primera carga de useActiveTripPolling haya resuelto (HTTP 200 confirmando
  // que el viaje existe o no existe).
  const primeraCargaCompletada = useRef(false);
  useDriverLocationTracking(viajeActivo);

  useEffect(() => { void leerCacheViajeActivo().then(setCacheViajeActivo); }, []);

  const cachearPasaporteActivo = useCallback(async (pasaporte: PasaporteRow) => {
    const cache = crearCacheViajeActivoDesdePasaporte(pasaporte);
    if (!cache) return;
    await guardarCacheViajeActivo(cache);
    setCacheViajeActivo(cache);
  }, []);

  useEffect(() => {
    // Durante el montaje inicial (primera ejecución del efecto) no se limpia el caché
    // aunque pasaporteActivo y viajeActivo sean null: la promesa del servidor aún está
    // pendiente y limpiar ahora borraría el viaje en caché sin confirmación del servidor.
    if (!primeraCargaCompletada.current) {
      primeraCargaCompletada.current = true;
      return;
    }

    if (pasaporteActivo) {
      void cachearPasaporteActivo(pasaporteActivo);
    } else if (!viajeActivoSinActualizar && !viajeActivo) {
      // El servidor respondió (HTTP 200) que no hay viaje activo: seguro limpiar caché.
      void limpiarCacheViajeActivo().then(() => setCacheViajeActivo(null));
    }
  }, [cachearPasaporteActivo, pasaporteActivo, viajeActivo, viajeActivoSinActualizar]);

  const limpiarViajeActivoGlobal = useCallback(async () => {
    registrarViajeActivo(null);
    setCacheViajeActivo(null);
    await limpiarCacheViajeActivo();
  }, [registrarViajeActivo]);

  const value = useMemo(
    () => ({
      viajeActivo,
      viajeActivoSinActualizar,
      registrarViajeActivo,
      cacheViajeActivo,
      cachearPasaporteActivo,
      limpiarViajeActivoGlobal
    }),
    [cacheViajeActivo, cachearPasaporteActivo, limpiarViajeActivoGlobal, registrarViajeActivo, viajeActivo, viajeActivoSinActualizar]
  );

  return (
    <ViajeActivoContext.Provider value={value}>
      {children}
    </ViajeActivoContext.Provider>
  );
}

export function useViajeActivo() {
  const contexto = useContext(ViajeActivoContext);
  if (!contexto) {
    throw new Error("useViajeActivo debe usarse dentro de ViajeActivoProvider.");
  }
  return contexto;
}

export function RegistroViajeActivo({ viaje }: { viaje: RegistroViajeActivoInput | null }) {
  const { registrarViajeActivo } = useViajeActivo();

  useEffect(() => {
    registrarViajeActivo(viaje && viajeEsOperacionActiva(viaje.estado) ? viaje : null);
    return () => registrarViajeActivo(null);
  }, [registrarViajeActivo, viaje]);

  return null;
}
