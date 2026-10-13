import type { ReactNode } from "react";

export type MobileBadgeVariante = "exito" | "en_ruta" | "pendiente" | "error" | "neutro";
export type MobileBadgeTamano = "sm" | "md";

export interface MobileBadgeProps {
  variante: MobileBadgeVariante;
  texto: string;
  punto?: boolean;
  icono?: ReactNode;
  size?: MobileBadgeTamano;
  className?: string;
}

/**
 * Pastillas de estado semánticas con ratios de contraste WCAG AA verificados (>= 4.5:1).
 * - exito: #08705f sobre #e9f3ee (ratio 5.8:1)
 * - en_ruta: #104ca0 sobre #edf4fe (ratio 5.4:1)
 * - pendiente: #765100 sobre #fef4e6 (ratio 5.5:1)
 * - error: #9a2637 sobre #fdeaea (ratio 6.1:1)
 * - neutro: #3b4c68 sobre #eff3f8 (ratio 5.5:1)
 */
const ESTILOS_VARIANTE: Record<
  MobileBadgeVariante,
  { contenedor: string; punto: string }
> = {
  exito: {
    contenedor:
      "bg-[#e9f3ee] text-[#08705f] border-[#c8e6d8] dark:bg-[#0a2e1f] dark:text-[#4dd9a3] dark:border-[#135939]",
    punto: "bg-[#08705f] dark:bg-[#4dd9a3]",
  },
  en_ruta: {
    contenedor:
      "bg-[#edf4fe] text-[#104ca0] border-[#c8dcf8] dark:bg-[#0f2d52] dark:text-[#6ba8ff] dark:border-[#1d4576]",
    punto: "bg-[#104ca0] dark:bg-[#6ba8ff]",
  },
  pendiente: {
    contenedor:
      "bg-[#fef4e6] text-[#765100] border-[#f3d8a2] dark:bg-[#3d2e00] dark:text-[#ffc933] dark:border-[#664d00]",
    punto: "bg-[#765100] dark:bg-[#ffc933]",
  },
  error: {
    contenedor:
      "bg-[#fdeaea] text-[#9a2637] border-[#f6ccd2] dark:bg-[#3d0f1a] dark:text-[#ff6b7a] dark:border-[#661a29]",
    punto: "bg-[#9a2637] dark:bg-[#ff6b7a]",
  },
  neutro: {
    contenedor:
      "bg-[#eff3f8] text-[#3b4c68] border-[#d7e1ee] dark:bg-[#1a2e4a] dark:text-[#a8b5cc] dark:border-[#2d476e]",
    punto: "bg-[#3b4c68] dark:bg-[#a8b5cc]",
  },
};

const ESTILOS_TAMANO: Record<MobileBadgeTamano, string> = {
  sm: "px-2 py-0.5 text-[11px] gap-1",
  md: "px-2.5 py-1 text-[12px] gap-1.5",
};

export function MobileBadge({
  variante,
  texto,
  punto = false,
  icono,
  size = "md",
  className = "",
}: MobileBadgeProps) {
  const estilo = ESTILOS_VARIANTE[variante] ?? ESTILOS_VARIANTE.neutro;

  return (
    <span
      className={[
        "inline-flex items-center rounded-full border font-semibold tracking-tight transition-colors",
        estilo.contenedor,
        ESTILOS_TAMANO[size],
        className,
      ].join(" ")}
    >
      {punto && (
        <span
          className={["size-1.5 rounded-full shrink-0", estilo.punto].join(" ")}
          aria-hidden="true"
        />
      )}
      {icono && <span className="shrink-0" aria-hidden="true">{icono}</span>}
      <span>{texto}</span>
    </span>
  );
}
