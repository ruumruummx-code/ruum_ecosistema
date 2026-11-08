"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ConductorScreen } from "../../components/ConductorScreen";
import { EmergencyPanel } from "./EmergencyPanel";
import dynamic from "next/dynamic";
const ChatViaje = dynamic(() => import("./ChatViaje").then(module => module.ChatViaje), { loading: () => <p role="status">Cargando mensajes…</p> });
import { chatDisponible } from "@ruum/shared/rules";
import { TripDialog } from "./TripDialog";
import { TripSupportDialog } from "./TripSupportDialog";
import { SecondaryTripNavBar } from "./SecondaryTripNavBar";
import { createNavigationOptions, type NavigationOption } from "@/lib/navigation-launcher";
import type { PasaporteRow } from "../trips-utils";
import styles from "./trip-stage.module.css";

export type TripStageProps = {
  pasaporte: PasaporteRow; title: string; instruction: string; stateLabel: string;
  destination?: boolean; primaryLabel: string; onPrimary?: () => void; primaryHref?: string;
  busy?: boolean; disabled?: boolean; error?: string | null; notice?: string | null;
  backHref?: string; readOnly?: boolean; onChat?: () => void; extraTools?: ReactNode;
  children?: ReactNode; offer?: boolean; minimal?: boolean; onReject?: () => void;
};

/** Estado, punto actual y siguiente acción; el detalle completo se consulta a demanda. */
export function TripStage({ pasaporte, title, instruction, stateLabel, destination = false, primaryLabel, onPrimary, primaryHref, busy = false, disabled = false, error, notice, backHref = "/viajes", readOnly = false, onChat, extraTools, children, offer = false, minimal = false, onReject }: TripStageProps) {
  const [dialog, setDialog] = useState<"details" | "point" | "navigation" | "error" | "chat" | null>(null);
  const [support, setSupport] = useState(false);
  const [navigation, setNavigation] = useState<NavigationOption[]>([]);
  const id = pasaporte.traslado_id!;
  const city = destination ? pasaporte.destino_ciudad : pasaporte.origen_ciudad;
  const street = destination ? pasaporte.destino_direccion : pasaporte.origen_direccion;
  const references = destination ? pasaporte.destino_referencias : pasaporte.origen_referencias;
  const lat = destination ? pasaporte.destino_lat : pasaporte.origen_lat;
  const lng = destination ? pasaporte.destino_lng : pasaporte.origen_lng;
  const pointLabel = destination ? "Entrega" : "Recogida";
  const vehicle = [pasaporte.vehiculo_marca, pasaporte.vehiculo_modelo, pasaporte.vehiculo_anio].filter(Boolean).join(" ") || "Vehículo por confirmar";
  const canNavigate = !!street?.trim() || (lat != null && lng != null);
  const contactName = destination ? pasaporte.contacto_recepcion_nombre : pasaporte.contacto_entrega_nombre;
  const contactPhone = destination ? pasaporte.contacto_recepcion_telefono : pasaporte.contacto_entrega_telefono;
  const phone = contactPhone?.replace(/[^0-9+]/g, "");
  const value = (text: string | number | null | undefined) => text == null || text === "" ? "Por confirmar" : String(text);
  const money = pasaporte.ganancia_conductor == null ? "Por confirmar" : new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(pasaporte.ganancia_conductor);
  const openNavigation = () => { setNavigation(createNavigationOptions({ lat, lng, address: street || "" })); setDialog("navigation"); };
  const contact = !readOnly && !offer && <section className={styles.detailsSection} aria-label="Contacto del punto actual">
    <h3>Contacto de {destination ? "recepción" : "origen"}</h3><p>{value(contactName)}</p>
    {phone ? <a href={`tel:${phone}`}>Llamar al contacto</a> : <p>Sin teléfono registrado</p>}
    {pasaporte.estado && chatDisponible(pasaporte.estado) && <button type="button" onClick={onChat || (() => setDialog("chat"))}>Abrir chat del traslado</button>}
  </section>;

  return <div data-trip-stage className={minimal ? styles.minimal : undefined}>
    <ConductorScreen variant="operation" label="Resumen operativo del traslado" header={<header className={styles.safety} aria-label="Seguridad del traslado">
      <Link href={backHref} aria-label="Volver a Traslados" title="Volver a Traslados">←</Link>
      <p>Traslado<span>{id.slice(0, 8).toUpperCase()}</span></p>
      <button type="button" onClick={() => setSupport(true)} aria-label="Soporte" title="Soporte del traslado">Ayuda</button>
      {!readOnly && <EmergencyPanel trasladoId={id} compact headerPill pillLabel="SOS" />}
    </header>} footer={<section data-trip-primary className={styles.action} aria-label="Acción principal del traslado">
      {error && <div className={styles.error} role="alert"><p>{error.length <= 160 ? error : "No se pudo actualizar el traslado."}</p>{error.length > 160 && <button type="button" onClick={() => setDialog("error")}>Ver motivo completo</button>}</div>}
      {notice && <p role="status" className={styles.notice}>{notice}</p>}
      {primaryHref ? <Link href={primaryHref} className={styles.primary}>{primaryLabel}</Link> : <button type="button" className={styles.primary} disabled={busy || disabled} aria-busy={busy} onClick={onPrimary}>{busy ? "Actualizando…" : primaryLabel}</button>}
    </section>}>
      <div className={`${styles.content} ${readOnly ? styles.readOnly : ""}`}>
        <section className={styles.heading} aria-label="Estado y siguiente paso">
          <p className={styles.state} role="status">{stateLabel}</p>
          <h1>{title}</h1><p>{instruction}</p>
        </section>
        <button type="button" className={styles.point} aria-label={`Ver dirección completa de ${pointLabel.toLowerCase()}`} onClick={() => setDialog(offer ? "details" : "point")} aria-haspopup="dialog">
          <span className={styles.pointLabel}>{offer ? `${pasaporte.origen_ciudad || "Origen por confirmar"} → ${pasaporte.destino_ciudad || "Destino por confirmar"}` : `${pointLabel} · ${city || "Ciudad por confirmar"}`}</span>
          <span className={styles.address}>{offer ? `${pasaporte.origen_direccion || "Origen por confirmar"} → ${pasaporte.destino_direccion || "Destino por confirmar"}` : street || "Dirección por confirmar"}</span>
          <span className={styles.pointHint}>{offer ? "Ver ruta completa →" : "Ver dirección completa →"}</span>
        </button>
        {offer ? <p className={styles.vehicle}>Ganancia: <strong>{money}</strong></p> : <p className={styles.vehicle}>{vehicle} · <strong className={styles.plates}>{pasaporte.vehiculo_placas || "Placas por confirmar"}</strong></p>}
        <div className={styles.tools}>
          <button type="button" onClick={() => setDialog("details")} aria-haspopup="dialog">{readOnly ? "Ver detalle" : "Detalles y herramientas"}</button>
          {!readOnly && !offer && <button type="button" onClick={openNavigation} disabled={!canNavigate} aria-haspopup="dialog">Navegar</button>}
          {offer && onReject && <button type="button" onClick={onReject} disabled={disabled} aria-haspopup="dialog">Rechazar oferta</button>}
        </div>
        {children}
      </div>
    </ConductorScreen>
    {dialog === "point" && <TripDialog title="Dirección completa" onClose={() => setDialog(null)}>
      <div className={styles.detailsSection}><h3>{pointLabel}</h3><p>{value(city)}</p><p>{value(street)}</p><h3>Referencias</h3><p>{references || "Sin referencias adicionales"}</p>{contact}</div>
    </TripDialog>}
    {dialog === "details" && <TripDialog title="Detalles del traslado" onClose={() => setDialog(null)}>
      <div className={styles.detailsSection}>
        {!readOnly && !offer && <SecondaryTripNavBar trasladoId={id} pasaporte={pasaporte} />}
        <h3>Vehículo</h3><p>{vehicle}</p><dl className={styles.data}>
          <dt>Placas</dt><dd>{value(pasaporte.vehiculo_placas)}</dd><dt>VIN</dt><dd>{value(pasaporte.vehiculo_vin)}</dd><dt>Color</dt><dd>{value(pasaporte.vehiculo_color)}</dd>
          <dt>Origen</dt><dd>{[pasaporte.origen_ciudad, pasaporte.origen_direccion].filter(Boolean).join(" · ") || "Por confirmar"}</dd>
          <dt>Referencias de origen</dt><dd>{pasaporte.origen_referencias || "Sin referencias adicionales"}</dd>
          <dt>Destino</dt><dd>{[pasaporte.destino_ciudad, pasaporte.destino_direccion].filter(Boolean).join(" · ") || "Por confirmar"}</dd>
          <dt>Referencias de destino</dt><dd>{pasaporte.destino_referencias || "Sin referencias adicionales"}</dd>
          <dt>Ganancia del conductor</dt><dd>{money}</dd><dt>Distancia</dt><dd>{pasaporte.distancia_km == null ? "Por confirmar" : `${pasaporte.distancia_km} km`}</dd>
          <dt>Duración estimada</dt><dd>{pasaporte.tiempo_estimado_horas == null ? "Por confirmar" : `${pasaporte.tiempo_estimado_horas} h`}</dd>
        </dl>{contact}{extraTools}
        <Link href={`/viajes/${id}/detalles`}>Abrir expediente completo</Link>
      </div>
    </TripDialog>}
    {dialog === "navigation" && <TripDialog title="Elegir navegación" onClose={() => setDialog(null)}>
      <div className={styles.detailsSection}><p>{street}</p>{navigation.map(option => <a key={option.id} href={option.href} target={option.nativeHref ? undefined : "_blank"} rel="noopener noreferrer">Abrir en {option.label}</a>)}</div>
    </TripDialog>}
    {dialog === "chat" && pasaporte.estado && chatDisponible(pasaporte.estado) && <TripDialog title="Mensajes del traslado" onClose={() => setDialog(null)}><ChatViaje trasladoId={id} estado={pasaporte.estado} /></TripDialog>}
    {dialog === "error" && <TripDialog title="Motivo de la actualización fallida" onClose={() => setDialog(null)}><p className={styles.completeText}>{error}</p></TripDialog>}
    {support && <TripSupportDialog onClose={() => setSupport(false)} />}
  </div>;
}
