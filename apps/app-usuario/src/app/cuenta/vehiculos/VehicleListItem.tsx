import type { Vehiculo } from "../cuenta-ui";

export function nombreVehiculo(vehiculo: Vehiculo) {
  return [vehiculo.marca, vehiculo.modelo, vehiculo.anio].map(valor => String(valor ?? "").trim()).filter(Boolean).join(" ") || "Vehículo sin información";
}
