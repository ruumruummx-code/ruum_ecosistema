"use client";
import { useState } from "react";
import Image from "next/image";
import type { SVGProps } from "react";
import type { Vehiculo } from "../cuenta-ui";
import { ETIQUETA_TIPO_VEHICULO } from "@ruum/shared/constants";
import {
  etiquetaTransmision,
  estadoVehiculo,
  imagenVehiculo,
} from "./vehiculos-model";
import s from "./vehiculos-desktop.module.css";
const paths = {
  car: "m4 10 2-6h12l2 6M3 10h18v9H3Zm2 9v2m14-2v2M6 14h2m8 0h2",
  check: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-14 0 3 3 7-7",
  tool: "m14 6 4 4 4-4a7 7 0 0 1-9 9l-7 7-4-4 7-7a7 7 0 0 1 9-9Z",
  file: "M14 2H5v20h14V7Zm0 0v6h5M8 12h8M8 16h6",
  gear: "M12 2v20M6 4v6H3V4m15 0v6h3V4M3 16v4h6v-4m6 0v4h6v-4M6 10h12M6 16h12",
  fuel: "M4 21V3h10v18M3 21h12M6 5h6v6H6Zm8 7h2v5c0 4 5 4 5 0V7l-3-3m1 2-2 2 4 4",
  search: "M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Zm-2 5 6 6",
  filter: "M4 7h16M4 17h16M8 4v6m8 4v6",
  more: "M4 12h.01M12 12h.01M20 12h.01",
  edit: "m15 3 6 6-12 12H3v-6Zm-2 2 6 6",
  refresh: "M20 8a9 9 0 0 0-15-3L2 8m0-6v6h6m-4 8a9 9 0 0 0 15 3l3-3m0 6v-6h-6",
  plus: "M12 4v16M4 12h16",
  calendar: "M4 5h16v16H4Zm0 5h16M8 2v6m8-6v6",
  color: "m14 3 7 7-11 11H3v-7Zm0 5h.01",
  vin: "M4 3h16v18H4Zm4 4v3m4-3v3m4-3v3M8 14v3m4-3v3m4-3v3",
  wheel: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 10h18M12 10v11m-6-3 6-8 6 8",
  close: "m5 5 14 14M19 5 5 19",
  arrow: "M4 12h16m-6-6 6 6-6 6",
  chevron: "m9 5 7 7-7 7",
} as const;
export type IconoVehiculoNombre = keyof typeof paths;
export function IconoVehiculo({
  name,
  ...props
}: SVGProps<SVGSVGElement> & { name: IconoVehiculoNombre }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={paths[name]} />
    </svg>
  );
}
export function ImagenVehiculo({
  vehiculo,
  grande = false,
}: {
  vehiculo: Vehiculo;
  grande?: boolean;
}) {
  const src = imagenVehiculo(vehiculo, grande);
  const [fallida, setFallida] = useState(false);
  const tipo =
    vehiculo.tipo === "pick_up"
      ? "pickup"
      : vehiculo.tipo === "suv"
        ? "suv"
        : "sedan";
  const fallback = `/imagenes/${grande ? "dashboard" : "traslados"}-${tipo}.webp`;
  return (
    <Image
      className={grande ? s.heroImage : s.thumbnail}
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
export function EstadoVehiculo({ vehiculo }: { vehiculo: Vehiculo }) {
  const estado = estadoVehiculo(vehiculo);
  return (
    <span
      className={s.statusBadge}
      data-status={estado}
      title={
        estado === "revision"
          ? "El vehículo no está declarado apto para circular rodando."
          : estado === "pendiente"
            ? "Confirma la información operativa del vehículo."
            : "Declarado apto para circular rodando."
      }
    >
      <IconoVehiculo name="check" />
      {estado === "disponible"
        ? "Disponible"
        : estado === "revision"
          ? "En revisión"
          : "Por confirmar"}
    </span>
  );
}
export function AtributosVehiculo({
  vehiculo,
  detalle = false,
}: {
  vehiculo: Vehiculo;
  detalle?: boolean;
}) {
  const atributos = [
    ["car", ETIQUETA_TIPO_VEHICULO[vehiculo.tipo] || "No registrado", "Tipo"],
    ["gear", etiquetaTransmision(vehiculo), "Transmisión"],
    ["fuel", "No registrado", "Combustible"],
  ] as const;
  return (
    <div className={detalle ? s.quickAttributes : s.attributes}>
      {atributos.map(([icon, label, caption]) => (
        <div key={caption}>
          <span>
            <IconoVehiculo name={icon} />
          </span>
          <p>
            {label}
            {detalle && <small>{caption}</small>}
          </p>
        </div>
      ))}
    </div>
  );
}
