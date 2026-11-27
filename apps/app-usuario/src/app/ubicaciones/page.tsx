import type { Metadata } from "next";
import { UserDashboardLayout } from "../../components/layout/UserDashboardLayout";
import { conCuenta } from "../cuenta/cuenta-ui";
import { construirNotificaciones } from "../../lib/inicio";
import { construirUbicacionesBase } from "./ubicaciones-usuario";
import { leerLibreta } from "./libreta-ubicaciones";
import { Ubicaciones } from "./Ubicaciones";

export const metadata: Metadata = {
  title: "Mis ubicaciones — Ruum Ruum",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

/* Una sola pantalla (Ubicaciones) dentro de UserDashboardLayout en todos los tamaños:
   el listado se desplaza por dentro desde 1024 px y el detalle pasa a hoja inferior antes. */
export default async function PaginaUbicaciones() {
  return conCuenta((cuenta) => (
    <UserDashboardLayout
      usuario={cuenta.usuario}
      nombre={cuenta.usuario.nombre}
      correo={cuenta.correoRegistro}
      totalVehiculos={cuenta.vehiculos.length}
      notificaciones={construirNotificaciones(cuenta.usuario, cuenta.traslados ?? [])}
      padding="ninguno"
      dashboardHeader
      classNameContenido="bg-ui-bg"
      idContenido="desktopLocationsMainContent"
    >
      <Ubicaciones
        key={cuenta.usuario.id}
        ubicaciones={construirUbicacionesBase(cuenta.usuario, cuenta.traslados ?? [])}
        libretaInicial={leerLibreta(cuenta.usuario.preferencias)}
      />
    </UserDashboardLayout>
  ));
}
