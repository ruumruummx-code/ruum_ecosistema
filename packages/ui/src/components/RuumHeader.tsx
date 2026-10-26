import type { ReactNode } from "react";
import Link from "next/link";
import { LogoMarca } from "./LogoMarca";

export type RolHeader = "conductor" | "usuario";

export interface RuumHeaderProps {
  /**
   * Rol de la aplicación. Define la etiqueta que se muestra debajo del nombre
   * de la marca: `"conductor"` para Ruum Ruum Conductor y `"Usuario"` para
   * Ruum Ruum Usuario.
   */
  rol?: RolHeader;
  /** Cantidad de notificaciones pendientes. Si es mayor a 0 se muestra el punto de alerta. */
  notificacionesCount?: number;
  /** Acción del botón de notificaciones (campana). */
  onNotificaciones?: () => void;
  /** Acción del botón de soporte/ayuda (audífonos). */
  onSoporte?: () => void;
  /** Acción adicional colocada a la izquierda del branding (p. ej. menú del conductor). */
  accionIzquierda?: ReactNode;
  /** Destino del logotipo (por defecto "/" — inicio de la app). */
  hrefLogo?: string;
  className?: string;
}

/** Ícono de campana (24×24, trazo). */
function IconoCampana({ className = "size-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

/** Ícono de diadema de soporte / call center (24×24, trazo). */
function IconoSoporte({ className = "size-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 13v-1a8 8 0 0 1 16 0v1" />
      <path d="M4 13a2 2 0 0 1 2-2h1v6H6a2 2 0 0 1-2-2v-2ZM20 13a2 2 0 0 0-2-2h-1v6h1a2 2 0 0 0 2-2v-2Z" />
      <path d="M17 17c0 2-1.8 3-4 3h-1" />
    </svg>
  );
}

/**
 * Header estándar de Ruum Ruum (App Usuario y Conductor).
 *
 * Estructura (de izquierda a derecha):
 *  - Branding: imagotipo (RR con pin de ubicación) + "Ruum Ruum" +
 *    etiqueta de rol ("conductor" | "Usuario") en gris/azul tenue.
 *  - Acciones: botón de notificaciones (campana) y botón de soporte (audífonos),
 *    cada uno dentro de un contenedor circular blanco con drop shadow.
 *
 * Detalle visual: curva degradada (azul brillante → azul marino) en la
 * esquina superior derecha que enmarca los botones de acción. Fondo blanco
 * con esquinas redondeadas en los bordes exteriores.
 */
export function RuumHeader({
  rol = "usuario",
  notificacionesCount = 0,
  onNotificaciones,
  onSoporte,
  accionIzquierda,
  hrefLogo = "/",
  className = "",
}: RuumHeaderProps) {
  const esConductor = rol === "conductor";
  const roleLabel = esConductor ? "conductor" : "Usuario";
  const tieneNotificaciones = notificacionesCount > 0;
  const ariaLabelNotificaciones = tieneNotificaciones
    ? `Notificaciones (${notificacionesCount} pendientes)`
    : "Notificaciones";

  return (
    <header
      className={[
        // Fondo blanco, esquinas redondeadas en bordes exteriores (top), sticky y sombra suave.
        "sticky top-0 z-30 flex w-full shrink-0 items-center justify-between gap-3 bg-white rounded-tl-[24px] rounded-tr-[24px] border-b border-[#e6f0ff] shadow-[0_2px_10px_rgba(13,43,94,0.05)]",
        "dark:bg-[#0a2342] dark:border-[#1a3a5c]",
        "pb-[max(8px,env(safe-area-inset-top))] pt-[max(10px,env(safe-area-inset-top))] px-4",
        className,
      ].join(" ")}
    >
      {/* Ola decorativa superior derecha: degradado azul brillante → azul marino oscuro. */}
      <div
        className="ruum-header__wave absolute top-0 right-0 w-[140px] h-[56px] shrink-0 bg-gradient-to-br from-[#00d1d1] to-[#0a2342] rounded-bl-[48px] opacity-90"
        aria-hidden="true"
      />

      <div className="ruum-header__inner flex w-full items-center justify-between gap-3">
        {/* Acción adicional a la izquierda (p. ej. menú del conductor) */}
        {accionIzquierda && <div className="ruum-header__accion-izq flex shrink-0 items-center">{accionIzquierda}</div>}
        {/* Costado izquierdo — Branding */}
        <div className="ruum-header__branding flex shrink-0 items-center gap-2.5 min-w-0">
          <Link
            href={hrefLogo}
            className="ruum-header__logo flex shrink-0 items-center gap-2.5 rounded-xl transition duration-200 hover:opacity-90 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#0066ff]"
            aria-label="Ruum Ruum"
          >
            <LogoMarca
              variante="simbolo"
              tamano={36}
              tema="claro"
              className="ruum-header__logo-img shrink-0"
            />
            <div className="ruum-header__text min-w-0">
              <span className="ruum-header__title block truncate font-display text-[17px] font-black leading-none tracking-tight text-[#0a2342] dark:text-[#f6f8fb]">
                Ruum Ruum
              </span>
              <span className="ruum-header__role block truncate text-[11px] font-medium leading-none text-[#566889] dark:text-[#a8b5cc] uppercase tracking-wider">
                {roleLabel}
              </span>
            </div>
          </Link>
        </div>

        {/* Costado derecho — Acciones */}
        <div className="ruum-header__actions flex shrink-0 items-center gap-2">
          {onNotificaciones && (
            <button
              type="button"
              onClick={onNotificaciones}
              aria-label={ariaLabelNotificaciones}
              className={[
                "ruum-header__action-btn relative flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white border border-[#e6f0ff] shadow-[0_2px_10px_rgba(13,43,94,0.08)] transition hover:shadow-[0_4px_12px_rgba(13,43,94,0.12)] active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0066ff]",
                tieneNotificaciones ? "text-[#00d1d1]" : "text-[#566889]",
                "dark:border-[#1a3a5c] dark:bg-[#0a2342] dark:text-[#a8b5cc]",
              ].join(" ")}
            >
              <IconoCampana className="size-5" />
              {tieneNotificaciones && (
                <span className="ruum-header__dot absolute top-[2px] right-[2px] size-2.5 rounded-full bg-[#00d0ff] border border-white" aria-hidden="true" />
              )}
              <span className="sr-only">
                {tieneNotificaciones ? `${notificacionesCount} notificaciones pendientes` : "Sin notificaciones pendientes"}
              </span>
            </button>
          )}
          {onSoporte && (
            <button
              type="button"
              onClick={onSoporte}
              aria-label="Soporte y ayuda"
              className={[
                "ruum-header__action-btn relative flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white border border-[#e6f0ff] shadow-[0_2px_10px_rgba(13,43,94,0.08)] transition hover:shadow-[0_4px_12px_rgba(13,43,94,0.12)] active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0066ff]",
                "text-[#566889]",
                "dark:border-[#1a3a5c] dark:bg-[#0a2342] dark:text-[#a8b5cc]",
              ].join(" ")}
            >
              <IconoSoporte className="size-5" />
              <span className="sr-only">Soporte y ayuda</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
