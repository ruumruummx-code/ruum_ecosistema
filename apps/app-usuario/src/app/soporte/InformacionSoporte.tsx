import { PROMESA_SOPORTE } from "../../lib/promesa-soporte";
import { CONTACTOS_SOPORTE_USUARIO } from "../../lib/contactos-soporte";

export function InformacionSoporte() {
  return <section aria-label="Disponibilidad de soporte" className="rounded-2xl border border-border bg-surface p-4 text-sm text-text-primary space-y-2">
    <p>{PROMESA_SOPORTE.recepcion}</p>
    <p>{PROMESA_SOPORTE.atencion}</p>
    <p>{PROMESA_SOPORTE.respuesta}</p>
    <p>{PROMESA_SOPORTE.emergencia} <a className="font-semibold text-route-action underline" href={CONTACTOS_SOPORTE_USUARIO.soporte.correo.href}>{CONTACTOS_SOPORTE_USUARIO.soporte.correo.valor}</a></p>
    <p>{PROMESA_SOPORTE.otrosCanales}</p>
  </section>;
}
