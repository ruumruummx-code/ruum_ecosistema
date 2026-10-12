import { conCuenta, LayoutCuenta } from "../cuenta-ui";
import { VerificacionDocumentos } from "../VerificacionDocumentos";

export const metadata = {
  title: "Verificación y documentos · Ruum Ruum Usuario",
  description: "Gestiona tu verificación de identidad y documentos fiscales.",
};

export default async function PaginaVerificacionDocumentos() {
  return conCuenta((cuenta) => (
    <LayoutCuenta cuenta={cuenta}>
      <VerificacionDocumentos usuario={cuenta.usuario} fotoUrl={cuenta.fotoPerfilUrl} />
    </LayoutCuenta>
  ));
}
