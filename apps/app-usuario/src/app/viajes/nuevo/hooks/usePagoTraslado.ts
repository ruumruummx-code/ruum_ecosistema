import { useCallback, useState } from "react";
import { crearClienteNavegador } from "@/lib/supabase-browser";
import { verificarPagoAnticipadoCompletado } from "@ruum/api/services";
import { useTrasladoRealtime } from "@/state/AppStateProvider";
import type { TrasladoCreado } from "@/state/app-state";

interface DependenciasPago {
  estadoTrasladoId: string;
  trasladoCreado: TrasladoCreado | null;
}

/**
 * Estado realtime de pago — confirmación contra la base de datos (Paso 5).
 * Soporta estado intermedio "pago en proceso de confirmación" cuando el webhook
 * tarda más de 12 s, junto con reintento manual ilimitado de verificación.
 */
export function usePagoTraslado({ estadoTrasladoId, trasladoCreado }: DependenciasPago) {
  const {
    pagoConfirmado,
    pagoEnProcesoConfirmacion = false,
    actualizar: actualizarEstadoTraslado,
  } = useTrasladoRealtime(estadoTrasladoId);

  const setPagoConfirmado = useCallback(
    (valor: boolean) =>
      actualizarEstadoTraslado({
        pagoConfirmado: valor,
        pagoEnProcesoConfirmacion: valor ? false : undefined,
      }),
    [actualizarEstadoTraslado],
  );

  const setPagoEnProcesoConfirmacion = useCallback(
    (valor: boolean) =>
      actualizarEstadoTraslado({
        pagoEnProcesoConfirmacion: valor,
      }),
    [actualizarEstadoTraslado],
  );

  const [verificandoPago, setVerificandoPago] = useState(false);
  const [errorVerificacionPago, setErrorVerificacionPago] = useState<string | null>(null);

  // Invocado al confirmar el pago en la pasarela Stripe (Elements / redirect)
  const manejarPagoStripeConfirmado = useCallback(async () => {
    if (!trasladoCreado || verificandoPago) return;
    setVerificandoPago(true);
    setErrorVerificacionPago(null);
    try {
      const cliente = crearClienteNavegador();
      let confirmado = false;
      // Sondeo inicial de hasta 12 segundos (6 intentos x 2s)
      for (let intento = 0; intento < 6 && !confirmado; intento++) {
        if (intento > 0) await new Promise((resolver) => setTimeout(resolver, 2000));
        confirmado = await verificarPagoAnticipadoCompletado(cliente, trasladoCreado.id);
      }

      if (!confirmado) {
        // En lugar de fallar de manera bloqueante, pasa al estado intermedio
        setPagoEnProcesoConfirmacion(true);
        setErrorVerificacionPago(null);
      } else {
        setPagoConfirmado(true);
        setPagoEnProcesoConfirmacion(false);
      }
    } catch (err) {
      setPagoEnProcesoConfirmacion(true);
      setErrorVerificacionPago(
        err instanceof Error
          ? err.message
          : "No pudimos verificar tu pago de inmediato. Puedes reintentar la verificación.",
      );
    } finally {
      setVerificandoPago(false);
    }
  }, [trasladoCreado, verificandoPago, setPagoConfirmado, setPagoEnProcesoConfirmacion]);

  // Reintento manual ilimitado de verificación
  const reintentarVerificacion = useCallback(async () => {
    if (!trasladoCreado || verificandoPago) return;
    setVerificandoPago(true);
    setErrorVerificacionPago(null);
    try {
      const cliente = crearClienteNavegador();
      const confirmado = await verificarPagoAnticipadoCompletado(cliente, trasladoCreado.id);
      if (confirmado) {
        setPagoConfirmado(true);
        setPagoEnProcesoConfirmacion(false);
      } else {
        setPagoEnProcesoConfirmacion(true);
        setErrorVerificacionPago(
          "Aún no se refleja la confirmación de pago en el sistema. Puedes reintentar en unos momentos.",
        );
      }
    } catch (err) {
      setErrorVerificacionPago(
        err instanceof Error
          ? err.message
          : "No fue posible conectar con el servicio de verificación. Intenta nuevamente.",
      );
    } finally {
      setVerificandoPago(false);
    }
  }, [trasladoCreado, verificandoPago, setPagoConfirmado, setPagoEnProcesoConfirmacion]);

  return {
    pagoConfirmado,
    setPagoConfirmado,
    pagoEnProcesoConfirmacion,
    setPagoEnProcesoConfirmacion,
    verificandoPago,
    errorVerificacionPago,
    manejarPagoStripeConfirmado,
    reintentarVerificacion,
  };
}
