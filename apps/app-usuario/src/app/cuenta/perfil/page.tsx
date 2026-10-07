import { SeccionPerfil, conCuenta, LayoutCuenta } from "../cuenta-ui";

export default async function PaginaPerfilCuenta() {
  return conCuenta((cuenta) => (
    <LayoutCuenta cuenta={cuenta}>
      <SeccionPerfil usuario={cuenta.usuario} fotoUrl={cuenta.fotoPerfilUrl} />
    </LayoutCuenta>
  ));
}