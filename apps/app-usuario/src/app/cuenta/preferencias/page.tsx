import type { Metadata } from "next";
import { conCuenta } from "../cuenta-ui";
import { Preferencias } from "../Preferencias";
import { PantallaCuentaResponsive } from "../PantallaCuentaResponsive";
export const metadata: Metadata = { title: "Mis preferencias — Ruum Ruum", robots: { index: false, follow: false } };
export default async function Pagina() {
  return conCuenta(cuenta => <PantallaCuentaResponsive cuenta={cuenta} titulo="Mis preferencias" descripcion="Configura notificaciones, apariencia y preferencias de privacidad." movil={<Preferencias usuario={cuenta.usuario}  />} escritorio={<Preferencias usuario={cuenta.usuario} escritorio  />} />);
}
