import { SeccionVehiculos, conCuenta, LayoutCuenta } from "../cuenta-ui";

export default async function PaginaVehiculosCuenta() {
  return conCuenta((cuenta) => (
    <LayoutCuenta cuenta={cuenta}>
      <SeccionVehiculos vehiculos={cuenta.vehiculos} />
    </LayoutCuenta>
  ));
}