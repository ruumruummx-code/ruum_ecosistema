"use client";

import { Button as BaseButton } from "@ruum/ui/base";
import { useId } from "react";
import { ConductorDialog } from "../components/ConductorDialog";

export interface InfoSheetProps {
  titulo: string;
  texto: string;
  onCerrar: () => void;
}

export function InfoSheet({ titulo, texto, onCerrar }: InfoSheetProps) {
  const titleId = useId();
  return (
    <ConductorDialog open onClose={onCerrar} labelledBy={titleId}>
      <div className="flex flex-col gap-4">
        <div className="mx-auto h-1.5 w-12 rounded-full bg-ui-line/40" aria-hidden />
        <div className="flex justify-between items-start gap-3">
          <h2 id={titleId} className="font-display text-lg font-black text-ui-fg">{titulo}</h2>
        </div>
        <p className="font-body text-sm leading-6 text-ui-fg-muted">{texto}</p>
        <div className="rounded-xl border border-ui-line/30 bg-ui-card p-3">
          <p className="font-body text-xs font-semibold text-ui-fg-muted">Fórmula: <span className="text-ui-fg font-bold">Depósito = Precio base + Bonos + Ajustes − Tasa + Reembolso</span></p>
        </div>
        <BaseButton variant="ghost" type="button" onClick={onCerrar} className="w-full min-h-11 rounded-xl bg-ui-brand font-display text-sm font-black text-ui-on-brand hover:bg-ui-brand/90 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-ui-brand">Entendido</BaseButton>
      </div>
    </ConductorDialog>
  );
}
