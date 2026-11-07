"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConductorIcon } from "@/components/icons";
import type { NavDestination } from "./ConductorNav";

export const CONDUCTOR_DESTINATIONS: NavDestination[] = [
  { href: "/panel", etiqueta: "Inicio" }, { href: "/viajes", etiqueta: "Traslados" }, { href: "/cuenta", etiqueta: "Cuenta" },
];
const ICONOS = { "/panel": "home", "/viajes": "truck", "/cuenta": "user" } as const;
export function ConductorNavigation({ embedded = false, destinos = CONDUCTOR_DESTINATIONS }: { embedded?: boolean; destinos?: NavDestination[] }) {
  const pathname = usePathname();
  const esActivo = (href: string) => pathname === href || (href !== "/panel" && pathname.startsWith(`${href}/`));
  const navigation = <nav aria-label="Navegación principal móvil" className="w-full px-1 max-w-md mx-auto">
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
                      activo ? "conductor-nav-selected font-semibold" : "text-text-secondary hover:text-text-primary"
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
          </nav>;
  return embedded ? <div data-conductor-local-nav className="conductor-local-nav">{navigation}</div> : navigation;
}
