"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCargaMasivaDesktop, type CargaRecienteItem } from "./useCargaMasivaDesktop";
import { UserDashboardLayout } from "../../../components/layout/UserDashboardLayout";
import { PagoStripe } from "@/app/PagoStripe";
import type { FilaMasiva } from "../nuevo/hooks/useCargaMasiva";

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
   ILUSTRACIÓN DROPZONE VECTORIAL
   ========================================================================= */

function IlustracionDropzone({ className = "size-28" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`} aria-hidden="true">
      <svg viewBox="0 0 140 120" fill="none" className="w-full h-full drop-shadow-md">
        <ellipse cx="70" cy="55" rx="55" ry="35" fill="#f0f7ff" />
        <path d="M25 45 L50 45 L60 55 L115 55 C118 55 120 57 120 60 L120 100 C120 103 118 105 115 105 L25 105 C22 105 20 103 20 100 L20 50 C20 47 22 45 25 45 Z" fill="#1d4ed8" />
        <g transform="translate(38, 15)">
          <rect x="0" y="0" width="56" height="70" rx="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
          <path d="M42 0 L56 14 L42 14 Z" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />
          <text x="28" y="42" textAnchor="middle" fill="#0f172a" fontSize="13" fontWeight="900" fontFamily="sans-serif">
            .xlsx
          </text>
          <rect x="8" y="50" width="40" height="2" fill="#93c5fd" />
          <rect x="8" y="56" width="30" height="2" fill="#bfdbfe" />
        </g>
        <path d="M20 58 L120 58 L114 105 L26 105 Z" fill="#2563eb" />
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
    error,
    filasVisibles,
    filasConError,
    filasCorrectas,
    todasListas,
    totalMXN,
    pagoConfirmado,
    cargaId,
    stripeClientSecret,
    nombreArchivo,
    arrastrando,
    setArrastrando,
    toast,
    cerrarToast,
    validarYProcesarArchivo,
    cargasRecientes,
    cargasPendientes,
    handleReanudarCarga,
    handleDescartarCarga,
    handleCancelarCarga,
    pago,
    setPago,
    conciliando,
    errorPago,
    verificarPago,
    geocodificarYCotizar,
    cotizarSoloValidas,
    eliminarFila,
    menuAbiertoId,
    toggleMenu,
    guiaModalAbierto,
    setGuiaModalAbierto,
    modalDetalleData,
    abrirDetalle,
    cerrarDetalle,
    handleDescargarReporte,
    handleCopiarResumen,
    filaEditando,
    iniciarEdicionFila,
    cancelarEdicionFila,
    guardarEdicionFila,
    filtroTab,
    setFiltroTab,
  } = useCargaMasivaDesktop();

  // Estado local para los campos mientras se edita una fila
  const [datosEdicion, setDatosEdicion] = useState<Record<string, string>>({});

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

  // Filtrado de filas en la tabla desktop
  const filasFiltradas = filasVisibles.filter((f) => {
    if (filtroTab === "validas") return f.estado === "correcto";
    if (filtroTab === "errores") return f.estado === "error" || Boolean(f.errorCotizacion);
    return true;
  });

  // Filas cotizadas en checkout
  const filasCotizadas = filasVisibles.filter((f) => !f.eliminada && f.tarifa != null);

  const totalFormateado = totalMXN.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <UserDashboardLayout
      idContenido="contenido-carga-masiva"
      nombre={nombreUsuario}
      padding="compacto"
    >
      {/* -----------------------------------------------------------------
          MIGAS DE PAN (BREADCRUMBS)
          ----------------------------------------------------------------- */}
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
          PANTALLA DE PAGO CONFIRMADO
          ----------------------------------------------------------------- */}
      {pagoConfirmado ? (
        <section
          aria-label="Confirmación de pago masivo"
          className="mx-auto my-12 flex max-w-2xl flex-col items-center justify-center rounded-3xl border border-emerald-200 bg-white p-10 text-center shadow-lg dark:border-emerald-900/50 dark:bg-[#0a2342]"
        >
          <span
            aria-hidden="true"
            className="flex size-20 items-center justify-center rounded-full bg-emerald-100 text-4xl font-black text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-300"
          >
            ✓
          </span>
          <h2 className="mt-5 font-display text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            ¡Carga masiva procesada y confirmada!
          </h2>
          <p className="mt-2 max-w-md text-sm text-slate-600 dark:text-slate-300">
            Tu pago consolidado de <strong>${totalFormateado} MXN</strong> fue acreditado exitosamente. Se han generado{" "}
            <strong>{filasCorrectas.length}</strong> traslados vinculados a tu cuenta y Pasaporte Digital.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/mis-viajes"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0066FF] px-6 py-3 font-display text-xs font-bold text-white shadow-md transition hover:bg-[#0052cc]"
            >
              <span>Ver mis traslados</span>
              <span aria-hidden="true">→</span>
            </Link>
            <button
              type="button"
              onClick={handleCancelarCarga}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              Realizar otra carga
            </button>
          </div>
        </section>
      ) : estado === "checkout" ? (
        /* -----------------------------------------------------------------
           ESTADO: CHECKOUT Y REVISIÓN DE TARIFAS CONSOLIDADA
           ----------------------------------------------------------------- */
        <section aria-label="Revisión y Checkout Masivo" className="space-y-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/60 pb-4 dark:border-[#1a3a5c]">
            <div>
              <h1 className="font-display text-2xl font-black text-slate-900 dark:text-white">
                Revisión consolidada y Checkout masivo
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Verifica las tarifas calculadas por cada traslado antes de proceder al pago seguro.
              </p>
            </div>
            <button
              type="button"
              disabled={pago.procesando || conciliando}
              onClick={handleCancelarCarga}
              className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:border-slate-700 dark:hover:bg-red-950/20"
            >
              Cancelar carga
            </button>
          </div>

          {/* Banner de pago parcial si hay filas con error que se conservaron como borrador */}
          {filasConError.length > 0 && (
            <aside
              role="status"
              aria-label="Aviso de pago parcial"
              className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50/90 p-4 text-xs text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200"
            >
              <span className="text-xl leading-none">ℹ️</span>
              <div>
                <p className="font-bold text-sm">Pago parcial de traslados válidos</p>
                <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
                  Estás procesando el pago de <strong>{filasCotizadas.length}</strong> traslados válidos. Los{" "}
                  <strong>{filasConError.length}</strong> traslados con incidencias quedan guardados como borrador en el servidor para que puedas corregirlos y pagarlos posteriormente sin perder tu avance.
                </p>
              </div>
            </aside>
          )}

          {errorPago && (
            <div role="alert" className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              <span>{errorPago}</span>
              <button
                type="button"
                onClick={() => void verificarPago()}
                disabled={conciliando}
                className="rounded-lg bg-red-600 px-3 py-1.5 font-bold text-white hover:bg-red-700 transition"
              >
                {conciliando ? "Consultando..." : "Consultar estado del pago"}
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            {/* Lista detallada de traslados cotizados (7 cols) */}
            <div className="xl:col-span-7 space-y-4">
              <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-[#1a3a5c] dark:bg-[#0a2342]">
                <h2 className="font-display text-sm font-bold text-slate-900 dark:text-white mb-3">
                  Resumen de traslados cotizados ({filasCotizadas.length})
                </h2>

                <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 pr-1">
                  {filasCotizadas.map((fila) => (
                    <div key={fila.indice} className="py-3 flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-900 dark:text-slate-100 truncate">
                          {fila.datos.marca} {fila.datos.modelo} {fila.datos.anio}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          CP {fila.datos.origenCodigoPostal} → CP {fila.datos.destinoCodigoPostal}
                          {fila.distanciaKm != null && ` · ${fila.distanciaKm.toFixed(1)} km`}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-3">
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300">
                          ✓ Cotizado
                        </span>
                        <p className="font-display font-extrabold text-sm text-[#0066FF] dark:text-[#4d94ff]">
                          ${fila.tarifa != null ? fila.tarifa.toFixed(2) : "0.00"} MXN
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tarjeta de desglose total */}
              <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-[#1a3a5c] dark:bg-[#0a2342] flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total consolidado a pagar</p>
                  <p className="text-[11px] text-slate-400">IVA y seguros de traslado incluidos</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-2xl font-black text-slate-900 dark:text-white">
                    ${totalFormateado} <span className="text-xs font-bold text-slate-500">MXN</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Panel de Checkout Stripe (5 cols) */}
            <div className="xl:col-span-5 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-[#1a3a5c] dark:bg-[#0a2342]">
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <h2 className="font-display text-sm font-bold text-slate-900 dark:text-white">
                  Pago seguro con Stripe
                </h2>
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <span>🔒 SSL 256-bit</span>
                </div>
              </div>

              {cargaId ? (
                <div className="space-y-4">
                  <PagoStripe
                    clientSecretExterno={stripeClientSecret ?? undefined}
                    returnPath="/mis-viajes?pago=masivo"
                    onEstadoPago={setPago}
                    trasladoId={cargaId}
                    monto={totalMXN}
                    onPagado={() => void verificarPago()}
                  />

                  <button
                    type="submit"
                    form={`pago-masivo-${cargaId}`}
                    disabled={!pago.listo || pago.procesando || conciliando}
                    className="w-full rounded-2xl bg-[#0066FF] py-3.5 font-display text-sm font-black text-white shadow-md transition hover:bg-[#0052cc] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {pago.procesando || conciliando
                      ? "Procesando pago seguro..."
                      : `Pagar $${totalFormateado} MXN`}
                  </button>

                  <p className="text-center text-[11px] text-slate-400">
                    Tu pago es verificado directamente con Stripe sin almacenar datos bancarios.
                  </p>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  Preparando sesión de pago...
                </div>
              )}
            </div>
          </div>
        </section>
      ) : estado === "geocodificando" || estado === "cotizando" ? (
        /* -----------------------------------------------------------------
           ESTADO: PROGRESO DE GEOCODIFICACIÓN Y COTIZACIÓN
           ----------------------------------------------------------------- */
        <section aria-label="Progreso de cotización" className="mx-auto my-16 max-w-xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-lg dark:border-[#1a3a5c] dark:bg-[#0a2342]">
          <div className="size-14 animate-spin rounded-full border-4 border-[#0066FF] border-t-transparent mx-auto mb-4" />
          <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
            {estado === "geocodificando"
              ? "Calculando rutas y distancias..."
              : "Cotizando tarifas en tiempo real..."}
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Optimizando pares de códigos postales con Mapbox para {filasCorrectas.length} traslados.
          </p>

          <div
            role="progressbar"
            aria-label="Progreso de cotización"
            aria-valuenow={progreso}
            aria-valuemin={0}
            aria-valuemax={100}
            className="mt-6 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
          >
            <div
              className="h-full rounded-full bg-[#0066FF] transition-all duration-300"
              style={{ width: `${Math.max(progreso, 25)}%` }}
            />
          </div>
        </section>
      ) : estado === "resultados" ? (
        /* -----------------------------------------------------------------
           ESTADO: TABLA DE VALIDACIÓN Y CORRECCIÓN DESKTOP
           ----------------------------------------------------------------- */
        <section aria-label="Validación y corrección de traslados" className="space-y-5">
          {/* Cabecera del archivo en validación */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/60 pb-4 dark:border-[#1a3a5c]">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl font-black text-slate-900 dark:text-white">
                  Validación de archivo
                </h1>
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-[#0066FF] dark:bg-blue-950 dark:text-blue-300">
                  {nombreArchivo || "lote_cargado.xlsx"} (Borrador local)
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Revisa los datos validados del archivo. Puedes corregir incidencias directamente en la tabla antes de cotizar.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCancelarCarga}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                Subir otro archivo
              </button>
            </div>
          </div>

          {/* Tarjetas de métricas de validación */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center dark:border-[#1a3a5c] dark:bg-[#0a2342]">
              <p className="font-display text-3xl font-black text-slate-900 dark:text-white">
                {filasVisibles.length}
              </p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                Total de traslados
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 text-center dark:border-emerald-900/50 dark:bg-emerald-950/20">
              <p className="font-display text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {filasCorrectas.length}
              </p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mt-0.5">
                Listos para cotizar
              </p>
            </div>
            <div className={`rounded-2xl border p-4 text-center ${
              filasConError.length > 0
                ? "border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20"
                : "border-slate-200 bg-white dark:border-[#1a3a5c] dark:bg-[#0a2342]"
            }`}>
              <p className={`font-display text-3xl font-black ${
                filasConError.length > 0 ? "text-red-600 dark:text-red-400" : "text-slate-400"
              }`}>
                {filasConError.length}
              </p>
              <p className={`text-[11px] font-bold uppercase tracking-wider mt-0.5 ${
                filasConError.length > 0 ? "text-red-600 dark:text-red-400" : "text-slate-400"
              }`}>
                Con incidencias
              </p>
            </div>
          </div>

          {/* Banner de Lote Parcial si hay mezcla de correctas y con error */}
          {filasCorrectas.length > 0 && filasConError.length > 0 && (
            <aside
              role="alert"
              aria-label="Aviso de lote parcial"
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200"
            >
              <div>
                <p className="font-bold text-sm">
                  {filasCorrectas.length} traslados listos para cotizar · {filasConError.length} fila(s) con incidencias
                </p>
                <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                  Puedes corregir las filas con error, o cotizar y pagar exclusivamente las válidas; las pendientes se conservarán en borrador.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void cotizarSoloValidas()}
                  className="rounded-xl bg-amber-600 px-4 py-2 font-bold text-white hover:bg-amber-700 transition"
                >
                  Cotizar {filasCorrectas.length} válidas
                </button>
                <button
                  type="button"
                  onClick={() => {
                    filasConError.forEach((f) => eliminarFila(f.indice));
                  }}
                  className="rounded-xl border border-amber-300 bg-white px-3 py-2 font-semibold text-amber-800 hover:bg-amber-100/50 dark:bg-slate-800 dark:text-amber-300 dark:border-amber-800"
                >
                  Omitir filas con error
                </button>
              </div>
            </aside>
          )}

          {error && (
            <div role="alert" className="rounded-2xl bg-red-50 p-4 text-xs font-bold text-red-600 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Filtros de tabla */}
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setFiltroTab("todas")}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                filtroTab === "todas"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
              }`}
            >
              Todas ({filasVisibles.length})
            </button>
            <button
              type="button"
              onClick={() => setFiltroTab("validas")}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                filtroTab === "validas"
                  ? "bg-emerald-600 text-white"
                  : "text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400"
              }`}
            >
              Válidas ({filasCorrectas.length})
            </button>
            <button
              type="button"
              onClick={() => setFiltroTab("errores")}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                filtroTab === "errores"
                  ? "bg-red-600 text-white"
                  : "text-red-600 hover:bg-red-50 dark:text-red-400"
              }`}
            >
              Con incidencias ({filasConError.length})
            </button>
          </div>

          {/* Tabla de corrección desktop */}
          <div className="overflow-x-auto rounded-3xl border border-slate-200/90 bg-white shadow-xs dark:border-[#1a3a5c] dark:bg-[#0a2342]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 dark:border-slate-800 dark:text-slate-500">
                  <th scope="col" className="py-3 px-3">#</th>
                  <th scope="col" className="py-3 px-3">Vehículo</th>
                  <th scope="col" className="py-3 px-3">Origen CP</th>
                  <th scope="col" className="py-3 px-3">Destino CP</th>
                  <th scope="col" className="py-3 px-3">Contacto Entrega</th>
                  <th scope="col" className="py-3 px-3">Contacto Recepción</th>
                  <th scope="col" className="py-3 px-3">Estado</th>
                  <th scope="col" className="py-3 px-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-xs text-slate-400">
                      No hay registros en esta vista.
                    </td>
                  </tr>
                ) : (
                  filasFiltradas.map((fila) => {
                    const estaEditando = filaEditando === fila.indice;
                    const tieneError = fila.estado === "error" || Boolean(fila.errorCotizacion);

                    return (
                      <tr
                        key={fila.indice}
                        className={`transition ${
                          tieneError
                            ? "bg-red-50/40 hover:bg-red-50/70 dark:bg-red-950/20"
                            : "hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                        }`}
                      >
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-400">
                          {fila.indice + 1}
                        </td>

                        {/* Vehículo */}
                        <td className="py-3 px-3">
                          {estaEditando ? (
                            <div className="space-y-1">
                              <input
                                type="text"
                                aria-label={`Marca fila ${fila.indice + 1}`}
                                defaultValue={fila.datos.marca}
                                onChange={(e) => setDatosEdicion((prev) => ({ ...prev, marca: e.target.value }))}
                                placeholder="Marca"
                                className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
                              />
                              <input
                                type="text"
                                aria-label={`Modelo fila ${fila.indice + 1}`}
                                defaultValue={fila.datos.modelo}
                                onChange={(e) => setDatosEdicion((prev) => ({ ...prev, modelo: e.target.value }))}
                                placeholder="Modelo"
                                className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
                              />
                            </div>
                          ) : (
                            <div>
                              <p className="font-bold text-slate-900 dark:text-slate-100">
                                {fila.datos.marca} {fila.datos.modelo}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                {fila.datos.anio} · {fila.datos.condicion}
                              </p>
                            </div>
                          )}
                        </td>

                        {/* Origen CP */}
                        <td className="py-3 px-3">
                          {estaEditando ? (
                            <input
                              type="text"
                              defaultValue={fila.datos.origenCodigoPostal}
                              onChange={(e) =>
                                setDatosEdicion((prev) => ({ ...prev, origenCodigoPostal: e.target.value }))
                              }
                              className="w-20 rounded-md border border-slate-300 px-2 py-1 text-xs font-mono"
                            />
                          ) : (
                            <div>
                              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                                {fila.datos.origenCodigoPostal}
                              </span>
                              {fila.errores?.origenCodigoPostal && (
                                <p className="text-[10px] text-red-600">{fila.errores.origenCodigoPostal}</p>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Destino CP */}
                        <td className="py-3 px-3">
                          {estaEditando ? (
                            <input
                              type="text"
                              defaultValue={fila.datos.destinoCodigoPostal}
                              onChange={(e) =>
                                setDatosEdicion((prev) => ({ ...prev, destinoCodigoPostal: e.target.value }))
                              }
                              className="w-20 rounded-md border border-slate-300 px-2 py-1 text-xs font-mono"
                            />
                          ) : (
                            <div>
                              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                                {fila.datos.destinoCodigoPostal}
                              </span>
                              {fila.errores?.destinoCodigoPostal && (
                                <p className="text-[10px] text-red-600">{fila.errores.destinoCodigoPostal}</p>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Contacto Entrega */}
                        <td className="py-3 px-3">
                          {estaEditando ? (
                            <input
                              type="text"
                              defaultValue={fila.datos.entregaTelefono}
                              onChange={(e) =>
                                setDatosEdicion((prev) => ({ ...prev, entregaTelefono: e.target.value }))
                              }
                              className="w-28 rounded-md border border-slate-300 px-2 py-1 text-xs"
                            />
                          ) : (
                            <div>
                              <p className="font-medium text-slate-700 dark:text-slate-300">{fila.datos.entregaNombre}</p>
                              <p className="text-[11px] text-slate-500">{fila.datos.entregaTelefono}</p>
                              {fila.errores?.entregaTelefono && (
                                <p className="text-[10px] text-red-600">{fila.errores.entregaTelefono}</p>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Contacto Recepción */}
                        <td className="py-3 px-3">
                          {estaEditando ? (
                            <input
                              type="text"
                              defaultValue={fila.datos.recepcionTelefono}
                              onChange={(e) =>
                                setDatosEdicion((prev) => ({ ...prev, recepcionTelefono: e.target.value }))
                              }
                              className="w-28 rounded-md border border-slate-300 px-2 py-1 text-xs"
                            />
                          ) : (
                            <div>
                              <p className="font-medium text-slate-700 dark:text-slate-300">{fila.datos.recepcionNombre}</p>
                              <p className="text-[11px] text-slate-500">{fila.datos.recepcionTelefono}</p>
                              {fila.errores?.recepcionTelefono && (
                                <p className="text-[10px] text-red-600">{fila.errores.recepcionTelefono}</p>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Estado */}
                        <td className="py-3 px-3">
                          {tieneError ? (
                            <div>
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-bold text-red-700 dark:bg-red-950 dark:text-red-300 whitespace-nowrap">
                                ✕ Con incidencia
                              </span>
                              {fila.errorCotizacion && (
                                <p className="mt-1 text-[10px] font-medium text-red-600 max-w-xs whitespace-normal dark:text-red-400">
                                  {fila.errorCotizacion}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 whitespace-nowrap">
                              ✓ Válido
                            </span>
                          )}
                        </td>

                        {/* Acciones */}
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          {estaEditando ? (
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                aria-label={`Guardar fila ${fila.indice + 1}`}
                                onClick={() => {
                                  Object.entries(datosEdicion).forEach(([campo, valor]) => {
                                    guardarEdicionFila(fila.indice, campo, valor);
                                  });
                                  cancelarEdicionFila();
                                  setDatosEdicion({});
                                }}
                                className="font-bold text-emerald-600 hover:underline"
                              >
                                Guardar
                              </button>
                              <button
                                type="button"
                                aria-label={`Cancelar edición fila ${fila.indice + 1}`}
                                onClick={() => {
                                  cancelarEdicionFila();
                                  setDatosEdicion({});
                                }}
                                className="text-slate-500 hover:underline"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-3">
                              <button
                                type="button"
                                aria-label={`Editar fila ${fila.indice + 1}`}
                                onClick={() => {
                                  iniciarEdicionFila(fila.indice);
                                  setDatosEdicion({});
                                }}
                                className="font-semibold text-[#0066FF] hover:underline dark:text-[#4d94ff]"
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                aria-label={`Eliminar fila ${fila.indice + 1}`}
                                onClick={() => eliminarFila(fila.indice)}
                                className="font-semibold text-red-600 hover:underline dark:text-red-400"
                              >
                                Eliminar
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Barra de acción inferior */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-[#1a3a5c] dark:bg-[#0a2342]">
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {todasListas
                  ? "Todas las filas son válidas. Puedes cotizar el lote completo."
                  : `${filasConError.length} fila(s) tienen errores pendientes de corrección.`}
              </p>
              <p className="text-[11px] text-slate-500">
                El cálculo consultará rutas y tarifas en tiempo real usando el cálculo normativo institucional.
              </p>
            </div>

            <div className="flex gap-3">
              {filasConError.length > 0 && filasCorrectas.length > 0 && (
                <button
                  type="button"
                  onClick={() => void cotizarSoloValidas()}
                  className="rounded-xl border border-amber-500 bg-amber-50 px-5 py-2.5 font-display text-xs font-bold text-amber-900 transition hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-200"
                >
                  Cotizar {filasCorrectas.length} válidas
                </button>
              )}

              <button
                type="button"
                disabled={!todasListas}
                onClick={() => void geocodificarYCotizar()}
                className={`rounded-xl px-6 py-2.5 font-display text-xs font-bold transition shadow-md ${
                  todasListas
                    ? "bg-[#0066FF] text-white hover:bg-[#0052cc]"
                    : "cursor-not-allowed bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600"
                }`}
              >
                {todasListas
                  ? `Cotizar lote completo (${filasCorrectas.length} traslados)`
                  : "Corrige los errores para cotizar todo"}
              </button>
            </div>
          </div>
        </section>
      ) : (
        /* -----------------------------------------------------------------
           ESTADO: IDLE (PANTALLA DE CARGA INICIAL)
           ----------------------------------------------------------------- */
        <>
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
              SECCIÓN: CARGAS PENDIENTES EN EL SERVIDOR
              ----------------------------------------------------------------- */}
          {cargasPendientes.length > 0 && (
            <section
              aria-label="Cargas pendientes de pago"
              className="rounded-3xl border-2 border-[#0066FF] bg-blue-50/70 p-5 shadow-xs dark:border-blue-800 dark:bg-blue-950/30"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl" aria-hidden="true">⏱️</span>
                <h2 className="font-display text-sm font-extrabold uppercase tracking-wider text-[#0066FF] dark:text-[#4d94ff]">
                  Cargas pendientes de pago ({cargasPendientes.length})
                </h2>
              </div>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                Tienes cotizaciones previas guardadas en el servidor. Puedes reanudarlas para completar su pago o descartarlas.
              </p>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {cargasPendientes.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-2xl border border-blue-200/80 bg-white p-4 shadow-xs dark:border-blue-900/60 dark:bg-[#0c2340]"
                  >
                    <div>
                      <p className="font-display font-extrabold text-sm text-slate-900 dark:text-white">
                        ${p.totalMXN.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {p.cantidad_traslados} traslado{p.cantidad_traslados !== 1 ? "s" : ""}
                        {p.creado_en ? ` · ${new Date(p.creado_en).toLocaleDateString("es-MX")}` : ""}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void handleReanudarCarga(p.id)}
                        className="rounded-xl bg-[#0066FF] px-3.5 py-2 text-xs font-bold text-white transition hover:bg-[#0052cc]"
                      >
                        Reanudar carga
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDescartarCarga(p.id)}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:border-slate-700 dark:hover:bg-red-950/20"
                      >
                        Descartar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

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
            <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-[#1a3a5c] dark:bg-[#0a2342]">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0066FF] dark:bg-blue-950 dark:text-blue-400">
                <IconoRayo className="size-5" />
              </span>
              <div>
                <h3 className="font-display text-xs font-bold text-slate-900 dark:text-white">Rápido</h3>
                <p className="text-[11px] font-medium text-slate-400">Procesa múltiples traslados en segundos</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-[#1a3a5c] dark:bg-[#0a2342]">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0066FF] dark:bg-blue-950 dark:text-blue-400">
                <IconoEscudo className="size-5" />
              </span>
              <div>
                <h3 className="font-display text-xs font-bold text-slate-900 dark:text-white">Seguro</h3>
                <p className="text-[11px] font-medium text-slate-400">Tus datos están protegidos</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-[#1a3a5c] dark:bg-[#0a2342]">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0066FF] dark:bg-blue-950 dark:text-blue-400">
                <IconoEquipo className="size-5" />
              </span>
              <div>
                <h3 className="font-display text-xs font-bold text-slate-900 dark:text-white">Sin errores</h3>
                <p className="text-[11px] font-medium text-slate-400">Validaciones automáticas del archivo</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-[#1a3a5c] dark:bg-[#0a2342]">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0066FF] dark:bg-blue-950 dark:text-blue-400">
                <IconoReloj className="size-5" />
              </span>
              <div>
                <h3 className="font-display text-xs font-bold text-slate-900 dark:text-white">Más control</h3>
                <p className="text-[11px] font-medium text-slate-400">Consulta el historial de tus cargas</p>
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
                        <td className="py-3.5 px-3 font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {carga.fechaHora}
                        </td>
                        <td className="py-3.5 px-3 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                          {carga.archivo}
                        </td>
                        <td className="py-3.5 px-3 font-semibold text-slate-700 dark:text-slate-300">
                          {carga.traslados}
                        </td>
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
                        <td className="py-3.5 px-3 text-right whitespace-nowrap relative">
                          <div className="inline-flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => abrirDetalle(carga)}
                              className="font-bold text-[#0066FF] hover:underline dark:text-[#4d94ff] cursor-pointer"
                            >
                              {carga.accion}
                            </button>

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

                              {menuAbiertoId === carga.id && (
                                <div
                                  role="menu"
                                  className="absolute right-0 mt-1 w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-[#1a3a5c] dark:bg-[#0a2342] z-30"
                                >
                                  <button
                                    type="button"
                                    role="menuitem"
                                    onClick={() => handleDescargarReporte(carga)}
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
                                    onClick={() => void handleCopiarResumen(carga)}
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
                    ))
                  )}
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
        </>
      )}

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
              {modalDetalleData.item.totalMXN != null && (
                <p><strong>Monto total:</strong> ${modalDetalleData.item.totalMXN.toFixed(2)} MXN</p>
              )}
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
