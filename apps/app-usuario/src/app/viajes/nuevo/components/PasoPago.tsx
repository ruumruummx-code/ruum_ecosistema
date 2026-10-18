"use client";
import { memo } from "react";
import Link from "next/link";
import { Button, Aviso, Icono } from "@ruum/ui";

import { PagoStripe, type PagoStripeProps } from "@/app/PagoStripe";
import type { DatosFormulario } from "../types";
import type { RutaEstimacion } from "@/state/app-state";

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
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 text-center" role="status" aria-live="polite">
        <span aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#e9f3ee] text-[#1f6b4a]"><Icono d="m5 12.5 4.5 4.5L19 7.5" className="size-6"/></span>
        <h2 className="text-xl font-extrabold">¡Traslado solicitado!</h2>
        <p className="max-w-xs text-[13px] text-[var(--user-color-muted)]">Tu pago fue confirmado. Te notificaremos al asignar un conductor certificado.</p>
        <p className="rounded-full bg-[var(--user-color-surface-soft)] px-4 py-1 text-xs font-bold">{folio}</p>
        <div className="grid w-full max-w-sm grid-cols-2 gap-2">
          <Link href={`/viajes/${trasladoCreado.id}`} className="flex min-h-12 items-center justify-center rounded-xl bg-[var(--user-color-action)] px-3 text-sm font-bold text-[var(--user-color-on-action)]">Ver pasaporte</Link>
          <Link href="/mis-viajes" className="flex min-h-12 items-center justify-center rounded-xl bg-[var(--user-color-surface-soft)] px-3 text-sm font-bold">Ver mis traslados</Link>
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
      <section aria-label="Resumen del traslado" className="shrink-0">
        <h2 className="truncate text-sm font-bold">{nombreVehiculo(datos)}</h2>
        <p className="truncate text-xs text-[var(--user-color-muted)]">
          {datos.origenCiudad || "Origen"} → {datos.destinoCiudad || "Destino"}{" "}
          · {distanciaResumen(rutaEstimacion)}
        </p>
      </section>
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

      {/* Oculta el formulario de Stripe durante verificación o estado intermedio para evitar reintentos duplicados */}
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
      </div>
    </div>
  );
});
