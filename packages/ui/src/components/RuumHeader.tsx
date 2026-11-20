import type { ReactNode } from "react";
import Link from "next/link";
import { Bell, Headset } from "lucide-react";
import { Button } from "../base/button";
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
  const roleLabel = esConductor ? "Conductor" : "Usuario";
  const tieneNotificaciones = notificacionesCount > 0;
  const ariaLabelNotificaciones = tieneNotificaciones
    ? `Notificaciones (${notificacionesCount} pendientes)`
    : "Notificaciones";

  return (
    <header
      className={[
        // Fondo blanco, esquinas redondeadas en bordes exteriores (top), sticky y sombra suave.
        "sticky top-0 z-30 flex w-full shrink-0 items-center justify-between gap-3 bg-ui-card border-b border-ui-line shadow-ui-sm",
        "pb-2 pt-[calc(0.5rem+env(safe-area-inset-top))] px-4",
        className,
      ].join(" ")}
    >
      {/* Ola decorativa superior derecha: degradado azul brillante → azul marino oscuro. */}
      <div
        className="ruum-header__wave absolute top-0 right-0 w-[140px] h-[56px] shrink-0 bg-ui-header-wave rounded-bl-full opacity-90"
        aria-hidden="true"
      />

      <div className="ruum-header__inner relative flex w-full items-center justify-between gap-3">
        {/* Acción adicional a la izquierda (p. ej. menú del conductor) */}
        {accionIzquierda && <div className="ruum-header__accion-izq flex shrink-0 items-center">{accionIzquierda}</div>}
        {/* Costado izquierdo — Branding */}
        <div className="ruum-header__branding flex shrink-0 items-center gap-2.5 min-w-0">
          <Link
            href={hrefLogo}
            className="ruum-header__logo flex shrink-0 items-center gap-2.5 rounded-xl transition duration-200 hover:opacity-90 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-ui-focus"
          >
            <span aria-hidden="true" className="shrink-0">
              <LogoMarca
                variante="simbolo"
                tamano={36}
                tema="auto"
                className="ruum-header__logo-img shrink-0"
              />
            </span>
            <div className="ruum-header__text min-w-0">
              <span className="ruum-header__title block truncate font-display text-base font-black leading-none tracking-tight text-ui-fg">
                Ruum Ruum
              </span>
              <span className="ruum-header__role block truncate text-xs font-medium leading-none text-ui-fg-muted uppercase tracking-wider">
                {roleLabel}
              </span>
            </div>
          </Link>
        </div>

        {/* Costado derecho — Acciones */}
        <div className="ruum-header__actions flex shrink-0 items-center gap-2">
          {onNotificaciones && (
            <Button
              variant="outline"
              size="icon"
              type="button"
              onClick={onNotificaciones}
              aria-label={ariaLabelNotificaciones}
              className="ruum-header__action-btn relative rounded-full shadow-ui-sm"
            >
              <Bell className="size-5" />
              {tieneNotificaciones && (
                <span className="ruum-header__dot absolute top-[2px] right-[2px] size-2.5 rounded-full bg-ui-brand border border-ui-card" aria-hidden="true" />
              )}
              <span className="sr-only">
                {tieneNotificaciones ? `${notificacionesCount} notificaciones pendientes` : "Sin notificaciones pendientes"}
              </span>
            </Button>
          )}
          {onSoporte && (
            <Button
              variant="outline"
              size="icon"
              type="button"
              onClick={onSoporte}
              aria-label="Soporte y ayuda"
              className="ruum-header__action-btn rounded-full shadow-ui-sm"
            >
              <Headset className="size-5" />
              <span className="sr-only">Soporte y ayuda</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
