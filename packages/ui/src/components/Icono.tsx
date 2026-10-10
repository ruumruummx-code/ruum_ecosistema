"use client";

import type { CSSProperties } from "react";

/**
 * Sendas reutilizables (24×24, trazo). Fuente única para los glifos que
 * vivían copiados en cada pantalla (atras ×3, candado ×4, ...).
 */
export const SENDAS_ICONO = {
  atras: "M19 12H5M11 6l-6 6 6 6",
  palomita: "M5 13l4 4L19 7",
  candado: "M3 11h18v11H3z M7 11V7a5 5 0 0 1 10 0v4",
  usuario: "M12 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM5 20c0-3.9 3.1-7 7-7s7 3.1 7 7",
} as const;

export type NombreIcono = keyof typeof SENDAS_ICONO;

interface IconoProps {
  /** Glifo del registro compartido. */
  nombre?: NombreIcono;
  /** Senda libre (migración de wrappers `Icono({d})` locales). */
  d?: string;
  className?: string;
  strokeWidth?: number | string;
  style?: CSSProperties;
}

/**
 * Icono decorativo (aria-hidden) con los atributos canónicos: viewBox 24,
 * sin relleno, trazo currentColor con extremos redondos. `className`
 * controla el tamaño para paridad visual exacta en cada sitio migrado.
 */
export function Icono({ nombre, d, className = "size-5", strokeWidth = 1.8, style }: IconoProps) {
  const senda = d ?? (nombre ? SENDAS_ICONO[nombre] : "");
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
    >
      <path d={senda} />
    </svg>
  );
}
