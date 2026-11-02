import type { Metadata } from "next";
import { conCuenta } from "../../cuenta-ui";
import { UserResponsiveLayout } from "../../../../components/layout/UserResponsiveLayout";
import { NuevoVehiculo } from "./NuevoVehiculo";
export const metadata: Metadata = { title: "Registrar vehículo — Ruum Ruum", robots: { index: false, follow: false } };
export default async function PaginaNuevoVehiculo() {
  return conCuenta(cuenta => <UserResponsiveLayout nombre={cuenta.usuario.nombre} mobileShell><NuevoVehiculo /></UserResponsiveLayout>, { carga: "perfil" });
}
