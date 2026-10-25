"use client";
import { memo } from "react";
import Link from "next/link";
import { Button, Aviso } from "@ruum/ui";

import { PagoStripe, type PagoStripeProps } from "@/app/PagoStripe";
import type { DatosFormulario } from "../types";
import type { RutaEstimacion } from "@/state/app-state";
import styles from "./cotizador.module.css";

export interface PasoPagoProps {
  trasladoCreado: {
    id: string;
    tipoPago: "anticipado" | "al_cierre";
    precioCotizado: number | null;
  };
  pagoConfirmado: boolean;
  pagoEnProcesoConfirmacion?: boolean;
  verificandoPago: boolean;
  errorVerificacionPago: string | null;
  onPagoStripeConfirmado: () => void;
  onReintentarVerificacion: () => void;
  errorAceptacion: string | null;
  onReintentarAceptacion: () => void;
  aceptandoCotizacion: boolean;
  cotizacionAceptada: boolean;
  datos: DatosFormulario;
  rutaEstimacion: RutaEstimacion | null;
  formId?: string;
  onEstadoPago?: PagoStripeProps["onEstadoPago"];
}

function folioCorto(id: string): string {
  return `#RR-${id.slice(0, 4).toUpperCase()}`;
}

function nombreVehiculo(datos: DatosFormulario): string {
  return (
    [datos.marca, datos.modelo, datos.anio].filter(Boolean).join(" ") ||
    "Vehículo"
  );
}

function distanciaResumen(rutaEstimacion: RutaEstimacion | null): string {
  const km =
    rutaEstimacion && "distanciaKm" in rutaEstimacion
      ? rutaEstimacion.distanciaKm
      : undefined;
  const horas =
    rutaEstimacion && "tiempoEstimadoHoras" in rutaEstimacion
      ? rutaEstimacion.tiempoEstimadoHoras
      : undefined;
  if (km == null || horas == null) return "Por calcular";
  const minutosTotales = Math.round(Number(horas) * 60);
  const h = Math.floor(minutosTotales / 60);
  const m = minutosTotales % 60;
  const tiempo =
    h <= 0
      ? `${m} min`
      : m === 0
        ? `${h} h`
        : `${h}h ${String(m).padStart(2, "0")}m`;
  return `${Number(km).toLocaleString("es-MX", { maximumFractionDigits: 1 })} km · ${tiempo}`;
}

export const PasoPago = memo(function PasoPago({
  trasladoCreado,
  pagoConfirmado,
  pagoEnProcesoConfirmacion = false,
  verificandoPago,
  errorVerificacionPago,
  onPagoStripeConfirmado,
  onReintentarVerificacion,
  errorAceptacion,
  onReintentarAceptacion,
  aceptandoCotizacion,
  cotizacionAceptada,
  datos,
  rutaEstimacion,
  formId,
  onEstadoPago,
}: PasoPagoProps) {
  const folio = folioCorto(trasladoCreado.id);
  const precio = trasladoCreado.precioCotizado;

  // Éxito: SOLO con pago electrónico verificado en servidor. Sin esto no hay avance.
  if (pagoConfirmado) {
    return (
      <div
        className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 text-center py-6"
        role="status"
        aria-live="polite"
      >
        <span
          aria-hidden="true"
          className="flex size-16 shrink-0 items-center justify-center rounded-full bg-[#eaf8f0] text-[#10b981] shadow-sm"
        >
          <svg
            className="size-8"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
        <div className="space-y-1">
          <h2 className="text-2xl font-black tracking-tight text-[#0a2342] dark:text-[#f8fafc]">
            ¡Traslado solicitado!
          </h2>
          <p className="max-w-xs text-xs font-medium text-[var(--user-color-muted)]">
            Tu pago fue confirmado. Te notificaremos al asignar un conductor certificado.
          </p>
        </div>
        <p className="rounded-full bg-[#f1f5fa] px-4 py-1.5 text-xs font-extrabold text-[#0066FF] dark:bg-[#0f2d52] dark:text-[#60a5fa] border border-[#dbeafe]">
          {folio}
        </p>
        <div className="mt-2 grid w-full max-w-sm grid-cols-2 gap-3">
          <Link
            href={`/viajes/${trasladoCreado.id}`}
            className="flex min-h-12 items-center justify-center rounded-2xl bg-[#0066FF] px-4 text-sm font-bold text-white shadow-[0_4px_14px_rgba(0,102,255,0.3)] transition-transform active:scale-[0.98]"
          >
            Ver pasaporte
          </Link>
          <Link
            href="/mis-viajes"
            className="flex min-h-12 items-center justify-center rounded-2xl bg-[#f1f5fa] px-4 text-sm font-bold text-[#0a2342] transition-colors hover:bg-[#e2e8f0] dark:bg-[#0f2d52] dark:text-[#f8fafc]"
          >
            Ver mis traslados
          </Link>
        </div>
      </div>
    );
  }

  // Sin monto cobrable el flujo no debió llegar aquí (el Paso 1 bloquea sin
  // tarifa automática). Estado de error sin salida lateral: volver al inicio.
  if (precio == null || precio <= 0) {
    return (
      <div className="flex flex-col gap-4">
        <Aviso tono="danger">
          Esta solicitud no tiene un monto cobrable. Vuelve al inicio y solicita
          una cotización especial con soporte.
        </Aviso>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[18px] bg-[#f2f6fb] px-4 py-2 text-[14px] font-bold text-[#0b1e33]"
        >
          Volver al inicio
        </Link>
      </div>
    );
  }

  if (errorAceptacion) {
    return (
      <div className="flex flex-col gap-3">
        <Aviso tono="danger">{errorAceptacion}</Aviso>
        <Button variant="secondary" onClick={onReintentarAceptacion}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (aceptandoCotizacion || !cotizacionAceptada) {
    return (
      <p
        role="status"
        aria-live="polite"
        className="font-body text-sm text-ink/55"
      >
        Confirmando tarifa para iniciar el pago…
      </p>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {/* Resumen del vehículo */}
      <section aria-label="Resumen del traslado" className="shrink-0">
        <div className={styles.carSummaryCard}>
          <div className={styles.carThumb} aria-hidden="true">
            <svg viewBox="0 0 64 64" fill="none" className="size-10">
              <rect width="64" height="64" rx="16" fill="#e0edff" />
              <path
                d="M14 36l3.5-9.5c.6-1.6 2.1-2.5 3.8-2.5h21.4c1.7 0 3.2 1 3.8 2.5L50 36v13a2 2 0 01-2 2h-3a2 2 0 01-2-2v-2H21v2a2 2 0 01-2 2h-3a2 2 0 01-2-2V36z"
                fill="#0066FF"
              />
              <circle cx="21" cy="41" r="3" fill="#ffffff" />
              <circle cx="43" cy="41" r="3" fill="#ffffff" />
              <path d="M19 33l2-6h22l2 6H19z" fill="#93c5fd" />
            </svg>
          </div>
          <div className={styles.carInfo}>
            <h2 className={styles.carTitle}>{nombreVehiculo(datos)}</h2>
            <p className={styles.carSubtitle}>
              {datos.origenCiudad || "Origen"} → {datos.destinoCiudad || "Destino"}
            </p>
            <div className={styles.carMetrics}>
              <span className={styles.metricItem}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-3"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {distanciaResumen(rutaEstimacion)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs de métodos de pago */}
      <div
        className={styles.paymentMethodTabs}
        role="tablist"
        aria-label="Métodos de pago"
      >
        <button
          type="button"
          role="tab"
          aria-selected="true"
          className={`${styles.paymentTab} ${styles.paymentTabActive}`}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-4 text-[#0066FF]"
            aria-hidden="true"
          >
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
          </svg>
          <span>Tarjeta</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected="false"
          className={styles.paymentTab}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-4"
            aria-hidden="true"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span>OXXO</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected="false"
          className={styles.paymentTab}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-4"
            aria-hidden="true"
          >
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
            <line x1="12" y1="18" x2="12.01" y2="18" />
          </svg>
          <span>Google Pay</span>
        </button>
      </div>

      {/* Banner de Link / Stripe */}
      <div className={styles.linkBanner}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-3.5 shrink-0 text-[#16a34a]"
          aria-hidden="true"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <span>
          Proceso de compra seguro y rápido con{" "}
          <strong className={styles.linkPill}>link</strong>
        </span>
      </div>

      {verificandoPago && (
        <p role="status" className="shrink-0 text-sm font-semibold">
          Confirmando tu pago con Stripe… no cierres esta pantalla.
        </p>
      )}

      {/* Estado intermedio: pago en proceso de confirmación */}
      {pagoEnProcesoConfirmacion && (
        <div
          className="flex flex-col gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-left"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="flex size-7 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-xs font-bold text-amber-500"
            >
              ⏳
            </span>
            <h3 className="text-sm font-bold text-amber-600 dark:text-amber-400">
              Pago en proceso de confirmación
            </h3>
          </div>
          <p className="text-xs leading-relaxed text-[var(--user-color-muted)]">
            Tu pago fue recibido por Stripe y se está procesando en nuestro
            sistema. No necesitas realizar otro pago. Puedes verificar el estado
            manualmente en cualquier momento.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button
              variant="secondary"
              onClick={onReintentarVerificacion}
              disabled={verificandoPago}
              className="min-h-10 text-xs font-bold"
            >
              {verificandoPago ? "Verificando…" : "Verificar pago"}
            </Button>
            <Link
              href={`/viajes/${trasladoCreado.id}`}
              className="inline-flex min-h-10 items-center justify-center rounded-xl bg-[var(--user-color-surface-soft)] px-3 text-xs font-semibold text-[var(--user-color-text)] hover:opacity-90"
            >
              Ver pasaporte
            </Link>
          </div>
          {errorVerificacionPago && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400" role="alert">
              {errorVerificacionPago}
            </p>
          )}
        </div>
      )}

      {/* Si no está en estado intermedio pero ocurrió un error de verificación */}
      {!pagoEnProcesoConfirmacion && errorVerificacionPago && (
        <div className="shrink-0 text-xs" role="alert">
          <p>{errorVerificacionPago}</p>
          <button
            type="button"
            className="min-h-11 font-semibold"
            onClick={onReintentarVerificacion}
          >
            Verificar pago
          </button>
        </div>
      )}

      {/* Formulario Stripe */}
      <div
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
        hidden={verificandoPago || pagoEnProcesoConfirmacion}
      >
        <PagoStripe
          trasladoId={trasladoCreado.id}
          monto={precio}
          onPagado={onPagoStripeConfirmado}
          compacto
          formId={formId}
          onEstadoPago={onEstadoPago}
        />
        <div className={styles.stripeFooter}>
          <div className={styles.securitySeal}>
            <svg
              className={styles.sealIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>Cifrado por Stripe. No guardamos tu tarjeta.</span>
          </div>
          <div className={styles.cardBrands} aria-hidden="true">
            <span className={styles.brandBadge}>VISA</span>
            <span className={styles.brandBadge}>MC</span>
            <span className={styles.brandBadge}>AMEX</span>
          </div>
        </div>
      </div>
    </div>
  );
});
