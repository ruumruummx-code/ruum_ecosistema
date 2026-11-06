"use client";

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
        <div className="mx-auto h-1.5 w-12 rounded-full bg-border/40" aria-hidden />
        <div className="flex justify-between items-start gap-3">
          <h2 id={titleId} className="font-display text-lg font-black text-text-primary">{titulo}</h2>
        </div>
        <p className="font-body text-sm leading-6 text-text-secondary">{texto}</p>
        <div className="rounded-xl border border-border/30 bg-surface p-3">
          <p className="font-body text-xs font-semibold text-text-tertiary">Fórmula: <span className="text-text-primary font-bold">Depósito = Precio base + Bonos + Ajustes − Tasa + Reembolso</span></p>
        </div>
        <button type="button" onClick={onCerrar} className="w-full min-h-11 rounded-xl bg-signal font-display text-sm font-black text-on-primary hover:bg-signal/90 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-signal">Entendido</button>
      </div>
    </ConductorDialog>
  );
}
