import type { CuentaReal } from "./cuenta-ui";
import { ETIQUETA_ESTADO_TRASLADO } from "@ruum/shared/states";
export interface ActividadCuenta {
  id: string;
  titulo: string;
  fecha: string;
  etiqueta: string;
  tono: "green" | "blue" | "orange" | "gray";
  icono: "car" | "pin" | "user";
  href: string;
}
export function fechaCuenta(valor: string): string {
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: "America/Mexico_City",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(valor));
}
export function antiguedadCuenta(
  fecha: string | null | undefined,
  ahora = new Date(),
): string {
  if (
    !fecha ||
    !Number.isFinite(Date.parse(fecha)) ||
    Date.parse(fecha) > ahora.getTime()
  )
    return "—";
  const inicio = new Date(fecha);
  let anios = ahora.getUTCFullYear() - inicio.getUTCFullYear();
  if (
    ahora.getUTCMonth() < inicio.getUTCMonth() ||
    (ahora.getUTCMonth() === inicio.getUTCMonth() &&
      ahora.getUTCDate() < inicio.getUTCDate())
  )
    anios--;
  return anios > 0 ? `${anios} ${anios === 1 ? "año" : "años"}` : "< 1 año";
}
export function actividadCuenta(cuenta: CuentaReal): ActividadCuenta[] {
  const actividad: ActividadCuenta[] = [];
  for (const t of cuenta.traslados ?? []) {
    if (
      !t.traslado_id ||
      !t.creado_en ||
      !Number.isFinite(Date.parse(t.creado_en))
    )
      continue;
    const terminal =
      t.estado === "servicio_cancelado" || t.estado === "traslado_fallido";
    const completado =
      t.estado === "servicio_cerrado" || t.estado === "entrega_confirmada";
    actividad.push({
      id: `traslado-${t.traslado_id}`,
      titulo: `Traslado ${[t.vehiculo_marca, t.vehiculo_modelo, t.vehiculo_anio].filter(Boolean).join(" ") || t.traslado_id.slice(0, 8).toUpperCase()}`,
      fecha: t.creado_en,
      etiqueta:
        t.estado === "traslado_en_curso"
          ? "En tránsito"
          : t.estado === "servicio_cerrado"
            ? "Completado"
            : t.estado
              ? ETIQUETA_ESTADO_TRASLADO[t.estado]
              : "Estado pendiente",
      tono: terminal
        ? "gray"
        : completado || t.estado === "traslado_en_curso"
          ? "green"
          : "blue",
      icono: "car",
      href: `/viajes/${t.traslado_id}`,
    });
  }
  for (const v of cuenta.vehiculos) {
    if (!v.creado_en || !Number.isFinite(Date.parse(v.creado_en))) continue;
    actividad.push({
      id: `vehiculo-${v.id}`,
      titulo: `Vehículo registrado · ${[v.marca, v.modelo].filter(Boolean).join(" ")}`,
      fecha: v.creado_en,
      etiqueta: "Registrado",
      tono: "blue",
      icono: "car",
      href: `/cuenta/vehiculos/${v.id}`,
    });
  }
  return actividad
    .sort((a, b) => Date.parse(b.fecha) - Date.parse(a.fecha))
    .slice(0, 4);
}
export function direccionCuenta(usuario: CuentaReal["usuario"]): string[] {
  const calle = [usuario.calle, usuario.numero]
    .filter((v) => v?.trim())
    .join(" ");
  if (!calle && usuario.direccion_principal?.trim())
    return [
      usuario.direccion_principal,
      [usuario.ciudad, usuario.estado].filter(Boolean).join(", "),
    ].filter(Boolean);
  return [
    calle,
    [usuario.colonia, usuario.codigo_postal]
      .filter((v) => v?.trim())
      .join(", "),
    [usuario.ciudad, usuario.estado].filter((v) => v?.trim()).join(", "),
  ].filter(Boolean);
}
