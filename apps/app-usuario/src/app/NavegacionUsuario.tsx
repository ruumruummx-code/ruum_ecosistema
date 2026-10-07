"use client";

import React from "react";
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

function IconoTraslados({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="1" y="4" width="14" height="12" rx="1.5" />
      <path d="M15 8h4l3 3.5V16h-7V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
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

export function NavegacionUsuario({
  variante = "oscuro",
  nombreUsuario,
  titulo,
  mostrarEnAcceso = false,
  mostrarNavegacionInferior = true,
}: {
  variante?: VarianteNavegacion;
  nombreUsuario?: string | null;
  titulo?: string;
  mostrarEnAcceso?: boolean;
  mostrarNavegacionInferior?: boolean;
}) {
  const pathname = usePathname();
  void variante;
  const esAcceso = pathname === "/login" || pathname === "/registro" || pathname === "/recuperar-password" || pathname === "/nueva-password" || pathname.startsWith("/registro/");
  const nombre = primerNombre(nombreUsuario);
  const saludo = nombre ? `¡Hola, ${nombre}!` : "¡Hola!";
  const textoCabecera = titulo ?? saludo;

  if (esAcceso && !mostrarEnAcceso) return null;

  return (
    <>
      <header
        id="homeHeader"
        role="banner"
        className="user-v2-shell-header user-v2-scope"
      >
        <div className="user-v2-shell-inner">
          <Link
            href="/"
            className="group flex shrink-0 cursor-pointer select-none items-center rounded-2xl transition duration-200 hover:opacity-80 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--user-color-action)]"
            aria-label="Ir al inicio"
          >
            <Image
              src="/imagenes/ruum-logo-header.png"
              alt="Ruum Ruum"
              width={1195}
              height={784}
              priority
              sizes="(max-width: 639px) 96px, 200px"
              className="h-11 w-24 rounded-xl object-contain sm:h-14 sm:w-[200px] sm:rounded-2xl"
            />
          </Link>

          <p className="min-w-0 flex-1 truncate text-center font-display text-sm font-bold sm:text-xl lg:text-2xl">
            {textoCabecera}
          </p>

          <nav aria-label="Navegación principal — escritorio" className="hidden shrink-0 items-center gap-1 lg:flex">
            {DESTINOS.map((destino) => {
              const activo = estaActivo(pathname, destino.href);
              return (
                <Link
                  key={destino.href}
                  href={destino.href}
                  aria-current={activo ? "page" : undefined}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 font-body text-sm font-semibold transition hover:bg-[var(--user-color-brand-soft)] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--user-color-action)]"
                >
                  <destino.Icono className="size-5" />
                  {destino.etiqueta}
                </Link>
              );
            })}
          </nav>

          <nav aria-label="Acciones del usuario" className="flex shrink-0 items-center gap-1 sm:gap-3">
            <Link
              href="/cuenta/preferencias"
              className="group flex min-h-12 min-w-12 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 transition duration-200 hover:bg-[var(--user-color-brand-soft)] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--user-color-action)] sm:px-2"
              aria-label="Preferencias"
            >
              <IconoCampana className="size-6" aria-hidden="true" />
              <span className="text-xs font-medium leading-none sm:text-xs">
                Preferencias
              </span>
            </Link>
            <Link
              href="/soporte"
              className="group flex min-h-12 min-w-12 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 transition duration-200 hover:bg-[var(--user-color-brand-soft)] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--user-color-action)] sm:px-2"
              aria-label="Soporte"
            >
              <IconoSoporte className="size-6" />
              <span className="text-xs font-medium leading-none sm:text-xs">
                Soporte
              </span>
            </Link>
          </nav>
        </div>
      </header>

      {mostrarNavegacionInferior && !esAcceso && (
        <nav
          id="bottomNavigation"
          aria-label="Navegación principal"
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
                    className="user-v2-nav-link group select-none"
                  >
                    <span className={`user-v2-nav-indicator ${activo ? "is-active" : ""}`} aria-hidden="true" />
                    <destino.Icono className="size-[22px] transition-colors" />
                    <span className="transition-colors">
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
