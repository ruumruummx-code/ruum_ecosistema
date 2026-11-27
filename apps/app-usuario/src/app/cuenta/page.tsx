import type { Metadata } from "next";
import { MobileShell } from "@ruum/ui";
import { NavegacionUsuario } from "../NavegacionUsuario";
import { UserDashboardLayout } from "../../components/layout/UserDashboardLayout";
import { construirNotificaciones } from "../../lib/inicio";
import { Cuenta } from "./Cuenta";
import { nombreVisibleCuenta } from "./cuenta-utils";
import { conCuenta } from "./cuenta-ui";

export const metadata: Metadata = {
  title: "Mi cuenta — Ruum Ruum",
  robots: { index: false, follow: false },
};

/* Una sola pantalla (Cuenta) dentro del marco de navegación de cada tamaño:
   barra inferior en móvil, barra lateral desde 1024 px.
   A-4 (auditoría): conCuenta distingue "sin sesión", "Supabase caído" y cuenta real. */
export default async function PaginaCuenta({ searchParams }: { searchParams?: Promise<{ seccion?: string }> }) {
  const seccion = (await searchParams)?.seccion;
  return conCuenta((cuenta) => {
    const nombre = nombreVisibleCuenta(cuenta.usuario?.nombre);
    const notificaciones = construirNotificaciones(cuenta.usuario, cuenta.traslados ?? []);
    return (
      <>
        <div className="flex h-full w-full flex-col lg:hidden" data-marco="movil">
          <NavegacionUsuario variante="claro" nombreUsuario={nombre} notificaciones={notificaciones} />
          <MobileShell as="main" variant="wide" padding="none" conFondoCanvas={false} navInferiorVisible className="bg-ui-bg">
            <Cuenta cuenta={cuenta} seccionInicial={seccion} marco="movil" />
          </MobileShell>
        </div>
        <div className="hidden h-full w-full lg:flex" data-marco="escritorio">
          <UserDashboardLayout
            usuario={cuenta.usuario}
            nombre={nombre}
            correo={cuenta.correoRegistro}
            totalVehiculos={cuenta.datosAuxiliaresCargados === false ? undefined : cuenta.vehiculos.length}
            notificaciones={notificaciones}
            padding="ninguno"
            classNameContenido="bg-ui-bg"
            idContenido="contenido-cuenta"
          >
            <Cuenta cuenta={cuenta} seccionInicial={seccion} marco="escritorio" />
          </UserDashboardLayout>
        </div>
      </>
    );
  });
}
