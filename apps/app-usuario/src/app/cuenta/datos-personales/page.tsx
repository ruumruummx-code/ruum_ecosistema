import type { Metadata } from "next";
import { conCuenta } from "../cuenta-ui";
import { DatosPersonales } from "../DatosPersonales";
import { PantallaCuentaResponsive } from "../PantallaCuentaResponsive";
export const metadata: Metadata = { title: "Mi perfil — Ruum Ruum", robots: { index: false, follow: false } };
export default async function Pagina() {
  return conCuenta(cuenta => <PantallaCuentaResponsive cuenta={cuenta} titulo="Mi perfil" descripcion="Administra tus datos personales y tu domicilio." movil={<DatosPersonales usuario={cuenta.usuario} correoRegistro={cuenta.correoRegistro} fotoUrlInicial={cuenta.fotoPerfilUrl} />} escritorio={<DatosPersonales usuario={cuenta.usuario} escritorio correoRegistro={cuenta.correoRegistro} fotoUrlInicial={cuenta.fotoPerfilUrl} />} />, { carga: "perfil" });
}
