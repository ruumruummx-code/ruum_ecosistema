import type { Metadata } from "next";
import { conCuenta } from "../cuenta-ui";
import { PreferenciasCliente } from "./PreferenciasCliente";

export const metadata: Metadata = {
  title: "Mis Preferencias — Ruum Ruum",
  description: "Configura notificaciones, apariencia, privacidad y preferencias de uso en Ruum Ruum.",
  robots: { index: false, follow: false },
};

export default async function PaginaPreferenciasCuenta() {
  return conCuenta(cuenta => <PreferenciasCliente cuenta={cuenta} />, { carga: "preferencias" });
}
