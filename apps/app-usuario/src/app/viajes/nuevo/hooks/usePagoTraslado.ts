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
 * God-hook (auditoría): estado realtime de pago — flag de confirmación y
 * verificación contra la base (regla estricta del Paso 5: el avance solo se
 * marca cuando la base confirma pago 'completado'). Se mueve intacto.
 */
export function usePagoTraslado({ estadoTrasladoId, trasladoCreado }: DependenciasPago) {
  const {
    pagoConfirmado,
    actualizar: actualizarEstadoTraslado,
  } = useTrasladoRealtime(estadoTrasladoId);

  const setPagoConfirmado = useCallback((valor: boolean) => actualizarEstadoTraslado({ pagoConfirmado: valor }), [actualizarEstadoTraslado]);

  // Regla estricta del Paso 5: el callback de Stripe es optimista (llega con
  // status succeeded|processing del cliente). El avance solo se marca cuando
  // la base confirma un pago con estado = 'completado' (webhook procesado).
  const [verificandoPago, setVerificandoPago] = useState(false);
  const [errorVerificacionPago, setErrorVerificacionPago] = useState<string | null>(null);

  const manejarPagoStripeConfirmado = useCallback(async () => {
    if (!trasladoCreado || verificandoPago) return;
    setVerificandoPago(true);
    setErrorVerificacionPago(null);
    try {
      const cliente = crearClienteNavegador();
      let confirmado = false;
      for (let intento = 0; intento < 6 && !confirmado; intento++) {
        if (intento > 0) await new Promise((resolver) => setTimeout(resolver, 2000));
        confirmado = await verificarPagoAnticipadoCompletado(cliente, trasladoCreado.id);
      }
      if (!confirmado) {
        throw new Error("Aún no vemos tu pago confirmado. Espera unos segundos y pulsa «Verificar pago».");
      }
      setPagoConfirmado(true);
    } catch (err) {
      setErrorVerificacionPago(err instanceof Error ? err.message : "No pudimos verificar tu pago. Intenta de nuevo.");
    } finally {
      setVerificandoPago(false);
    }
  }, [trasladoCreado, verificandoPago, setPagoConfirmado]);

  return { pagoConfirmado, setPagoConfirmado, verificandoPago, errorVerificacionPago, manejarPagoStripeConfirmado };
}
