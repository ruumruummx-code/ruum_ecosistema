import type { Metadata } from "next";
import { MobileShell } from "@ruum/ui";
import { NavegacionUsuario } from "../../NavegacionUsuario";
import { conCuenta } from "../cuenta-ui";
import { DatosPersonales } from "../DatosPersonales";

export const metadata: Metadata = {
  title: "Datos personales — Ruum Ruum",
  robots: { index: false, follow: false },
};

export default async function PaginaDatosPersonales() {
  return conCuenta((cuenta) => (
    <>
      <NavegacionUsuario variante="claro" nombreUsuario={cuenta.usuario?.nombre} />
      <MobileShell variant="compact" navInferiorVisible={true} as="main">
        <DatosPersonales usuario={cuenta.usuario} fotoUrlInicial={cuenta.fotoPerfilUrl} />
      </MobileShell>
    </>
  ));
}
