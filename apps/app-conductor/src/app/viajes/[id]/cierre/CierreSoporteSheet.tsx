"use client";

import { TripSupportDialog } from "../TripSupportDialog";

export function CierreSoporteSheet({ abierto, onCerrar }: { abierto: boolean; onCerrar: () => void }) {
  return abierto ? <TripSupportDialog onClose={onCerrar} /> : null;
}
