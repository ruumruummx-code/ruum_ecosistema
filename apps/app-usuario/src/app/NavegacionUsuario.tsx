"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

type VarianteNavegacion = "claro" | "oscuro";

function IconoCampana({ className = "size-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

function IconoPreferencias({ className = "size-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

function IconoSoporte({ className = "size-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 13v-1a8 8 0 0 1 16 0v1" />
      <path d="M4 13a2 2 0 0 1 2-2h1v6H6a2 2 0 0 1-2-2v-2ZM20 13a2 2 0 0 0-2-2h-1v6h1a2 2 0 0 0 2-2v-2Z" />
      <path d="M17 17c0 2-1.8 3-4 3h-1" />
    </svg>
  );
}

function IconoHome({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5Z" />
      <path d="M9 21v-9h6v9" />
    </svg>
  );
}

/**
 * Ícono de paquete/auto para Traslados (Libro de marca y especificaciones UI)
 */
function IconoTraslados({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {/* Contenedor / Paquete */}
      <rect x="1.5" y="4.5" width="12" height="11" rx="1.5" />
      <path d="M7.5 4.5v11" />
      {/* Cabina vehicular / Auto de traslado */}
      <path d="M13.5 8h4.5l3 3.5v4h-7.5V8z" />
      <circle cx="5.5" cy="18" r="2.2" />
      <circle cx="17.5" cy="18" r="2.2" />
    </svg>
  );
}

function IconoCuenta({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

/**
 * Destinos principales de navegación según especificaciones oficiales:
 * 1. Inicio
 * 2. Traslados
 * 3. Cuenta
 */
const DESTINOS = [
  { href: "/", etiqueta: "Inicio", Icono: IconoHome },
  { href: "/mis-viajes", etiqueta: "Traslados", Icono: IconoTraslados },
  { href: "/cuenta", etiqueta: "Cuenta", Icono: IconoCuenta },
] as const;

function estaActivo(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function primerNombre(nombre: string | null | undefined) {
  const valor = nombre?.trim().split(/\s+/)[0];
  if (!valor) return null;
  return valor.charAt(0).toUpperCase() + valor.slice(1).toLowerCase();
}

export interface NavegacionUsuarioProps {
  variante?: VarianteNavegacion;
  nombreUsuario?: string | null;
  titulo?: string;
  mostrarEnAcceso?: boolean;
  mostrarNavegacionInferior?: boolean;
  notificacionesCount?: number;
}

export function NavegacionUsuario({
  variante = "oscuro",
  nombreUsuario,
  titulo,
  mostrarEnAcceso = false,
  mostrarNavegacionInferior = true,
  notificacionesCount = 1,
}: NavegacionUsuarioProps) {
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);
  void variante;
  const esAcceso =
    pathname === "/login" ||
    pathname === "/registro" ||
    pathname === "/recuperar-password" ||
    pathname === "/nueva-password" ||
    pathname.startsWith("/registro/");
  const nombre = primerNombre(nombreUsuario);
  const saludo = nombre ? `¡Hola, ${nombre}!` : "¡Hola!";
  const textoCabecera = titulo ?? (pathname === "/" ? "Ruum Ruum" : saludo);

  useEffect(() => {
    if (esAcceso && !mostrarEnAcceso) return;
    const root = document.documentElement;
    const actualizar = () => {
      if (headerRef.current) root.style.setProperty("--user-header-height", headerRef.current.getBoundingClientRect().height + "px");
      if (navRef.current) root.style.setProperty("--user-mobile-nav-height", navRef.current.getBoundingClientRect().height + "px");
    };
    actualizar();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(actualizar) : null;
    if (headerRef.current) observer?.observe(headerRef.current);
    if (navRef.current) observer?.observe(navRef.current);
    window.addEventListener("resize", actualizar);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", actualizar);
      root.style.removeProperty("--user-header-height");
      root.style.removeProperty("--user-mobile-nav-height");
    };
  }, [esAcceso, mostrarEnAcceso, mostrarNavegacionInferior]);

  if (esAcceso && !mostrarEnAcceso) return null;

  return (
    <>
      {/* A. Barra Superior (Header) */}
      <header
        ref={headerRef}
        id="homeHeader"
        role="banner"
        className="user-v2-shell-header user-v2-scope"
      >
        <div className="user-v2-shell-inner flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
          {/* Logotipo e Identidad oficial de la marca: SVG responsive con soporte claro/oscuro */}
          <Link
            href="/"
            className="group flex shrink-0 cursor-pointer select-none items-center rounded-xl transition duration-200 hover:opacity-90 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--user-color-action)]"
            aria-label="Ruum Ruum usuario"
          >
            <Image
              src="/imagenes/ruum-logo.svg"
              alt="Ruum Ruum usuario"
              width={186}
              height={40}
              priority
              unoptimized
              className="ruum-logo-light h-8 w-auto object-contain md:h-10"
            />
            <Image
              src="/imagenes/ruum-logo-dark.svg"
              alt=""
              aria-hidden
              width={186}
              height={40}
              priority
              unoptimized
              className="ruum-logo-dark h-8 w-auto object-contain md:h-10"
            />
          </Link>

          {/* Título en vistas secundarias / desktop */}
          <p className={`${pathname === "/" ? "hidden lg:block" : ""} min-w-0 flex-1 truncate text-center font-display text-sm font-bold sm:text-lg lg:text-xl text-[var(--user-color-primary)]`}>
            {pathname === "/" ? "" : textoCabecera}
          </p>

          {/* Navegación para pantallas grandes */}
          <nav aria-label="Navegación principal — escritorio" className="hidden shrink-0 items-center gap-1 lg:flex">
            {DESTINOS.map((destino) => {
              const activo = estaActivo(pathname, destino.href);
              return (
                <Link
                  key={destino.href}
                  href={destino.href}
                  aria-current={activo ? "page" : undefined}
                  className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-3.5 font-body text-sm transition focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--user-color-action)] ${
                    activo
                      ? "bg-[var(--user-color-brand-soft)] font-bold text-[var(--user-color-primary)] dark:text-emerald-400"
                      : "font-semibold text-[var(--user-color-muted)] hover:bg-[var(--user-color-brand-soft)] hover:text-[var(--user-color-primary)]"
                  }`}
                >
                  <destino.Icono className={`size-5 ${activo ? "stroke-[2.2]" : ""}`} />
                  {destino.etiqueta}
                </Link>
              );
            })}
          </nav>

          {/* Acciones Rápidas (Iconografía derecha): Notificaciones con alerta + Preferencias/Cuenta */}
          <nav aria-label="Acciones del usuario" className="flex shrink-0 items-center gap-1 sm:gap-2">
            <Link
              href="/mis-viajes"
              className="relative group flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-xl transition duration-200 hover:bg-[var(--user-color-brand-soft)] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--user-color-action)]"
              aria-label="Notificaciones"
            >
              <IconoCampana className="size-5.5 text-[var(--user-color-primary)]" />
              <span className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-[#071626]">
                {notificacionesCount > 0 ? notificacionesCount : 1}
              </span>
            </Link>

            <Link
              href="/cuenta/preferencias"
              className="group flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-xl transition duration-200 hover:bg-[var(--user-color-brand-soft)] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--user-color-action)]"
              aria-label="Preferencias"
            >
              <IconoPreferencias className="size-5.5 text-[var(--user-color-primary)]" aria-hidden="true" />
              <span className="sr-only">Preferencias</span>
            </Link>

            {pathname !== "/" && (
              <Link
                href="/soporte"
                className="group flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-xl transition duration-200 hover:bg-[var(--user-color-brand-soft)] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--user-color-action)]"
                aria-label="Soporte"
              >
                <IconoSoporte className="size-5.5 text-[var(--user-color-primary)]" />
                <span className="sr-only">Soporte</span>
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* G. Barra de Navegación Inferior (Bottom Navigation Bar) */}
      {mostrarNavegacionInferior && !esAcceso && (
        <nav
          id="bottomNavigation"
          aria-label="Navegación principal"
          ref={navRef}
          className="user-v2-shell-nav lg:hidden user-v2-scope"
        >
          <div className="user-v2-shell-nav-inner">
            <div className="grid grid-cols-3 items-center">
              {DESTINOS.map((destino) => {
                const activo = estaActivo(pathname, destino.href);
                return (
                  <Link
                    key={destino.href}
                    href={destino.href}
                    aria-current={activo ? "page" : undefined}
                    className={`user-v2-nav-link group select-none transition-colors duration-150 ${
                      activo
                        ? "!text-[var(--user-color-primary)] dark:!text-emerald-400"
                        : "text-[var(--user-color-muted)] hover:text-[var(--user-color-primary)] dark:text-slate-400 dark:hover:text-white"
                    }`}
                  >
                    <span
                      className={`user-v2-nav-indicator ${activo ? "is-active !bg-[#0b1e32] dark:!bg-emerald-400" : ""}`}
                      aria-hidden="true"
                    />
                    <destino.Icono
                      className={`size-[22px] transition-all duration-150 ${
                        activo
                          ? "scale-105 stroke-[2.3] text-[var(--user-color-primary)] dark:text-emerald-400"
                          : "text-[var(--user-color-muted)] group-hover:text-[var(--user-color-primary)] dark:text-slate-400 dark:group-hover:text-white"
                      }`}
                    />
                    <span
                      className={`transition-colors text-[12px] ${
                        activo
                          ? "font-extrabold text-[var(--user-color-primary)] dark:text-emerald-400"
                          : "font-medium text-[var(--user-color-muted)] group-hover:text-[var(--user-color-primary)] dark:text-slate-400 dark:group-hover:text-white"
                      }`}
                    >
                      {destino.etiqueta}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      )}
    </>
  );
}
