"use client";
import { useId, type ReactNode } from "react";
import { ConductorDialog } from "../components/ConductorDialog";
export function DetailsDialog({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  const id = useId();
  return <ConductorDialog open={open} title={title} labelledBy={id} onClose={onClose}>{children}</ConductorDialog>;
}
