import { useCallback, useEffect, useRef } from "react";
import { crearClienteNavegador } from "@/lib/supabase-browser";
import { aceptarCotizacionUsuario } from "@ruum/api/services";
import { useTrasladoRealtime } from "@/state/AppStateProvider";
import type { TrasladoCreado } from "@/state/app-state";
import type { SettersFormulario } from "./useSettersFormulario";

interface DependenciasCotizacion {
  estadoTrasladoId: string;
  trasladoCreado: TrasladoCreado | null;
  reintentoAceptacion: number;
  setReintentoAceptacion: SettersFormulario["setReintentoAceptacion"];
}

/**
 * God-hook (auditoría): estado realtime de cotización — flags, setters,
 * auto-aceptación al crearse el traslado, reintento y purga de la entrada al
 * entrar/salir (deuda realtime). Se mueve intacto.
 */
export function useCotizacionTraslado({
  estadoTrasladoId,
  trasladoCreado,
  reintentoAceptacion,
  setReintentoAceptacion,
}: DependenciasCotizacion) {
  const {
    cotizacionAceptada,
    aceptandoCotizacion,
    errorAceptacion,
    limpiar: limpiarEstadoTraslado,
    actualizar: actualizarEstadoTraslado,
  } = useTrasladoRealtime(estadoTrasladoId);

  const setCotizacionAceptada = useCallback((valor: boolean) => actualizarEstadoTraslado({ cotizacionAceptada: valor }), [actualizarEstadoTraslado]);
  const setAceptandoCotizacion = useCallback((valor: boolean) => actualizarEstadoTraslado({ aceptandoCotizacion: valor }), [actualizarEstadoTraslado]);
  const setErrorAceptacion = useCallback((valor: string | null) => actualizarEstadoTraslado({ errorAceptacion: valor }), [actualizarEstadoTraslado]);
  const reintentarAceptacion = useCallback(() => setReintentoAceptacion((n) => n + 1), [setReintentoAceptacion]);

  const trasladoAceptacionIntentado = useRef<string | null>(null);

  // La clave sintética "nuevo" (y cualquier id residual) jamás se limpiaba del
  // estado realtime. Se purga al entrar y al salir; se recrea sola si se usa.
  useEffect(() => {
    limpiarEstadoTraslado();
    return () => limpiarEstadoTraslado();
  }, [limpiarEstadoTraslado]);

  // Toda solicitud nueva con tarifa se confirma automáticamente para habilitar
  // el pago Stripe en el último paso del wizard.
  useEffect(() => {
    if (!trasladoCreado) return;
    if (trasladoCreado.precioCotizado == null) return;
    if (trasladoAceptacionIntentado.current === trasladoCreado.id) return;
    trasladoAceptacionIntentado.current = trasladoCreado.id;

    setAceptandoCotizacion(true);
    setErrorAceptacion(null);
    (async () => {
      try {
        const cliente = crearClienteNavegador();
        await aceptarCotizacionUsuario(cliente, trasladoCreado.id);
        setCotizacionAceptada(true);
      } catch (err) {
        trasladoAceptacionIntentado.current = null; // permite reintentar
        setErrorAceptacion(err instanceof Error ? err.message : "No se pudo confirmar la tarifa para iniciar el pago.");
      } finally {
        setAceptandoCotizacion(false);
      }
    })();
  }, [reintentoAceptacion, setAceptandoCotizacion, setCotizacionAceptada, setErrorAceptacion, trasladoCreado]);

  return {
    cotizacionAceptada,
    aceptandoCotizacion,
    errorAceptacion,
    setCotizacionAceptada,
    setAceptandoCotizacion,
    setErrorAceptacion,
    reintentarAceptacion,
  };
}
