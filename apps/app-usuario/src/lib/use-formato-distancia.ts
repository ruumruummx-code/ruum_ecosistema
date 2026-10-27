"use client";
import { useCallback, useSyncExternalStore } from "react";
export function formatearDistanciaUsuario(km: number, imperial = false) {
  return `${(imperial ? km / 1.609344 : km).toLocaleString("es-MX", { maximumFractionDigits: 1 })} ${imperial ? "mi" : "km"}`;
}
const suscribir = (cambiar: () => void) => {
  window.addEventListener("ruum:unidades-actualizadas", cambiar);
  return () => window.removeEventListener("ruum:unidades-actualizadas", cambiar);
};
export function useFormatoDistancia() {
  const imperial = useSyncExternalStore(suscribir, () => document.documentElement.dataset.units === "imperial", () => false);
  return useCallback((km: number) => formatearDistanciaUsuario(km, imperial), [imperial]);
}
