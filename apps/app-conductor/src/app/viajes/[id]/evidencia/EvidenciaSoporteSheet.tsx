"use client";

import { TripSupportDialog } from "../TripSupportDialog";

export function EvidenciaSoporteSheet({ soporteAbierto, setSoporteAbierto }: { soporteAbierto: boolean; setSoporteAbierto: (value: boolean) => void }) {
  return soporteAbierto ? <TripSupportDialog onClose={() => setSoporteAbierto(false)} /> : null;
}
