"use client";

import { CONTACTOS_SOPORTE_CONDUCTOR } from "@/lib/contactos-soporte";
import { TripDialog } from "./TripDialog";

export function TripSupportDialog({ onClose }: { onClose: () => void }) {
  const { whatsapp, telefono, correo } = CONTACTOS_SOPORTE_CONDUCTOR.soporte;
  return <TripDialog title="Soporte del traslado" onClose={onClose}>
    <p className="mb-3 text-sm">Contacta al equipo operativo sin salir de este paso.</p>
    <div className="grid gap-3">
      <a href={whatsapp.href} target="_blank" rel="noreferrer" className="min-h-11 rounded-xl border border-border p-3">WhatsApp de soporte</a>
      <a href={telefono.href} className="min-h-11 rounded-xl border border-border p-3">Llamar a soporte</a>
      <a href={correo.href} className="min-h-11 rounded-xl border border-border p-3">Correo de soporte</a>
    </div>
  </TripDialog>;
}
