"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { SimboloVectorial } from "@ruum/ui";
import {
  NAVEGACION_USUARIO,
  obtenerItemActivo,
  type ItemNavegacionUsuario,
} from "./user-navigation.config";
import {
  IconoFlechaDerecha,
  IconoPanelLateral,
} from "./user-navigation-icons";
import estilos from "./user-dashboard.module.css";

export interface UserSidebarProps {
  items?: ItemNavegacionUsuario[];
  activePath?: string;
  collapsed?: boolean;
  mobileOpen?: boolean;
  onCollapseChange?: (value: boolean) => void;
  onMobileClose?: () => void;
  showPromo?: boolean;
}

function IconoCerrar({ className = "size-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

/** Ilustración estilizada de sedán blanco para la tarjeta promocional inferior */
function MiniAutoPromo() {
  return (
    <svg viewBox="0 0 160 55" fill="none" className="w-full h-auto drop-shadow-md" aria-hidden="true">
      <defs>
        <radialGradient id="promoGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#075be8" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#075be8" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="promoBody" x1="0" y1="0" x2="1" y2="0.6">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="50%" stopColor="#f0f5fa" />
          <stop offset="100%" stopColor="#d3dfec" />
        </linearGradient>
      </defs>
      {/* Luz y asfalto curvado */}
      <ellipse cx="80" cy="46" rx="72" ry="7" fill="url(#promoGlow)" />
      <path d="M10 46 C 45 42, 115 42, 150 46" stroke="#00bfd2" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
      {/* Carrocería sedán */}
      <path
        d="M18 36 C 24 35, 36 32, 48 30 C 64 27, 82 20, 106 20 C 128 20, 140 25, 146 30 C 150 32, 153 35, 151 37 C 149 39, 138 41, 126 41 C 121 41, 114 34, 102 34 C 90 34, 85 41, 65 41 C 57 41, 52 34, 40 34 C 28 34, 23 41, 16 40 C 12 40, 14 37, 18 36 Z"
        fill="url(#promoBody)"
      />
      {/* Cabina y cristales */}
      <path d="M52 29 L 70 22 C 78 19, 108 19, 118 22 L 134 29 Z" fill="#081a30" />
      <path d="M72 23 L 90 21 L 89 28 L 57 29 Z" fill="#60a5fa" opacity="0.35" />
      {/* Faros */}
      <polygon points="15,35 22,34 21,37" fill="#00bfd2" />
      <polygon points="149,34 146,37 144,36" fill="#ef4444" />
      {/* Ruedas */}
      <g transform="translate(42, 38)">
        <circle cx="0" cy="0" r="8" fill="#0f172a" />
        <circle cx="0" cy="0" r="5" fill="#475569" stroke="#94a3b8" strokeWidth="1" />
        <circle cx="0" cy="0" r="2" fill="#f8fafc" />
      </g>
      <g transform="translate(118, 38)">
        <circle cx="0" cy="0" r="8" fill="#0f172a" />
        <circle cx="0" cy="0" r="5" fill="#475569" stroke="#94a3b8" strokeWidth="1" />
        <circle cx="0" cy="0" r="2" fill="#f8fafc" />
      </g>
    </svg>
  );
}

export function UserSidebar({
  items = NAVEGACION_USUARIO,
  activePath,
  collapsed = false,
  mobileOpen = false,
  onCollapseChange,
  onMobileClose,
  showPromo = true,
}: UserSidebarProps) {
  const rutaActual = usePathname() ?? "/";
  const parametros = useSearchParams();
  const ruta = activePath ?? rutaActual;
  const idActivo = obtenerItemActivo(ruta, parametros);
  const sidebarRef = useRef<HTMLElement>(null);
  const botonCerrarRef = useRef<HTMLButtonElement>(null);
  const elementoPrevioRef = useRef<HTMLElement | null>(null);

  // En móvil con drawer abierto: trampa de foco, bloqueo de scroll, aislamiento del fondo y Escape
  useEffect(() => {
    if (!mobileOpen) return;

    // 1. Guardar el elemento previamente activo para restaurar el foco al cerrar
    elementoPrevioRef.current = (document.activeElement as HTMLElement) ?? null;

    // 2. Bloquear scroll del fondo
    const estiloAnteriorOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // 3. Foco inicial al botón de cerrar
    const focoTimer = setTimeout(() => {
      botonCerrarRef.current?.focus();
    }, 0);

    // 4. Aislar elementos hermanos para tecnologías de asistencia (background isolation)
    const elementosAislados: Array<{ el: HTMLElement; prevAriaHidden: string | null; prevInert: boolean }> = [];
    const sidebarEl = sidebarRef.current;

    if (typeof document !== "undefined" && sidebarEl) {
      const hijosBody = Array.from(document.body.children) as HTMLElement[];
      for (const el of hijosBody) {
        if (el !== sidebarEl && !el.contains(sidebarEl) && !el.classList.contains(estilos.drawerBackdrop)) {
          elementosAislados.push({
            el,
            prevAriaHidden: el.getAttribute("aria-hidden"),
            prevInert: el.inert,
          });
          el.setAttribute("aria-hidden", "true");
          try {
            el.inert = true;
          } catch {
            // Soporte seguro de navegador
          }
        }
      }
    }

    // 5. Manejar Tab, Shift+Tab (focus trap) y tecla Escape
    const alPresionarTecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onMobileClose?.();
        return;
      }

      if (e.key === "Tab") {
        const sidebar = sidebarRef.current;
        if (!sidebar) return;

        const selector =
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
        const focusables = Array.from(
          sidebar.querySelectorAll<HTMLElement>(selector)
        ).filter(
          (elem) =>
            !elem.hasAttribute("disabled") &&
            elem.getAttribute("aria-disabled") !== "true" &&
            !elem.hidden &&
            elem.tabIndex !== -1
        );

        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }

        const primerElem = focusables[0];
        const ultimoElem = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === primerElem || !sidebar.contains(document.activeElement)) {
            e.preventDefault();
            ultimoElem.focus();
          }
        } else {
          if (document.activeElement === ultimoElem || !sidebar.contains(document.activeElement)) {
            e.preventDefault();
            primerElem.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", alPresionarTecla);
    return () => {
      clearTimeout(focoTimer);
      document.body.style.overflow = estiloAnteriorOverflow;
      document.removeEventListener("keydown", alPresionarTecla);

      // Restaurar aislamiento del fondo
      for (const item of elementosAislados) {
        if (item.prevAriaHidden === null) {
          item.el.removeAttribute("aria-hidden");
        } else {
          item.el.setAttribute("aria-hidden", item.prevAriaHidden);
        }
        try {
          item.el.inert = item.prevInert;
        } catch {
          // No-op
        }
      }

      // Restaurar foco al elemento que detonó la apertura
      elementoPrevioRef.current?.focus?.();
    };
  }, [mobileOpen, onMobileClose]);

  const esContraida = collapsed && !mobileOpen;

  const alternarColapso = () => {
    onCollapseChange?.(!collapsed);
  };

  // Divide los elementos en 2 grupos: Operativos (1-5) y Cuenta/Soporte (6-9)
  const itemsGrupoOperativo = items.slice(0, 5);
  const itemsGrupoCuenta = items.slice(5);

  const renderItem = (item: ItemNavegacionUsuario): ReactNode => {
    const Icono = item.icono;
    const activo = item.id === idActivo;
    const base = `group relative flex min-h-[44px] items-center rounded-xl text-[13px] font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${
      esContraida ? "justify-center px-0 py-2.5" : "gap-3 px-3.5 py-2.5"
    }`;

    if (item.disponible === false) {
      return (
        <li key={item.id}>
          <span
            aria-disabled="true"
            title={`${item.etiqueta} — disponible próximamente`}
            className={`${base} cursor-not-allowed text-[var(--udb-text,#94a3b8)]/60 opacity-60`}
          >
            <Icono className="size-5 shrink-0" />
            {!esContraida && (
              <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                <span className="truncate">{item.etiqueta}</span>
                <span className="shrink-0 rounded-full border border-white/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[var(--udb-text,#94a3b8)]">
                  Pronto
                </span>
              </span>
            )}
            {esContraida && <span className="sr-only">{item.etiqueta} (próximamente)</span>}
          </span>
        </li>
      );
    }

    return (
      <li key={item.id}>
        <Link
          href={item.href}
          onClick={() => {
            if (mobileOpen) onMobileClose?.();
          }}
          aria-current={activo ? "page" : undefined}
          aria-label={esContraida ? item.etiqueta : undefined}
          title={esContraida ? item.etiqueta : undefined}
          className={`${base} ${
            activo
              ? "bg-[var(--rr-sidebar-active,#075be8)] text-white shadow-[0_6px_18px_-4px_rgba(7,91,232,0.85)] font-bold"
              : "text-[var(--udb-text,#94a3b8)] hover:bg-white/10 hover:text-white"
          }`}
        >
          <Icono className="size-5 shrink-0" />
          {!esContraida && <span className="truncate">{item.etiqueta}</span>}
          {activo && !esContraida && (
            <span
              aria-hidden="true"
              className="absolute right-3 size-1.5 rounded-full bg-white/90"
            />
          )}
        </Link>
      </li>
    );
  };

  return (
    <>
      {/* Backdrop para Drawer Móvil */}
      {mobileOpen && (
        <div
          className={estilos.drawerBackdrop}
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      <aside
        ref={sidebarRef}
        id="userDashboardSidebar"
        aria-label={mobileOpen ? "Menú principal de navegación" : "Menú principal de escritorio"}
        aria-modal={mobileOpen ? "true" : undefined}
        role={mobileOpen ? "dialog" : undefined}
        className={`${estilos.sidebar} ${esContraida ? estilos.sidebarColapsada : ""} ${
          mobileOpen ? estilos.sidebarMobileOpen : ""
        }`}
      >
        {/* Cabecera del Sidebar: Logo y botón de toggle/cierre */}
        <div
          className={`flex shrink-0 items-center gap-2 px-3 pb-2 pt-4 ${
            esContraida ? "flex-col" : "justify-between"
          }`}
        >
          <Link
            href="/"
            onClick={() => {
              if (mobileOpen) onMobileClose?.();
            }}
            aria-label="Ruum Ruum — Ir al inicio"
            className="flex min-w-0 items-center gap-2.5 rounded-xl p-1 transition hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <SimboloVectorial tamano={esContraida ? 32 : 34} tema="oscuro" />
            {!esContraida && (
              <span className="min-w-0">
                <span className="block truncate font-display text-[15px] font-black leading-tight tracking-tight text-white">
                  Ruum Ruum
                </span>
                <span className="mt-0.5 block truncate text-[10px] font-semibold leading-tight tracking-wide text-[var(--rr-brand-cyan,#00bfd2)]">
                  Tu traslado, en orden
                </span>
              </span>
            )}
          </Link>

          {/* Botón Cerrar en móvil, o Alternar en Desktop/Tablet */}
          {mobileOpen ? (
            <button
              ref={botonCerrarRef}
              type="button"
              onClick={onMobileClose}
              aria-label="Cerrar menú de navegación"
              className="flex size-9 shrink-0 items-center justify-center rounded-lg text-[var(--udb-text,#94a3b8)] transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <IconoCerrar className="size-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={alternarColapso}
              aria-label={esContraida ? "Expandir menú lateral" : "Colapsar menú lateral"}
              aria-expanded={!esContraida}
              aria-controls="userDashboardSidebarNav"
              title={esContraida ? "Expandir menú lateral" : "Colapsar menú lateral"}
              className={`hidden md:flex size-8 shrink-0 items-center justify-center rounded-lg text-[var(--udb-text,#94a3b8)] transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${
                esContraida ? "mt-1" : ""
              }`}
            >
              <IconoPanelLateral className={`size-4 ${esContraida ? "rotate-180" : ""}`} />
            </button>
          )}
        </div>

        {/* Lista de navegación con scroll independiente */}
        <div className={`${estilos.navScroll} px-2.5 pb-2 pt-2`}>
          <nav id="userDashboardSidebarNav" aria-label="Navegación del panel">
            <ul className="flex flex-col gap-1">
              {itemsGrupoOperativo.map(renderItem)}
            </ul>

            {/* Divisor de separación entre módulos operativos y de cuenta */}
            <div className="my-2 border-t border-white/10 mx-1" aria-hidden="true" />

            <ul className="flex flex-col gap-1">
              {itemsGrupoCuenta.map(renderItem)}
            </ul>
          </nav>
        </div>

        {/* Tarjeta Promocional Inferior Opcional */}
        {showPromo && (
          <div className={`${estilos.promo} px-2.5 pb-4 pt-2`}>
            {esContraida ? (
              <Link
                href="/viajes/nuevo"
                aria-label="Registrar traslado"
                title="Registrar traslado"
                className="flex size-11 items-center justify-center rounded-xl border border-white/15 bg-[var(--rr-sidebar-active,#075be8)] text-xl font-bold text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 shadow-md"
              >
                +
              </Link>
            ) : (
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#071d36]/90 p-3.5 shadow-lg">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full bg-[var(--rr-sidebar-active,#075be8)]/30 blur-xl"
                />

                <div className="relative mb-2">
                  <MiniAutoPromo />
                </div>

                <p className="relative text-[10px] font-bold uppercase tracking-[0.18em] text-[#7dd3fc]">
                  Confianza comprobable
                </p>
                <p className="relative mt-1 font-display text-[13px] font-extrabold leading-snug text-white">
                  Mueve tu auto sin salir de casa
                </p>
                <p className="relative mt-1 text-[11px] leading-relaxed text-[#dfeaf7]">
                  Movemos vehículos con tecnología, evidencia y conductores certificados.
                </p>

                <Link
                  href="/viajes/nuevo"
                  onClick={() => {
                    if (mobileOpen) onMobileClose?.();
                  }}
                  className="relative mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[var(--rr-sidebar-active,#075be8)] px-3 py-2 text-xs font-bold text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 shadow-sm"
                >
                  + Crear traslado
                  <IconoFlechaDerecha className="size-3.5" />
                </Link>

                <Link
                  href="/viajes/nuevo"
                  onClick={() => {
                    if (mobileOpen) onMobileClose?.();
                  }}
                  className="relative mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-[11px] font-semibold text-white/90 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                >
                  Registrar traslado
                </Link>
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
