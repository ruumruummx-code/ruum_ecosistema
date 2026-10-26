"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { useNuevoTraslado } from "./hooks/useNuevoTraslado";
import type { DatosFormulario } from "./types";
import { MARCAS_CATALOGO } from "@/lib/catalogo-vehiculos";
import { MobileBottomSheet } from "@/components/MobileBottomSheet";
import { BottomSheetCargaMasiva } from "./components/carga-masiva";

export interface NuevoTrasladoDesktopProps {
  t: ReturnType<typeof useNuevoTraslado>;
  nombreUsuario?: string | null;
}

/* =========================================================================
   ÍCONOS VECTORIALES PRECISOS
   ========================================================================= */

function IconoInicio({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="m3 9.5 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 22V12h6v10" />
    </svg>
  );
}

function IconoTraslados({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
      <path d="M14 8h4.5l3.5 4.5v5.5a1 1 0 0 1-1 1h-1" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="18" cy="18" r="2" />
    </svg>
  );
}

function IconoCargaMasiva({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="2" y="4" width="20" height="6" rx="1.5" />
      <rect x="2" y="14" width="20" height="6" rx="1.5" />
      <path d="M6 10v4" />
      <path d="M18 10v4" />
    </svg>
  );
}

function IconoCuenta({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M20 21a8 8 0 0 0-16 0" />
    </svg>
  );
}

function IconoPerfil({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconoPreferencias({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconoCampana({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

function IconoLupa({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function IconoMapa({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
      <line x1="9" x2="9" y1="3" y2="18" />
      <line x1="15" x2="15" y1="6" y2="21" />
    </svg>
  );
}

function IconoAuto({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 12 10s-6.7.6-8.5 1.1C2.7 11.3 2 12.1 2 13v3c0 .6.4 1 1 1h2" />
      <circle cx="7" cy="17" r="2" />
      <path d="M9 17h6" />
      <circle cx="17" cy="17" r="2" />
      <path d="M5 10l1.5-4.5A2 2 0 0 1 8.4 4h7.2a2 2 0 0 1 1.9 1.5L19 10" />
    </svg>
  );
}

function IconoEscudoSeguridad({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function IconoCandado({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function IconoRayo({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function IconoPin({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function IconoAudifonos({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" />
    </svg>
  );
}

/* =========================================================================
   COMPONENTE PRINCIPAL: NUEVO TRASLADO DESKTOP (PASO 1)
   ========================================================================= */

export function NuevoTrasladoDesktop({ t, nombreUsuario }: NuevoTrasladoDesktopProps) {
  const router = useRouter();
  const [cargaMasivaAbierta, setCargaMasivaAbierta] = useState(false);

  const nombreMostrado = nombreUsuario || "Hector";
  const inicialUsuario = nombreMostrado.trim().charAt(0).toUpperCase() || "H";

  // Datos reactivos de geolocalización y vehículo
  const origenCp = t.datos.origenCodigoPostal || "52104";
  const destinoCp = t.datos.destinoCodigoPostal || "52000";
  const origenCiudad = t.datos.origenCiudad || "San Mateo Atenco";
  const origenEstado = t.datos.origenEstado || "Estado de México";
  const destinoCiudad = t.datos.destinoCiudad || "Lerma";
  const destinoEstado = t.datos.destinoEstado || "Estado de México";

  const marcaSeleccionada = t.datos.marca || "Fiat";
  const modeloSeleccionado = t.datos.modelo || "Mobi";
  const condicionSeleccionada = t.datos.condicion || "nueva";
  const anioVehiculo = t.datos.anio || 2026;

  // Cálculo reactivo de la tarifa estimada
  const tarifaCalculada = t.previsualizacion?.disponible && t.previsualizacion?.tarifa
    ? Number(t.previsualizacion.tarifa)
    : 870.52;

  const tarifaFormateada = `$${tarifaCalculada.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} MXN`;

  // Desglose de tarifa (Base + Distancia + IVA)
  const tarifaBase = (tarifaCalculada * 0.86).toFixed(2);
  const tarifaDistancia = (tarifaCalculada * 0.09).toFixed(2);
  const tarifaIva = (tarifaCalculada - Number(tarifaBase) - Number(tarifaDistancia)).toFixed(2);

  const distanciaEstimada = t.rutaEstimacion?.distanciaKm
    ? `${t.rutaEstimacion.distanciaKm.toFixed(1)} km`
    : "4.8 km";

  const tiempoEstimado = t.rutaEstimacion?.tiempoEstimadoHoras
    ? `${Math.round(t.rutaEstimacion.tiempoEstimadoHoras * 60)} min`
    : "13 min";

  const manejarContinuar = () => {
    if (t.accionesTarifa?.onContinuar) {
      t.accionesTarifa.onContinuar();
    } else {
      t.avanzarPaso();
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f8fafc] text-slate-800 antialiased dark:bg-[#07192f] dark:text-slate-100">
      {/* ---------------------------------------------------------------------
          SIDEBAR IZQUIERDO GLOBAL
          --------------------------------------------------------------------- */}
      <aside
        aria-label="Menú principal de escritorio"
        className="w-64 shrink-0 flex flex-col justify-between border-r border-slate-200/80 bg-white p-5 dark:border-[#1a3a5c] dark:bg-[#0a2342] z-20"
      >
        <div className="flex flex-col gap-6">
          {/* Logo Ruum Ruum USUARIO estándar */}
          <Link href="/" className="flex items-center gap-2.5 px-2 py-1">
            <span className="flex size-9 items-center justify-center rounded-xl bg-[#0c2340] dark:bg-[#0066FF] shadow-xs">
              <svg viewBox="0 0 32 32" fill="none" className="size-5">
                <path d="M6 10 L16 4 L26 10 L26 22 L16 28 L6 22 Z" stroke="#38bdf8" strokeWidth="2.5" strokeLinejoin="round" />
                <path d="M12 14 L16 11 L20 14 L20 20 L16 23 L12 20 Z" fill="#38bdf8" />
              </svg>
            </span>
            <div>
              <span className="font-display text-[17px] font-black tracking-tight text-[#0c2340] dark:text-white block leading-tight">
                Ruum Ruum
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0066FF] dark:text-[#38bdf8] block">
                USUARIO
              </span>
            </div>
          </Link>

          {/* Menú de navegación lateral */}
          <nav aria-label="Navegación del panel" className="flex flex-col gap-1.5">
            <Link
              href="/"
              className="flex items-center gap-3.5 rounded-2xl bg-[#0066FF] px-4 py-3 text-[14px] font-bold text-white shadow-sm"
            >
              <IconoInicio className="size-5 text-white" />
              Inicio
            </Link>

            <Link
              href="/mis-viajes"
              className="flex items-center gap-3.5 rounded-2xl px-4 py-3 text-[14px] font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              <IconoTraslados className="size-5 text-slate-400 dark:text-slate-400" />
              Traslados
            </Link>

            <Link
              href="/viajes/masivo"
              className="flex items-center gap-3.5 rounded-2xl px-4 py-3 text-[14px] font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              <IconoCargaMasiva className="size-5 text-slate-400 dark:text-slate-400" />
              Carga masiva
            </Link>

            <Link
              href="/cuenta"
              className="flex items-center gap-3.5 rounded-2xl px-4 py-3 text-[14px] font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              <IconoCuenta className="size-5 text-slate-400 dark:text-slate-400" />
              Cuenta
            </Link>

            <Link
              href="/cuenta/datos-personales"
              className="flex items-center gap-3.5 rounded-2xl px-4 py-3 text-[14px] font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              <IconoPerfil className="size-5 text-slate-400 dark:text-slate-400" />
              Perfil
            </Link>

            <Link
              href="/cuenta/preferencias"
              className="flex items-center gap-3.5 rounded-2xl px-4 py-3 text-[14px] font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              <IconoPreferencias className="size-5 text-slate-400 dark:text-slate-400" />
              Preferencias
            </Link>
          </nav>
        </div>

        {/* Card inferior: Seguridad, evidencia y trazabilidad */}
        <div className="relative rounded-2xl border border-blue-100 bg-[#edf5fd] p-4 dark:border-blue-900/40 dark:bg-[#0c2646] shadow-2xs">
          {/* Ilustración de camioneta azul de traslado */}
          <div className="flex justify-end -mt-1 -mr-1 mb-1" aria-hidden="true">
            <svg viewBox="0 0 80 40" fill="none" className="w-16 h-8">
              <rect x="5" y="10" width="48" height="22" rx="3" fill="#60a5fa" />
              <path d="M53 16 L65 16 L73 24 L73 32 L53 32 Z" fill="#93c5fd" />
              <circle cx="20" cy="32" r="4.5" fill="#1e293b" />
              <circle cx="62" cy="32" r="4.5" fill="#1e293b" />
            </svg>
          </div>

          <h3 className="font-display text-[13px] font-bold text-slate-900 dark:text-white leading-tight">
            Seguridad, evidencia y trazabilidad en cada traslado.
          </h3>
          <p className="mt-1 font-display text-[12px] font-extrabold text-[#0066FF] dark:text-[#38bdf8]">
            Ruum Ruum
          </p>
          <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
            Más rápido. Más simple. Más lejos.
          </p>
        </div>
      </aside>

      {/* ---------------------------------------------------------------------
          ÁREA PRINCIPAL DE CONTENIDO
          --------------------------------------------------------------------- */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Barra Superior con Buscador, Notificaciones y Perfil */}
        <header
          aria-label="Barra superior de nuevo traslado"
          className="flex h-18 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/90 px-8 backdrop-blur-md dark:border-[#1a3a5c] dark:bg-[#0a2342]/90 z-10"
        >
          {/* Input de Búsqueda */}
          <div className="relative max-w-md w-full">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <IconoLupa className="size-4" />
            </span>
            <input
              type="search"
              placeholder="Buscar traslados, vehículos o documentos..."
              aria-label="Buscar traslados, vehículos o documentos"
              className="w-full rounded-full border border-slate-200/90 bg-[#f8fafc] py-2.5 pl-10 pr-4 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-[#0066FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20 dark:border-[#1a3a5c] dark:bg-[#07192f] dark:text-slate-100"
            />
          </div>

          {/* Notificaciones y Perfil */}
          <div className="flex items-center gap-4">
            <Link
              href="/cuenta/preferencias"
              aria-label="Notificaciones"
              className="relative flex size-10 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <IconoCampana className="size-5" />
              <span
                className="absolute top-2 right-2 size-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-[#0a2342]"
                aria-hidden="true"
              />
            </Link>

            {/* Avatar Dropdown */}
            <div className="flex items-center gap-2.5">
              <span className="flex size-10 items-center justify-center rounded-full bg-[#0066FF] font-display text-sm font-bold text-white shadow-xs">
                {inicialUsuario}
              </span>
              <div className="text-left">
                <button
                  type="button"
                  onClick={() => router.push("/cuenta")}
                  aria-label="Perfil de usuario"
                  className="flex items-center gap-1 font-display text-xs font-bold text-slate-900 hover:text-[#0066FF] dark:text-white cursor-pointer"
                >
                  <span>Hola, {nombreMostrado}</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="size-3 text-slate-400" aria-hidden="true">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
                <span className="block text-[10px] font-medium text-slate-400">Usuario</span>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Main Area */}
        <main
          id="contenido-nuevo-traslado"
          className="flex-1 overflow-y-auto px-8 py-6 space-y-6"
        >
          {/* Enlace Volver */}
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-[#0066FF] transition dark:text-slate-300 dark:hover:text-[#4d94ff]"
            >
              <span>←</span>
              <span>Volver</span>
            </Link>
          </div>

          {/* Encabezado: Paso 1 de 5 y Título Principal */}
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#0066FF] dark:text-[#38bdf8]">
              PASO 1 DE 5
            </span>
            <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Crea un nuevo traslado
            </h1>
            <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
              Completa la información del traslado y obtén tu tarifa al instante.
            </p>
          </div>

          {/* Stepper Horizontal de 5 Pasos */}
          <section aria-label="Progreso del traslado" className="py-2">
            <div className="relative flex items-center justify-between max-w-2xl">
              {/* Línea conectora de fondo */}
              <div className="absolute left-6 right-6 top-4.5 -z-0 h-0.5 bg-slate-200 dark:bg-slate-700" aria-hidden="true" />

              {/* Paso 1: Tarifa (Activo) */}
              <div className="relative z-10 flex flex-col items-center text-center">
                <span className="flex size-9 items-center justify-center rounded-full bg-[#0066FF] font-display text-xs font-bold text-white ring-4 ring-blue-100 dark:ring-blue-950 shadow-sm">
                  1
                </span>
                <span className="mt-1.5 font-display text-xs font-bold text-slate-900 dark:text-white">
                  Tarifa
                </span>
                <span className="text-[10px] font-medium text-slate-400">
                  Cotiza tu traslado
                </span>
              </div>

              {/* Paso 2: Vehículo */}
              <div className="relative z-10 flex flex-col items-center text-center">
                <span className="flex size-9 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-800">
                  <IconoAuto className="size-4" />
                </span>
                <span className="mt-1.5 font-display text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Vehículo
                </span>
                <span className="text-[10px] font-medium text-slate-400">
                  Selecciona el vehículo
                </span>
              </div>

              {/* Paso 3: Origen/Destino */}
              <div className="relative z-10 flex flex-col items-center text-center">
                <span className="flex size-9 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-800">
                  <IconoPin className="size-4" />
                </span>
                <span className="mt-1.5 font-display text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Origen/Destino
                </span>
                <span className="text-[10px] font-medium text-slate-400">
                  Confirma tu ruta
                </span>
              </div>

              {/* Paso 4: Servicio */}
              <div className="relative z-10 flex flex-col items-center text-center">
                <span className="flex size-9 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-800">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4" aria-hidden="true">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                </span>
                <span className="mt-1.5 font-display text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Servicio
                </span>
                <span className="text-[10px] font-medium text-slate-400">
                  Opciones adicionales
                </span>
              </div>

              {/* Paso 5: Pago */}
              <div className="relative z-10 flex flex-col items-center text-center">
                <span className="flex size-9 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-800">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4" aria-hidden="true">
                    <rect width="20" height="14" x="2" y="5" rx="2" />
                    <line x1="2" x2="22" y1="10" y2="10" />
                  </svg>
                </span>
                <span className="mt-1.5 font-display text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Pago
                </span>
                <span className="text-[10px] font-medium text-slate-400">
                  Finaliza y paga
                </span>
              </div>
            </div>
          </section>

          {/* -----------------------------------------------------------------
              ESTRUCTURA DE DOS COLUMNAS (60% / 40%)
              ----------------------------------------------------------------- */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* ===============================================================
                COLUMNA IZQUIERDA (60% / 7 cols)
                =============================================================== */}
            <div className="lg:col-span-7 space-y-6">
              {/* Tarjeta del Formulario (Card Blanco) */}
              <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-[#1a3a5c] dark:bg-[#0a2342] space-y-5">
                {/* Título Interno */}
                <div className="flex items-center gap-3.5 pb-2">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#0066FF] dark:bg-blue-950 dark:text-blue-400">
                    <IconoMapa className="size-6" />
                  </span>
                  <div>
                    <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                      ¿A dónde trasladamos tu auto?
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Ingresa los datos de tu traslado para obtener el costo estimado.
                    </p>
                  </div>
                </div>

                {/* Fila 1: Códigos Postales */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Origen */}
                  <div>
                    <label htmlFor="cp-origen-desktop" className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      <span className="size-2 rounded-full bg-emerald-500" aria-hidden="true" />
                      Código Postal de origen
                    </label>
                    <div className="relative">
                      <input
                        id="cp-origen-desktop"
                        type="text"
                        inputMode="numeric"
                        maxLength={5}
                        value={t.datos.origenCodigoPostal}
                        onChange={(e) => t.actualizarCodigoPostal("origen", e.target.value)}
                        placeholder="52104"
                        className="w-full rounded-xl border border-slate-200 bg-[#f8fafc] py-2.5 pl-3.5 pr-10 text-xs font-semibold text-slate-900 focus:border-[#0066FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20 dark:border-[#1a3a5c] dark:bg-[#07192f] dark:text-white"
                      />
                      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
                        <IconoLupa className="size-4" />
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 min-h-[16px]">
                      {t.cpConsultando === "origen" ? "Buscando…" : `${origenCiudad}, ${origenEstado}`}
                    </p>
                  </div>

                  {/* Destino */}
                  <div>
                    <label htmlFor="cp-destino-desktop" className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      <span className="size-2 rounded-full bg-rose-500" aria-hidden="true" />
                      Código Postal de destino
                    </label>
                    <div className="relative">
                      <input
                        id="cp-destino-desktop"
                        type="text"
                        inputMode="numeric"
                        maxLength={5}
                        value={t.datos.destinoCodigoPostal}
                        onChange={(e) => t.actualizarCodigoPostal("destino", e.target.value)}
                        placeholder="52000"
                        className="w-full rounded-xl border border-slate-200 bg-[#f8fafc] py-2.5 pl-3.5 pr-10 text-xs font-semibold text-slate-900 focus:border-[#0066FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20 dark:border-[#1a3a5c] dark:bg-[#07192f] dark:text-white"
                      />
                      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
                        <IconoLupa className="size-4" />
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 min-h-[16px]">
                      {t.cpConsultando === "destino" ? "Buscando…" : `${destinoCiudad}, ${destinoEstado}`}
                    </p>
                  </div>
                </div>

                {/* Fila 2: Marca y Modelo */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Marca */}
                  <div>
                    <label htmlFor="marca-vehiculo-desktop" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Marca del vehículo
                    </label>
                    <div className="relative flex items-center">
                      <select
                        id="marca-vehiculo-desktop"
                        value={t.datos.marca}
                        onChange={(e) => t.actualizarMarcaCatalogo(e.target.value)}
                        className="w-full appearance-none rounded-xl border border-slate-200 bg-[#f8fafc] py-2.5 pl-3.5 pr-9 text-xs font-semibold text-slate-900 focus:border-[#0066FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20 dark:border-[#1a3a5c] dark:bg-[#07192f] dark:text-white cursor-pointer"
                      >
                        <option value="">Selecciona la marca</option>
                        {MARCAS_CATALOGO.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="pointer-events-none absolute right-3 size-3.5 text-slate-400" aria-hidden="true">
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </div>
                  </div>

                  {/* Modelo */}
                  <div>
                    <label htmlFor="modelo-vehiculo-desktop" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Modelo
                    </label>
                    <div className="relative flex items-center">
                      <select
                        id="modelo-vehiculo-desktop"
                        value={t.datos.modelo}
                        onChange={(e) => t.actualizarModeloCatalogo(e.target.value)}
                        className="w-full appearance-none rounded-xl border border-slate-200 bg-[#f8fafc] py-2.5 pl-3.5 pr-9 text-xs font-semibold text-slate-900 focus:border-[#0066FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20 dark:border-[#1a3a5c] dark:bg-[#07192f] dark:text-white cursor-pointer"
                      >
                        <option value="">Selecciona el modelo</option>
                        {((t.modelosDisponibles?.length ?? 0) > 0 ? t.modelosDisponibles : ["Mobi", "Argo", "Pulse", "Fastback"]).map((mod) => (
                          <option key={mod} value={mod}>
                            {mod}
                          </option>
                        ))}
                      </select>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="pointer-events-none absolute right-3 size-3.5 text-slate-400" aria-hidden="true">
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Fila 3: Condición del vehículo */}
                <div>
                  <label htmlFor="condicion-vehiculo-desktop" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Condición del vehículo
                  </label>
                  <div className="relative flex items-center">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#0066FF]">
                      <IconoAuto className="size-4" />
                    </span>
                    <select
                      id="condicion-vehiculo-desktop"
                      value={t.datos.condicion}
                      onChange={(e) => {
                        if (t.actualizar) {
                          t.actualizar("condicion", e.target.value as DatosFormulario["condicion"]);
                        }
                      }}
                      className="w-full appearance-none rounded-xl border border-slate-200 bg-[#f8fafc] py-2.5 pl-10 pr-9 text-xs font-semibold text-slate-900 focus:border-[#0066FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20 dark:border-[#1a3a5c] dark:bg-[#07192f] dark:text-white cursor-pointer"
                    >
                      <option value="nueva">Nueva</option>
                      <option value="seminueva">Seminueva</option>
                      <option value="usada">Usada</option>
                    </select>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="pointer-events-none absolute right-3 size-3.5 text-slate-400" aria-hidden="true">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </div>
                </div>

                {/* Banner Informativo de Seguridad */}
                <div className="flex items-center gap-2.5 rounded-2xl bg-[#edf5fd] p-3 text-xs text-[#0c2340] dark:bg-[#0c2646] dark:text-blue-100">
                  <span className="text-[#0066FF] dark:text-[#38bdf8]">
                    <IconoEscudoSeguridad className="size-4.5" />
                  </span>
                  <p>
                    <strong className="font-bold">Tus datos están seguros.</strong> Solo los usamos para calcular tu tarifa de traslado.
                  </p>
                </div>

                {t.paso === 0 && (
                  <button
                    type="button"
                    onClick={() => setCargaMasivaAbierta(true)}
                    aria-label="Abrir módulo de carga masiva de traslados"
                    className="min-h-11 w-full rounded-xl border border-blue-200 bg-blue-50 px-4 text-xs font-bold text-[#0066FF] transition hover:bg-blue-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0066FF] dark:border-blue-900/40 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-950"
                  >
                    Abrir módulo de carga masiva de traslados
                  </button>
                )}

                {/* Botonera de Acción */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    disabled
                    aria-label="← Anterior"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-5 py-2.5 text-xs font-bold text-slate-400 cursor-not-allowed dark:border-slate-800 dark:bg-slate-900 dark:text-slate-600"
                  >
                    <span>←</span>
                    <span>Anterior</span>
                  </button>

                  <button
                    type="button"
                    onClick={manejarContinuar}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#0066FF] px-6 py-2.5 font-display text-xs font-bold text-white shadow-md transition hover:bg-[#0052cc] active:scale-[0.98] cursor-pointer"
                  >
                    <span>Continuar - Tarifa est. {tarifaFormateada}</span>
                    <span aria-hidden="true">➔</span>
                  </button>
                </div>
              </div>

              {/* Sección Inferior: ¿Por qué elegir Ruum Ruum? */}
              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-[#1a3a5c] dark:bg-[#0a2342]">
                <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white mb-4">
                  ¿Por qué elegir Ruum Ruum?
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  {/* 1. Cotización instantánea */}
                  <div className="flex flex-col gap-1">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-[#0066FF] dark:bg-blue-950 dark:text-blue-400 mb-1">
                      <IconoRayo className="size-4" />
                    </span>
                    <h4 className="font-display text-xs font-bold text-slate-900 dark:text-white">
                      Cotización instantánea
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      En segundos, sin complicaciones.
                    </p>
                  </div>

                  {/* 2. Transporte seguro */}
                  <div className="flex flex-col gap-1">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-[#0066FF] dark:bg-blue-950 dark:text-blue-400 mb-1">
                      <IconoEscudoSeguridad className="size-4" />
                    </span>
                    <h4 className="font-display text-xs font-bold text-slate-900 dark:text-white">
                      Transporte seguro
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Tu vehículo en manos expertas.
                    </p>
                  </div>

                  {/* 3. Cobertura nacional */}
                  <div className="flex flex-col gap-1">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-[#0066FF] dark:bg-blue-950 dark:text-blue-400 mb-1">
                      <IconoPin className="size-4" />
                    </span>
                    <h4 className="font-display text-xs font-bold text-slate-900 dark:text-white">
                      Cobertura nacional
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Llegamos a más destinos.
                    </p>
                  </div>

                  {/* 4. Soporte humano */}
                  <div className="flex flex-col gap-1">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-[#0066FF] dark:bg-blue-950 dark:text-blue-400 mb-1">
                      <IconoAudifonos className="size-4" />
                    </span>
                    <h4 className="font-display text-xs font-bold text-slate-900 dark:text-white">
                      Soporte humano
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Te acompañamos en todo el proceso.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ===============================================================
                COLUMNA DERECHA (40% / 5 cols)
                =============================================================== */}
            <aside aria-label="Resumen persistente de tarifa" className="lg:col-span-5 space-y-4">
              {/* Badge Superior: Cotización en segundos */}
              <div className="flex items-center gap-3.5 rounded-2xl border border-blue-100 bg-gradient-to-r from-[#f0f7ff] to-[#f8fafc] p-3.5 dark:border-blue-900/40 dark:from-[#0c2646] dark:to-[#0a2342] shadow-2xs">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0066FF] shadow-2xs dark:bg-blue-950 dark:text-blue-400">
                  <IconoRayo className="size-4" />
                </span>
                <div>
                  <h3 className="font-display text-xs font-bold text-slate-900 dark:text-white">
                    Cotización en segundos
                  </h3>
                  <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                    Rápido · Seguro · Confiable
                  </p>
                </div>
              </div>

              {/* Tarjeta Principal de Resumen */}
              <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-[#1a3a5c] dark:bg-[#0a2342] space-y-4">
                {/* Header: Resumen del traslado y Cotización Activa */}
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
                    Resumen del traslado
                  </h3>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300">
                    Cotización Activa
                  </span>
                </div>

                {/* Mapa de Ruta Gráfico */}
                <div className="relative h-36 w-full rounded-2xl bg-[#eef2f7] dark:bg-[#07192f] overflow-hidden border border-slate-200/60 dark:border-slate-800">
                  {/* Calles sutiles de fondo */}
                  <svg viewBox="0 0 400 160" fill="none" className="absolute inset-0 w-full h-full opacity-35 pointer-events-none">
                    <line x1="0" y1="40" x2="400" y2="40" stroke="#cbd5e1" strokeWidth="3" />
                    <line x1="0" y1="110" x2="400" y2="110" stroke="#cbd5e1" strokeWidth="4" />
                    <line x1="80" y1="0" x2="80" y2="160" stroke="#cbd5e1" strokeWidth="3" />
                    <line x1="220" y1="0" x2="220" y2="160" stroke="#cbd5e1" strokeWidth="3" />
                    <line x1="330" y1="0" x2="330" y2="160" stroke="#cbd5e1" strokeWidth="3" />
                  </svg>

                  {/* Ruta punteada en arco */}
                  <svg viewBox="0 0 400 160" fill="none" className="absolute inset-0 w-full h-full">
                    <path
                      d="M 60 110 Q 180 30 330 90"
                      stroke="#0066FF"
                      strokeWidth="3.5"
                      strokeDasharray="6 6"
                      strokeLinecap="round"
                    />
                  </svg>

                  {/* Origen (Verde) */}
                  <div className="absolute left-6 bottom-5 flex flex-col items-center">
                    <span className="size-3 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-[#0a2342] shadow-xs" />
                    <span className="mt-1 rounded-md bg-[#0c2340] px-2 py-0.5 text-[9px] font-bold text-white shadow-xs">
                      {origenCiudad}
                    </span>
                  </div>

                  {/* Destino (Azul oscuro / rojo) */}
                  <div className="absolute right-10 top-12 flex flex-col items-center">
                    <span className="size-3 rounded-full bg-[#0066FF] ring-4 ring-white dark:ring-[#0a2342] shadow-xs" />
                    <span className="mt-1 rounded-md bg-[#0c2340] px-2 py-0.5 text-[9px] font-bold text-white shadow-xs">
                      {destinoCiudad}
                    </span>
                  </div>

                  {/* Badge de Distancia y Tiempo */}
                  <div className="absolute right-3 bottom-3 flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold text-slate-800 shadow-sm backdrop-blur-xs dark:bg-[#0a2342]/95 dark:text-white">
                    <IconoAuto className="size-3 text-[#0066FF]" />
                    <span>{distanciaEstimada} ({tiempoEstimado})</span>
                  </div>
                </div>

                {/* Tarjeta de Vehículo Seleccionado */}
                <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-[#f8fafc] p-3 dark:border-slate-800 dark:bg-[#07192f]">
                  {/* Ilustración compacta de coche blanco */}
                  <div className="size-12 shrink-0 flex items-center justify-center rounded-xl bg-white dark:bg-[#0a2342] shadow-2xs">
                    <svg viewBox="0 0 60 32" fill="none" className="w-10 h-6">
                      <rect x="5" y="10" width="50" height="14" rx="4" fill="#e2e8f0" />
                      <path d="M12 10 L18 3 L40 3 L46 10 Z" fill="#cbd5e1" />
                      <rect x="18" y="5" width="8" height="4" rx="1" fill="#93c5fd" />
                      <rect x="28" y="5" width="10" height="4" rx="1" fill="#93c5fd" />
                      <circle cx="16" cy="24" r="4" fill="#1e293b" />
                      <circle cx="44" cy="24" r="4" fill="#1e293b" />
                    </svg>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="truncate font-display text-xs font-bold text-slate-900 dark:text-white">
                        {marcaSeleccionada} {modeloSeleccionado} {anioVehiculo}
                      </h4>
                      <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300">
                        {condicionSeleccionada === "nueva" ? "Nuevo" : condicionSeleccionada}
                      </span>
                    </div>
                    <p className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                      {origenCiudad} → {destinoCiudad}
                    </p>
                  </div>
                </div>

                {/* Módulo de Desglose de Tarifa */}
                <div className="space-y-2 pt-2">
                  <h4 className="font-display text-xs font-bold text-slate-900 dark:text-white">
                    Desglose de tarifa
                  </h4>

                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Tarifa base</span>
                      <span className="font-semibold text-slate-900 dark:text-white">${tarifaBase} MXN</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Distancia ({distanciaEstimada})</span>
                      <span className="font-semibold text-slate-900 dark:text-white">${tarifaDistancia} MXN</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">IVA (16%)</span>
                      <span className="font-semibold text-slate-900 dark:text-white">${tarifaIva} MXN</span>
                    </div>
                  </div>

                  {/* Separador */}
                  <div className="my-2 border-t border-slate-100 dark:border-slate-800" />

                  {/* Fila de Total a pagar destacada */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="font-display text-sm font-bold text-slate-900 dark:text-white">
                      Total a pagar
                    </span>
                    <span className="font-display text-2xl font-black text-[#0066FF] dark:text-[#38bdf8]">
                      {tarifaFormateada}
                    </span>
                  </div>
                </div>

                {/* Badge inferior de seguridad Stripe */}
                <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50/70 border border-emerald-100 p-2 text-center text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-900/40 dark:text-emerald-300">
                  <IconoCandado className="size-3.5 text-emerald-600" />
                  <span>Proceso de pago cifrado 256-bit Stripe</span>
                </div>
              </div>

              {/* Banner Promocional Inferior: Mueve tu auto sin soltar el control */}
              <div className="relative rounded-3xl bg-gradient-to-r from-[#dbeafe] via-[#bfdbfe] to-[#93c5fd] p-5 text-[#0c2340] shadow-xs overflow-hidden dark:from-[#0c2646] dark:to-[#1e3a8a] dark:text-white">
                <div className="relative z-10 max-w-[170px]">
                  <h4 className="font-display text-sm font-black leading-tight">
                    Mueve tu auto sin soltar el control.
                  </h4>
                  <p className="mt-1 text-[11px] font-medium text-slate-600 dark:text-blue-100">
                    Conecta, traslada, avanza.
                  </p>
                  <span className="mt-3 block h-1 w-7 rounded-full bg-[#0066FF] dark:bg-[#38bdf8]" />
                </div>

                {/* Ilustración de auto azul moderno en perfil/frente */}
                <div className="absolute right-0 bottom-0 top-0 w-36 pointer-events-none flex items-center justify-end" aria-hidden="true">
                  <svg viewBox="0 0 160 120" fill="none" className="w-full h-full scale-110">
                    {/* Silueta de frente de sedán deportivo azul */}
                    <path d="M40 30 L90 22 L140 25 L155 50 L160 85 L140 95 L30 95 L20 65 Z" fill="#1d4ed8" />
                    <path d="M45 35 L88 28 L125 30 L135 50 L40 50 Z" fill="#0f172a" opacity="0.8" />
                    <rect x="25" y="65" width="130" height="20" rx="4" fill="#2563eb" />
                    {/* Faros delanteros LED */}
                    <polygon points="120,52 145,54 150,62 125,60" fill="#f8fafc" />
                    <polygon points="122,54 142,56 146,60 126,58" fill="#38bdf8" />
                    {/* Parrilla frontal */}
                    <rect x="60" y="68" width="60" height="14" rx="2" fill="#0f172a" />
                    <line x1="65" y1="72" x2="115" y2="72" stroke="#475569" strokeWidth="1.5" />
                    <line x1="65" y1="76" x2="115" y2="76" stroke="#475569" strokeWidth="1.5" />
                  </svg>
                </div>
              </div>
            </aside>
          </div>

          {/* Footer Global */}
          <footer className="border-t border-slate-200/60 pt-4 pb-2 text-[11px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-600 dark:text-slate-300">Ruum Ruum</span>
              <span>|</span>
              <span>© 2024 Todos los derechos reservados.</span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/legal/terminos" className="hover:underline">Términos</Link>
              <span>|</span>
              <Link href="/legal/privacidad" className="hover:underline">Privacidad</Link>
              <span>|</span>
              <Link href="/soporte" className="hover:underline">Soporte</Link>
            </div>
          </footer>
        </main>
      </div>
      <MobileBottomSheet
        open={cargaMasivaAbierta}
        onClose={() => setCargaMasivaAbierta(false)}
        title="Carga masiva de traslados"
        fullScreen
      >
        <BottomSheetCargaMasiva onCerrar={() => setCargaMasivaAbierta(false)} />
      </MobileBottomSheet>
    </div>
  );
}
