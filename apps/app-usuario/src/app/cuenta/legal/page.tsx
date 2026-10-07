import { SeccionLegal, conCuenta, LayoutCuenta } from "../cuenta-ui";

export default async function PaginaLegalCuenta() {
  return conCuenta((cuenta) => (
    <LayoutCuenta cuenta={cuenta}>
      <SeccionLegal />
    </LayoutCuenta>
  ));
}