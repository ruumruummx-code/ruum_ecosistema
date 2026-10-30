"use client";

import type { OportunidadAsignacion } from "@ruum/api/services";
import { useState } from "react";
import { ConductorIcon } from "@/components/icons";
import { chatDisponible } from "@ruum/shared/rules";
import { TEXTOS_CARGANDO } from "@ruum/shared/constants";
import { nombreVehiculo, formatearDistancia, type PasaporteRow } from "../trips-utils";
import { OfferRoutePreview } from "../OfferRoutePreview";
import { TripActionDock, useTripReturnPath } from "./TripOperationalFrame";
import { TripDialog } from "./TripDialog";
import { ChatViaje } from "./ChatViaje";
import styles from "./opportunity-details.module.css";

function address(city: string | null, street: string | null) {
  if (!street) return city || "Dirección por confirmar";
  return city && !street.toLocaleLowerCase("es-MX").includes(city.toLocaleLowerCase("es-MX")) ? `${street}, ${city}` : street;
}

export function OpportunityDetailsView({ oportunidad, pasaporte, volver, procesando, error, avisoExito, ofertaTomada, solicitudEnviada, onAccept, onReject }: {
  oportunidad: OportunidadAsignacion | null;
  pasaporte: PasaporteRow; volver: string; procesando: boolean; error: string | null; avisoExito: string | null;
  ofertaTomada: boolean; solicitudEnviada: boolean; onAccept: () => void; onReject: () => void;
}) {
  useTripReturnPath(volver);
  const [dialog, setDialog] = useState<"messages" | "vehicle" | null>(null);
  const vehicle = nombreVehiculo(pasaporte);
  const origen = address(pasaporte.origen_ciudad, pasaporte.origen_direccion);
  const destino = address(pasaporte.destino_ciudad, pasaporte.destino_direccion);
  const hours = pasaporte.tiempo_estimado_horas;
  const minutes = hours != null && Number.isFinite(hours) ? Math.max(1, Math.round(hours * 60)) : null;
  const duration = minutes == null ? "Por confirmar" : `Aprox. ${Math.floor(minutes / 60) ? `${Math.floor(minutes / 60)} h ` : ""}${minutes % 60 ? `${minutes % 60} min` : ""}`.trim();
  const status = ofertaTomada ? "Esta oferta ya fue asignada a otro conductor." : avisoExito || (oportunidad?.modo === "dirigida" ? "Oferta dirigida: confirma para aceptar la asignación." : "Registra tu solicitud y espera la resolución del servidor.");
  const disabled = procesando || ofertaTomada || solicitudEnviada;

  return <>
    <section className={styles.screen} data-opportunity-detail aria-label="Detalle de oferta de traslado">
      <h1 className={styles.srOnly}>Detalle de oferta</h1>
      <div className={styles.summary}>
        <div className={styles.earning}><span>Ganancia <small>MXN</small></span><strong>{pasaporte.ganancia_conductor == null ? "Por confirmar" : new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(pasaporte.ganancia_conductor)}</strong></div>
        <button type="button" className={styles.vehicle} onClick={() => setDialog("vehicle")} aria-label={`Ver información de ${vehicle} y referencias`} aria-haspopup="dialog"><ConductorIcon name="car" /><span>{vehicle}<small>{[pasaporte.vehiculo_color, pasaporte.vehiculo_placas].filter(Boolean).join(" · ") || "Ver información"}</small></span></button>
      </div>
      <dl className={styles.route}>
        <div><dt>Origen</dt><dd>{origen}</dd></div>
        <div><dt>Destino</dt><dd>{destino}</dd></div>
      </dl>
      <div className={styles.map} data-opportunity-map><OfferRoutePreview viaje={pasaporte} /></div>
      <div className={styles.stats}>
        <span><ConductorIcon name="gps" /><span><small>Distancia</small>{formatearDistancia(pasaporte.distancia_km)}</span></span>
        <span><ConductorIcon name="clock" /><span><small>Duración</small>{duration}</span></span>
      </div>
    </section>
    <TripActionDock status={status} error={error}>
      <div className={styles.actions}>
      <div className={styles.secondary}>
        <button type="button" className={styles.reject} onClick={onReject} disabled={disabled}>Rechazar</button>
        <button type="button" onClick={() => setDialog("messages")} aria-haspopup="dialog"><ConductorIcon name="mail" />Mensajes</button>
      </div>
      {oportunidad && !oportunidad.elegible && <p role="alert">No puedes solicitar este traslado: {(oportunidad.motivos ?? []).map(m => m.replaceAll("_", " ")).join(", ")}. La disponibilidad se valida en el servidor.</p>}
      {oportunidad?.expira_en && <p>Oferta vigente hasta {new Date(oportunidad.expira_en).toLocaleString("es-MX")}</p>}
      <button type="button" className={styles.accept} onClick={onAccept} disabled={disabled || !oportunidad?.elegible}>{procesando ? TEXTOS_CARGANDO.actualizando : solicitudEnviada ? "SOLICITUD REGISTRADA · ESPERANDO RESOLUCIÓN" : oportunidad?.modo === "dirigida" ? "ACEPTAR OFERTA DIRIGIDA" : "SOLICITAR ASIGNACIÓN"}</button>
      </div>
    </TripActionDock>
    {dialog === "messages" && <TripDialog title="Mensajes del traslado" onClose={() => setDialog(null)}>
      {pasaporte.estado && chatDisponible(pasaporte.estado) ? <ChatViaje trasladoId={pasaporte.traslado_id!} estado={pasaporte.estado} /> : <p className="text-sm">El chat se habilita cuando se asigna el traslado a tu cuenta. Mientras es una oferta puedes contactar al equipo desde Soporte.</p>}
    </TripDialog>}
    {dialog === "vehicle" && <TripDialog title="Vehículo y referencias" onClose={() => setDialog(null)}>
      <dl className={styles.info}>
        <div><dt>Vehículo</dt><dd>{vehicle}</dd></div>
        <div><dt>Color</dt><dd>{pasaporte.vehiculo_color || "Por confirmar"}</dd></div>
        <div><dt>Placas</dt><dd>{pasaporte.vehiculo_placas || "Por confirmar"}</dd></div>
        <div><dt>Origen</dt><dd>{origen}</dd></div>
        <div><dt>Referencias de origen</dt><dd>{pasaporte.origen_referencias || "Sin referencias adicionales"}</dd></div>
        <div><dt>Destino</dt><dd>{destino}</dd></div>
        <div><dt>Referencias de destino</dt><dd>{pasaporte.destino_referencias || "Sin referencias adicionales"}</dd></div>
      </dl>
      {pasaporte.origen_lat != null && pasaporte.origen_lng != null && <a className={styles.navigation} href={`https://www.google.com/maps/dir/?api=1&destination=${pasaporte.origen_lat},${pasaporte.origen_lng}`} target="_blank" rel="noopener noreferrer">Navegar al punto de recolección →</a>}
    </TripDialog>}
  </>;
}
