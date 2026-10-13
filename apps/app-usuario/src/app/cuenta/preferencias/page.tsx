import type { Metadata } from "next";
import { MobileShell } from "@ruum/ui";
import { NavegacionUsuario } from "../../NavegacionUsuario";
import { conCuenta } from "../cuenta-ui";
import { Preferencias } from "../Preferencias";

export const metadata: Metadata = {
  title: "Preferencias — Ruum Ruum",
  robots: { index: false, follow: false },
};

export default async function PaginaPreferencias() {
  return conCuenta((cuenta) => (
    <>
      <NavegacionUsuario variante="claro" nombreUsuario={cuenta.usuario?.nombre} />
      <MobileShell variant="compact" navInferiorVisible={true} as="main">
        <Preferencias usuario={cuenta.usuario} />
      </MobileShell>
    </>
  ));
}
