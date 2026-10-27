"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTema } from "../../app/TemaProvider";
import {
  buscarDestinos,
  hrefBusquedaTraslados,
  NAVEGACION_USUARIO,
} from "./user-navigation.config";
import {
  IconoBuscar,
  IconoCampana,
  IconoCerrarSesion,
  IconoChevron,
  IconoFlechaDerecha,
  IconoLuna,
  IconoPerfil,
  IconoPreferencias,
  IconoSol,
  IconoVehiculos,
} from "./user-navigation-icons";

export interface NotificacionHeader {
  id: string;
  mensaje: string;
  tono?: "info" | "atencion" | "danger";
  href?: string;
}

export interface UserHeaderProps {
  user?: {
    name?: string | null;
    avatarUrl?: string | null;
    role?: string;
  };
  usuario?: { id?: string; nombre?: string | null; correo?: string | null; [key: string]: unknown } | null;
  nombre?: string | null;
  correo?: string | null;
  rol?: string;
  unreadNotifications?: number;
  notificaciones?: NotificacionHeader[];
  totalVehiculos?: number;
  onMenuOpen?: () => void;
  onSearchOpen?: () => void;
  onLogout?: () => void;
  onCerrarSesion?: () => void | Promise<void>;
  /** El tema es una acción global; se conserva en el header compartido. */
  mostrarTema?: boolean;
}

function IconoMenu({ className = "size-5" }: { className?: string }) {
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
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  );
}

function iniciales(nombre: string): string {
  const partes = nombre
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (partes.length === 0) return "US";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase();
}

const TONO_NOTIFICACION: Record<NonNullable<NotificacionHeader["tono"]>, string> = {
  info: "bg-[var(--ruum-action-bg,#e6f0ff)] text-[var(--ruum-action-text,#0052ff)]",
  atencion: "bg-[var(--user-color-pending-soft,#fff7dd)] text-[var(--user-color-pending-ink,#765100)]",
  danger: "bg-[var(--user-color-error-soft,#fdecef)] text-[var(--user-color-error-ink,#9a2637)]",
};

const ITEM_MENU =
  "flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-[var(--ruum-text)] transition hover:bg-[var(--ruum-surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ruum-focus)]";

export function UserHeader({
  user,
  usuario = null,
  nombre,
  correo,
  rol = "Usuario",
  unreadNotifications,
  notificaciones = [],
  totalVehiculos,
  onMenuOpen,
  onSearchOpen,
  onLogout,
  onCerrarSesion,
  mostrarTema = true,
}: UserHeaderProps) {
  const router = useRouter();
  const { tema, alternar } = useTema();
  const buscadorRef = useRef<HTMLInputElement>(null);
  const contenedorRef = useRef<HTMLDivElement>(null);

  const [busqueda, setBusqueda] = useState("");
  const [buscadorAbierto, setBuscadorAbierto] = useState(false);
  const [notificacionesAbiertas, setNotificacionesAbiertas] = useState(false);
  const [perfilAbierto, setPerfilAbierto] = useState(false);
  const [cerrandoSesion, setCerrandoSesion] = useState(false);

  const nombreCompleto = (user?.name || nombre || usuario?.nombre || "Usuario").trim();
  const primerNombre = nombreCompleto.split(/\s+/)[0] || "Usuario";
  const correoMostrado = (correo || usuario?.correo || "").trim();
  const rolUsuario = user?.role || rol;
  const avatarUrl = user?.avatarUrl;
  const inicial = iniciales(nombreCompleto);
  const totalNotificaciones =
    typeof unreadNotifications === "number" ? unreadNotifications : notificaciones.length;
  const destinos = busqueda.trim() ? buscarDestinos(busqueda) : [];
  const itemPerfil = NAVEGACION_USUARIO.find((item) => item.id === "perfil");

  const cerrarPaneles = useCallback(() => {
    setBuscadorAbierto(false);
    setNotificacionesAbiertas(false);
    setPerfilAbierto(false);
  }, []);

  // Atajo global Ctrl+K / Cmd+K y cierre con Escape.
  useEffect(() => {
    const alPresionar = (evento: KeyboardEvent) => {
      if ((evento.ctrlKey || evento.metaKey) && evento.key.toLowerCase() === "k") {
        evento.preventDefault();
        buscadorRef.current?.focus();
        buscadorRef.current?.select();
        setBuscadorAbierto(true);
        onSearchOpen?.();
        return;
      }
      if (evento.key === "Escape") cerrarPaneles();
    };

    document.addEventListener("keydown", alPresionar);
    return () => document.removeEventListener("keydown", alPresionar);
  }, [cerrarPaneles, onSearchOpen]);

  useEffect(() => {
    if (!buscadorAbierto && !notificacionesAbiertas && !perfilAbierto) return;

    const alClicFuera = (evento: MouseEvent) => {
      if (!contenedorRef.current?.contains(evento.target as Node)) cerrarPaneles();
    };

    document.addEventListener("mousedown", alClicFuera);
    return () => document.removeEventListener("mousedown", alClicFuera);
  }, [buscadorAbierto, notificacionesAbiertas, perfilAbierto, cerrarPaneles]);

  const enviarBusqueda = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    const termino = busqueda.trim();
    if (!termino) return;
    setBuscadorAbierto(false);
    router.push(hrefBusquedaTraslados(termino));
  };

  const salir = async () => {
    if (cerrandoSesion) return;
    setPerfilAbierto(false);
    setCerrandoSesion(true);

    try {
      if (onLogout) {
        await onLogout();
        return;
      }
      if (onCerrarSesion) {
        await onCerrarSesion();
        return;
      }
      const { crearClienteNavegador } = await import("../../lib/supabase-browser");
      await crearClienteNavegador().auth.signOut();
      router.replace("/login");
      router.refresh();
    } catch {
      // Si Supabase no responde, se ofrece de nuevo el acceso al menú.
    } finally {
      setCerrandoSesion(false);
    }
  };

  return (
    <header
      id="userDashboardHeader"
      aria-label="Barra superior de usuario"
      className="sticky top-0 z-30 flex h-[var(--rr-header-height,72px)] shrink-0 items-center justify-between gap-3 border-b border-[var(--rr-border,#e3eaf3)] bg-[var(--rr-header-bg,#ffffff)] px-4 sm:px-6 xl:px-8 text-[var(--ruum-text)] transition-colors duration-150"
    >
      <div ref={contenedorRef} className="flex min-w-0 flex-1 items-center justify-between gap-3 sm:gap-4">
        {/* Botón de Menú Hamburguesa para Móvil + Buscador global */}
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          {onMenuOpen && (
            <button
              type="button"
              onClick={onMenuOpen}
              aria-label="Abrir menú de navegación"
              className="flex size-10 shrink-0 items-center justify-center rounded-xl text-[var(--ruum-text-secondary)] transition hover:bg-[var(--ruum-surface-subtle)] hover:text-[var(--ruum-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ruum-focus)] md:hidden"
            >
              <IconoMenu className="size-5" />
            </button>
          )}

          <div className="relative w-full min-w-0 max-w-[200px] sm:max-w-[320px] md:max-w-[380px] lg:max-w-[460px] xl:max-w-[520px]">
            <form role="search" onSubmit={enviarBusqueda} className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[var(--ruum-text-tertiary)]">
                <IconoBuscar className="size-4" />
              </span>
              <input
                ref={buscadorRef}
                type="search"
                value={busqueda}
                onChange={(evento) => {
                  setBusqueda(evento.target.value);
                  setBuscadorAbierto(true);
                  onSearchOpen?.();
                }}
                onFocus={() => {
                  setBuscadorAbierto(true);
                  onSearchOpen?.();
                }}
                onKeyDown={(evento) => {
                  if (evento.key === "Escape") {
                    setBuscadorAbierto(false);
                    evento.currentTarget.blur();
                  }
                }}
                placeholder="Buscar traslados, vehículos o documentos..."
                aria-label="Buscar traslados, vehículos o documentos"
                aria-expanded={buscadorAbierto}
                aria-controls="userHeaderSearchSuggestions"
                aria-keyshortcuts="Control+K Meta+K"
                autoComplete="off"
                className="h-10 w-full rounded-full border border-[var(--rr-border,#e3eaf3)] bg-[var(--ruum-surface-subtle)] pl-10 pr-16 sm:pr-20 text-xs font-medium text-[var(--ruum-text)] outline-none transition placeholder:text-[var(--ruum-text-tertiary)] focus:border-[var(--ruum-action,#0052ff)] focus:bg-[var(--ruum-surface)] focus:ring-2 focus:ring-[var(--ruum-focus-ring)]"
              />
              <kbd
                aria-hidden="true"
                className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded-md border border-[var(--rr-border,#e3eaf3)] bg-[var(--ruum-surface)] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[var(--ruum-text-tertiary)] sm:inline-flex"
              >
                Ctrl K
              </kbd>
            </form>

            {buscadorAbierto && (
              <div
                id="userHeaderSearchSuggestions"
                role="dialog"
                aria-label="Sugerencias de búsqueda"
                className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-[var(--rr-border,#e3eaf3)] bg-[var(--rr-header-bg,#ffffff)] p-2 shadow-[var(--ruum-shadow-3,0_10px_25px_-5px_rgba(0,0,0,0.1))]"
              >
                <p className="px-2.5 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-widest text-[var(--ruum-text-tertiary)]">
                  {busqueda.trim() ? "Resultados" : "Ir a"}
                </p>

                {busqueda.trim() ? (
                  <>
                    {destinos.length > 0 && (
                      <ul className="mb-1 space-y-0.5">
                        {destinos.map((destino) => {
                          const Icono = destino.icono;
                          return (
                            <li key={destino.id}>
                              <Link
                                href={destino.href}
                                onClick={cerrarPaneles}
                                className={ITEM_MENU}
                              >
                                <Icono className="size-4 shrink-0 text-[var(--ruum-text-tertiary)]" />
                                <span className="truncate">{destino.etiqueta}</span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setBuscadorAbierto(false);
                        router.push(hrefBusquedaTraslados(busqueda));
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl bg-[var(--ruum-action-bg,#e6f0ff)] px-3 py-2.5 text-left text-xs font-bold text-[var(--ruum-action-text,#0052ff)] transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ruum-focus)]"
                    >
                      <IconoBuscar className="size-4 shrink-0" />
                      <span className="min-w-0 flex-1 truncate">
                        Buscar “{busqueda.trim()}” en mis traslados
                      </span>
                      <IconoFlechaDerecha className="size-3.5 shrink-0" />
                    </button>
                  </>
                ) : (
                  <ul className="space-y-0.5">
                    {NAVEGACION_USUARIO.filter(
                      (item) => item.disponible !== false && item.id !== "inicio"
                    ).map((destino) => {
                      const Icono = destino.icono;
                      return (
                        <li key={destino.id}>
                          <Link href={destino.href} onClick={cerrarPaneles} className={ITEM_MENU}>
                            <Icono className="size-4 shrink-0 text-[var(--ruum-text-tertiary)]" />
                            <span className="truncate">{destino.etiqueta}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Acciones globales */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
          {mostrarTema && (
            <button
              type="button"
              onClick={alternar}
              aria-label={`Cambiar a modo ${tema === "dark" ? "claro" : "oscuro"}`}
              title={`Cambiar a modo ${tema === "dark" ? "claro" : "oscuro"}`}
              className="flex size-9 sm:size-10 items-center justify-center rounded-full text-[var(--ruum-text-secondary)] transition hover:bg-[var(--ruum-surface-subtle)] hover:text-[var(--ruum-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ruum-focus)]"
            >
              {tema === "dark" ? <IconoSol className="size-5" /> : <IconoLuna className="size-5" />}
            </button>
          )}

          {/* Notificaciones */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setNotificacionesAbiertas((abierto) => !abierto);
                setPerfilAbierto(false);
                setBuscadorAbierto(false);
              }}
              aria-label={
                totalNotificaciones > 0
                  ? `Notificaciones (${totalNotificaciones} pendientes)`
                  : "Notificaciones"
              }
              aria-expanded={notificacionesAbiertas}
              aria-haspopup="dialog"
              className="relative flex size-9 sm:size-10 items-center justify-center rounded-full text-[var(--ruum-text-secondary)] transition hover:bg-[var(--ruum-surface-subtle)] hover:text-[var(--ruum-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ruum-focus)]"
            >
              <IconoCampana className="size-5" />
              {totalNotificaciones > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute -right-0.5 -top-0.5 flex min-w-[18px] items-center justify-center rounded-full bg-[var(--ruum-danger,#c23648)] px-1 text-[10px] font-bold leading-[18px] text-white shadow-sm"
                >
                  {totalNotificaciones > 9 ? "9+" : totalNotificaciones}
                </span>
              )}
            </button>

            {notificacionesAbiertas && (
              <div
                role="dialog"
                aria-label="Notificaciones"
                className="absolute right-0 top-[calc(100%+10px)] z-50 w-[300px] sm:w-[320px] overflow-hidden rounded-2xl border border-[var(--rr-border,#e3eaf3)] bg-[var(--rr-header-bg,#ffffff)] shadow-[var(--ruum-shadow-3,0_10px_25px_-5px_rgba(0,0,0,0.1))]"
              >
                <div className="flex items-center justify-between border-b border-[var(--rr-border,#e3eaf3)] px-4 py-3">
                  <h2 className="text-sm font-bold text-[var(--ruum-text)]">Notificaciones</h2>
                  <span className="text-[11px] font-semibold text-[var(--ruum-text-tertiary)]">
                    {totalNotificaciones} {totalNotificaciones === 1 ? "pendiente" : "pendientes"}
                  </span>
                </div>

                {totalNotificaciones > 0 ? (
                  <ul className="max-h-72 divide-y divide-[var(--rr-border,#e3eaf3)] overflow-y-auto">
                    {notificaciones.map((notificacion) => {
                      const contenido = (
                        <span className="flex items-start gap-2.5">
                          <span
                            aria-hidden="true"
                            className={`mt-1.5 size-2 shrink-0 rounded-full ${
                              TONO_NOTIFICACION[notificacion.tono ?? "info"]
                            }`}
                          />
                          <span className="text-xs font-medium leading-relaxed text-[var(--ruum-text)]">
                            {notificacion.mensaje}
                          </span>
                        </span>
                      );

                      return (
                        <li key={notificacion.id}>
                          {notificacion.href ? (
                            <Link
                              href={notificacion.href}
                              onClick={cerrarPaneles}
                              className="block px-4 py-3 transition hover:bg-[var(--ruum-surface-subtle)]"
                            >
                              {contenido}
                            </Link>
                          ) : (
                            <div className="px-4 py-3">{contenido}</div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="px-4 py-6 text-center text-xs font-medium text-[var(--ruum-text-secondary)]">
                    No tienes notificaciones pendientes.
                  </p>
                )}

                <Link
                  href="/mis-viajes"
                  onClick={cerrarPaneles}
                  className="flex items-center justify-center gap-1.5 border-t border-[var(--rr-border,#e3eaf3)] px-4 py-2.5 text-xs font-bold text-[var(--ruum-action-text,#0052ff)] transition hover:bg-[var(--ruum-surface-subtle)]"
                >
                  Ver mis traslados
                  <IconoFlechaDerecha className="size-3.5" />
                </Link>
              </div>
            )}
          </div>

          {/* Perfil */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setPerfilAbierto((abierto) => !abierto);
                setNotificacionesAbiertas(false);
                setBuscadorAbierto(false);
              }}
              aria-label={`Menú de usuario ${nombreCompleto}`}
              aria-expanded={perfilAbierto}
              aria-haspopup="menu"
              className="flex items-center gap-2 rounded-full p-1 transition hover:bg-[var(--ruum-surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ruum-focus)]"
            >
              {avatarUrl ? (
                <div className="relative size-9 overflow-hidden rounded-full shadow-sm">
                  <Image
                    src={avatarUrl}
                    alt={nombreCompleto}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <span className="flex size-9 items-center justify-center rounded-full bg-[var(--rr-sidebar-bg,#061b34)] text-xs font-bold text-white shadow-sm border border-white/10">
                  {inicial}
                </span>
              )}

              <span className="hidden text-left xl:block">
                <span className="block text-xs font-bold leading-none text-[var(--ruum-text)]">
                  Hola, {primerNombre}
                </span>
                <span className="mt-1 block text-[11px] font-medium leading-none text-[var(--ruum-text-tertiary)]">
                  {rolUsuario}
                </span>
              </span>
              <IconoChevron className="hidden size-4 text-[var(--ruum-text-tertiary)] xl:block" />
            </button>

            {perfilAbierto && (
              <div
                role="menu"
                aria-label={`Menú de usuario ${nombreCompleto}`}
                className="absolute right-0 top-[calc(100%+10px)] z-50 w-60 overflow-hidden rounded-2xl border border-[var(--rr-border,#e3eaf3)] bg-[var(--rr-header-bg,#ffffff)] p-2 shadow-[var(--ruum-shadow-3,0_10px_25px_-5px_rgba(0,0,0,0.1))]"
              >
                <div className="border-b border-[var(--rr-border,#e3eaf3)] px-3 py-2">
                  <p className="truncate text-xs font-bold text-[var(--ruum-text)]">
                    {nombreCompleto}
                  </p>
                  {correoMostrado && (
                    <p className="mt-0.5 truncate text-[11px] text-[var(--ruum-text-secondary)]">
                      {correoMostrado}
                    </p>
                  )}
                </div>

                <div className="py-1">
                  <Link
                    href="/cuenta"
                    role="menuitem"
                    onClick={cerrarPaneles}
                    className={ITEM_MENU}
                  >
                    <IconoPerfil className="size-4 text-[var(--ruum-text-tertiary)]" />
                    Mi cuenta
                  </Link>

                  {itemPerfil && (
                    <Link
                      href={itemPerfil.href}
                      role="menuitem"
                      onClick={cerrarPaneles}
                      className={ITEM_MENU}
                    >
                      <IconoPerfil className="size-4 text-[var(--ruum-text-tertiary)]" />
                      Mi perfil
                    </Link>
                  )}

                  <Link
                    href="/cuenta/vehiculos"
                    role="menuitem"
                    onClick={cerrarPaneles}
                    className={ITEM_MENU}
                  >
                    <IconoVehiculos className="size-4 text-[var(--ruum-text-tertiary)]" />
                    Mis vehículos
                    {typeof totalVehiculos === "number" && totalVehiculos > 0 && (
                      <span className="ml-auto rounded-full bg-[var(--ruum-surface-subtle)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--ruum-text-secondary)]">
                        {totalVehiculos}
                      </span>
                    )}
                  </Link>

                  <Link
                    href="/cuenta/preferencias"
                    role="menuitem"
                    onClick={cerrarPaneles}
                    className={ITEM_MENU}
                  >
                    <IconoPreferencias className="size-4 text-[var(--ruum-text-tertiary)]" />
                    Mis preferencias
                  </Link>
                </div>

                <div className="border-t border-[var(--rr-border,#e3eaf3)] pt-1">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => void salir()}
                    disabled={cerrandoSesion}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-[var(--ruum-danger,#c23648)] transition hover:bg-[var(--user-color-error-soft,#fdecef)] disabled:opacity-60"
                  >
                    <IconoCerrarSesion className="size-4" />
                    {cerrandoSesion ? "Cerrando sesión..." : "Cerrar sesión"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
