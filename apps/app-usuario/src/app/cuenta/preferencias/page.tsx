import type { Metadata } from "next";
import { MobileShell } from "@ruum/ui";
import { NavegacionUsuario } from "../../NavegacionUsuario";
import { conCuenta } from "../cuenta-ui";
import { Preferencias } from "../Preferencias";
import { UserDashboardLayout } from "../../../components/layout/UserDashboardLayout";

export const metadata: Metadata = {
  title: "Preferencias — Ruum Ruum",
  robots: { index: false, follow: false },
};

export default async function PaginaPreferencias() {
  return conCuenta((cuenta) => (
    <>
      {/* VISTA MÓVIL (< 1024px) */}
      <div className="lg:hidden flex flex-col h-full w-full">
        <NavegacionUsuario variante="claro" nombreUsuario={cuenta.usuario?.nombre} />
        <MobileShell
          variant="compact"
          navInferiorVisible={false}
          as="main"
          className="user-v2-scope user-preferences-shell"
          contentClassName="user-preferences-content"
        >
          <Preferencias usuario={cuenta.usuario} />
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
                Mis preferencias
              </h1>
              <p className="mt-1 text-xs text-[var(--ruum-text-secondary)]">
                Configura notificaciones, tema visual, privacidad y métodos de contacto.
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--rr-border,#e3eaf3)] bg-[var(--rr-header-bg,#ffffff)] p-6 shadow-xs">
              <Preferencias usuario={cuenta.usuario} />
            </div>
          </div>
        </UserDashboardLayout>
      </div>
    </>
  ));
}
