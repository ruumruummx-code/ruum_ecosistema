import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { MobileShell } from "@ruum/ui";
import { NavegacionUsuario } from "../../../NavegacionUsuario";
import { conCuenta } from "../../cuenta-ui";
import { nombreVehiculo } from "../VehicleListItem";

export const metadata: Metadata = { title: "Detalle del vehículo — Ruum Ruum" };

export default async function PaginaDetalleVehiculo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return conCuenta((cuenta) => {
    const vehiculo = cuenta.vehiculos.find((item) => item.id === id);
    if (!vehiculo) notFound();
    const nombre = nombreVehiculo(vehiculo);
    return (
      <>
        <NavegacionUsuario variante="claro" nombreUsuario={cuenta.usuario?.nombre} />
        <MobileShell as="main" variant="compact" className="user-v2-scope user-vehicles-shell" contentClassName="user-vehicles-content">
          <Link href="/cuenta/vehiculos" className="mb-4 inline-flex min-h-11 items-center text-sm font-semibold underline">‹ Volver a mis vehículos</Link>
          <section className="rounded-2xl border border-[var(--user-color-border)] bg-[var(--user-color-surface)] p-4">
            <h2 className="break-words text-lg font-bold">{nombre}</h2>
            {vehiculo.alias && <p className="mt-1 text-sm text-[var(--user-color-muted)]">{vehiculo.alias}</p>}
            <dl className="mt-4 grid gap-4 text-sm">
              <div><dt className="text-[var(--user-color-muted)]">Placas</dt><dd className="font-semibold">{vehiculo.placas?.trim() || "Sin placas"}</dd></div>
              <div><dt className="text-[var(--user-color-muted)]">Color</dt><dd className="font-semibold">{vehiculo.color?.trim() || "No especificado"}</dd></div>
              <div><dt className="text-[var(--user-color-muted)]">VIN</dt><dd className="break-all font-mono">{vehiculo.vin?.trim() || "No especificado"}</dd></div>
            </dl>
            {!!vehiculo.fotos_urls?.length && <div className="mt-4 grid grid-cols-2 gap-2">
              {vehiculo.fotos_urls.map((foto, index) => <Image key={`${foto}-${index}`} src={foto} alt={`${nombre}, fotografía ${index + 1}`} width={320} height={220} className="h-auto w-full rounded-xl object-cover" unoptimized />)}
            </div>}
          </section>
        </MobileShell>
      </>
    );
  });
}
