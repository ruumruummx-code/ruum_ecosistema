"use client";
import { memo } from "react";
import Link from "next/link";
import { Button, Aviso, Icono } from "@ruum/ui";
import { formatearPrecio } from "@ruum/shared/utils";
import { PagoStripe } from "@/app/PagoStripe";
import type { DatosFormulario } from "../types";
import type { RutaEstimacion } from "@/state/app-state";

export interface PasoPagoProps {
  trasladoCreado: {
    id: string;
    tipoPago: "anticipado" | "al_cierre";
    precioCotizado: number | null;
  };
  pagoConfirmado: boolean;
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
}

function folioCorto(id: string): string {
  return `#RR-${id.slice(0, 4).toUpperCase()}`;
}

function nombreVehiculo(datos: DatosFormulario): string {
  return [datos.marca, datos.modelo, datos.anio].filter(Boolean).join(" ") || "Vehículo";
}

function fechaResumen(datos: DatosFormulario): string {
  if (datos.modalidadProgramacion === "programado" && datos.fechaHoraProgramada) {
    try {
      const fecha = new Date(datos.fechaHoraProgramada);
      if (!Number.isNaN(fecha.getTime())) {
        return new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(fecha);
      }
    } catch {
      // cae al valor por defecto
    }
  }
  return "Lo antes posible";
}

function distanciaResumen(rutaEstimacion: RutaEstimacion | null): string {
  const km = rutaEstimacion && "distanciaKm" in rutaEstimacion ? rutaEstimacion.distanciaKm : undefined;
  const horas = rutaEstimacion && "tiempoEstimadoHoras" in rutaEstimacion ? rutaEstimacion.tiempoEstimadoHoras : undefined;
  if (km == null || horas == null) return "Por calcular";
  const minutosTotales = Math.round(Number(horas) * 60);
  const h = Math.floor(minutosTotales / 60);
  const m = minutosTotales % 60;
  const tiempo = h <= 0 ? `${m} min` : m === 0 ? `${h} h` : `${h}h ${String(m).padStart(2, "0")}m`;
  return `${Number(km).toLocaleString("es-MX", { maximumFractionDigits: 1 })} km · ${tiempo}`;
}

export const PasoPago = memo(function PasoPago({
  trasladoCreado,
  pagoConfirmado,
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
}: PasoPagoProps) {
  const folio = folioCorto(trasladoCreado.id);
  const precio = trasladoCreado.precioCotizado;

  // Éxito: SOLO con pago electrónico verificado en servidor. Sin esto no hay avance.
  if (pagoConfirmado) {
    return (
      <div className="flex flex-col items-center py-10 text-center" role="status" aria-live="polite">
        <span aria-hidden="true" className="mb-6 flex size-24 items-center justify-center rounded-full bg-[#e9f3ee] text-[44px] text-[#1f6b4a] shadow-[0_0_0_12px_rgba(31,107,74,0.06)]">
          <Icono d="m5 12.5 4.5 4.5L19 7.5" className="size-11" />
        </span>
        <h2 className="text-[24px] font-extrabold tracking-tight text-[#0b1e33]">¡Traslado solicitado!</h2>
        <p className="mt-2.5 max-w-[300px] text-[14px] font-medium leading-relaxed text-[#6b7c94]">
          Tu pago fue confirmado y estamos asignando un conductor certificado. Recibirás una notificación cuando esté en camino.
        </p>
        <p className="mb-8 mt-2 rounded-[20px] bg-[#f0f5fe] px-[18px] py-2 text-[13px] font-bold text-[#2e5a88]">
          {folio}
        </p>
        <div className="flex w-full max-w-[300px] flex-col gap-2.5">
          <Link
            href={`/viajes/${trasladoCreado.id}`}
            className="inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-[18px] bg-[#0b1e33] px-[22px] text-[16px] font-bold text-[#fff] shadow-[0_14px_28px_-10px_rgba(11,30,51,0.4)]"
          >
            Ver pasaporte
          </Link>
          <Link
            href="/mis-viajes"
            className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-[18px] bg-[#f2f6fb] px-[22px] text-[16px] font-bold text-[#0b1e33]"
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
          Esta solicitud no tiene un monto cobrable. Vuelve al inicio y solicita una cotización especial con soporte.
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
      <p role="status" aria-live="polite" className="font-body text-sm text-ink/55">Confirmando tarifa para iniciar el pago…</p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Resumen del traslado */}
      <section aria-label="Resumen del traslado" className="rounded-[22px] border border-[#eef2f7] bg-white p-5 shadow-[0_6px_16px_rgba(0,0,0,0.02)]">
        <h2 className="mb-4 flex items-center gap-2.5 text-[14.5px] font-bold text-[#0b1e33]">
          <span aria-hidden="true" className="flex size-[30px] items-center justify-center rounded-[10px] bg-[#f0f5fe] text-[#2e5a88]">
            <Icono d="M8 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M9 5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V5Z" className="size-[13px]" />
          </span>
          Resumen del traslado
        </h2>
        <dl>
          {[
            { etiqueta: "Vehículo", valor: nombreVehiculo(datos) },
            { etiqueta: "Ruta", valor: `${datos.origenCiudad || "Origen"} → ${datos.destinoCiudad || "Destino"}` },
            { etiqueta: "Fecha", valor: fechaResumen(datos) },
            { etiqueta: "Distancia", valor: distanciaResumen(rutaEstimacion) },
          ].map(({ etiqueta, valor }) => (
            <div key={etiqueta} className="flex items-start justify-between gap-4 border-b border-[#f0f4fa] py-3 text-[14px] last:border-b-0 last:pb-0 first:pt-0">
              <dt className="shrink-0 font-medium text-[#6f7e94]">{etiqueta}</dt>
              <dd className="text-right font-semibold text-[#1a293b]">{valor}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Total a pagar */}
      <section
        aria-label={`Total a pagar: ${formatearPrecio(Number(precio))}`}
        className="relative overflow-hidden rounded-3xl p-6 text-[#fff] shadow-[0_16px_32px_-12px_rgba(11,30,51,0.4)]"
        style={{ background: "linear-gradient(135deg, #0b1e33 0%, #162c47 100%)" }}
      >
        <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.6px] text-[rgba(255,255,255,0.7)]">
          Total a pagar
        </p>
        <p className="mb-1.5 text-[38px] font-extrabold tracking-tight">
          {formatearPrecio(Number(precio))}
        </p>
        <p className="flex items-center gap-1.5 text-[13px] font-medium text-[rgba(255,255,255,0.65)]">
          <Icono nombre="candado" className="size-[13px]" />
          Pago seguro con Stripe
        </p>
      </section>

      {/* Verificación en curso / error de verificación */}
      {verificandoPago ? (
        <div role="status" aria-live="polite" className="flex items-center gap-3 rounded-2xl border border-[#dfe8f3] bg-[#f0f5fe] p-4">
          <span aria-hidden="true" className="size-6 shrink-0 animate-spin rounded-full border-[3px] border-[#d5e2f0] border-t-[#0b1e33]" />
          <p className="text-[13.5px] font-semibold text-[#1a293b]">
            Confirmando tu pago con Stripe… no cierres esta pantalla.
          </p>
        </div>
      ) : (
        <>
          {errorVerificacionPago && (
            <div className="flex flex-col gap-3">
              <Aviso tono="danger">{errorVerificacionPago}</Aviso>
              <Button variant="secondary" onClick={onReintentarVerificacion}>
                Verificar pago
              </Button>
            </div>
          )}
          <Aviso tono="info">
            Completa el pago seguro con Stripe para confirmar tu solicitud de traslado.
          </Aviso>
          <PagoStripe
            trasladoId={trasladoCreado.id}
            monto={precio}
            onPagado={onPagoStripeConfirmado}
          />
        </>
      )}

      <div className="flex items-start gap-3 rounded-2xl border border-[#dfe8f3] bg-[#f0f5fe] p-3.5">
        <span aria-hidden="true" className="mt-0.5 shrink-0 text-[#2e5a88]">
          <Icono d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z M9 12l2 2 4-4" className="size-4" />
        </span>
        <p className="text-[12.5px] font-medium leading-relaxed text-[#3d5470]">
          Tu información de pago está cifrada. Ruum Ruum no almacena los datos de tu tarjeta. El traslado solo se considera solicitado con el pago electrónico confirmado; si sales sin pagar, la solicitud se cancela automáticamente.
        </p>
      </div>
    </div>
  );
});
