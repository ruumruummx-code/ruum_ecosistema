import { conCuenta, LayoutCuenta } from "../cuenta-ui";
import { DatosPersonalesForm } from "../DatosPersonalesForm";

export const metadata = {
  title: "Datos personales · Ruum Ruum Usuario",
  description: "Gestiona tu información personal y dirección de contacto.",
};

export default async function PaginaDatosPersonales() {
  return conCuenta((cuenta) => (
    <LayoutCuenta cuenta={cuenta}>
      <DatosPersonalesForm usuario={cuenta.usuario} fotoUrlInicial={cuenta.fotoPerfilUrl} />
    </LayoutCuenta>
  ));
}
