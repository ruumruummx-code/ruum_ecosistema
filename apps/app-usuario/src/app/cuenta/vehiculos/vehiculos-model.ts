import type { Database } from "@ruum/shared/types";
import type { Vehiculo } from "../cuenta-ui";

export type TrasladoVehiculo =
  Database["public"]["Views"]["pasaporte_digital"]["Row"];
export const normalizarVehiculo = (valor: string) =>
  valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
/** Availability is based on the recorded roadworthiness declaration, never the row position. */
export function estadoVehiculo(
  v: Vehiculo,
): "disponible" | "revision" | "pendiente" {
  return v.puede_circular_rodando === true
    ? "disponible"
    : v.puede_circular_rodando === false
      ? "revision"
      : "pendiente";
}
export function etiquetaTransmision(v: Vehiculo): string {
  return v.transmision === "automatica"
    ? "Automático"
    : v.transmision === "manual"
      ? "Manual"
      : v.transmision === "electrica"
        ? "Eléctrica"
        : v.transmision?.trim() || "No registrada";
}
export function imagenVehiculo(v: Vehiculo, grande = false): string {
  const foto = v.fotos_urls?.find((url) => /^(https?:\/\/|\/(?!\/))/.test(url));
  if (foto) return foto;
  const tipo =
    v.tipo === "pick_up" ? "pickup" : v.tipo === "suv" ? "suv" : "sedan";
  return `/imagenes/${grande ? "dashboard" : "traslados"}-${tipo}.webp`;
}
export function fechaVehiculo(valor: string | null | undefined): string {
  if (!valor || !Number.isFinite(Date.parse(valor)))
    return "Fecha no disponible";
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: "America/Mexico_City",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(valor));
}
