"use client";

import { Button as BaseButton } from "@ruum/ui/base";
import { useEffect, useRef, useState } from "react";
import { MOTIVOS_RECHAZO, type MotivoRechazo } from "@ruum/shared/constants";
import { nombreVehiculo, type PasaporteRow } from "./trips-utils";

/**
 * Solicitud de liberación de un traslado ya aceptado.
 *
 * El conductor no puede desasignarse por sí mismo (`cancelar_asignacion` es
 * exclusivo de operación), así que esta acción envía una solicitud: el
 * traslado sigue asignado hasta que operación la confirme. El diálogo lo
 * explica antes de enviar y pide confirmar el motivo en un segundo paso.
 */
export function RejectTripDialog({
  viaje,
  enviando = false,
  onClose,
  onConfirm
}: {
  viaje: PasaporteRow | null;
  enviando?: boolean;
  onClose: () => void;
  onConfirm: (motivo: MotivoRechazo) => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [motivo, setMotivo] = useState<MotivoRechazo | null>(null);

  useEffect(() => {
    setMotivo(null);
    if (viaje) {
      // Foco programático controlado — evita autoFocus y respeta prefers-reduced-motion / TalkBack
      const id = requestAnimationFrame(() => closeRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [viaje]);

  if (!viaje) return null;

  const cerrar = () => {
    if (!enviando) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-ui-overlay/70 backdrop-blur-xs flex items-end justify-center">
      <BaseButton variant="ghost"
        type="button"
        aria-label="Cerrar diálogo"
        onClick={cerrar}
        className="absolute inset-0 w-full h-full bg-transparent border-none cursor-default"
      />
      <dialog
        open
        aria-modal="true"
        aria-labelledby="liberacion-viaje-titulo"
        aria-describedby="liberacion-viaje-descripcion"
        className="relative w-full max-w-md rounded-t-3xl border-t border-ui-line/30 bg-ui-muted p-6 shadow-2xl animate-in slide-in-from-bottom-5 duration-200 m-0 block"
      >
        <div className="flex items-start justify-between gap-4 pb-3 border-b border-ui-line/15">
          <div>
            <p id="liberacion-viaje-titulo" className="font-display text-lg font-black text-ui-fg">
              Solicitar liberación
            </p>
            <p className="mt-0.5 font-body text-xs text-ui-fg-muted">
              {nombreVehiculo(viaje)}
            </p>
          </div>
          <BaseButton variant="ghost"
            ref={closeRef}
            type="button"
            onClick={cerrar}
            disabled={enviando}
            className="min-h-11 px-4 py-2 rounded-xl border border-ui-line/40 bg-ui-card hover:bg-ui-muted font-body text-sm font-bold text-ui-fg-muted hover:text-ui-fg transition-colors cursor-pointer focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-ui-brand"
          >
            Cerrar
          </BaseButton>
        </div>
        <p id="liberacion-viaje-descripcion" className="mt-4 font-body text-sm leading-6 text-ui-fg-muted">
          Operación revisará tu solicitud. El traslado sigue asignado a ti hasta que te confirmen la liberación.
        </p>
        <fieldset className="mt-4 grid gap-2.5" disabled={enviando}>
          <legend className="mb-2 font-body text-sm font-semibold text-ui-fg">¿Por qué no puedes realizarlo?</legend>
          {MOTIVOS_RECHAZO.map((opcion) => (
            <BaseButton variant="ghost"
              key={opcion}
              type="button"
              aria-pressed={motivo === opcion}
              onClick={() => setMotivo(opcion)}
              className={`min-h-11 rounded-lg border px-4 py-3 text-left font-body text-sm font-semibold text-ui-fg transition-all cursor-pointer focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-ui-brand ${
                motivo === opcion ? "border-ui-brand bg-ui-brand-soft" : "border-ui-line/30 bg-ui-card hover:border-ui-line"
              }`}
            >
              {opcion}
            </BaseButton>
          ))}
        </fieldset>
        <BaseButton variant="primary"
          type="button"
          className="mt-4 min-h-12 w-full"
          disabled={!motivo || enviando}
          aria-busy={enviando}
          onClick={() => motivo && onConfirm(motivo)}
        >
          {enviando ? "Enviando solicitud…" : "Enviar solicitud"}
        </BaseButton>
      </dialog>
    </div>
  );
}
