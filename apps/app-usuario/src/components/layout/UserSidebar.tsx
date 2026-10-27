"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { SimboloVectorial } from "@ruum/ui";
import { NAVEGACION_USUARIO, obtenerItemActivo } from "./user-navigation.config";
import { IconoFlechaDerecha, IconoPanelLateral } from "./user-navigation-icons";
import estilos from "./user-dashboard.module.css";

const CLAVE_COLAPSADA = "ruum-usuario-sidebar-colapsada";

function leerPreferenciaColapsada(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(CLAVE_COLAPSADA) === "1";
  } catch {
    return false;
  }
}

export function UserSidebar() {
  const ruta = usePathname() ?? "/";
  const parametros = useSearchParams();
  const idActivo = obtenerItemActivo(ruta, parametros);
  const [colapsada, setColapsada] = useState(false);

  useEffect(() => {
    setColapsada(leerPreferenciaColapsada());
  }, []);

  const alternar = () => {
    setColapsada((anterior) => {
      const siguiente = !anterior;
      try {
        window.localStorage.setItem(CLAVE_COLAPSADA, siguiente ? "1" : "0");
      } catch {
        // Almacenamiento restringido: la preferencia solo dura la sesión.
      }
      return siguiente;
    });
  };

  return (
    <aside
      id="userDashboardSidebar"
      aria-label="Menú principal de escritorio"
      className={`${estilos.sidebar} ${colapsada ? estilos.sidebarColapsada : ""}`}
    >
      <div
        className={`flex shrink-0 items-center gap-2 px-3 pb-2 pt-4 ${
          colapsada ? "flex-col" : "justify-between"
        }`}
      >
        <Link
          href="/"
          aria-label="Ruum Ruum — Ir al inicio"
          className="flex min-w-0 items-center gap-2.5 rounded-xl p-1 transition hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          <SimboloVectorial tamano={colapsada ? 32 : 34} tema="oscuro" />
          {!colapsada && (
            <span className="min-w-0">
              <span className="block truncate font-display text-[15px] font-black leading-tight tracking-tight text-white">
                Ruum Ruum
              </span>
              <span className="mt-0.5 block truncate text-[10px] font-semibold leading-tight tracking-wide text-[var(--udb-text)]">
                Tu traslado, en orden.
              </span>
            </span>
          )}
        </Link>

        <button
          type="button"
          onClick={alternar}
          aria-label={colapsada ? "Expandir menú lateral" : "Colapsar menú lateral"}
          aria-expanded={!colapsada}
          aria-controls="userDashboardSidebarNav"
          title={colapsada ? "Expandir menú lateral" : "Colapsar menú lateral"}
          className={`flex size-8 shrink-0 items-center justify-center rounded-lg text-[var(--udb-text)] transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${
            colapsada ? "mt-1" : ""
          }`}
        >
          <IconoPanelLateral className={`size-4 ${colapsada ? "rotate-180" : ""}`} />
        </button>
      </div>

      <div className={`${estilos.navScroll} px-2.5 pb-2`}>
        <nav id="userDashboardSidebarNav" aria-label="Navegación del panel">
          <ul className="flex flex-col gap-1">
            {NAVEGACION_USUARIO.map((item) => {
              const Icono = item.icono;
              const activo = item.id === idActivo;
              const base = `group relative flex items-center rounded-xl text-[13px] font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${
                colapsada ? "justify-center px-0 py-2.5" : "gap-3 px-3.5 py-2.5"
              }`;

              if (item.disponible === false) {
                return (
                  <li key={item.id}>
                    <span
                      aria-disabled="true"
                      title={`${item.etiqueta} — disponible próximamente`}
                      className={`${base} cursor-not-allowed text-[var(--udb-text)]/65 opacity-70`}
                    >
                      <Icono className="size-5 shrink-0" />
                      {!colapsada && (
                        <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                          <span className="truncate">{item.etiqueta}</span>
                          <span className="shrink-0 rounded-full border border-white/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[var(--udb-text)]">
                            Pronto
                          </span>
                        </span>
                      )}
                      {colapsada && <span className="sr-only">{item.etiqueta} (próximamente)</span>}
                    </span>
                  </li>
                );
              }

              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    aria-current={activo ? "page" : undefined}
                    aria-label={colapsada ? item.etiqueta : undefined}
                    title={colapsada ? item.etiqueta : undefined}
                    className={`${base} ${
                      activo
                        ? "bg-[var(--udb-accent)] text-white shadow-[0_8px_20px_-8px_rgba(0,82,255,0.9)]"
                        : "text-[var(--udb-text)] hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icono className="size-5 shrink-0" />
                    {!colapsada && <span className="truncate">{item.etiqueta}</span>}
                    {activo && !colapsada && (
                      <span
                        aria-hidden="true"
                        className="absolute right-3 size-1.5 rounded-full bg-white/90"
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <div className={`${estilos.promo} px-2.5 pb-4 pt-2`}>
        {colapsada ? (
          <Link
            href="/viajes/nuevo"
            aria-label="Crear traslado"
            title="Crear traslado"
            className="flex size-11 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-lg font-black text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            +
          </Link>
        ) : (
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[var(--udb-card)] p-4 shadow-lg">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-8 -top-8 size-24 rounded-full bg-[var(--udb-accent)]/30 blur-2xl"
            />
            <p className="relative font-display text-[13px] font-extrabold leading-snug text-white">
              Mueve tu auto sin soltar el control
            </p>
            <div className="relative mt-1.5 space-y-0.5 text-[11px] leading-relaxed text-[var(--udb-text)]">
              <p>Más simple.</p>
              <p>Más inteligente.</p>
              <p>Más cerca de ti.</p>
            </div>
            <Link
              href="/viajes/nuevo"
              className="relative mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[var(--udb-accent)] px-3 py-2 text-xs font-bold text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              Crear traslado
              <IconoFlechaDerecha className="size-3.5" />
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
