"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConductorNavigation } from "./ConductorNavigation";
import { conductorRouteContract } from "./route-contract";


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

  const esAcceso = !conductorRouteContract(pathname).navigation || excluidos.some((r) => pathname === r || pathname.startsWith(r + "/"));

  if (esAcceso) return null;

  return (
    <>
      {mostrarMobileNav && (
        <div data-conductor-mobile-nav className="conductor-bottom-nav">
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
                <span className="inline-flex min-h-10 items-center justify-center rounded-xl bg-signal px-3.5 font-display text-xs font-black uppercase" style={{ color: "var(--conductor-on-action)" }}>
                  Abrir
                </span>
              </Link>
            </div>
          )}

          <ConductorNavigation destinos={destinos} />
        </div>
      )}
    </>
  );
}
