import type { Metadata } from "next";
import { MobileShell } from "@ruum/ui";
import { conCuenta } from "../cuenta-ui";
import { VerificacionDocumentos } from "../VerificacionDocumentos";

export const metadata: Metadata = {
  title: "Verificación y facturación — Ruum Ruum",
  robots: { index: false, follow: false },
};

export default async function PaginaVerificacionDocumentos() {
  return conCuenta((cuenta) => (
    <>
      <MobileShell variant="compact" navInferiorVisible={false} as="main" className="user-v2-scope user-verification-shell" contentClassName="user-verification-content">
        <VerificacionDocumentos usuario={cuenta.usuario} empresa={cuenta.empresa} />
      </MobileShell>
    </>
  ));
}
