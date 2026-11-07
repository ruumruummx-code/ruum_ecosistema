"use client";
import { useId, type ReactNode } from "react";
import { ConductorDialog } from "../../components/ConductorDialog";
export function TripDialog({ title, onClose, children, footer }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  const id = useId();
  return <ConductorDialog open title={title} labelledBy={id} closeLabel={`Cerrar ${title}`} onClose={onClose} footer={footer}>{children}</ConductorDialog>;
}
