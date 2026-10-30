import type { Metadata } from "next";
import { UserDashboardLayout } from "../../components/layout/UserDashboardLayout";
import { conCuenta } from "../cuenta/cuenta-ui";
import { construirNotificaciones } from "../../lib/inicio";
import {
  construirUbicaciones,
  construirUbicacionesBase,
} from "./ubicaciones-usuario";
import { leerLibreta } from "./libreta-ubicaciones";
import { UbicacionesDesktop } from "./UbicacionesDesktop";
import { UbicacionesMovil } from "./UbicacionesMovil";
import s from "./ubicaciones-desktop.module.css";
export const metadata: Metadata = {
  title: "Mis ubicaciones — Ruum Ruum",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export default async function PaginaUbicaciones() {
  return conCuenta((cuenta) => (
    <UserDashboardLayout
      usuario={cuenta.usuario}
      nombre={cuenta.usuario.nombre}
      correo={cuenta.correoRegistro}
      totalVehiculos={cuenta.vehiculos.length}
      notificaciones={construirNotificaciones(
        cuenta.usuario,
        cuenta.traslados ?? [],
      )}
      padding="ninguno"
      fixedContent
      dashboardHeader
      classNameContenido={s.shellContent}
      idContenido="desktopLocationsMainContent"
    >
      <div className={s.mobile}>
        <UbicacionesMovil
          ubicaciones={construirUbicaciones(
            cuenta.usuario,
            cuenta.traslados ?? [],
          )}
        />
      </div>
      <div className={s.desktop}>
        <UbicacionesDesktop
          key={cuenta.usuario.id}
          ubicaciones={construirUbicacionesBase(
            cuenta.usuario,
            cuenta.traslados ?? [],
          )}
          libretaInicial={leerLibreta(cuenta.usuario.preferencias)}
        />
      </div>
    </UserDashboardLayout>
  ));
}
