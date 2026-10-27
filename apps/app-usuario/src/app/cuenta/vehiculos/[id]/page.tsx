import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { MobileShell } from "@ruum/ui";
import { ETIQUETA_TIPO_VEHICULO } from "@ruum/shared/constants";
import { NavegacionUsuario } from "../../../NavegacionUsuario";
import { conCuenta } from "../../cuenta-ui";
import { nombreVehiculo } from "../VehicleListItem";
import { UserDashboardLayout } from "../../../../components/layout/UserDashboardLayout";
import { construirNotificaciones } from "../../../../lib/inicio";

export const metadata: Metadata = { title: "Detalle del vehículo — Ruum Ruum" };

export default async function PaginaDetalleVehiculo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return conCuenta(cuenta => {
    const vehiculo = cuenta.vehiculos.find(item => item.id === id);
    if (!vehiculo) notFound();
    const nombre = nombreVehiculo(vehiculo);
    const fotos = (vehiculo.fotos_urls ?? []).filter(f => typeof f === "string" && /^(https?:\/\/|\/(?!\/))/.test(f));
    const detalle = <div className="mx-auto max-w-4xl space-y-5">
      <Link href="/cuenta/vehiculos" className="inline-flex min-h-11 items-center text-sm font-semibold underline">‹ Volver a mis vehículos</Link>
      <section aria-label="Detalle del vehículo" className="rounded-2xl border bg-[var(--ruum-surface)] p-6">
        <h1 className="break-words text-2xl font-bold">{nombre}</h1>
        {vehiculo.alias?.trim() && <p className="mt-2 text-sm text-[var(--ruum-text-secondary)]">{vehiculo.alias}</p>}
        <dl className="mt-5 grid gap-5 text-sm sm:grid-cols-2">
          <div><dt className="text-[var(--ruum-text-secondary)]">Placas</dt><dd className="font-semibold">{vehiculo.placas?.trim() || "Sin placas"}</dd></div>
          <div><dt className="text-[var(--ruum-text-secondary)]">Color</dt><dd className="font-semibold">{vehiculo.color?.trim() || "No especificado"}</dd></div>
          <div><dt className="text-[var(--ruum-text-secondary)]">VIN</dt><dd className="break-all font-mono">{vehiculo.vin?.trim() || "No especificado"}</dd></div>
          <div><dt className="text-[var(--ruum-text-secondary)]">Tipo</dt><dd>{vehiculo.tipo ? ETIQUETA_TIPO_VEHICULO[vehiculo.tipo] ?? vehiculo.tipo : "No especificado"}</dd></div>
        </dl>
        <div className="mt-6 flex flex-wrap gap-4 text-sm">
          <Link href={"/viajes/nuevo?" + new URLSearchParams({ vehiculo: vehiculo.id })} className="rounded-xl bg-blue-700 p-3 font-bold text-white">Solicitar traslado con este vehículo</Link>
          <Link href="/soporte" className="rounded-xl border p-3">Solicitar corrección de datos</Link>
        </div>
        <p className="mt-4 text-xs text-[var(--ruum-text-secondary)]">Revisa los datos y confirma el vehículo en el cotizador. Para corregir información del registro, contacta a soporte.</p>
        {fotos.length > 0 ? <div className="mt-5 grid gap-3 sm:grid-cols-2">{fotos.map((foto, i) => <Image key={foto + i} src={foto} alt={nombre + ", fotografía " + (i + 1)} width={480} height={320} className="h-auto w-full rounded-xl object-cover" unoptimized />)}</div> : <p className="mt-5 text-sm text-[var(--ruum-text-secondary)]">Sin fotografías registradas.</p>}
      </section>
    </div>;
    return <>
      <div className="lg:hidden"><NavegacionUsuario variante="claro" nombreUsuario={cuenta.usuario.nombre} /><MobileShell as="main" variant="compact" className="user-v2-scope user-vehicles-shell" contentClassName="user-vehicles-content">{detalle}</MobileShell></div>
      <div className="hidden lg:flex h-full w-full overflow-hidden"><UserDashboardLayout usuario={cuenta.usuario} nombre={cuenta.usuario.nombre} correo={cuenta.correoRegistro} totalVehiculos={cuenta.vehiculos.length} notificaciones={construirNotificaciones(cuenta.usuario, cuenta.traslados ?? [])}>{detalle}</UserDashboardLayout></div>
    </>;
  });
}
