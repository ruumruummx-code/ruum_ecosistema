import type { Metadata } from "next";
import { MobileShell } from "@ruum/ui";
import { Vehiculos } from "./Vehiculos";
import { construirNotificaciones } from "../../../lib/inicio";
import { NavegacionUsuario } from "../../NavegacionUsuario";
import { conCuenta } from "../cuenta-ui";
import { UserDashboardLayout } from "../../../components/layout/UserDashboardLayout";

export const metadata: Metadata = {
  title: "Mis vehículos — Ruum Ruum",
  robots: { index: false, follow: false },
};

/* Una sola pantalla (Vehiculos) dentro del marco de navegación de cada tamaño:
   barra inferior en móvil, barra lateral desde 1024 px. */
export default async function PaginaVehiculos() {
  return conCuenta((cuenta) => {
    const notificaciones = construirNotificaciones(cuenta.usuario, cuenta.traslados ?? []);
    const contenido = <Vehiculos vehiculos={cuenta.vehiculos} traslados={cuenta.traslados ?? []} />;
    return (
      <>
        <div className="flex h-full w-full flex-col lg:hidden" data-marco="movil">
          <NavegacionUsuario variante="claro" nombreUsuario={cuenta.usuario?.nombre} notificaciones={notificaciones} />
          <MobileShell as="main" variant="wide" padding="none" conFondoCanvas={false} navInferiorVisible className="bg-ui-bg">
            {contenido}
          </MobileShell>
        </div>
        <div className="hidden h-full w-full lg:flex" data-marco="escritorio">
          <UserDashboardLayout
            usuario={cuenta.usuario}
            nombre={cuenta.usuario?.nombre}
            correo={cuenta.correoRegistro}
            totalVehiculos={cuenta.vehiculos.length}
            notificaciones={notificaciones}
            showPromo={false}
            dashboardHeader
            padding="ninguno"
            classNameContenido="bg-ui-bg"
            idContenido="desktopVehiclesMainContent"
          >
            {contenido}
          </UserDashboardLayout>
        </div>
      </>
    );
  });
}
