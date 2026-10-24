"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ConductorIcon } from "@/components/icons";
import { claveDia, formatearDistancia, nombreVehiculo, type DetalleOperativo, type PasaporteRow } from "./trips-utils";
import { OfferRoutePreview } from "./OfferRoutePreview";
import styles from "./offer-preview.module.css";

export type AcceptedPreview = { label: string; tone: "pending" | "active" | "success"; onReject: () => void };

export function OfferPreviewCard({ viaje, detalle, hrefDetalle, mapPreview, accepted }: { viaje: PasaporteRow; detalle: DetalleOperativo; hrefDetalle: string; mapPreview?: ReactNode; accepted?: AcceptedPreview }) {
  const folio = viaje.traslado_id?.slice(0, 8).toUpperCase() ?? "SIN ID";
  const origen = viaje.origen_direccion || viaje.origen_ciudad || detalle.origen;
  const destino = viaje.destino_direccion || viaje.destino_ciudad || detalle.destino;
  const date = new Date(detalle.fechaHoraProgramada ?? "");
  const validDate = Number.isFinite(date.getTime());
  const day = validDate ? claveDia(date) === claveDia(new Date()) ? "Hoy" : new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", timeZone: "America/Mexico_City" }).format(date) : "Por confirmar";
  const time = validDate ? new Intl.DateTimeFormat("es-MX", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "America/Mexico_City" }).format(date) : "";
  const hours = viaje.tiempo_estimado_horas ?? detalle.tiempoEstimadoHoras;
  const minutes = hours != null && Number.isFinite(hours) ? Math.max(1, Math.round(hours * 60)) : null;
  const duration = minutes == null ? "Por confirmar" : `${Math.floor(minutes / 60) ? `${Math.floor(minutes / 60)} h ` : ""}${minutes % 60 || !Math.floor(minutes / 60) ? `${minutes % 60} min` : ""}`.trim();
  const price = viaje.ganancia_conductor ?? detalle.gananciaConductorOficial;
  const actionLabel = !accepted ? "Ver detalles de la oferta" : accepted.tone === "success" ? "VER TRASLADO" : accepted.tone === "active" ? "CONTINUAR TRASLADO" : "INICIAR TRASLADO";
  const primaryAction = <Link href={hrefDetalle} className={styles.action} prefetch={false}>{actionLabel} <span aria-hidden="true">→</span></Link>;
  return <article className={styles.card} data-offer-card={!accepted || undefined} data-accepted-card={accepted ? true : undefined} aria-label={`${accepted ? "Traslado aceptado" : "Oferta"} ${folio}`}>
    <div className={styles.top}><span className={styles.available} data-tone={accepted?.tone}><ConductorIcon name={accepted?.tone === "active" ? "truck" : "check"} />{accepted?.label ?? "Oferta disponible"}</span><button type="button" aria-label={`Copiar folio ${folio}`} onClick={() => { if (navigator.clipboard) void navigator.clipboard.writeText(folio); }}>ID {folio}</button></div>
    <div className={styles.summary}>
      <div className={styles.priceBlock}><strong>{price == null ? "Por confirmar" : new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(price)}</strong>{price != null && <span>MXN</span>}<p>{nombreVehiculo(viaje)}</p></div>
      <div className={styles.schedule}><ConductorIcon name="clock" /><div><span>{day}</span><time dateTime={validDate ? date.toISOString() : undefined}>{time}</time></div></div>
    </div>
    <dl className={styles.route}>
      <div><dt>Origen</dt><dd title={origen}>{origen}</dd></div>
      <div><dt>Destino</dt><dd title={destino}>{destino}</dd></div>
    </dl>
    <div className={styles.stats}>
      <span><ConductorIcon name="gps" /><span>{formatearDistancia(viaje.distancia_km ?? detalle.distanciaKm)}</span></span>
      <span><ConductorIcon name="clock" /><span>{minutes == null ? duration : `Aprox. ${duration}`}</span></span>
      <span><ConductorIcon name="bank" /><span>Peaje: por confirmar</span></span>
    </div>
    {mapPreview ? <div className={styles.previewMap} data-offer-map>{mapPreview}</div> : <OfferRoutePreview viaje={viaje} />}
    <div className={styles.badges} data-offer-badges>
      <span><ConductorIcon name="car" /><span>Vehículo<small>Con conductor</small></span></span>
      <span><ConductorIcon name="shield" /><span>Viaje seguro<small>Ver condiciones</small></span></span>
      <span><ConductorIcon name="card" /><span>Pago en app<small>{viaje.tipo_pago === "anticipado" ? "Anticipado" : viaje.tipo_pago === "al_cierre" ? "Al cierre" : "Por confirmar"}</small></span></span>
    </div>
    {accepted ? <div className={styles.actionRow}>{primaryAction}<button type="button" className={styles.options} onClick={accepted.onReject} aria-label="Opciones de traslado" aria-haspopup="dialog">•••</button></div> : primaryAction}
  </article>;
}
