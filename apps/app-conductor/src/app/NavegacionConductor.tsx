"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { obtenerConductorActual } from "@ruum/api/services";
import { contarNotificacionesNoLeidas } from "@ruum/api/drivers";
import { useViajeActivo } from "./ViajeActivoContext";
import { getTripPresentation } from "../lib/trip-presentation";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "../lib/supabase-browser";
import { useCerrarSesion } from "../lib/use-cerrar-sesion";
import { PanelSupportSheet } from "./panel/PanelSupportSheet";

/* Íconos SVG inline — set unificado de navegación (Inicio/viajes/Ganancias/Notificaciones/Cuenta) */

function IcoHome() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5Z" />
      <path d="M9 21V12h6v9" />
    </svg>
  );
}

function IcoTraslados() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="1" y="3" width="15" height="13" rx="2" />
      <path d="M16 8h4l3 3v5h-7V8Z" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}

function IcoGanancias() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M12 9v6m-3-3h6" />
    </svg>
  );
}

function IcoNotificaciones({ className = "size-[17px]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </svg>
  );
}

function IcoSoporte({ className = "size-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 13v-1a8 8 0 0 1 16 0v1" />
      <path d="M4 13a2 2 0 0 1 2-2h1v6H6a2 2 0 0 1-2-2v-2ZM20 13a2 2 0 0 0-2-2h-1v6h1a2 2 0 0 0 2-2v-2Z" />
      <path d="M17 17c0 2-1.8 3-4 3h-1" />
    </svg>
  );
}

function IcoCuenta({ className = "size-[17px]" }: { className?: string }) {
  return (
    <svg className={className} width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

type DestinoIcono = React.ComponentType<{ className?: string }>;

/**
 * Componente para navegar entre tabs con swipe gestures (MOB-002)
 */
function MobileNavWithSwipe({
  children,
  onSwipeLeft,
  onSwipeRight,
  activePath,
}: {
  children: React.ReactNode;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  activePath?: string;
}) {
  const navRef = useRef<HTMLDivElement>(null);
  const [startX, setStartX] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startX === null) return;

    const currentX = e.touches[0].clientX;
    const deltaX = startX - currentX;

    // Swipe izquierdo (deltaX positivo) -> siguiente tab
    if (deltaX > 50) {
      onSwipeLeft();
      setStartX(null);
    }
    // Swipe derecho (deltaX negativo) -> tab anterior
    else if (deltaX < -50) {
      onSwipeRight();
      setStartX(null);
    }
  };

  const handleTouchEnd = () => {
    setStartX(null);
  };

  return (
    <div
      ref={navRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  );
}

const DESTINOS_ESCRITORIO: { href: string; etiqueta: string; Icono: DestinoIcono }[] = [
  { href: "/panel", etiqueta: "Inicio", Icono: IcoHome },
  { href: "/viajes", etiqueta: "Traslados", Icono: IcoTraslados },
  { href: "/ganancias", etiqueta: "Ganancias", Icono: IcoGanancias },
  { href: "/notificaciones", etiqueta: "Notificaciones", Icono: IcoNotificaciones },
  { href: "/cuenta", etiqueta: "Cuenta", Icono: IcoCuenta },
];

const DESTINOS_MOVIL = DESTINOS_ESCRITORIO;

function esActivo(pathname: string, href: string) {
  if (href === "/panel") return pathname === "/panel";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function primerNombre(nombre: string | null | undefined) {
  const valor = nombre?.trim().split(/\s+/)[0];
  if (!valor) return null;
  return valor.charAt(0).toUpperCase() + valor.slice(1).toLowerCase();
}

/** Navegación consistente para la operación del conductor. */
export function NavegacionConductor() {
  const pathname = usePathname();
  const router = useRouter();
  const { viajeActivo, viajeActivoSinActualizar } = useViajeActivo();
  const [nombreConductor, setNombreConductor] = useState<string | null>(null);
  const [notificacionesNoLeidas, setNotificacionesNoLeidas] = useState(0);
  const [soporteAbierto, setSoporteAbierto] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const { cerrarSesion, cerrandoSesion } = useCerrarSesion();
  const esAcceso = pathname === "/login" || pathname === "/registro" || pathname === "/onboarding" || pathname === "/recuperar-password" || pathname === "/nueva-password" || pathname.startsWith("/auth/");
  const presentacionViajeActivo = viajeActivo ? getTripPresentation(viajeActivo.estado) : null;
  const hayAccionPendiente = Boolean(presentacionViajeActivo && presentacionViajeActivo.primaryAction.action !== "none");
  const nombre = primerNombre(nombreConductor);
  const saludo = nombre ? `¡Hola, ${nombre}!` : "¡Hola, conductor!";

  useEffect(() => {
    if (esAcceso || !tieneSupabaseConfigurado()) return;

    let activo = true;
    const cargarEncabezado = async () => {
      try {
        const cliente = crearClienteNavegador();
        const [perfil, notificaciones] = await Promise.allSettled([
          obtenerConductorActual(cliente),
          contarNotificacionesNoLeidas(cliente),
        ]);

        if (!activo) return;
        setNombreConductor(perfil.status === "fulfilled" ? perfil.value?.nombre ?? null : null);
        setNotificacionesNoLeidas(notificaciones.status === "fulfilled" ? notificaciones.value : 0);
      } catch {
        if (activo) {
          setNombreConductor(null);
          setNotificacionesNoLeidas(0);
        }
      }
    };

    void cargarEncabezado();
    return () => {
      activo = false;
    };
  }, [esAcceso, pathname]);

  useEffect(() => {
    document.body.classList.toggle("conductor-tiene-viaje-activo", Boolean(viajeActivo));
    return () => {
      document.body.classList.remove("conductor-tiene-viaje-activo");
    };
  }, [viajeActivo]);

  if (esAcceso) return null;

  return (
    <>
      {/* ===================== HEADER SUPERIOR SIMPLIFICADO =====================
         Solo: saludo abreviado, foto de perfil (con menú), notificaciones y soporte.
         Se eliminó el menú horizontal superior y el logo grande. ===================== */}
      <header role="banner" className="sticky top-0 z-30 border-b border-border/20 bg-surface/95 backdrop-blur-md supports-[backdrop-filter]:bg-surface/80 pt-[env(safe-area-inset-top)] pb-2 text-text-primary">
        <div className="mx-auto flex w-full max-w-md items-center justify-between gap-3 px-4 sm:px-6">
          <div className="min-w-0 flex-1">
            <p className="font-body text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Ruum Conductor</p>
            <h1 className="mt-0.5 font-display text-xl font-extrabold tracking-tight text-text-primary leading-none">
              {saludo}
            </h1>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {/* Foto de perfil / avatar con acceso al menú */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuAbierto((v) => !v)}
                aria-label="Perfil y menú del conductor"
                aria-expanded={menuAbierto}
                aria-haspopup="menu"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border/30 bg-surface-elevated text-text-primary text-base font-black shadow-sm hover:bg-surface transition-colors cursor-pointer focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-route-action"
              >
                {nombre ? nombre.charAt(0).toUpperCase() : "C"}
              </button>
              {menuAbierto && (
                <>
                  <button type="button" className="fixed inset-0 z-20 cursor-default" onClick={() => setMenuAbierto(false)} aria-label="Cerrar menú" tabIndex={-1} />
                  <div role="menu" className="absolute right-0 top-full mt-2 z-30 w-56 rounded-2xl border border-border bg-surface-elevated shadow-xl overflow-hidden animate-fadeIn">
                    <button type="button" role="menuitem" onClick={() => { setMenuAbierto(false); router.push("/cuenta"); }} className="w-full text-left px-4 py-3.5 font-body text-sm font-semibold text-text-primary hover:bg-surface flex items-center gap-3 min-h-11">
                      <span className="flex size-8 items-center justify-center rounded-full bg-surface border border-border text-text-secondary">
                        <IcoCuenta className="size-5" />
                      </span>
                      Mi cuenta
                    </button>
                    <button type="button" role="menuitem" onClick={() => { setMenuAbierto(false); setSoporteAbierto(true); }} className="w-full text-left px-4 py-3.5 font-body text-sm font-semibold text-text-primary hover:bg-surface flex items-center gap-3 min-h-11">
                      <span className="flex size-8 items-center justify-center rounded-full bg-surface border border-border text-text-secondary">
                        <span className="font-display text-sm font-black">?</span>
                      </span>
                      Ayuda y soporte
                    </button>
                    <div className="h-px bg-border/40" aria-hidden />
                    <button type="button" role="menuitem" aria-label="Cerrar sesión" onClick={() => { setMenuAbierto(false); void cerrarSesion(); }} disabled={cerrandoSesion} className="w-full text-left px-4 py-3.5 font-body text-sm font-semibold text-red-500 hover:bg-red-500/10 flex items-center gap-3 min-h-11 disabled:opacity-50">
                      <span className="flex size-8 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20 text-red-500">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                          <polyline points="16 17 21 12 16 7" />
                          <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                      </span>
                      {cerrandoSesion ? "Cerrando…" : "Cerrar sesión"}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Notificaciones — primario, siempre visible */}
            <Link
              href="/notificaciones"
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border/20 bg-surface-elevated text-text-primary hover:text-route-action transition-colors cursor-pointer shadow-xs focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-route-action"
              aria-label={notificacionesNoLeidas > 0 ? `Notificaciones (${notificacionesNoLeidas > 99 ? "99+" : notificacionesNoLeidas} sin leer)` : "Notificaciones"}
            >
              <IcoNotificaciones className="size-5" />
              {notificacionesNoLeidas > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-danger text-white text-[10px] font-black rounded-full min-w-4 h-4 px-0.5 flex items-center justify-center border-2 border-surface shadow-xs tabular-nums">
                  {notificacionesNoLeidas > 99 ? "99+" : notificacionesNoLeidas}
                </span>
              )}
            </Link>

            {/* Soporte rápido */}
            <button
              type="button"
              onClick={() => setSoporteAbierto(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border/20 bg-surface-elevated text-text-primary hover:text-route-action transition-colors cursor-pointer shadow-xs focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-route-action"
              aria-label="Ayuda y soporte rápido"
            >
              <span className="font-display text-xs font-black">?</span>
            </button>
          </div>
        </div>
      </header>

      {viajeActivo && !pathname.startsWith("/viajes") && pathname !== "/panel" && (
        <div className="hidden border-t border-border bg-surface-elevated/95 px-3 py-2 backdrop-blur md:block">
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

      {/* Bottom Sheet de Soporte (global, gestionado desde el header) */}
      <PanelSupportSheet abierto={soporteAbierto} onCerrar={() => setSoporteAbierto(false)} />

      {/* ===================== BOTTOM TAB BAR (móvil, exclusiva) =====================
         La navegación principal opera exclusivamente desde esta barra anclada abajo. ===================== */}
      <div className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-surface/95 border-t border-border/20 backdrop-blur-md pb-[max(8px,env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-8px_30px_rgba(13,43,94,0.10)] supports-[backdrop-filter]:bg-surface/80">

        {/* Banner de viaje activo en móvil: flotante arriba de la barra fija */}
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

        {/* MOB-002: Swipe gestures para navegar entre tabs */}
        <MobileNavWithSwipe
          activePath={pathname}
          onSwipeLeft={() => {
            const currentIndex = DESTINOS_MOVIL.findIndex((d) => esActivo(pathname, d.href));
            const nextIndex = (currentIndex + 1) % DESTINOS_MOVIL.length;
            router.push(DESTINOS_MOVIL[nextIndex].href);
          }}
          onSwipeRight={() => {
            const currentIndex = DESTINOS_MOVIL.findIndex((d) => esActivo(pathname, d.href));
            const prevIndex = (currentIndex - 1 + DESTINOS_MOVIL.length) % DESTINOS_MOVIL.length;
            router.push(DESTINOS_MOVIL[prevIndex].href);
          }}
        >
          <nav aria-label="Navegación principal móvil" className="w-full px-1 max-w-md mx-auto">
            <div className="grid grid-cols-5 gap-0.5">
              {DESTINOS_MOVIL.map((destino) => {
                const activo = esActivo(pathname, destino.href);
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
                      <destino.Icono />
                    </div>
                    <span className="max-w-full truncate tracking-tight text-xs leading-none">{destino.etiqueta}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        </MobileNavWithSwipe>
      </div>
    </>
  );
}
