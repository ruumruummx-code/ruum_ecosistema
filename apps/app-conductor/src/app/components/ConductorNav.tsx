"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useConductorShellInsets } from "./useConductorShellInsets";
import { ConductorIcon } from "@/components/icons";

export type NavDestination = {
  href: string;
  etiqueta: string;
  Icono?: React.ComponentType<{ className?: string }>;
};

/**
 * Componente de navegación parametrizable para el conductor.
 * Encapsula los íconos, la lista de destinos y la lógica de estado activo,
 * para evitar duplicar la navegación en múltiples page.tsx.
 *
 * Uso:
 *   <ConductorNav
 *     destinos={DESTINOS_PRINCIPALES}
 *     excluidos={["/login", "/registro", ...]}
 *     mostrarHeader={true}
 *     mostrarMobileNav={true}
 *   />
 */
export function ConductorNav({
  destinos,
  excluidos = [],
  mostrarHeader = true,
  mostrarMobileNav = true,
  viajeActivo,
  viajeActivoSinActualizar,
  notificacionesNoLeidas = 0,
  nombreConductor = null,
}: {
  destinos: NavDestination[];
  excluidos?: string[];
  mostrarHeader?: boolean;
  mostrarMobileNav?: boolean;
  viajeActivo?: { trasladoId: string; folio: string; estado: string; etapa: string; destinoActual: string } | null;
  viajeActivoSinActualizar?: boolean;
  notificacionesNoLeidas?: number;
  nombreConductor?: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const esAcceso = excluidos.some((r) => pathname === r || pathname.startsWith(r + "/"));
  const { headerRef, mobileNavRef } = useConductorShellInsets(!esAcceso && mostrarHeader, !esAcceso && mostrarMobileNav);
  const presentacionViajeActivo = viajeActivo
    ? { primaryAction: { action: "none" as const } }
    : null;
  const hayAccionPendiente = false;

  const esActivo = (href: string) => {
    if (href === "/panel") return pathname === "/panel";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const primerNombre = (nombre: string | null | undefined) => {
    const valor = nombre?.trim().split(/\s+/)[0];
    if (!valor) return null;
    return valor.charAt(0).toUpperCase() + valor.slice(1).toLowerCase();
  };

  const nombre = primerNombre(nombreConductor);
  const saludo = nombre ? `¡Hola, ${nombre}!` : "¡Hola, conductor!";

  // Íconos compartidos por defecto si no se proporcionan en los destinos
  const IcoHome = ({ className = "size-[17px]" }: { className?: string }) => (
    <ConductorIcon name="home" className={className} size={17} strokeWidth={1.8} />
  );
  const IcoTraslados = ({ className = "size-[17px]" }: { className?: string }) => (
    <ConductorIcon name="truck" className={className} size={17} strokeWidth={1.8} />
  );
  const IcoGanancias = ({ className = "size-[17px]" }: { className?: string }) => (
    <ConductorIcon name="chart" className={className} size={17} strokeWidth={1.8} />
  );
  const IcoNotificaciones = ({ className = "size-[17px]" }: { className?: string }) => (
    <ConductorIcon name="bell" className={className} size={17} strokeWidth={1.8} />
  );
  const IcoSoporte = ({ className = "size-6" }: { className?: string }) => (
    <ConductorIcon name="support" className={className} size={24} strokeWidth={1.8} />
  );
  const IcoCuenta = ({ className = "size-[17px]" }: { className?: string }) => (
    <ConductorIcon name="user" className={className} size={17} strokeWidth={1.8} />
  );

  // Mapear íconos por href si el destino no trae Icono
  const iconoPorDefecto: Record<string, React.ComponentType<{ className?: string }>> = {
    "/panel": IcoHome,
    "/viajes": IcoTraslados,
    "/ganancias": IcoGanancias,
    "/notificaciones": IcoNotificaciones,
    "/cuenta": IcoCuenta,
  };

  if (esAcceso) return null;

  return (
    <>
      {mostrarHeader && (
        <header role="banner" ref={headerRef} data-conductor-header className="sticky top-0 z-30 border-b border-white/10 bg-[var(--ruum-navy)]/95 pt-[env(safe-area-inset-top)] text-white shadow-sm backdrop-blur-md">
          <div data-conductor-header-content className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-4 sm:gap-6 sm:px-6 lg:px-8">
            <Link
              href="/panel"
              aria-label="Ir al inicio de Ruum Conductor"
              className="flex shrink-0 cursor-pointer items-center rounded-2xl transition duration-200 hover:opacity-80 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--ruum-focus)]"
            >
              <span className="h-11 w-28 rounded-xl object-cover sm:h-14 sm:w-[200px] sm:rounded-2xl">
                {(() => {
                  const IconoPanel = destinos.find((d) => d.href === "/panel")?.Icono ?? IcoHome;
                  return <IconoPanel className="w-full h-full" />;
                })()}
              </span>
            </Link>

            <p className="min-w-0 flex-1 truncate text-center font-display text-sm font-bold text-white sm:text-xl lg:text-2xl">
              {saludo}
            </p>

            <nav aria-label="Acciones del conductor" className="flex shrink-0 items-center gap-1 sm:gap-3">
              <Link
                href="/notificaciones"
                aria-label={notificacionesNoLeidas > 0 ? `Notificaciones (${notificacionesNoLeidas} sin leer)` : "Notificaciones"}
                className="group flex min-h-12 min-w-12 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl px-1.5 text-slate-200 transition duration-200 hover:bg-white/5 hover:text-sky-400 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--ruum-focus)] sm:px-2"
              >
                <span className="relative">
                  <IcoNotificaciones className="size-6" />
                  {notificacionesNoLeidas > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-sky-400 ring-2 ring-[var(--ruum-navy)]" aria-hidden="true" />
                  )}
                </span>
                <span className="text-[10px] font-medium leading-none text-slate-300 transition-colors duration-200 group-hover:text-sky-400 sm:text-xs">
                  Notificaciones
                </span>
              </Link>
              <Link
                href="/cuenta/soporte"
                aria-label="Soporte"
                className="group flex min-h-12 min-w-12 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl px-1.5 text-slate-200 transition duration-200 hover:bg-white/5 hover:text-sky-400 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--ruum-focus)] sm:px-2"
              >
                <IcoSoporte className="size-6" />
                <span className="text-[10px] font-medium leading-none text-slate-300 transition-colors duration-200 group-hover:text-sky-400 sm:text-xs">
                  Soporte
                </span>
              </Link>
            </nav>
          </div>

          <nav aria-label="Navegación principal" className="hidden border-t border-white/10 md:block">
            <div data-conductor-desktop-nav className="mx-auto flex w-full max-w-7xl items-center justify-center gap-1 px-6 py-2 lg:px-8">
              {destinos.map((destino) => {
                const Icono = destino.Icono || iconoPorDefecto[destino.href] || IcoHome;
                const activo = esActivo(destino.href);
                return (
                  <Link
                    key={destino.href}
                    href={destino.href}
                    prefetch={!activo}
                    aria-current={activo ? "page" : undefined}
                    aria-label={activo ? `Página actual: ${destino.etiqueta}` : destino.etiqueta}
                    className={[
                      "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-3 py-2 font-body text-sm font-semibold transition duration-200",
                      activo ? "bg-white/10 text-white shadow-sm" : "text-slate-300 hover:bg-white/5 hover:text-sky-400"
                    ].join(" ")}
                  >
                    <Icono />
                    {destino.etiqueta}
                  </Link>
                );
              })}
            </div>
          </nav>

          {viajeActivo && !pathname.startsWith("/viajes") && pathname !== "/panel" && (
            <div data-conductor-desktop-active-trip className="hidden border-t border-border bg-surface-elevated/95 px-3 py-2 backdrop-blur md:block">
              <div className="ruum-container flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Link
                  href={`/viajes/${viajeActivo.trasladoId}`}
                  className="min-w-0 rounded-xl px-1 py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-route-action"
                  aria-label={`Ver detalles del traslado ${viajeActivo.folio}`}
                >
                  <p className="flex items-center gap-2 font-body text-sm font-semibold text-route-action">
                    <span>Traslado activo · {viajeActivo.folio}</span>
                    {hayAccionPendiente && (
                      <span className="rounded-full border border-warning bg-warning px-2 py-0.5 font-body text-sm font-bold text-on-primary">
                        Acción pendiente
                      </span>
                    )}
                    {viajeActivoSinActualizar && (
                      <span className="rounded-full border border-warning bg-warning/10 px-2 py-0.5 font-body text-sm font-bold text-warning">
                        Información sin actualizar
                      </span>
                    )}
                  </p>
                  <div className="mt-0.5 flex min-w-0 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
                    <span className="truncate font-body text-sm font-semibold text-text-primary">{viajeActivo.etapa}</span>
                    <span className="hidden text-text-secondary sm:inline" aria-hidden>
                      ·
                    </span>
                    <span className="truncate font-body text-base text-text-secondary">{viajeActivo.destinoActual}</span>
                  </div>
                </Link>
                <div className="grid grid-cols-4 gap-1 sm:flex sm:shrink-0 sm:items-center">
                  <Link
                    href={`/viajes/${viajeActivo.trasladoId}`}
                    className="inline-flex min-h-11 items-center justify-center rounded-lg bg-route-action px-3 py-2 text-center font-body text-sm font-bold text-white"
                  >
                    Abrir
                  </Link>
                  <Link
                    href={`/viajes/${viajeActivo.trasladoId}#contacto`}
                    className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[rgba(142,197,255,0.42)] bg-surface px-2 py-2 text-center font-body text-sm font-semibold text-text-primary"
                  >
                    Contacto
                  </Link>
                  <Link
                    href={`/viajes/${viajeActivo.trasladoId}#reportar-problema`}
                    className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[rgba(142,197,255,0.42)] bg-surface px-2 py-2 text-center font-body text-sm font-semibold text-text-primary"
                  >
                    Problema
                  </Link>
                  <Link
                    href={`/viajes/${viajeActivo.trasladoId}#emergencia`}
                    className="inline-flex min-h-11 items-center justify-center rounded-lg border border-danger-action bg-danger-soft px-2 py-2 text-center font-body text-sm font-semibold text-danger-action"
                  >
                    Emergencia
                  </Link>
                </div>
              </div>
            </div>
          )}
        </header>
      )}

      {mostrarMobileNav && (
        <div ref={mobileNavRef} data-conductor-mobile-nav className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-surface/95 border-t border-border/20 backdrop-blur-md pb-[max(8px,env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-8px_30px_rgba(13,43,94,0.10)] supports-[backdrop-filter]:bg-surface/80">
          {viajeActivo && !pathname.startsWith("/viajes") && pathname !== "/panel" && (
            <div className="conductor-mobile-active-trip px-4 pb-3">
              <Link
                href={`/viajes/${viajeActivo.trasladoId}`}
                aria-label={`Abrir traslado activo ${viajeActivo.folio}: ${viajeActivo.etapa}`}
                className="conductor-mobile-active-trip-card mx-auto grid grid-cols-[1fr_auto] items-center gap-3 rounded-2xl border border-border/40 bg-surface-elevated/95 px-4 py-2.5 shadow-lg backdrop-blur"
              >
                <span className="min-w-0">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate font-body text-xs font-bold uppercase text-route-action">
                      Traslado activo · {viajeActivo.folio}
                    </span>
                    {hayAccionPendiente && (
                      <span className="inline-flex size-3 shrink-0 rounded-full bg-warning ring-2 ring-surface-elevated" aria-hidden />
                    )}
                  </span>
                  <span className="mt-1 block truncate font-body text-sm font-bold text-text-primary">{viajeActivo.etapa}</span>
                  <span className="conductor-mobile-active-trip-destination mt-0.5 block truncate font-body text-xs text-text-secondary">{viajeActivo.destinoActual}</span>
                </span>
                <span className="inline-flex min-h-10 items-center justify-center rounded-xl bg-signal px-3.5 font-display text-xs font-black uppercase" style={{ color: "var(--ruum-on-primary, #061529)" }}>
                  Abrir
                </span>
              </Link>
            </div>
          )}

          <nav aria-label="Navegación principal móvil" className="w-full px-1 max-w-md mx-auto">
            <div className="grid grid-cols-5 gap-0.5">
              {destinos.map((destino) => {
                const Icono = destino.Icono || iconoPorDefecto[destino.href] || IcoHome;
                const activo = esActivo(destino.href);
                const notificar = destino.href === "/viajes" && hayAccionPendiente;
                return (
                  <Link
                    key={destino.href}
                    href={destino.href}
                    prefetch={!activo}
                    aria-current={activo ? "page" : undefined}
                    aria-label={notificar ? `${destino.etiqueta}: acción pendiente` : destino.etiqueta}
                    className={[
                      "relative flex flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1.5 min-h-[56px] font-body text-xs leading-none transition-colors duration-200 select-none",
                      activo ? "text-text-primary dark:text-signal font-black bg-signal/20 dark:bg-signal/15 shadow-2xs" : "text-text-secondary hover:text-text-primary"
                    ].join(" ")}
                  >
                    <div className="relative flex items-center justify-center p-1">
                      {notificar && (
                        <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-warning ring-2 ring-surface animate-pulse" aria-hidden />
                      )}
                      <Icono />
                    </div>
                    <span className="max-w-full truncate tracking-tight text-xs leading-none">{destino.etiqueta}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
