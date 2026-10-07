import { SeccionFacturacion, conCuenta, LayoutCuenta } from "../cuenta-ui";

export default async function PaginaFacturacionCuenta() {
  return conCuenta((cuenta) => (
    <LayoutCuenta cuenta={cuenta}>
      <SeccionFacturacion empresa={cuenta.empresa} usuario={cuenta.usuario} />
    </LayoutCuenta>
  ));
}