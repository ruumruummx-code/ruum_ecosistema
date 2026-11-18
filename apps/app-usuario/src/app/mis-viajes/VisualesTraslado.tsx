import Image from "next/image";
import { Badge, cn } from "@ruum/ui/base";
import type { ViajeLista } from "./useGestionTraslados";
import { presentarViaje } from "./presentacion";

/** Insignia de estado con el detalle completo disponible para lectores y al pasar el cursor. */
export function EstadoTraslado({ viaje, className }: { viaje: ViajeLista; className?: string }) {
  const { estado, tono } = presentarViaje(viaje);
  return (
    <Badge tone={tono} dot title={estado.detalle} className={className}>
      {estado.etiqueta}
      {estado.detalle && <span className="sr-only">: {estado.detalle}</span>}
    </Badge>
  );
}

export function VehiculoTraslado({ viaje, grande = false, className }: { viaje: ViajeLista; grande?: boolean; className?: string }) {
  const tipo = viaje.pasaporte.vehiculo_tipo;
  const imagen = tipo === "pick_up" ? "pickup" : tipo === "suv" ? "suv" : "sedan";
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-md bg-ui-muted",
        grande ? "h-20 w-32" : "h-12 w-16",
        className,
      )}
    >
      <Image
        className="h-auto w-[88%] object-contain"
        src={`/imagenes/traslados-${imagen}.webp`}
        width={grande ? 240 : 120}
        height={grande ? 134 : 68}
        alt={`Ilustración de ${imagen === "sedan" ? "sedán" : imagen}`}
        sizes={grande ? "128px" : "64px"}
        unoptimized
      />
    </span>
  );
}
