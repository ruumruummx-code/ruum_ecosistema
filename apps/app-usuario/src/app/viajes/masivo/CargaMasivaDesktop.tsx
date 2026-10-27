"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCargaMasivaDesktop, type CargaRecienteItem } from "./useCargaMasivaDesktop";
import { UserDashboardLayout } from "../../../components/layout/UserDashboardLayout";

export interface CargaMasivaDesktopProps {
  nombreUsuario?: string | null;
}

/* =========================================================================
   ÍCONOS VECTORIALES PRECISOS
   ========================================================================= */

function IconoPin({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function IconoRayo({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function IconoEscudo({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function IconoEquipo({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconoReloj({ className = "size-5" }: { className?: string }) {
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

function IconoAudifonos({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" />
    </svg>
  );
}

/* =========================================================================
   ILUSTRACIÓN DROPZONE VECTORIAL (CARPETA + DOCUMENTO .XLSX + SUBIR)
   ========================================================================= */

function IlustracionDropzone({ className = "size-28" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`} aria-hidden="true">
      <svg viewBox="0 0 140 120" fill="none" className="w-full h-full drop-shadow-md">
        {/* Nube suave de fondo */}
        <ellipse cx="70" cy="55" rx="55" ry="35" fill="#f0f7ff" />

        {/* Carpeta trasera azul oscuro */}
        <path d="M25 45 L50 45 L60 55 L115 55 C118 55 120 57 120 60 L120 100 C120 103 118 105 115 105 L25 105 C22 105 20 103 20 100 L20 50 C20 47 22 45 25 45 Z" fill="#1d4ed8" />

        {/* Hoja de cálculo blanca .xlsx sobresaliendo */}
        <g transform="translate(38, 15)">
          {/* Cuerpo de la hoja */}
          <rect x="0" y="0" width="56" height="70" rx="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
          {/* Esquina doblada */}
          <path d="M42 0 L56 14 L42 14 Z" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />
          {/* Etiqueta .xlsx */}
          <text x="28" y="42" textAnchor="middle" fill="#0f172a" fontSize="13" fontWeight="900" fontFamily="sans-serif">
            .xlsx
          </text>
          {/* Líneas sutiles de cuadrícula */}
          <rect x="8" y="50" width="40" height="2" fill="#93c5fd" />
          <rect x="8" y="56" width="30" height="2" fill="#bfdbfe" />
        </g>

        {/* Solapa frontal de la carpeta */}
        <path d="M20 58 L120 58 L114 105 L26 105 Z" fill="#2563eb" />

        {/* Círculo azul vibrante con flecha arriba */}
        <circle cx="100" cy="85" r="18" fill="#0066FF" stroke="#ffffff" strokeWidth="3" />
        <path d="M100 93 L100 77 M94 83 L100 77 L106 83" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

/* =========================================================================
   COMPONENTE PRINCIPAL: CARGA MASIVA DESKTOP
   ========================================================================= */

export function CargaMasivaDesktop({ nombreUsuario }: CargaMasivaDesktopProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    estado,
    progreso,
    arrastrando,
    setArrastrando,
    toast,
    cerrarToast,
    validarYProcesarArchivo,
    cargasRecientes,
    menuAbiertoId,
    toggleMenu,
    guiaModalAbierto,
    setGuiaModalAbierto,
    modalDetalleData,
    abrirDetalle,
    cerrarDetalle,
    mostrarToast,
  } = useCargaMasivaDesktop();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setArrastrando(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setArrastrando(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setArrastrando(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void validarYProcesarArchivo(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void validarYProcesarArchivo(file);
    }
    e.target.value = "";
  };

  return (
    <UserDashboardLayout
      idContenido="contenido-carga-masiva"
      nombre={nombreUsuario}
      padding="compacto"
    >
      {/* Migas de pan: antes vivían en el header duplicado */}
      <nav aria-label="Migas de pan" className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1 text-slate-700 hover:text-[#0066FF] transition dark:text-slate-200 cursor-pointer"
        >
          <span>←</span>
          <span>Volver</span>
        </button>
        <span className="text-slate-300 dark:text-slate-600">|</span>
        <Link href="/mis-viajes" className="hover:text-[#0066FF] transition">
          Traslados
        </Link>
        <span className="text-slate-300 dark:text-slate-600">&gt;</span>
        <span className="text-slate-900 font-bold dark:text-white" aria-current="location">
          Carga Masiva
        </span>
      </nav>

          {/* -----------------------------------------------------------------
              HEADER DE SECCIÓN
              ----------------------------------------------------------------- */}
          <section
            aria-label="Encabezado de carga masiva"
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/60 pb-5 dark:border-[#1a3a5c]"
          >
            <div>
              <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Carga masiva de traslados
              </h1>
              <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                Cotiza y procesa múltiples traslados desde un archivo <strong className="font-bold text-slate-800 dark:text-slate-200">.xlsx</strong> de forma rápida y segura.
              </p>
            </div>

            {/* Botón Superior Derecho: Mis viajes */}
            <Link
              href="/mis-viajes"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-[#0066FF] shadow-2xs transition hover:bg-slate-50 active:scale-[0.98] dark:border-slate-700 dark:bg-[#0a2342] dark:text-[#4d94ff] self-start sm:self-center"
            >
              <IconoPin className="size-4" />
              <span>Mis viajes</span>
              <span aria-hidden="true">→</span>
            </Link>
          </section>

          {/* -----------------------------------------------------------------
              MÓDULO DE INTERACCIÓN PRINCIPAL (Grid 2 columnas: 7 + 5)
              ----------------------------------------------------------------- */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
            {/* Zona Dropzone (Izquierda, 7 cols) */}
            <section
              aria-label="Zona de arrastre de archivos"
              onDragOver={handleDragOver}
              onDragEnter={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`xl:col-span-7 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-8 text-center transition cursor-pointer select-none ${
                arrastrando
                  ? "border-[#0066FF] bg-blue-50/80 ring-4 ring-[#0066FF]/20 dark:bg-blue-950/40"
                  : "border-[#93c5fd] bg-[#f0f7ff]/40 hover:border-[#0066FF] hover:bg-[#f0f7ff]/80 dark:border-blue-900/60 dark:bg-[#0c2340]/30"
              }`}
            >
              {estado === "validando" ? (
                <div className="flex flex-col items-center justify-center py-6">
                  <div className="size-10 animate-spin rounded-full border-4 border-[#0066FF] border-t-transparent mb-3" />
                  <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                    Validando archivo... {progreso > 0 ? `${progreso}%` : ""}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Parseando datos y verificando información en segundo plano
                  </p>
                </div>
              ) : (
                <>
                  <IlustracionDropzone className="size-24 mb-2" />

                  <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                    Arrastra y suelta tu archivo aquí
                  </h2>

                  <button
                    type="button"
                    className="mt-1 text-xs font-semibold text-[#0066FF] hover:underline dark:text-[#4d94ff]"
                  >
                    o haz clic para seleccionar un archivo .xlsx
                  </button>

                  <p className="mt-2 text-xs font-medium text-slate-400 dark:text-slate-500">
                    Máximo 100 traslados · Hasta 5 MB
                  </p>

                  {/* Botón Seleccionar archivo */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#0066FF] px-6 py-2.5 font-display text-xs font-bold text-white shadow-md transition hover:bg-[#0052cc] active:scale-[0.98]"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4" aria-hidden="true">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                    Seleccionar archivo
                  </button>
                </>
              )}

              {/* Input nativo oculto */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                aria-label="Cargar archivo Excel .xlsx"
                className="sr-only"
                onChange={handleFileInputChange}
              />
            </section>

            {/* Panel Instructivo: ¿Cómo funciona? (Derecha, 5 cols) */}
            <section
              aria-label="Guía paso a paso de carga masiva"
              className="xl:col-span-5 flex flex-col justify-between rounded-3xl border border-emerald-100 bg-[#f0fdf4] p-6 shadow-xs dark:border-emerald-900/40 dark:bg-[#062417]"
            >
              <div>
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/60 dark:text-emerald-300">
                    <IconoFoco className="size-5" />
                  </span>
                  <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                    ¿Cómo funciona?
                  </h2>
                </div>

                {/* 4 Pasos numerados */}
                <ol className="mt-5 space-y-3.5">
                  <li className="flex items-center gap-3 text-xs font-semibold text-slate-700 dark:text-slate-200">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#10b981] text-[11px] font-bold text-white shadow-2xs">
                      1
                    </span>
                    <span>Descarga la plantilla oficial</span>
                  </li>

                  <li className="flex items-center gap-3 text-xs font-semibold text-slate-700 dark:text-slate-200">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#10b981] text-[11px] font-bold text-white shadow-2xs">
                      2
                    </span>
                    <span>Llena la información de tus traslados</span>
                  </li>

                  <li className="flex items-center gap-3 text-xs font-semibold text-slate-700 dark:text-slate-200">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#10b981] text-[11px] font-bold text-white shadow-2xs">
                      3
                    </span>
                    <span>Sube el archivo y nosotros lo procesamos</span>
                  </li>

                  <li className="flex items-center gap-3 text-xs font-semibold text-slate-700 dark:text-slate-200">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#10b981] text-[11px] font-bold text-white shadow-2xs">
                      4
                    </span>
                    <span>Consulta el resultado y cotiza en segundos</span>
                  </li>
                </ol>
              </div>

              {/* Botón de descarga y enlace de guía */}
              <div className="mt-6 flex flex-col gap-2.5">
                <a
                  href="/docs-legales/plantilla-carga-masiva.xlsx"
                  download="plantilla-carga-masiva.xlsx"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2.5 font-display text-xs font-bold text-[#0066FF] shadow-2xs transition hover:bg-blue-50/70 active:scale-[0.98] dark:border-slate-700 dark:bg-slate-800 dark:text-[#4d94ff]"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="size-4" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Descargar plantilla oficial (.xlsx)
                </a>

                <button
                  type="button"
                  onClick={() => setGuiaModalAbierto(true)}
                  className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-3.5" aria-hidden="true">
                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                    <path d="M6 6h10" />
                    <path d="M6 10h10" />
                  </svg>
                  Ver guía de uso
                </button>
              </div>
            </section>
          </div>

          {/* -----------------------------------------------------------------
              CINTA DE BENEFICIOS / VENTAJAS (4 Columnas)
              ----------------------------------------------------------------- */}
          <section
            aria-label="Ventajas de la carga masiva"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {/* Rápido */}
            <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-[#1a3a5c] dark:bg-[#0a2342]">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0066FF] dark:bg-blue-950 dark:text-blue-400">
                <IconoRayo className="size-5" />
              </span>
              <div>
                <h3 className="font-display text-xs font-bold text-slate-900 dark:text-white">
                  Rápido
                </h3>
                <p className="text-[11px] font-medium text-slate-400 dark:text-slate-400">
                  Procesa múltiples traslados en segundos
                </p>
              </div>
            </div>

            {/* Seguro */}
            <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-[#1a3a5c] dark:bg-[#0a2342]">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0066FF] dark:bg-blue-950 dark:text-blue-400">
                <IconoEscudo className="size-5" />
              </span>
              <div>
                <h3 className="font-display text-xs font-bold text-slate-900 dark:text-white">
                  Seguro
                </h3>
                <p className="text-[11px] font-medium text-slate-400 dark:text-slate-400">
                  Tus datos están protegidos
                </p>
              </div>
            </div>

            {/* Sin errores */}
            <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-[#1a3a5c] dark:bg-[#0a2342]">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0066FF] dark:bg-blue-950 dark:text-blue-400">
                <IconoEquipo className="size-5" />
              </span>
              <div>
                <h3 className="font-display text-xs font-bold text-slate-900 dark:text-white">
                  Sin errores
                </h3>
                <p className="text-[11px] font-medium text-slate-400 dark:text-slate-400">
                  Validaciones automáticas del archivo
                </p>
              </div>
            </div>

            {/* Más control */}
            <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-[#1a3a5c] dark:bg-[#0a2342]">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0066FF] dark:bg-blue-950 dark:text-blue-400">
                <IconoReloj className="size-5" />
              </span>
              <div>
                <h3 className="font-display text-xs font-bold text-slate-900 dark:text-white">
                  Más control
                </h3>
                <p className="text-[11px] font-medium text-slate-400 dark:text-slate-400">
                  Consulta el historial de tus cargas
                </p>
              </div>
            </div>
          </section>

          {/* -----------------------------------------------------------------
              TABLA DE CARGAS RECIENTES
              ----------------------------------------------------------------- */}
          <section
            aria-label="Cargas recientes procesadas"
            className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-[#1a3a5c] dark:bg-[#0a2342]"
          >
            {/* Cabecera de la tabla */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  <IconoReloj className="size-4" />
                </span>
                <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                  Cargas recientes
                </h2>
              </div>

              <Link
                href="/mis-viajes"
                className="text-xs font-bold text-[#0066FF] hover:underline dark:text-[#4d94ff]"
              >
                Ver todas &gt;
              </Link>
            </div>

            {/* Estructura de tabla */}
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 dark:border-slate-800 dark:text-slate-500">
                    <th scope="col" className="py-3 px-3">Fecha y hora</th>
                    <th scope="col" className="py-3 px-3">Archivo</th>
                    <th scope="col" className="py-3 px-3">Traslados</th>
                    <th scope="col" className="py-3 px-3">Estado</th>
                    <th scope="col" className="py-3 px-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs dark:divide-slate-800">
                  {cargasRecientes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                        No hay cargas recientes. Arrastra o selecciona un archivo .xlsx para comenzar.
                      </td>
                    </tr>
                  ) : (
                    cargasRecientes.map((carga) => (
                    <tr key={carga.id} className="hover:bg-slate-50/70 transition dark:hover:bg-slate-800/40">
                      {/* Fecha y hora */}
                      <td className="py-3.5 px-3 font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {carga.fechaHora}
                      </td>

                      {/* Archivo */}
                      <td className="py-3.5 px-3 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {carga.archivo}
                      </td>

                      {/* Traslados */}
                      <td className="py-3.5 px-3 font-semibold text-slate-700 dark:text-slate-300">
                        {carga.traslados}
                      </td>

                      {/* Estado */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {carga.estado === "Completado" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300">
                            <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            Completado
                          </span>
                        )}
                        {carga.estado === "En proceso" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-600 dark:bg-amber-950/60 dark:text-amber-300">
                            <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 15 14" />
                            </svg>
                            En proceso
                          </span>
                        )}
                        {carga.estado === "Con errores" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-bold text-red-600 dark:bg-red-950/60 dark:text-red-300">
                            <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                            Con errores
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap relative">
                        <div className="inline-flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => abrirDetalle(carga)}
                            className="font-bold text-[#0066FF] hover:underline dark:text-[#4d94ff] cursor-pointer"
                          >
                            {carga.accion}
                          </button>

                          {/* Menú de tres puntos verticales */}
                          <div className="relative inline-block text-left">
                            <button
                              type="button"
                              onClick={() => toggleMenu(carga.id)}
                              aria-label={`Opciones de carga ${carga.archivo}`}
                              aria-haspopup="menu"
                              className="flex size-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer"
                            >
                              <svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden="true">
                                <circle cx="12" cy="5" r="1.5" />
                                <circle cx="12" cy="12" r="1.5" />
                                <circle cx="12" cy="19" r="1.5" />
                              </svg>
                            </button>

                            {/* Dropdown contextual */}
                            {menuAbiertoId === carga.id && (
                              <div
                                role="menu"
                                className="absolute right-0 mt-1 w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-[#1a3a5c] dark:bg-[#0a2342] z-30"
                              >
                                <button
                                  type="button"
                                  role="menuitem"
                                  onClick={() => {
                                    toggleMenu(carga.id);
                                    mostrarToast(`Descargando reporte de ${carga.archivo}...`, "info");
                                  }}
                                  className="w-full text-left rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                                >
                                  Descargar reporte
                                </button>
                                <button
                                  type="button"
                                  role="menuitem"
                                  onClick={() => {
                                    toggleMenu(carga.id);
                                    router.push("/mis-viajes");
                                  }}
                                  className="w-full text-left rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                                >
                                  Ver traslados
                                </button>
                                <button
                                  type="button"
                                  role="menuitem"
                                  onClick={() => {
                                    toggleMenu(carga.id);
                                    mostrarToast("Resumen de carga copiado al portapapeles", "exito");
                                  }}
                                  className="w-full text-left rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                                >
                                  Copiar resumen
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>
          </section>

          {/* -----------------------------------------------------------------
              FOOTER DE SOPORTE
              ----------------------------------------------------------------- */}
          <footer
            aria-label="Ayuda de carga masiva"
            className="relative flex flex-col sm:flex-row items-center justify-between gap-4 rounded-3xl bg-[#eef5fc] p-6 dark:bg-[#0c2646] overflow-hidden"
          >
            {/* Trazado decorativo de mapa / carretera a la derecha */}
            <div className="absolute right-0 bottom-0 top-0 w-60 opacity-30 pointer-events-none select-none" aria-hidden="true">
              <svg viewBox="0 0 200 100" fill="none" className="w-full h-full">
                <path d="M0 80 Q60 20 120 70 T200 30" stroke="#0066FF" strokeWidth="4" strokeDasharray="6 6" />
                <circle cx="160" cy="45" r="10" fill="#93c5fd" />
                <circle cx="160" cy="45" r="4" fill="#0066FF" />
              </svg>
            </div>

            <div className="relative z-10 flex items-center gap-4 text-center sm:text-left">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#0c2340] text-white shadow-xs dark:bg-[#0066FF]">
                <IconoAudifonos className="size-6" />
              </span>
              <div>
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                  ¿Necesitas ayuda?
                </h3>
                <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-300">
                  Nuestro equipo está listo para ayudarte a procesar tus traslados.
                </p>
              </div>
            </div>

            <Link
              href="/soporte"
              className="relative z-10 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 font-display text-xs font-bold text-slate-800 shadow-xs transition hover:bg-slate-50 active:scale-[0.98] dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-750"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4" aria-hidden="true">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Contactar soporte
            </Link>
          </footer>
      {/* ---------------------------------------------------------------------
          TOAST FLOTANTE DE FEEDBACK / ERRORES
          --------------------------------------------------------------------- */}
      {toast && (
        <aside
          role={toast.tipo === "error" ? "alert" : "status"}
          aria-live="polite"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl px-5 py-3.5 text-xs font-bold shadow-2xl transition ${
            toast.tipo === "error"
              ? "bg-red-600 text-white"
              : toast.tipo === "exito"
              ? "bg-emerald-600 text-white"
              : "bg-[#0c2340] text-white"
          }`}
        >
          <span>{toast.mensaje}</span>
          <button
            type="button"
            onClick={cerrarToast}
            aria-label="Cerrar notificación"
            className="flex size-5 items-center justify-center rounded-full opacity-80 hover:opacity-100"
          >
            ✕
          </button>
        </aside>
      )}

      {/* ---------------------------------------------------------------------
          MODAL DE GUÍA DE USO DE PLANTILLA
          --------------------------------------------------------------------- */}
      {guiaModalAbierto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-guia-uso"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setGuiaModalAbierto(false);
          }}
        >
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-[#0a2342] border border-slate-200 dark:border-[#1a3a5c]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 id="titulo-guia-uso" className="font-display text-lg font-bold text-slate-900 dark:text-white">
                Guía de uso para la plantilla oficial
              </h3>
              <button
                type="button"
                onClick={() => setGuiaModalAbierto(false)}
                aria-label="Cerrar guía"
                className="flex size-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <p><strong>1. Formato estricto:</strong> Conserva los encabezados de la fila 1 sin renombrarlos.</p>
              <p><strong>2. Códigos postales:</strong> Asegúrate de capturar 5 dígitos exactos para origen y destino.</p>
              <p><strong>3. Teléfonos de contacto:</strong> Escribe números válidos a 10 dígitos para entrega y recepción.</p>
              <p><strong>4. Límite de carga:</strong> Puedes registrar hasta 100 traslados en un solo archivo .xlsx.</p>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setGuiaModalAbierto(false)}
                className="rounded-xl bg-[#0066FF] px-5 py-2 text-xs font-bold text-white transition hover:bg-[#0052cc]"
              >
                Cerrar guía
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------
          MODAL DE DETALLE / ERRORES DE CARGA RECIENTE
          --------------------------------------------------------------------- */}
      {modalDetalleData && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-detalle-carga"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) cerrarDetalle();
          }}
        >
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-[#0a2342] border border-slate-200 dark:border-[#1a3a5c]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 id="titulo-detalle-carga" className="font-display text-base font-bold text-slate-900 dark:text-white">
                {modalDetalleData.titulo}
              </h3>
              <button
                type="button"
                onClick={cerrarDetalle}
                aria-label="Cerrar modal de detalle"
                className="flex size-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <p><strong>Archivo:</strong> {modalDetalleData.item.archivo}</p>
              <p><strong>Fecha:</strong> {modalDetalleData.item.fechaHora}</p>
              <p><strong>Traslados:</strong> {modalDetalleData.item.traslados}</p>
              <p><strong>Estado:</strong> {modalDetalleData.item.estado}</p>
              {modalDetalleData.item.estado === "Con errores" && (
                <div className="rounded-xl bg-red-50 p-3 text-red-700 dark:bg-red-950/40 dark:text-red-300 mt-2">
                  <p className="font-bold">Incidencias encontradas en la plantilla:</p>
                  <ul className="list-disc pl-4 mt-1 space-y-0.5">
                    <li>Fila 12: Código postal de destino no encontrado.</li>
                    <li>Fila 27: Teléfono de recepción incompleto (9 dígitos).</li>
                  </ul>
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={cerrarDetalle}
                className="rounded-xl bg-[#0c2340] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#15345d] dark:bg-[#0066FF]"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </UserDashboardLayout>
  );
}
