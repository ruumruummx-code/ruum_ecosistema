import type { Metadata } from "next";
import { MobileShell } from "@ruum/ui";
import { NavegacionUsuario } from "../../NavegacionUsuario";
import { conCuenta } from "../cuenta-ui";
import { DatosPersonales } from "../DatosPersonales";
import { UserDashboardLayout } from "../../../components/layout/UserDashboardLayout";

export const metadata: Metadata = {
  title: "Mi perfil — Ruum Ruum",
  robots: { index: false, follow: false },
};

export default async function PaginaDatosPersonales() {
  return conCuenta((cuenta) => (
    <>
      {/* VISTA MÓVIL (< 1024px) */}
      <div className="lg:hidden flex flex-col h-full w-full">
        <NavegacionUsuario variante="claro" nombreUsuario={cuenta.usuario?.nombre} />
        <MobileShell
          variant="compact"
          as="main"
          className="user-v2-scope user-profile-shell"
          contentClassName="user-profile-content"
        >
          <DatosPersonales
            correoRegistro={cuenta.correoRegistro}
            usuario={cuenta.usuario}
            fotoUrlInicial={cuenta.fotoPerfilUrl}
          />
        </MobileShell>
      </div>

      {/* VISTA ESCRITORIO (>= 1024px): Con UserDashboardLayout */}
      <div className="hidden lg:flex h-full w-full overflow-hidden">
        <UserDashboardLayout
          usuario={cuenta.usuario}
          nombre={cuenta.usuario?.nombre}
          correo={cuenta.correoRegistro}
          totalVehiculos={cuenta.vehiculos.length}
        >
          <div className="mx-auto max-w-4xl space-y-6">
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--ruum-text)]">
                Mi perfil
              </h1>
              <p className="mt-1 text-xs text-[var(--ruum-text-secondary)]">
                Administra tus datos personales, información de contacto y verificación de identidad.
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--rr-border,#e3eaf3)] bg-[var(--rr-header-bg,#ffffff)] p-6 shadow-xs">
              <DatosPersonales
                correoRegistro={cuenta.correoRegistro}
                usuario={cuenta.usuario}
                fotoUrlInicial={cuenta.fotoPerfilUrl}
              />
            </div>
          </div>
        </UserDashboardLayout>
      </div>
    </>
  ));
}
