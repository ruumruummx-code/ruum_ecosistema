import Link from "next/link";
import { CONTACTOS_SOPORTE_CONDUCTOR } from "@/lib/contactos-soporte";
import { ConductorScreen, ConductorPageHeader } from "../../../components/ConductorScreen";
import { ReportarIncidencia } from "../ReportarIncidencia";
export default async function SoporteViaje({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { whatsapp, telefono } = CONTACTOS_SOPORTE_CONDUCTOR.soporte;
  return <div data-trip-stage><ConductorScreen variant="detail" label="Ayuda e incidencias del traslado" header={<ConductorPageHeader title="Soporte del traslado" backHref={`/viajes/${id}`} backLabel="Volver al traslado" />} footer={<Link href={`/viajes/${id}`} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-border p-3">Volver al traslado</Link>}>
    <p className="my-3 text-sm">Conserva tu paso actual mientras solicitas ayuda operativa.</p>
    <div className="grid gap-3 mb-4">
      <a href={whatsapp.href} target="_blank" rel="noreferrer" className="min-h-11 rounded-xl border border-border p-3">WhatsApp de soporte</a>
      <a href={telefono.href} className="min-h-11 rounded-xl border border-border p-3">Llamar a soporte</a>
    </div>
    <ReportarIncidencia trasladoId={id} />
  </ConductorScreen></div>;
}
