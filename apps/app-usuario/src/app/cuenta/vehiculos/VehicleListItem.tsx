import Link from "next/link";
import type { Vehiculo } from "../cuenta-ui";

export function nombreVehiculo(vehiculo: Vehiculo) {
  return [vehiculo.marca, vehiculo.modelo, vehiculo.anio].filter(Boolean).join(" ") || "Vehículo";
}

export function VehicleListItem({ vehiculo }: { vehiculo: Vehiculo }) {
  const nombre = nombreVehiculo(vehiculo);
  return (
    <li>
      <Link href={`/cuenta/vehiculos/${vehiculo.id}`} className="flex min-h-18 items-center gap-3 px-3 py-3 transition-colors hover:bg-[var(--user-color-brand-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--user-color-action)]">
        <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--user-color-brand-soft)] text-xl">
          {vehiculo.tipo === "suv" ? "🚙" : "🚗"}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold text-[var(--user-color-primary)]" title={nombre}>{nombre}</span>{" "}
          <span className="block truncate text-sm text-[var(--user-color-muted)]">{vehiculo.placas?.trim() || "Sin placas"}</span>
        </span>
        <svg aria-hidden="true" className="size-5 shrink-0 text-[var(--user-color-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 6 6 6-6 6" /></svg>
      </Link>
    </li>
  );
}
