import Image from "next/image";
import type { ViajeLista } from "./useGestionTraslados";
import s from "./traslados-desktop.module.css";
import { EstadoTrasladoBreve } from "../../components/EstadoTrasladoBreve";
import { estadoVisibleTraslado } from "../../lib/traslado-presentacion";

export function EstadoTraslado({ viaje }: { viaje: ViajeLista }) {
  return <EstadoTrasladoBreve
    className={s.badge}
    estado={estadoVisibleTraslado(viaje.pasaporte, !viaje.pasaporte.traslado_id || !viaje.traslado)}
  />;
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
