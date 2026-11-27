"use client";
import { useState } from "react";
import Image from "next/image";
import { Car, CircleCheck, Cog, Fuel } from "lucide-react";
import { Badge, cn } from "@ruum/ui/base";
import type { Vehiculo } from "../cuenta-ui";
import { ETIQUETA_TIPO_VEHICULO } from "@ruum/shared/constants";
import { etiquetaTransmision, estadoVehiculo, imagenVehiculo } from "./vehiculos-model";

export function ImagenVehiculo({ vehiculo, grande = false }: { vehiculo: Vehiculo; grande?: boolean }) {
  const src = imagenVehiculo(vehiculo, grande);
  const [fallida, setFallida] = useState(false);
  const tipo = vehiculo.tipo === "pick_up" ? "pickup" : vehiculo.tipo === "suv" ? "suv" : "sedan";
  const fallback = `/imagenes/${grande ? "dashboard" : "traslados"}-${tipo}.webp`;
  return (
    <Image
      className={cn(
        "bg-ui-muted object-contain",
        grande ? "aspect-[3/2] h-auto max-h-full w-full rounded-lg" : "aspect-[3/2] h-auto w-20 shrink-0 rounded-md sm:w-24",
      )}
      src={fallida ? fallback : src}
      alt={
        src === fallback || fallida
          ? `Render ilustrativo de ${tipo === "sedan" ? "sedán" : tipo}`
          : `Fotografía de ${vehiculo.marca} ${vehiculo.modelo}`
      }
      width={grande ? 960 : 240}
      height={grande ? 640 : 160}
      sizes={grande ? "(min-width:1600px) 400px, 300px" : "100px"}
      unoptimized
      onError={() => {
        if (!fallida) setFallida(true);
      }}
    />
  );
}

const ESTADO = {
  disponible: { tone: "success", etiqueta: "Disponible", titulo: "Declarado apto para circular rodando." },
  revision: { tone: "warning", etiqueta: "En revisión", titulo: "El vehículo no está declarado apto para circular rodando." },
  pendiente: { tone: "neutral", etiqueta: "Por confirmar", titulo: "Confirma la información operativa del vehículo." },
} as const;

export function EstadoVehiculo({ vehiculo }: { vehiculo: Vehiculo }) {
  const estado = ESTADO[estadoVehiculo(vehiculo)];
  return (
    <Badge tone={estado.tone} title={estado.titulo}>
      <CircleCheck aria-hidden="true" className="size-3.5" />
      {estado.etiqueta}
    </Badge>
  );
}

export function AtributosVehiculo({ vehiculo, detalle = false, className }: { vehiculo: Vehiculo; detalle?: boolean; className?: string }) {
  const atributos = [
    [Car, ETIQUETA_TIPO_VEHICULO[vehiculo.tipo] || "No registrado", "Tipo"],
    [Cog, etiquetaTransmision(vehiculo), "Transmisión"],
    [Fuel, "No especificado", "Combustible"],
  ] as const;
  return (
    <div className={cn(detalle ? "grid grid-cols-3 gap-2" : "flex flex-wrap gap-x-4 gap-y-1", className)}>
      {atributos.map(([Icono, etiqueta, rotulo]) => (
        <div
          key={rotulo}
          className={cn("flex items-center gap-1.5 text-sm text-ui-fg-muted", detalle && "rounded-md bg-ui-muted px-2 py-2")}
        >
          <Icono aria-hidden="true" className="size-4 shrink-0" />
          <p className="min-w-0">
            <span className={cn(detalle && "block font-medium text-ui-fg")}>{etiqueta}</span>
            {detalle && <small className="block text-xs">{rotulo}</small>}
          </p>
        </div>
      ))}
    </div>
  );
}
