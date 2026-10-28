import Image from "next/image";
import { pestañaDeViaje, type ViajeLista } from "./useGestionTraslados";
import s from "./traslados-desktop.module.css";
export function EstadoTraslado({ viaje }: { viaje: ViajeLista }) {
  const tipo = pestañaDeViaje(viaje.pasaporte);
  return (
    <span className={s.badge} data-status={tipo}>
      <i />
      {tipo === "activos"
        ? viaje.pasaporte.estado === "traslado_en_curso"
          ? "En tránsito"
          : "En curso"
        : tipo === "finalizados"
          ? "Completado"
          : tipo === "programados"
            ? "Programado"
            : "Cancelado"}
    </span>
  );
}
export function VehiculoTraslado({
  viaje,
  grande = false,
}: {
  viaje: ViajeLista;
  grande?: boolean;
}) {
  const tipo = viaje.pasaporte.vehiculo_tipo;
  const imagen =
    tipo === "pick_up" ? "pickup" : tipo === "suv" ? "suv" : "sedan";
  return (
    <Image
      className={grande ? s.heroCar : s.car}
      src={`/imagenes/traslados-${imagen}.webp`}
      width={grande ? 240 : 120}
      height={grande ? 134 : 68}
      alt={`Ilustración de ${imagen === "sedan" ? "sedán" : imagen}`}
      sizes={grande ? "110px" : "65px"}
      unoptimized
    />
  );
}
