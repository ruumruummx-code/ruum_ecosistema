import type { Metadata } from "next";
import { MobileShell } from "@ruum/ui";
import { NavegacionUsuario } from "../../NavegacionUsuario";
import { conCuenta } from "../cuenta-ui";
import { Facturacion } from "../Facturacion";

export const metadata: Metadata = {
  title: "Facturación — Ruum Ruum",
  robots: { index: false, follow: false },
};

export default async function PaginaFacturacion() {
  return conCuenta((cuenta) => (
    <>
      <NavegacionUsuario variante="claro" nombreUsuario={cuenta.usuario?.nombre} />
      <MobileShell variant="compact" navInferiorVisible={true} as="main">
        <Facturacion usuario={cuenta.usuario} empresa={cuenta.empresa} />
      </MobileShell>
    </>
  ));
}
