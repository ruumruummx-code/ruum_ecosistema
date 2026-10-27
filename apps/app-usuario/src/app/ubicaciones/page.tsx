import type { Metadata } from "next";
import { UserDashboardLayout } from "../../components/layout/UserDashboardLayout";
import { conCuenta } from "../cuenta/cuenta-ui";
import { construirNotificaciones } from "../../lib/inicio";
import { construirUbicaciones } from "./ubicaciones-usuario";
import { UbicacionesDesktop } from "./UbicacionesDesktop";

export const metadata: Metadata = {
  title: "Mis ubicaciones — Ruum Ruum",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function PaginaUbicaciones() {
  return conCuenta(cuenta => <UserDashboardLayout usuario={cuenta.usuario} nombre={cuenta.usuario.nombre} correo={cuenta.correoRegistro} totalVehiculos={cuenta.vehiculos.length} notificaciones={construirNotificaciones(cuenta.usuario, cuenta.traslados ?? [])} padding="compacto">
    <UbicacionesDesktop ubicaciones={construirUbicaciones(cuenta.usuario, cuenta.traslados ?? [])} />
  </UserDashboardLayout>);
}
