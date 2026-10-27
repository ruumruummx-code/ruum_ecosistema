"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCuentaUsuario, type ActividadItem } from "./useCuentaUsuario";
import type { CuentaReal } from "./cuenta-ui";
import { UserDashboardLayout } from "../../components/layout/UserDashboardLayout";

export interface CuentaDesktopProps {
  cuenta: CuentaReal;
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
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
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
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
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

function IconoBuscar({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
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

function IconoSol({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2 M12 20v2 M4.93 4.93l1.41 1.41 M17.66 17.66l1.41 1.41 M2 12h2 M20 12h2 M6.34 17.66l-1.41 1.41 M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function IconoLuna({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

function IconoEditarLapiz({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  );
}

function IconoIncidencias({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function IconoUbicacion({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function IconoVehiculo({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M5 11l1.5-4.5h11L19 11M4 11h16v6a1 1 0 0 1-1 1h-1a2 2 0 0 1-4 0H10a2 2 0 0 1-4 0H5a1 1 0 0 1-1-1v-6z" />
      <circle cx="7.5" cy="17.5" r="1.5" />
      <circle cx="16.5" cy="17.5" r="1.5" />
    </svg>
  );
}

function IconoAudifonos({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" />
    </svg>
  );
}

function IconoEscudoSeguridad({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function IconoCerrarSesion({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function IconoMail({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function IconoTelefono({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function IconoGlobo({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function IconoReloj({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconoFoco({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M9 18h6 M10 22h4 M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5.76.76 1.23 1.52 1.41 2.5" />
    </svg>
  );
}

function IconoLibro({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
      <path d="M6 6h10" />
      <path d="M6 10h10" />
    </svg>
  );
}

/* =========================================================================
   ILUSTRACIONES VECTORIALES Y GRÁFICOS
   ========================================================================= */

/** Ilustración 3D de escudo de verificación azul */
function Escudo3DIlustracion({ className = "size-28" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`} aria-hidden="true">
      <svg viewBox="0 0 120 130" fill="none" className="w-full h-full drop-shadow-xl">
        <defs>
          <linearGradient id="shieldGrad" x1="10" y1="10" x2="110" y2="120" gradientUnits="userSpaceOnUse">
            <stop stopColor="#93c5fd" />
            <stop offset="0.5" stopColor="#60a5fa" />
            <stop offset="1" stopColor="#2563eb" />
          </linearGradient>
          <linearGradient id="checkGrad" x1="40" y1="50" x2="80" y2="80" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffffff" />
            <stop offset="1" stopColor="#dbeafe" />
          </linearGradient>
          <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Glow de fondo */}
        <ellipse cx="60" cy="65" rx="45" ry="50" fill="#3b82f6" opacity="0.3" filter="url(#softGlow)" />

        {/* Escudo exterior */}
        <path
          d="M60 10 L102 26 C102 70 82 108 60 120 C38 108 18 70 18 26 Z"
          fill="url(#shieldGrad)"
          stroke="#bfdbfe"
          strokeWidth="3"
        />

        {/* Brillo biselado interior */}
        <path
          d="M60 18 L94 31 C94 67 78 98 60 108 C42 98 26 67 26 31 Z"
          fill="#3b82f6"
          opacity="0.5"
        />

        {/* Palomita / Checkmark */}
        <path
          d="M44 64 L55 75 L78 50"
          fill="none"
          stroke="url(#checkGrad)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

/** Ilustración de soporte al cliente con operadora amigable */
function AvatarOperadoraSoporte({ className = "size-20" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-100 to-indigo-100 dark:from-blue-950 dark:to-indigo-900 overflow-hidden shrink-0 ${className}`} aria-hidden="true">
      <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
        {/* Cabello oscuro */}
        <path d="M26 48 C26 26 74 26 74 48 C74 72 70 88 70 94 L30 94 C30 88 26 72 26 48 Z" fill="#0f172a" />
        
        {/* Rostro */}
        <path d="M35 44 C35 34 65 34 65 44 C65 58 60 70 50 70 C40 70 35 58 35 44 Z" fill="#fed7aa" />
        
        {/* Cuello y blusa */}
        <path d="M45 68 L55 68 L58 78 L42 78 Z" fill="#fdba74" />
        <path d="M32 78 L68 78 L78 100 L22 100 Z" fill="#2563eb" />
        <path d="M42 78 L50 88 L58 78 Z" fill="#ffffff" />
        
        {/* Diadema de audífonos con micrófono */}
        <path d="M30 46 C28 28 72 28 70 46" stroke="#0284c7" strokeWidth="4" strokeLinecap="round" fill="none" />
        <rect x="25" y="42" width="7" height="14" rx="3" fill="#0284c7" />
        <rect x="68" y="42" width="7" height="14" rx="3" fill="#0284c7" />
        <path d="M28 54 C28 66 40 68 45 66" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <circle cx="46" cy="66" r="3" fill="#0f172a" />
        
        {/* Ojos y sonrisa */}
        <circle cx="43" cy="48" r="2" fill="#0f172a" />
        <circle cx="57" cy="48" r="2" fill="#0f172a" />
        <path d="M46 56 Q50 60 54 56" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" fill="none" />
      </svg>
    </div>
  );
}

/** Ilustración de cabecera con camión, auto y silueta de ciudad */
function IlustracionCabeceraCuenta() {
  return (
    <div className="relative flex items-center gap-6 h-full select-none" aria-hidden="true">
      {/* Fondo skyline edificios */}
      <svg viewBox="0 0 280 80" fill="none" className="w-56 h-16 opacity-40">
        <rect x="10" y="30" width="22" height="50" rx="1.5" fill="#93c5fd" />
        <rect x="36" y="20" width="28" height="60" rx="1.5" fill="#bfdbfe" />
        <rect x="68" y="40" width="20" height="40" rx="1.5" fill="#93c5fd" />
        <rect x="92" y="15" width="34" height="65" rx="1.5" fill="#bfdbfe" />
        <rect x="130" y="32" width="26" height="48" rx="1.5" fill="#93c5fd" />
        <rect x="160" y="25" width="30" height="55" rx="1.5" fill="#bfdbfe" />
        <rect x="194" y="36" width="24" height="44" rx="1.5" fill="#93c5fd" />
        <rect x="222" y="18" width="30" height="62" rx="1.5" fill="#bfdbfe" />
      </svg>

      {/* Vehículos en tránsito: Auto compacto azul y camión de traslado */}
      <div className="flex items-end gap-3 pb-1">
        {/* Sedán azul */}
        <svg viewBox="0 0 64 30" fill="none" className="w-14 h-7 drop-shadow-xs">
          <path d="M8 18 L16 8 L44 8 L54 18 Z" fill="#2563eb" />
          <rect x="2" y="15" width="60" height="10" rx="3" fill="#1d4ed8" />
          <rect x="18" y="10" width="11" height="6" rx="1" fill="#bfdbfe" />
          <rect x="32" y="10" width="11" height="6" rx="1" fill="#bfdbfe" />
          <circle cx="15" cy="25" r="4.5" fill="#0f172a" />
          <circle cx="15" cy="25" r="2" fill="#e2e8f0" />
          <circle cx="48" cy="25" r="4.5" fill="#0f172a" />
          <circle cx="48" cy="25" r="2" fill="#e2e8f0" />
        </svg>

        {/* Camión blanco de carga segura */}
        <svg viewBox="0 0 85 40" fill="none" className="w-18 h-9 drop-shadow-xs">
          {/* Cabina */}
          <path d="M52 14 L68 14 L78 24 L78 33 L52 33 Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
          <rect x="62" y="17" width="10" height="7" rx="1" fill="#93c5fd" />
          {/* Caja cerrada */}
          <rect x="2" y="6" width="50" height="27" rx="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
          <line x1="18" y1="6" x2="18" y2="33" stroke="#e2e8f0" strokeWidth="1" />
          <line x1="34" y1="6" x2="34" y2="33" stroke="#e2e8f0" strokeWidth="1" />
          {/* Ruedas */}
          <circle cx="16" cy="33" r="5" fill="#0f172a" />
          <circle cx="16" cy="33" r="2" fill="#e2e8f0" />
          <circle cx="40" cy="33" r="5" fill="#0f172a" />
          <circle cx="40" cy="33" r="2" fill="#e2e8f0" />
          <circle cx="70" cy="33" r="5" fill="#0f172a" />
          <circle cx="70" cy="33" r="2" fill="#e2e8f0" />
        </svg>
      </div>

      {/* Tarjeta de lema de confianza comprobable */}
      <div className="hidden 2xl:flex flex-col text-right max-w-[240px]">
        <p className="font-display text-[12px] font-bold text-slate-800 dark:text-slate-200 leading-snug">
          Traslado vehicular con conductores certificados,{" "}
          <span className="relative inline-block font-extrabold text-[#0066FF] dark:text-[#4d94ff]">
            evidencia y seguimiento
            <span className="absolute -bottom-0.5 left-0 right-0 h-[2px] bg-[#0066FF] dark:bg-[#4d94ff] rounded-full" />
          </span>
        </p>
      </div>
    </div>
  );
}

/* =========================================================================
   COMPONENTE PRINCIPAL: CUENTA DESKTOP
   ========================================================================= */

export function CuentaDesktop({ cuenta }: CuentaDesktopProps) {
  const {
    cerrarSesion,
    cerrandoSesion,
    errorSesion,
    nombreCompleto,
    primerNombre,
    inicialesUsuario,
    correo,
    telefono,
    esVerificado,
    totalIncidencias,
    totalTraslados,
    totalVehiculos,
    actividades,
    tipActual,
    siguienteTip,
    seguridadModalAbierto,
    setSeguridadModalAbierto,
    busqueda,
    setBusqueda,
    dropdownPerfilAbierto,
    setDropdownPerfilAbierto,
    tema,
    alternarTema,
  } = useCuentaUsuario(cuenta);

  return (
    <UserDashboardLayout
      usuario={cuenta.usuario}
      nombre={nombreCompleto}
      correo={correo}
      totalVehiculos={totalVehiculos}
      onCerrarSesion={cerrarSesion}
      padding="ninguno"
      idContenido="contenido-cuenta"
    >
      <div className="space-y-6 px-8 py-6">
        {/* Alerta de Error de Sesión si ocurre */}
        {errorSesion && (
          <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {errorSesion}
          </div>
        )}

          {/* -----------------------------------------------------------------
              HEADER DE SECCIÓN
              ----------------------------------------------------------------- */}
          <section
            aria-label="Encabezado de cuenta"
            className="flex items-center justify-between border-b border-slate-200/60 pb-5 dark:border-[#1a3a5c]"
          >
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-400">
                CUENTA
              </span>
              <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                ¡Hola, {primerNombre}! 👋
              </h1>
              <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                Aquí puedes gestionar tu información, seguridad y configuración.
              </p>
            </div>

            {/* Ilustración de Tránsito y Edificios */}
            <IlustracionCabeceraCuenta />
          </section>

          {/* -----------------------------------------------------------------
              BLOQUE DE RESUMEN DE PERFIL (Grid 2 columnas: 7 + 5)
              ----------------------------------------------------------------- */}
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
            {/* Tarjeta de Perfil (Izquierda, 7 cols) */}
            <section
              aria-label="Resumen de perfil"
              className="xl:col-span-7 flex flex-col justify-between rounded-3xl bg-[#0c2340] p-6 text-white shadow-md dark:bg-[#081a2e]"
            >
              <div>
                <div className="flex items-start justify-between gap-4">
                  {/* Avatar con iniciales o foto + estado */}
                  <div className="flex items-center gap-4">
                    <div className="relative shrink-0">
                      {cuenta.fotoPerfilUrl ? (
                        <Image
                          src={cuenta.fotoPerfilUrl}
                          alt={`Fotografía de ${nombreCompleto}`}
                          width={64}
                          height={64}
                          className="size-16 rounded-full border-2 border-white/20 object-cover"
                          unoptimized
                        />
                      ) : (
                        <span className="flex size-16 items-center justify-center rounded-full bg-[#1b3b64] font-display text-xl font-black text-white border-2 border-white/20 shadow-inner">
                          {inicialesUsuario}
                        </span>
                      )}
                      {/* Punto de estado en línea verde */}
                      <span
                        className="absolute bottom-0 right-0 size-4 rounded-full bg-[#22c55e] ring-2 ring-[#0c2340]"
                        aria-hidden="true"
                        title="Usuario activo"
                      />
                    </div>

                    {/* Datos del usuario */}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate font-display text-lg font-bold text-white">
                          {nombreCompleto}
                        </h2>
                        {esVerificado && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#eaf8f0] px-2.5 py-0.5 text-[11px] font-bold text-[#10b981]">
                            <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            Verificado
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs font-medium text-slate-300 mt-1">
                        {correo}
                      </p>
                      <p className="truncate text-xs font-medium text-slate-300">
                        {telefono}
                      </p>
                    </div>
                  </div>

                  {/* Botón Editar perfil */}
                  <Link
                    href="/cuenta/datos-personales"
                    className="shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/5 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-white/15 active:scale-[0.98]"
                  >
                    <IconoEditarLapiz className="size-3.5" />
                    Editar perfil
                  </Link>
                </div>
              </div>

              {/* Separador sutil */}
              <div className="my-4 border-t border-white/10" />

              {/* 3 Contadores Inferiores */}
              <dl className="grid grid-cols-3 divide-x divide-white/10 text-center">
                <div className="px-2">
                  <div className="flex items-center justify-center gap-1.5 text-white">
                    <IconoIncidencias className="size-4 text-slate-300" />
                    <dd className="font-display text-lg font-bold">{totalIncidencias}</dd>
                  </div>
                  <dt className="text-[11px] font-medium text-slate-300 mt-0.5">Incidencias</dt>
                </div>

                <div className="px-2">
                  <div className="flex items-center justify-center gap-1.5 text-white">
                    <IconoUbicacion className="size-4 text-slate-300" />
                    <dd className="font-display text-lg font-bold">{totalTraslados}</dd>
                  </div>
                  <dt className="text-[11px] font-medium text-slate-300 mt-0.5">Traslados</dt>
                </div>

                <div className="px-2">
                  <div className="flex items-center justify-center gap-1.5 text-white">
                    <IconoVehiculo className="size-4 text-slate-300" />
                    <dd className="font-display text-lg font-bold">{totalVehiculos}</dd>
                  </div>
                  <dt className="text-[11px] font-medium text-slate-300 mt-0.5">Vehículos</dt>
                </div>
              </dl>
            </section>

            {/* Tarjeta de Seguridad (Derecha, 5 cols) */}
            <section
              aria-label="Estado de seguridad"
              className="xl:col-span-5 relative flex items-center justify-between overflow-hidden rounded-3xl bg-gradient-to-br from-[#1d63d8] via-[#2563eb] to-[#1e40af] p-6 text-white shadow-md"
            >
              <div className="relative z-10 max-w-[240px]">
                <h2 className="font-display text-xl font-extrabold text-white tracking-tight leading-tight">
                  Tu cuenta está verificada
                </h2>
                <p className="mt-1.5 text-xs font-medium text-blue-100 leading-relaxed">
                  Disfruta de todos los beneficios de la plataforma
                </p>

                <button
                  type="button"
                  onClick={() => setSeguridadModalAbierto(true)}
                  className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold text-[#1d4ed8] shadow-sm transition hover:bg-blue-50 active:scale-[0.98] cursor-pointer"
                >
                  Ver consejos de seguridad
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="size-3.5" aria-hidden="true">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
              </div>

              {/* Gráfico 3D de escudo con palomita */}
              <Escudo3DIlustracion className="size-32 shrink-0 drop-shadow-2xl" />
            </section>
          </div>

          {/* -----------------------------------------------------------------
              ACCESOS RÁPIDOS (Grid 4 columnas)
              ----------------------------------------------------------------- */}
          <nav aria-label="Accesos rápidos de configuración" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Perfil */}
            <Link
              href="/cuenta/datos-personales"
              className="group flex items-center justify-between rounded-2xl border border-slate-200/90 bg-white p-4.5 shadow-xs transition hover:border-blue-300 hover:shadow-md dark:border-[#1a3a5c] dark:bg-[#0a2342] dark:hover:border-blue-500"
            >
              <div className="flex items-center gap-3.5">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#edf4fe] text-[#2563eb] dark:bg-[#0c2646] dark:text-[#4d94ff]">
                  <IconoPerfil className="size-5" />
                </span>
                <div>
                  <h3 className="font-display text-sm font-bold text-slate-900 group-hover:text-[#0066FF] dark:text-white dark:group-hover:text-[#4d94ff]">
                    Perfil
                  </h3>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Edita tu información personal
                  </p>
                </div>
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="size-4 text-slate-400 group-hover:translate-x-0.5 transition" aria-hidden="true">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </Link>

            {/* Soporte */}
            <Link
              href="/soporte"
              className="group flex items-center justify-between rounded-2xl border border-slate-200/90 bg-white p-4.5 shadow-xs transition hover:border-emerald-300 hover:shadow-md dark:border-[#1a3a5c] dark:bg-[#0a2342] dark:hover:border-emerald-500"
            >
              <div className="flex items-center gap-3.5">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#ecfdf5] text-[#10b981] dark:bg-[#09281e] dark:text-[#34d399]">
                  <IconoAudifonos className="size-5" />
                </span>
                <div>
                  <h3 className="font-display text-sm font-bold text-slate-900 group-hover:text-emerald-600 dark:text-white dark:group-hover:text-emerald-400">
                    Soporte
                  </h3>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Obtén ayuda y contáctanos
                  </p>
                </div>
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="size-4 text-slate-400 group-hover:translate-x-0.5 transition" aria-hidden="true">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </Link>

            {/* Legal y cuenta */}
            <Link
              href="/legal/terminos"
              className="group flex items-center justify-between rounded-2xl border border-slate-200/90 bg-white p-4.5 shadow-xs transition hover:border-orange-300 hover:shadow-md dark:border-[#1a3a5c] dark:bg-[#0a2342] dark:hover:border-orange-500"
            >
              <div className="flex items-center gap-3.5">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#fff7ed] text-[#f97316] dark:bg-[#331c0e] dark:text-[#fb923c]">
                  <IconoEscudoSeguridad className="size-5" />
                </span>
                <div>
                  <h3 className="font-display text-sm font-bold text-slate-900 group-hover:text-orange-600 dark:text-white dark:group-hover:text-orange-400">
                    Legal y cuenta
                  </h3>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Términos, privacidad y seguridad
                  </p>
                </div>
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="size-4 text-slate-400 group-hover:translate-x-0.5 transition" aria-hidden="true">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </Link>

            {/* Cerrar sesión (Acción Destructiva en Rojo) */}
            <button
              type="button"
              onClick={cerrarSesion}
              disabled={cerrandoSesion}
              aria-label={cerrandoSesion ? "Cerrando sesión…" : "Cerrar sesión"}
              className="group flex items-center justify-between rounded-2xl border border-red-200/90 bg-white p-4.5 shadow-xs transition hover:bg-red-50/50 hover:border-red-400 hover:shadow-md dark:border-red-900/40 dark:bg-[#0a2342] dark:hover:bg-red-950/20 cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#fef2f2] text-[#ef4444] dark:bg-[#331418] dark:text-[#f87171]">
                  <IconoCerrarSesion className="size-5" />
                </span>
                <div className="text-left">
                  <h3 className="font-display text-sm font-bold text-[#ef4444] dark:text-[#f87171]">
                    {cerrandoSesion ? "Cerrando…" : "Cerrar sesión"}
                  </h3>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Finaliza tu sesión de forma segura
                  </p>
                </div>
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="size-4 text-[#ef4444] dark:text-[#f87171] group-hover:translate-x-0.5 transition" aria-hidden="true">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </nav>

          {/* -----------------------------------------------------------------
              BLOQUE DE DETALLE: INFORMACIÓN PERSONAL & ACTIVIDAD RECIENTE (Grid 2 cols)
              ----------------------------------------------------------------- */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Información Personal (Izquierda) */}
            <section
              aria-label="Información personal"
              className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-[#1a3a5c] dark:bg-[#0a2342]"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                  Información personal
                </h3>
                <Link
                  href="/cuenta/datos-personales"
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#0066FF] hover:underline dark:text-[#4d94ff]"
                >
                  <IconoEditarLapiz className="size-3.5" />
                  Editar
                </Link>
              </div>

              {/* Lista de Datos Personales */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {/* Nombre Completo */}
                <div className="flex items-center justify-between py-3.5">
                  <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                    <IconoPerfil className="size-4 text-slate-400" />
                    <span className="text-xs font-semibold">Nombre completo</span>
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {nombreCompleto}
                  </span>
                </div>

                {/* Correo Electrónico */}
                <div className="flex items-center justify-between py-3.5">
                  <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                    <IconoMail className="size-4 text-slate-400" />
                    <span className="text-xs font-semibold">Correo electrónico</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {correo}
                    </span>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                      Verificado
                    </span>
                  </div>
                </div>

                {/* Teléfono */}
                <div className="flex items-center justify-between py-3.5">
                  <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                    <IconoTelefono className="size-4 text-slate-400" />
                    <span className="text-xs font-semibold">Teléfono</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {telefono}
                    </span>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                      Verificado
                    </span>
                  </div>
                </div>

                {/* País */}
                <div className="flex items-center justify-between py-3.5">
                  <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                    <IconoGlobo className="size-4 text-slate-400" />
                    <span className="text-xs font-semibold">País</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100">
                    <span role="img" aria-label="Bandera de México" className="text-sm">🇲🇽</span>
                    México
                  </div>
                </div>

                {/* Zona Horaria */}
                <div className="flex items-center justify-between py-3.5">
                  <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                    <IconoReloj className="size-4 text-slate-400" />
                    <span className="text-xs font-semibold">Zona horaria</span>
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    (UTC-06:00) Ciudad de México
                  </span>
                </div>
              </div>
            </section>

            {/* Actividad Reciente (Derecha) */}
            <section
              aria-label="Actividad reciente"
              className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-[#1a3a5c] dark:bg-[#0a2342]"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                  Actividad reciente
                </h3>
                <Link
                  href="/mis-viajes"
                  className="text-xs font-bold text-[#0066FF] hover:underline dark:text-[#4d94ff]"
                >
                  Ver todo
                </Link>
              </div>

              {/* Timeline Vertical */}
              <div className="relative mt-4 space-y-4">
                {/* Línea conectora de fondo */}
                <div
                  className="absolute left-4 top-3 bottom-3 w-[2px] bg-slate-100 dark:bg-slate-800"
                  aria-hidden="true"
                />

                {actividades.map((act) => (
                  <div key={act.id} className="relative flex items-center justify-between gap-3 pl-1">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Nodo con icono */}
                      <span
                        className={`relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-white dark:border-[#0a2342] ${
                          act.tipo === "traslado"
                            ? "bg-blue-50 text-[#0066FF] dark:bg-blue-950 dark:text-blue-400"
                            : act.tipo === "vehiculo"
                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {act.tipo === "traslado" ? (
                          <IconoTraslados className="size-4" />
                        ) : act.tipo === "vehiculo" ? (
                          <IconoVehiculo className="size-4" />
                        ) : (
                          <IconoPerfil className="size-4" />
                        )}
                      </span>

                      <div className="min-w-0">
                        {act.enlace ? (
                          <Link href={act.enlace} className="truncate text-xs font-bold text-slate-900 hover:text-[#0066FF] dark:text-slate-100 block">
                            {act.titulo}
                          </Link>
                        ) : (
                          <p className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">
                            {act.titulo}
                          </p>
                        )}
                        <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                          {act.fechaFormateada}
                        </p>
                      </div>
                    </div>

                    {/* Tag de estatus */}
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        act.estado === "En curso"
                          ? "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300"
                          : act.estado === "Completado"
                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : "bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-300"
                      }`}
                    >
                      {act.estado}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* -----------------------------------------------------------------
              FOOTER DE SECCIÓN: PANEL DE AYUDA & TIP DE LA SEMANA (Grid 2 cols: 7 + 5)
              ----------------------------------------------------------------- */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-1">
            {/* Panel de Ayuda (Izquierda, 7 cols) */}
            <section
              aria-label="Panel de ayuda y soporte"
              className="lg:col-span-7 flex flex-col sm:flex-row items-center gap-5 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-[#1a3a5c] dark:bg-[#0a2342]"
            >
              <AvatarOperadoraSoporte className="size-24" />

              <div className="flex-1 text-center sm:text-left">
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                  ¿Necesitas ayuda?
                </h3>
                <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                  Nuestro equipo está listo para apoyarte en todo momento.
                </p>

                <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                  <Link
                    href="/soporte"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#0c2340] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#15345d] active:scale-[0.98] dark:bg-[#0066FF] dark:hover:bg-[#0052cc]"
                  >
                    <IconoAudifonos className="size-4" />
                    Contactar soporte
                  </Link>

                  <Link
                    href="/preguntas-frecuentes"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 active:scale-[0.98] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-750"
                  >
                    <IconoLibro className="size-4" />
                    Centro de ayuda
                  </Link>
                </div>
              </div>
            </section>

            {/* Tip de la Semana (Derecha, 5 cols) */}
            <section
              aria-label="Consejo de la semana"
              className="lg:col-span-5 flex items-center justify-between gap-4 rounded-3xl border border-emerald-100 bg-[#f0fdf4] p-6 shadow-xs dark:border-emerald-900/40 dark:bg-[#062417]"
            >
              <div className="flex items-start gap-3.5">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/60 dark:text-emerald-300">
                  <IconoFoco className="size-5" />
                </span>
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                    Tip de la semana
                  </span>
                  <p className="mt-1 text-xs font-medium text-slate-700 dark:text-slate-200 leading-relaxed min-h-[38px]">
                    {tipActual}
                  </p>
                </div>
              </div>

              {/* Botón de paginación del carrusel */}
              <button
                type="button"
                onClick={siguienteTip}
                aria-label="Siguiente consejo de la semana"
                className="flex size-9 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-white text-emerald-600 shadow-2xs transition hover:bg-emerald-50 active:scale-95 dark:border-emerald-800 dark:bg-[#0c3322] dark:text-emerald-300 dark:hover:bg-[#10422c] cursor-pointer"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="size-4" aria-hidden="true">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </section>
          </div>
        </div>

      {/* ---------------------------------------------------------------------
          MODAL DE CONSEJOS DE SEGURIDAD
          --------------------------------------------------------------------- */}
      {seguridadModalAbierto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-modal-seguridad"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSeguridadModalAbierto(false);
          }}
        >
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-[#0a2342] border border-slate-200 dark:border-[#1a3a5c]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-[#0066FF] dark:bg-blue-950 dark:text-blue-400">
                  <IconoEscudoSeguridad className="size-5" />
                </span>
                <h3 id="titulo-modal-seguridad" className="font-display text-lg font-bold text-slate-900 dark:text-white">
                  Consejos de seguridad
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSeguridadModalAbierto(false)}
                aria-label="Cerrar modal de seguridad"
                className="flex size-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="size-4" aria-hidden="true">
                  <path d="M18 6 6 18 M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3.5 dark:bg-[#07192f]">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 font-bold text-[11px]">1</span>
                <p><strong>Conductores certificados:</strong> Todos nuestros traslados son operados por choferes con verificación de antecedentes y licencia vigente.</p>
              </div>
              <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3.5 dark:bg-[#07192f]">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 font-bold text-[11px]">2</span>
                <p><strong>Evidencia fotográfica:</strong> Antes de iniciar y al finalizar la entrega, se capturan fotografías del odómetro, nivel de combustible y estado exterior.</p>
              </div>
              <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3.5 dark:bg-[#07192f]">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 font-bold text-[11px]">3</span>
                <p><strong>Seguimiento satelital en vivo:</strong> Consulta en todo momento la posición geográfica de tu unidad desde el Pasaporte Digital.</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setSeguridadModalAbierto(false)}
                className="rounded-xl bg-[#0c2340] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#15345d] dark:bg-[#0066FF] dark:hover:bg-[#0052cc]"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </UserDashboardLayout>
  );
}
