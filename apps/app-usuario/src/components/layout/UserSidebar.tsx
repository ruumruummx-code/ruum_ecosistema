"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { SidebarBrand } from "./SidebarBrand";
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
  mainContentId?: string;
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

export function UserSidebar({
  items = NAVEGACION_USUARIO,
  activePath,
  collapsed = false,
  mobileOpen = false,
  onCollapseChange,
  onMobileClose,
  showPromo = true,
  mainContentId = "userDashboardMainContent",
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

    // 4. Aislar explícitamente el contenido principal, header y hermanos (background isolation)
    const elementosAislados: Array<{ el: HTMLElement; prevAriaHidden: string | null; prevInert: boolean }> = [];
    const sidebarEl = sidebarRef.current;

    const aislarElemento = (el: HTMLElement | null) => {
      if (!el || el === sidebarEl || el.contains(sidebarEl) || el.classList.contains(estilos.drawerBackdrop)) {
        return;
      }
      if (elementosAislados.some((item) => item.el === el)) {
        return;
      }
      elementosAislados.push({
        el,
        prevAriaHidden: el.getAttribute("aria-hidden"),
        prevInert: el.inert,
      });
      el.setAttribute("aria-hidden", "true");
      try {
        el.inert = true;
      } catch {
        // Fallback seguro si el navegador no soporta inert
      }
    };

    if (typeof document !== "undefined" && sidebarEl) {
      // a) Aislar explícitamente el contenedor de contenido principal y header por ID
      if (mainContentId) {
        aislarElemento(document.getElementById(mainContentId));
      }
      aislarElemento(document.getElementById("userDashboardHeader"));

      // b) Aislar hermanos directos del sidebar dentro del layout padre (UserDashboardLayout)
      if (sidebarEl.parentElement) {
        for (const hermano of Array.from(sidebarEl.parentElement.children) as HTMLElement[]) {
          aislarElemento(hermano);
        }
      }

      // c) Aislar hermanos en document.body (para elementos externos o modales ajenos)
      for (const hijo of Array.from(document.body.children) as HTMLElement[]) {
        aislarElemento(hijo);
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

      // 1. Restaurar aislamiento del fondo
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

      // 2. Garantizar que el contenedor principal esté libre de aria-hidden e inert
      if (mainContentId) {
        const mainEl = document.getElementById(mainContentId);
        if (mainEl) {
          mainEl.removeAttribute("aria-hidden");
          mainEl.removeAttribute("inert");
          try {
            (mainEl as HTMLElement).inert = false;
          } catch {}
        }
      }

      // 3. Restaurar foco al elemento detonador inmediatamente después de desaislar el fondo
      elementoPrevioRef.current?.focus?.();
    };
  }, [mobileOpen, onMobileClose, mainContentId]);

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
    const base = `${estilos.navItem} ${esContraida ? estilos.navItemCollapsed : ""}`;

    if (item.disponible === false) {
      return (
        <li key={item.id}>
          <span
            aria-disabled="true"
            title={`${item.etiqueta} — disponible próximamente`}
            className={`${base} cursor-not-allowed text-[var(--udb-text,#94a3b8)]/60 opacity-60`}
          >
            <Icono className={estilos.navIcon} />
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
          className={`${base} ${activo ? estilos.navItemActive : ""}`}
        >
          <Icono className={estilos.navIcon} />
          {!esContraida && <span className="truncate">{item.etiqueta}</span>}

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
          className={`${estilos.brandHeader} ${
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
            <SidebarBrand className={estilos.brandSymbol} />
            {!esContraida && (
              <span className="min-w-0">
                <span className={estilos.brandName}>
                  Ruum Ruum
                </span>
                <span className={estilos.brandTagline}>
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
              className={`${estilos.collapseButton} hidden md:flex size-8 shrink-0 items-center justify-center rounded-lg text-[var(--udb-text,#94a3b8)] transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${
                esContraida ? "mt-1" : ""
              }`}
            >
              <IconoPanelLateral className={`size-4 ${esContraida ? "rotate-180" : ""}`} />
            </button>
          )}
        </div>

        {/* Navegación flexible sin scroll en escritorio */}
        <div className={estilos.navScroll}>
          <nav id="userDashboardSidebarNav" aria-label="Navegación del panel">
            <ul className={estilos.navGroup}>
              {itemsGrupoOperativo.map(renderItem)}
            </ul>

            {/* Divisor de separación entre módulos operativos y de cuenta */}
            <div className={estilos.navDivider} aria-hidden="true" />

            <ul className={estilos.navGroup}>
              {itemsGrupoCuenta.map(renderItem)}
            </ul>
          </nav>
        </div>

        {/* Tarjeta Promocional Inferior Opcional */}
        {showPromo && (
          <div className={estilos.promo}>
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
              <div className={estilos.promoCard}>
                <div className={estilos.promoArtwork} aria-hidden="true" />
                <div className={estilos.promoCopy}>
                  <p className={estilos.promoTitle}>Mueve tu auto sin salir de casa</p>
                  <p className={estilos.promoDescription}>Un servicio confiable, seguro y en todo México.</p>
                </div>
                <Link href="/viajes/nuevo" onClick={() => { if (mobileOpen) onMobileClose?.(); }} className={estilos.promoAction}>
                  Registrar traslado<IconoFlechaDerecha className="size-5" />
                </Link>
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
