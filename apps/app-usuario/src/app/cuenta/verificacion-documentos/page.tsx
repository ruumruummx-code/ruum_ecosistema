import type { Metadata } from "next";
import { MobileShell } from "@ruum/ui";
import { NavegacionUsuario } from "../../NavegacionUsuario";
import { conCuenta } from "../cuenta-ui";
import { VerificacionDocumentos } from "../VerificacionDocumentos";

export const metadata: Metadata = {
  title: "Verificación y documentos — Ruum Ruum",
  robots: { index: false, follow: false },
};

export default async function PaginaVerificacionDocumentos() {
  return conCuenta((cuenta) => (
    <>
      <NavegacionUsuario variante="claro" nombreUsuario={cuenta.usuario?.nombre} />
      <MobileShell variant="compact" navInferiorVisible={true} as="main">
        <VerificacionDocumentos usuario={cuenta.usuario} fotoUrl={cuenta.fotoPerfilUrl} />
      </MobileShell>
    </>
  ));
}
