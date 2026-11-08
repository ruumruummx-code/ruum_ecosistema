import type { Metadata } from "next";
import Link from "next/link";
import { VehiculosDesktop } from "./VehiculosDesktop";
import { construirNotificaciones } from "../../../lib/inicio";
import { MobileShell } from "@ruum/ui";
import { NavegacionUsuario } from "../../NavegacionUsuario";
import { conCuenta } from "../cuenta-ui";
import { VehicleListItem } from "./VehicleListItem";
import { UserDashboardLayout } from "../../../components/layout/UserDashboardLayout";

export const metadata: Metadata = {
  title: "Mis vehículos — Ruum Ruum",
  robots: { index: false, follow: false },
};

export default async function PaginaVehiculos() {
  return conCuenta((cuenta) => (
    <>
      {/* VISTA MÓVIL (< 1024px): Intacta para mobile-first */}
      <div className="lg:hidden flex flex-col h-full w-full">
        <NavegacionUsuario
          variante="claro"
          nombreUsuario={cuenta.usuario?.nombre}
        />
        <MobileShell
          as="main"
          variant="compact"
          className="user-v2-scope user-vehicles-shell"
          contentClassName="user-vehicles-content"
        >
          <Link href="/cuenta/vehiculos/nuevo" className="mb-4 block rounded-xl bg-blue-700 px-4 py-3 text-center font-semibold text-white">Registrar nuevo vehículo</Link>
          {cuenta.vehiculos.length > 0 ? (
            <ul
              aria-label="Vehículos guardados"
              className="overflow-hidden rounded-2xl border border-[var(--user-color-border)] bg-[var(--user-color-surface)] divide-y divide-[var(--user-color-border)]"
            >
              {cuenta.vehiculos.map((vehiculo) => (
                <VehicleListItem key={vehiculo.id} vehiculo={vehiculo} />
              ))}
            </ul>
          ) : (
            <div className="py-10 text-center">
              <span aria-hidden="true" className="text-3xl">
                🚗
              </span>
              <h2 className="mt-3 text-lg font-bold">
                Sin vehículos registrados
              </h2>
              <p className="mx-auto mt-1 max-w-72 text-sm text-[var(--user-color-muted)]">
                Registra tu vehículo desde esta sección para usarlo en próximas solicitudes.
              </p>
            </div>
          )}
        </MobileShell>
      </div>

      {/* VISTA ESCRITORIO (>= 1024px): Shell unificado UserDashboardLayout */}
      <div className="hidden lg:flex h-full w-full">
        <UserDashboardLayout
          usuario={cuenta.usuario}
          nombre={cuenta.usuario?.nombre}
          correo={cuenta.correoRegistro}
          totalVehiculos={cuenta.vehiculos.length}
          notificaciones={construirNotificaciones(
            cuenta.usuario,
            cuenta.traslados ?? [],
          )}
          dashboardHeader
          padding="ninguno"
          idContenido="desktopVehiclesMainContent"
        >
          <VehiculosDesktop
            vehiculos={cuenta.vehiculos}
            traslados={cuenta.traslados ?? []}
          />
        </UserDashboardLayout>
      </div>
    </>
  ));
}
