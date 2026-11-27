import { BriefcaseBusiness, House, MapPin, type LucideIcon } from "lucide-react";
import { Badge, cn } from "@ruum/ui/base";
import {
  ETIQUETAS_UBICACION,
  tipoUbicacion,
  type FuenteUbicacion,
  type UbicacionUsuario,
} from "./ubicaciones-usuario";

const TONO: Record<FuenteUbicacion, "info" | "success" | "warning" | "neutral"> = {
  perfil: "info",
  trabajo: "warning",
  origen: "success",
  destino: "neutral",
  otro: "neutral",
};

/** Etiquetas de los roles de la ubicación: el principal con color y los demás en contorno. */
export function EtiquetaUbicacion({ ubicacion, className }: { ubicacion: UbicacionUsuario; className?: string }) {
  const tipo = tipoUbicacion(ubicacion);
  return (
    <span className={cn("flex flex-wrap gap-1", className)}>
      <Badge tone={TONO[tipo]}>{ETIQUETAS_UBICACION[tipo]}</Badge>
      {ubicacion.fuentes
        .filter((f) => f !== tipo)
        .map((f) => (
          <Badge key={f} tone="outline" title={ETIQUETAS_UBICACION[f]}>
            {f === "origen" ? "Origen" : f === "destino" ? "Destino" : ETIQUETAS_UBICACION[f]}
          </Badge>
        ))}
    </span>
  );
}

export function iconoDeUbicacion(u: UbicacionUsuario): LucideIcon {
  return u.fuentes.includes("perfil") ? House : u.fuentes.includes("trabajo") ? BriefcaseBusiness : MapPin;
}

/** Icono de la ubicación dentro de un círculo con el tono de su rol principal. */
export function IconoUbicacion({ ubicacion, className }: { ubicacion: UbicacionUsuario; className?: string }) {
  const Icono = iconoDeUbicacion(ubicacion);
  const tipo = tipoUbicacion(ubicacion);
  return (
    <span
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-full",
        tipo === "perfil"
          ? "bg-ui-brand-soft text-ui-brand-soft-fg"
          : tipo === "trabajo"
            ? "bg-ui-warning-soft text-ui-warning"
            : tipo === "origen"
              ? "bg-ui-success-soft text-ui-success"
              : "bg-ui-muted text-ui-fg-muted",
        className,
      )}
    >
      <Icono aria-hidden="true" className="size-5" />
    </span>
  );
}

export function nombreUbicacion(u: UbicacionUsuario): string {
  return u.alias?.trim() || u.direccion.split(",")[0] || "Ubicación";
}
