"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { NotificacionInicio } from "../lib/inicio";
import { MobileShell, RuumHeader } from "@ruum/ui";

type VarianteNavegacion = "claro" | "oscuro";

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

function IconoCargaMasiva({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {/* Vehículo frontal */}
      <rect x="2" y="9" width="13" height="9" rx="2" />
      <circle cx="5.5" cy="18" r="1.8" />
      <circle cx="11.5" cy="18" r="1.8" />
      {/* Lote / Segundo vehículo en fila */}
      <path d="M15 7h4l3 3v5h-4" />
      <circle cx="19" cy="18" r="1.8" />
      <path d="M6 9V5a1 1 0 0 1 1-1h9l3 3v2" />
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
 * 3. Carga Masiva (flotillas/lotes)
 * 4. Cuenta
 */
const DESTINOS = [
  { href: "/", etiqueta: "Inicio", Icono: IconoHome },
  { href: "/mis-viajes", etiqueta: "Traslados", Icono: IconoTraslados },
  { href: "/viajes/masivo", etiqueta: "Carga Masiva", Icono: IconoCargaMasiva },
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
  notificaciones?: NotificacionInicio[];
}

export function NavegacionUsuario({
  variante = "oscuro",
  nombreUsuario,
  titulo,
  mostrarEnAcceso = false,
  mostrarNavegacionInferior = true,
  notificacionesCount = 0,
  notificaciones = [],
}: NavegacionUsuarioProps) {
  const pathname = usePathname();
  const esInicio = pathname === "/";
  const headerRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);
  void variante;
  const esAcceso =
    pathname === "/login" ||
    pathname === "/registro" ||
    pathname === "/recuperar-password" ||
    pathname === "/nueva-password" ||
    pathname.startsWith("/registro/");
  const esMisTraslados = pathname === "/mis-viajes";
  const esMasivo = pathname === "/viajes/masivo" || pathname.startsWith("/viajes/masivo/");
  const esCuenta = pathname === "/cuenta";
  const esVehiculos = pathname === "/cuenta/vehiculos" || pathname.startsWith("/cuenta/vehiculos/");
  const cabeceraCompacta = esMisTraslados || esCuenta || esVehiculos || esMasivo;
  const etiquetaFab = esVehiculos ? "Agregar vehículo" : "Solicitar traslado";
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
  }, [esAcceso, mostrarEnAcceso, mostrarNavegacionInferior, pathname]);

  const router = useRouter();

  if (esAcceso && !mostrarEnAcceso) return null;
  const tituloSecundario = pathname === "/cuenta/preferencias" ? "Preferencias" : pathname === "/soporte" ? "Soporte" : pathname === "/cuenta/datos-personales" ? "Editar Perfil" : pathname === "/cuenta/cambiar-contrasena" ? "Cambiar contraseña" : pathname === "/cuenta/verificacion-documentos" ? "Verificación y facturación" : null;
  if (tituloSecundario) {
    return <header ref={headerRef} className="user-profile-appbar user-secondary-appbar user-v2-scope"><Link href="/cuenta?seccion=perfil" aria-label="Volver a mi cuenta" className="user-profile-back">‹ Atrás</Link><h1>{tituloSecundario}</h1><span aria-hidden="true" /></header>;
  }

  return (
    <>
      {/* A. Barra Superior (Header) — estándar Ruum Ruum */}
      {pathname !== "/preguntas-frecuentes" && (
        <div ref={headerRef} id="homeHeader" className="user-v2-shell-header user-v2-scope">
          <RuumHeader
            rol="usuario"
            notificacionesCount={notificacionesCount}
            onNotificaciones={() => void router.push("/mis-viajes")}
            onSoporte={() => void router.push("/soporte")}
            hrefLogo="/"
          />
        </div>
      )}

      {/* G. Barra de Navegación Inferior (Bottom Navigation Bar) */}
      {mostrarNavegacionInferior && !esAcceso && (
        <nav
          id="bottomNavigation"
          aria-label="Navegación principal"
          ref={navRef}
          className={`user-v2-shell-nav ${cabeceraCompacta || esInicio ? "" : "lg:hidden"} ${esInicio ? "home-tab-navigation" : ""} ${esMisTraslados ? "user-transfers-nav" : ""} user-v2-scope`}
        >
          <div className="user-v2-shell-nav-inner">
            <div className="grid grid-cols-4 items-center">
              {DESTINOS.map((destino) => {
                const activo = estaActivo(pathname, destino.href);
                return (
                  <Link
                    key={destino.href}
                    href={destino.href}
                    aria-current={activo ? "page" : undefined}
                    className={`user-v2-nav-link group select-none transition-colors duration-150 min-h-[48px] min-w-[48px] ${
                      activo
                        ? esMisTraslados
                          ? "!text-[#0046c4] dark:!text-[#80b4ff]"
                          : esMasivo
                            ? "!text-[#0066FF] dark:!text-[#4d94ff]"
                            : "!text-[#0a2342] dark:!text-[#f6f8fb]"
                        : "text-[#8293b0] hover:text-[#0a2342] dark:text-slate-400 dark:hover:text-white"
                    }`}
                  >
                    <span
                      className={`user-v2-nav-indicator ${
                        activo
                          ? esMisTraslados
                            ? "is-active !bg-[#0046c4] dark:!bg-[#80b4ff]"
                            : esMasivo
                              ? "is-active !bg-[#0066FF] dark:!bg-[#4d94ff]"
                              : esInicio
                                ? "is-active !bg-[#00D1D1] dark:!bg-[#2ee6b6]"
                                : "is-active !bg-[#0b1e32] dark:!bg-emerald-400"
                          : ""
                      }`}
                      aria-hidden="true"
                    />
                    <destino.Icono
                      className={`size-[22px] transition-all duration-150 ${
                        activo
                          ? esMisTraslados
                            ? "scale-105 stroke-[2.3] text-[#0046c4] dark:text-[#80b4ff]"
                            : esMasivo
                              ? "scale-105 stroke-[2.3] text-[#0066FF] dark:text-[#4d94ff]"
                              : "scale-105 stroke-[2.3] text-[#0a2342] dark:text-[#f6f8fb]"
                          : "text-[#8293b0] group-hover:text-[#0a2342] dark:text-slate-400 dark:group-hover:text-white"
                      }`}
                    />
                    <span
                      className={`transition-colors text-[11px] sm:text-[12px] truncate px-0.5 ${
                        activo
                          ? esMisTraslados
                            ? "font-extrabold text-[#0046c4] dark:text-[#80b4ff]"
                            : esMasivo
                              ? "font-extrabold text-[#0066FF] dark:text-[#4d94ff]"
                              : "font-extrabold text-[#0a2342] dark:text-[#f6f8fb]"
                          : "font-medium text-[#8293b0] group-hover:text-[#0a2342] dark:text-slate-400 dark:group-hover:text-white"
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
      {mostrarNavegacionInferior && !esAcceso && !esInicio && !esMisTraslados && !pathname.startsWith("/viajes/nuevo") && !pathname.startsWith("/viajes/masivo") && pathname !== "/preguntas-frecuentes" && (
        <Link id="requestTransferButton" href="/viajes/nuevo" aria-label={etiquetaFab} title={etiquetaFab} className="user-transfer-fab user-v2-scope">
          <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
        </Link>
      )}
    </>
  );
}
