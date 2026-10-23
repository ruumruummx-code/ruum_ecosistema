import Link from "next/link";
import { CONTACTOS_SOPORTE_CONDUCTOR } from "@/lib/contactos-soporte";
import { TripActionDock } from "../TripOperationalFrame";
import { ReportarIncidencia } from "../ReportarIncidencia";
export default async function SoporteViaje({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { whatsapp, telefono } = CONTACTOS_SOPORTE_CONDUCTOR.soporte;
  return <div className="p-4">
    <h1 className="font-display text-xl font-bold">Soporte del traslado</h1>
    <p className="my-3 text-sm">Conserva tu paso actual mientras solicitas ayuda operativa.</p>
    <div className="grid gap-3 mb-4">
      <a href={whatsapp.href} target="_blank" rel="noreferrer" className="min-h-11 rounded-xl border border-border p-3">WhatsApp de soporte</a>
      <a href={telefono.href} className="min-h-11 rounded-xl border border-border p-3">Llamar a soporte</a>
    </div>
    <ReportarIncidencia trasladoId={id} />
    <TripActionDock status="Soporte · Puedes volver al paso operativo">
      <Link href={`/viajes/${id}`} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-signal p-2 font-bold text-slate-950">Volver al traslado</Link>
    </TripActionDock>
  </div>;
}
