"use client";

import { useRouter } from "next/navigation";
import { aceptarCotizacionUsuario } from "@ruum/api/services";
import { Aviso, Button } from "@ruum/ui";
import { crearClienteNavegador } from "@/lib/supabase-browser";
import { useTrasladoRealtime } from "@/state/AppStateProvider";
import { validarTransicionFlujo10, registrarAuditoriaAccionF10 } from "@/lib/flujo10-transiciones-policy";

export function AceptarCotizacion({
  trasladoId,
  tipoPago = "anticipado",
  estadoActual,
}: {
  trasladoId: string;
  tipoPago?: "anticipado" | "al_cierre" | null;
  estadoActual?: string | null;
}) {
  const router = useRouter();
  const { aceptandoCotizacion: procesando, errorAceptacion: error, actualizar } = useTrasladoRealtime(trasladoId);

  // CB-2 / CA-4: Validación de transición contra máquina de estados de Flujo 10 y F8
  const validacion = estadoActual
    ? validarTransicionFlujo10("aceptar_cotizacion", estadoActual, { trasladoId })
    : { permitida: true, motivoBloqueo: undefined };

  async function aceptar() {
    if (!validacion.permitida) {
      actualizar({
        errorAceptacion: validacion.motivoBloqueo ?? "La cotización no puede ser aceptada en el estado actual.",
        aceptandoCotizacion: false,
      });
      return;
    }

    actualizar({ aceptandoCotizacion: true, errorAceptacion: null });
    try {
      await aceptarCotizacionUsuario(crearClienteNavegador(), trasladoId);
      actualizar({ cotizacionAceptada: true, aceptandoCotizacion: false });

      // CB-3 / T10 / CA-8: Registro de auditoría
      registrarAuditoriaAccionF10({
        trasladoId,
        usuarioId: "cliente_sesion",
        accion: "aceptar_cotizacion",
        estadoAnterior: estadoActual ?? "cotizacion_generada",
        estadoNuevo: tipoPago === "anticipado" ? "cotizacion_aceptada" : "servicio_confirmado",
        timestamp: new Date().toISOString(),
      });

      router.refresh();
    } catch (e) {
      actualizar({
        errorAceptacion: e instanceof Error ? e.message : "No se pudo aceptar la tarifa",
        aceptandoCotizacion: false,
      });
    }
  }

  if (!validacion.permitida) {
    return (
      <div className="mt-6 rounded-lg border border-ink/15 bg-mist p-4">
        <p className="font-body text-xs font-semibold uppercase tracking-wider text-ink/60">
          Aceptación no disponible
        </p>
        <p className="mt-1 font-body text-sm text-ink/80">{validacion.motivoBloqueo}</p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <p className="mb-3 font-body text-sm text-ink/65">
        {tipoPago === "anticipado"
          ? "Al aceptar podrás realizar el pago anticipado por el precio cotizado."
          : "Al aceptar, el servicio se confirmará sin solicitar un pago inicial."}
      </p>
      {error && <Aviso tono="danger">{error}</Aviso>}
      <Button onClick={aceptar} disabled={procesando}>
        {procesando ? "Aceptando…" : "Aceptar cotización"}
      </Button>
    </div>
  );
}
