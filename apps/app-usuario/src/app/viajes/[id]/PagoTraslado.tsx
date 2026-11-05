"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@ruum/ui";
import { formatearPrecio } from "@ruum/shared/utils";
import { PagoStripe } from "../../PagoStripe";
import { useTrasladoRealtime } from "@/state/AppStateProvider";

export interface PagoTrasladoProps {
  trasladoId: string;
  monto: number;
}

export type EstadoResolucionPagoUI =
  | "esperando_pago"
  | "verificando_confirmacion"
  | "confirmado"
  | "conciliacion_pendiente"
  | "error";

export function PagoTraslado({ trasladoId, monto }: PagoTrasladoProps) {
  const router = useRouter();
  const { pagoConfirmado: pagadoRealtime, actualizar } = useTrasladoRealtime(trasladoId);
  const [estadoResolucion, setEstadoResolucion] = useState<EstadoResolucionPagoUI>(
    pagadoRealtime ? "confirmado" : "esperando_pago"
  );
  const [intentosRealizados, setIntentosRealizados] = useState(0);
  const activoRef = useRef(true);

  useEffect(() => {
    activoRef.current = true;
    return () => {
      activoRef.current = false;
    };
  }, []);

  // Polling con backoff exponencial para resolución de webhook demorado (CB-1 / CA-1, CA-2)
  const consultarEstadoPago = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch(`/api/viajes/${encodeURIComponent(trasladoId)}/estado-pago`, {
        cache: "no-store",
      });
      if (!res.ok) return false;
      const data = await res.json();
      return data.pagado === true;
    } catch {
      return false;
    }
  }, [trasladoId]);

  const iniciarVerificacionDurable = useCallback(async () => {
    setEstadoResolucion("verificando_confirmacion");
    setIntentosRealizados(0);

    // Tiempos de reintento: 1.5s, 3s, 5s, 8s (cubre hasta ~18s de latencia de webhook)
    const intervalosMs = [1500, 3000, 5000, 8000];

    for (let i = 0; i < intervalosMs.length; i++) {
      if (!activoRef.current) return;
      await new Promise((r) => setTimeout(r, intervalosMs[i]));
      if (!activoRef.current) return;

      setIntentosRealizados(i + 1);
      const confirmado = await consultarEstadoPago();

      if (confirmado) {
        if (!activoRef.current) return;
        setEstadoResolucion("confirmado");
        actualizar({ pagoConfirmado: true, pagoEnProcesoConfirmacion: false });
        router.refresh();
        return;
      }
    }

    // CA-2 / CA-3: Si el webhook demora más allá de los reintentos, NO volvemos a "Pago pendiente".
    // Mostramos estado intermedio honesto declarando dependencia del reconciliador durable.
    if (activoRef.current) {
      setEstadoResolucion("conciliacion_pendiente");
      actualizar({ pagoEnProcesoConfirmacion: true });
    }
  }, [consultarEstadoPago, actualizar, router]);

  // Si se confirma en Realtime mientras se espera, actualizar de inmediato
  useEffect(() => {
    if (pagadoRealtime && estadoResolucion !== "confirmado") {
      setEstadoResolucion("confirmado");
    }
  }, [pagadoRealtime, estadoResolucion]);

  // Polling pasivo mientras permanece en estado honesto de conciliación pendiente (CB-1)
  // Si el reconciliador o webhook resuelve después de los 18s, la vista actualiza sola sin acción del usuario
  useEffect(() => {
    if (estadoResolucion !== "conciliacion_pendiente") return;
    const intervalo = setInterval(async () => {
      const confirmado = await consultarEstadoPago();
      if (confirmado && activoRef.current) {
        setEstadoResolucion("confirmado");
        actualizar({ pagoConfirmado: true, pagoEnProcesoConfirmacion: false });
        router.refresh();
      }
    }, 10000);
    return () => clearInterval(intervalo);
  }, [estadoResolucion, consultarEstadoPago, actualizar, router]);

  const handlePagoStripeCompletado = useCallback(() => {
    // Señalizar en realtime e iniciar verificación basada en sistema
    actualizar({ pagoConfirmado: true });
    iniciarVerificacionDurable();
  }, [actualizar, iniciarVerificacionDurable]);

  // Pantalla de Verificación en Proceso (Webhook en tránsito)
  if (estadoResolucion === "verificando_confirmacion") {
    return (
      <div
        className="mt-6 rounded-2xl border border-sky-500/30 bg-[#0A1220] p-4 text-center"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <div
          className="mx-auto flex size-10 items-center justify-center rounded-full bg-sky-500/10 text-sky-400 mb-2 animate-pulse"
          aria-hidden="true"
        >
          ⏳
        </div>
        <p className="font-display text-sm font-bold text-white">Confirmando pago con el banco...</p>
        <p className="mt-1 font-body text-xs text-[#8E9CAE]">
          Tu pago fue recibido por la pasarela. Estamos validando la confirmación de la red bancaria (intento{" "}
          {intentosRealizados + 1} de 4).
        </p>
      </div>
    );
  }

  // Pantalla de Estado Intermedio Honesto (Webhook demorado / Reconciliador F6/F7)
  // Comportamiento posterior: polling pasivo (10s), reintento manual, notificación y enlace a soporte
  if (estadoResolucion === "conciliacion_pendiente") {
    return (
      <div
        className="mt-6 rounded-2xl border border-amber-500/30 bg-[#0A1220] p-4 text-center"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <div
          className="mx-auto flex size-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 mb-2"
          aria-hidden="true"
        >
          ⏱️
        </div>
        <p className="font-display text-sm font-bold text-white">Pago en proceso de confirmación</p>
        <p className="mt-1 font-body text-xs text-[#8E9CAE]">
          Tu pago fue procesado correctamente. Nuestro reconciliador automático de pagos (F6/F7) confirmará tu traslado
          en breve. <strong>No es necesario volver a pagar.</strong>
        </p>
        <p className="mt-2 font-body text-[11px] text-[#8E9CAE]/90">
          Te notificaremos por correo electrónico en cuanto la confirmación concluya. Puedes cerrar esta ventana con
          tranquilidad o comprobar el estado en tiempo real.
        </p>
        <div className="mt-3 flex flex-col sm:flex-row items-center justify-center gap-2">
          <Button variant="secondary" onClick={iniciarVerificacionDurable}>
            Comprobar estado ahora
          </Button>
          <a
            href={`/soporte?motivo=pago_en_conciliacion&traslado=${encodeURIComponent(trasladoId)}`}
            className="text-xs text-sky-400 underline hover:text-sky-300 py-2 px-3"
          >
            Contactar a soporte
          </a>
        </div>
      </div>
    );
  }

  // Pantalla de Confirmado
  if (estadoResolucion === "confirmado" || pagadoRealtime) {
    return (
      <div
        className="mt-6 rounded-2xl border border-emerald-500/30 bg-[#0A1220] p-4 text-center"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <div
          className="mx-auto flex size-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 mb-2"
          aria-hidden="true"
        >
          ✓
        </div>
        <p className="font-display text-sm font-bold text-white">Pago procesado correctamente</p>
        <p className="mt-1 font-body text-xs text-[#8E9CAE]">
          El servicio se encuentra confirmado y listo para la asignación de conductor.
        </p>
        <Button variant="secondary" className="mt-3" onClick={() => router.refresh()}>
          Actualizar estado ahora
        </Button>
      </div>
    );
  }

  // Pantalla de Entrada de Pago Pendiente
  return (
    <div className="mt-6 rounded-2xl border border-[#1C2A3E] bg-[#0A1220] p-4">
      <div className="mb-3 flex items-center justify-between border-b border-[#1C2A3E] pb-3">
        <p className="font-body text-xs font-bold uppercase tracking-wider text-[#8E9CAE]">Pago pendiente</p>
        <p className="font-display text-base font-extrabold text-[#FFC400]">{formatearPrecio(monto)}</p>
      </div>

      <PagoStripe trasladoId={trasladoId} monto={monto} onPagado={handlePagoStripeCompletado} />
    </div>
  );
}
