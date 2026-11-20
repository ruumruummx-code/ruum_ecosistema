"use client";

import { useEffect, useRef } from "react";
import { ConductorButton as Button } from "@/components/v2/ConductorUI";

interface ConfirmarDisponibilidadProps {
  abierto: boolean;
  persistiendo: boolean;
  onCancelar: () => void;
  onConfirmar: () => void;
}

export function ConfirmarDisponibilidad({
  abierto,
  persistiendo,
  onCancelar,
  onConfirmar
}: ConfirmarDisponibilidadProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (abierto && !dialog.open) {
      dialog.showModal();
    }
    if (!abierto && dialog.open) {
      dialog.close();
    }
  }, [abierto]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="confirmar-disponibilidad-titulo"
      className="w-[min(92vw,420px)] rounded-lg border border-ui-line bg-ui-card p-0 text-ui-fg shadow-ui-md backdrop:bg-ui-muted"
      onCancel={(evento) => {
        evento.preventDefault();
        if (!persistiendo) onCancelar();
      }}
    >
      <div className="p-5">
        <h2 id="confirmar-disponibilidad-titulo" className="font-display text-xl font-semibold">
          ¿Pasas a no disponible?
        </h2>
        <p className="mt-3 font-body text-sm leading-6 text-ui-fg-muted">
          Dejarás de recibir traslados nuevos hasta que reactives tu disponibilidad.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onCancelar} disabled={persistiendo}>
            Cancelar
          </Button>
          <Button type="button" variant="primary" onClick={onConfirmar} loading={persistiendo}>
            Confirmar
          </Button>
        </div>
      </div>
    </dialog>
  );
}
