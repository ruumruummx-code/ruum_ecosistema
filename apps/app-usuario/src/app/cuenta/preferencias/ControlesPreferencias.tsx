import type { ReactNode, SelectHTMLAttributes } from "react";

export interface InterruptorPreferenciaProps {
  id?: string;
  evento: string;
  canal?: string;
  activo: boolean;
  onAlternar: () => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Control switch accesible con nombre que combina evento y canal (WCAG 4.1.2 y 1.3.1).
 * Garantiza anuncio semántico de estado y cambio para lectores de pantalla.
 */
export function InterruptorPreferencia({
  id,
  evento,
  canal,
  activo,
  onAlternar,
  disabled = false,
  className = "",
}: InterruptorPreferenciaProps) {
  const nombreAccesible = canal ? `${evento} · ${canal}` : evento;
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={activo}
      aria-label={nombreAccesible}
      disabled={disabled}
      onClick={onAlternar}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#0066FF] ${
        activo ? "bg-[#0066FF]" : "bg-slate-300 dark:bg-slate-700"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
    >
      <span className="sr-only">
        {nombreAccesible}: {activo ? "activado" : "desactivado"}
      </span>
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
          activo ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export interface SelectorPreferenciaProps extends SelectHTMLAttributes<HTMLSelectElement> {
  id: string;
  etiquetaVisible?: string;
  nombreAccesible: string;
  children: ReactNode;
}

/**
 * Selector accesible con doble vinculación (label for + aria-label) para garantizar
 * nombre accesible unívoco en todos los árboles de accesibilidad (axe select-name).
 */
export function SelectorPreferencia({
  id,
  etiquetaVisible,
  nombreAccesible,
  children,
  className = "",
  ...props
}: SelectorPreferenciaProps) {
  return (
    <>
      <label htmlFor={id} className="sr-only">
        {etiquetaVisible || nombreAccesible}
      </label>
      <select
        id={id}
        aria-label={nombreAccesible}
        className={`bg-white dark:bg-[#16253B] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-xl px-3 py-1.5 outline-none focus:ring-2 focus:ring-[#0066FF] shrink-0 ${className}`}
        {...props}
      >
        {children}
      </select>
    </>
  );
}
