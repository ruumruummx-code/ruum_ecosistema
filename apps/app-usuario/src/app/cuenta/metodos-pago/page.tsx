import type { Metadata } from "next";
import { UserResponsiveLayout } from "../../../components/layout/UserResponsiveLayout";
import { conCuenta } from "../cuenta-ui";
import { MetodosPago } from "./MetodosPago";
export const metadata: Metadata = { title: "Métodos de pago — Ruum Ruum", robots: { index: false, follow: false } };
export default async function PaginaMetodosPago() {
  return conCuenta(cuenta => <UserResponsiveLayout nombre={cuenta.usuario.nombre} mobileShell><MetodosPago /></UserResponsiveLayout>);
}
