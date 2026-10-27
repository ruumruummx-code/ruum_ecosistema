import type { Metadata } from "next";
import { UserResponsiveLayout } from "../../../components/layout/UserResponsiveLayout";
import { conCuenta } from "../cuenta-ui";
import { VerificacionDocumentos } from "../VerificacionDocumentos";

export const metadata: Metadata = {
  title: "Verificación y facturación — Ruum Ruum",
  robots: { index: false, follow: false },
};

export default async function PaginaVerificacionDocumentos() {
  return conCuenta((cuenta) => (
    <>
      <UserResponsiveLayout nombre={cuenta.usuario.nombre} mobileShell mobileClassName="user-v2-scope user-verification-shell" mobileContentClassName="user-verification-content">
        <VerificacionDocumentos usuario={cuenta.usuario} empresa={cuenta.empresa} />
      </UserResponsiveLayout>
    </>
  ));
}
