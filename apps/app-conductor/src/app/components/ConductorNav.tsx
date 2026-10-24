"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useConductorShellInsets } from "./useConductorShellInsets";
import { ConductorIcon } from "@/components/icons";

const ICONOS = { "/panel": "home", "/viajes": "truck", "/cuenta": "user" } as const;

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
 *     mostrarMobileNav={true}
 *   />
 */
export function ConductorNav({
  destinos,
  excluidos = [],
  mostrarMobileNav = true,
  viajeActivo,
  viajeActivoSinActualizar,
}: {
  destinos: NavDestination[];
  excluidos?: string[];
  mostrarMobileNav?: boolean;
  viajeActivo?: { trasladoId: string; folio: string; estado: string; etapa: string; destinoActual: string } | null;
  viajeActivoSinActualizar?: boolean;
}) {
  const pathname = usePathname();

  const esAcceso = excluidos.some((r) => pathname === r || pathname.startsWith(r + "/"));
  const { mobileNavRef } = useConductorShellInsets(false, !esAcceso && mostrarMobileNav);

  const esActivo = (href: string) => {
    if (href === "/panel") return pathname === "/panel";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  if (esAcceso) return null;

  return (
    <>
      {mostrarMobileNav && (
        <div ref={mobileNavRef} data-conductor-mobile-nav className="fixed bottom-0 inset-x-0 z-40 bg-surface/95 border-t border-border/20 backdrop-blur-md pb-[max(8px,env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-8px_30px_rgba(13,43,94,0.10)] supports-[backdrop-filter]:bg-surface/80">
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
                  </span>
                  {viajeActivoSinActualizar && <span className="block text-sm text-warning">Información sin actualizar</span>}
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
            <div className="grid grid-cols-3 gap-0.5">
              {destinos.map((destino) => {
                const Icono = destino.Icono;
                const icono = ICONOS[destino.href as keyof typeof ICONOS] ?? "home";
                const activo = esActivo(destino.href);
                return (
                  <Link
                    key={destino.href}
                    href={destino.href}
                    prefetch={!activo}
                    aria-current={activo ? "page" : undefined}
                    aria-label={destino.etiqueta}
                    className={[
                      "relative flex flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1.5 min-h-[56px] font-body text-xs leading-none transition-colors duration-200 select-none",
                      activo ? "text-text-primary dark:text-signal font-black bg-signal/20 dark:bg-signal/15 shadow-2xs" : "text-text-secondary hover:text-text-primary"
                    ].join(" ")}
                  >
                    <div className="relative flex items-center justify-center p-1">
                      {Icono ? <Icono /> : <ConductorIcon name={icono} size={17} strokeWidth={1.8} />}
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
