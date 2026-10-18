import Link from "next/link";
import { formatearDistancia, formatearHora, nombreVehiculo, type DetalleOperativo, type PasaporteRow } from "./trips-utils";
import styles from "./traslados.module.css";

export function TripPreviewCard({ viaje, detalle, hrefDetalle, accepted }: { viaje: PasaporteRow; detalle: DetalleOperativo; hrefDetalle: string; accepted?: { label: string; onReject: () => void } }) {
  const folio = viaje.traslado_id?.slice(0, 8).toUpperCase() ?? "SIN ID";
  const origen = viaje.origen_direccion || viaje.origen_ciudad || detalle.origen;
  const destino = viaje.destino_direccion || viaje.destino_ciudad || detalle.destino;
  return <article className={styles.tripCard}>
    <div className={styles.tripTop}><span>{accepted?.label ?? "Oferta disponible"}</span><button type="button" aria-label={`Copiar folio ${folio}`} onClick={() => { if (navigator.clipboard) void navigator.clipboard.writeText(folio); }}>ID {folio}</button></div>
    <strong className={styles.tripAmount}>{viaje.ganancia_conductor == null ? "Por confirmar" : new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(viaje.ganancia_conductor)}</strong>
    <p className={styles.vehicle}>{nombreVehiculo(viaje)}</p>
    <div className={styles.route}><p title={origen}><span>Origen</span>{origen}</p><p title={destino}><span>Destino</span>{destino}</p></div>
    <p className={styles.tripStats}>{formatearHora(detalle.fechaHora)} · {formatearDistancia(viaje.distancia_km)}</p>
    <div className={styles.tripActions}><Link href={hrefDetalle} className={styles.primary} prefetch={false}>{accepted ? "INICIAR TRASLADO →" : "Ver oferta →"}</Link>{accepted && <button type="button" onClick={accepted.onReject} aria-label="Opciones de traslado">•••</button>}</div>
  </article>;
}
