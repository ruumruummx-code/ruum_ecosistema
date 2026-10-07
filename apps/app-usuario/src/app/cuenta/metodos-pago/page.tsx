import { SeccionMetodosPago, conCuenta, LayoutCuenta } from "../cuenta-ui";

export default async function PaginaMetodosPagoCuenta() {
  return conCuenta((cuenta) => (
    <LayoutCuenta cuenta={cuenta}>
      <SeccionMetodosPago usuario={cuenta.usuario} />
    </LayoutCuenta>
  ));
}