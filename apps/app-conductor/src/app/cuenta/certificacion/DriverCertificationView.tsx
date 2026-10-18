"use client";

import { useEffect, useState } from "react";
import type { Database } from "@ruum/shared/types";
import { puedeAscenderNivel } from "@ruum/shared/rules";
import { CARTA_DERECHOS_CONDUCTOR, COMPROMISOS_CONDUCTOR, ETIQUETA_NIVEL_CERTIFICACION, NIVELES_CERTIFICACION_SERVICIO, REQUISITOS_MINIMOS_CERTIFICACION, type ClaveRequisitoCertificacion } from "@ruum/shared/constants";
import { DriverDetailsShell } from "../DriverDetailsShell";
import { DetailsDialog } from "../DetailsDialog";
import { DetailsNotice } from "../DetailsNotice";
import { ServiceIcon } from "../ServiceIcon";
import shared from "../details.module.css";
import styles from "./certification.module.css";

type Props = {
  driver: Database["public"]["Tables"]["conductores"]["Row"] | null; checklist: Record<ClaveRequisitoCertificacion, boolean>;
  loading: boolean; error: string | null; active: boolean; reason: string | null; licenseWarning: string | null;
  onRetry: () => void; onComplete: () => void; openMce: boolean; onOpenMce: () => void;
};
export function DriverCertificationView(props: Props) {
  const { checklist, driver, loading, error, openMce, onOpenMce } = props;
  const [allOpen, setAllOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  useEffect(() => { if (openMce) { setExpanded("mce"); setPage(0); onOpenMce(); } }, [openMce, onOpenMce]);
  const completed = Object.values(checklist).filter(Boolean).length;
  const next = REQUISITOS_MINIMOS_CERTIFICACION.find(item => !checklist[item.clave]);
  const level = driver?.nivel_certificacion === 2 ? 2 : driver?.nivel_certificacion === 3 ? 3 : 1;
  const promotion = puedeAscenderNivel({ nivelActual: level, trasladosCompletados: driver?.traslados_completados ?? 0,
    puntualidadPct: null, calidadEvidenciaPct: null, incidentesGravesImputables: driver?.incidencias_graves_12m ?? 0,
    evaluacionComplementariaAprobada: false });
  const sections = [
    { key: "mce", icon: "graduation", title: "Capacitación y evaluación (MCE)", items: [
      `Capacitación MCE: ${driver?.capacitacion_aprobada ? "Aprobada" : "Pendiente"}. Evaluación de evidencia: ${driver?.evaluacion_practica_aprobada ? "Aprobada" : "Pendiente"}. Prueba de manejo: ${driver?.prueba_manejo_aprobada ? "Aprobada" : "Pendiente"}.`,
      props.reason ?? "Cumples el filtro MCE para recibir asignaciones.",
      "Para programar capacitación o evaluación, contacta a soporte desde Cuenta.",
    ] },
    { key: "level", icon: "chart", title: "Nivel de certificación", items: [
      `Tu nivel actual: ${ETIQUETA_NIVEL_CERTIFICACION[level]}.`,
      ...NIVELES_CERTIFICACION_SERVICIO.map(item => `${item.denominacion}: ${item.descripcion}`),
      ...(promotion.puede ? ["Cumples los criterios registrados para solicitar una revisión de nivel."] : promotion.faltantes.map(item => `Para ascender: ${item}.`)),
    ] },
    { key: "rights", icon: "document", title: "Carta de derechos del conductor", items: CARTA_DERECHOS_CONDUCTOR },
    { key: "commitments", icon: "shield", title: "Compromisos del conductor", items: COMPROMISOS_CONDUCTOR },
  ] as const;
  return <DriverDetailsShell kind="certification">
    <section className={`${shared.heading} ${styles.heading}`}><div><h1>Certificación Ruum</h1><span className={styles.badge} data-active={props.active}>{loading ? "Cargando" : error ? "Sin datos" : props.active ? "Activo" : "Pendiente"}</span></div><p>Completa los requisitos para conducir</p></section>
    {error ? <><DetailsNotice message={error} error/><button className={shared.retry} onClick={props.onRetry}>Reintentar</button></> : <>
      <section className={styles.progressCard} aria-label="Avance de certificación" aria-busy={loading}>
        <div className={styles.ring} role="progressbar" aria-label="Requisitos completados" aria-valuemin={0} aria-valuemax={10} aria-valuenow={loading ? 0 : completed}>
          <svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="43"/><circle cx="50" cy="50" r="43" pathLength="100" strokeDasharray="100" strokeDashoffset={100 - (loading ? 0 : completed * 10)}/></svg><strong>{loading ? "…" : `${completed}/10`}</strong>
        </div><div><p>{loading ? "Consultando tus requisitos…" : `${completed} de 10 requisitos completados`}</p><button type="button" onClick={() => setAllOpen(true)} disabled={loading}>Ver todos</button></div>
      </section>
      <section className={styles.nextAction}><span className={styles.play} aria-hidden="true">▶</span><div><p>SIGUIENTE ACCIÓN</p><h2>{loading ? "Cargando certificación…" : next?.etiqueta ?? "¡Requisitos completados!"}</h2><button type="button" disabled={loading || !next} onClick={props.onComplete}>{next ? "Completar" : "Completado"}</button></div></section>
    </>}
    <section className={styles.accordionList} aria-label="Información de certificación">
      {sections.map(section => <div className={styles.accordion} key={section.key} data-open={expanded === section.key}>
        <button type="button" aria-expanded={expanded === section.key} aria-controls={`cert-${section.key}`} id={`cert-trigger-${section.key}`} onClick={() => { setExpanded(expanded === section.key ? null : section.key); setPage(0); }}><span className={styles.sectionIcon}><ServiceIcon name={section.icon}/></span><span>{section.title}</span><i aria-hidden="true">⌄</i></button>
        <div className={styles.collapse} inert={expanded !== section.key} id={`cert-${section.key}`} role="region" aria-labelledby={`cert-trigger-${section.key}`}><div><div className={styles.panel}>
          <p>{section.items[expanded === section.key ? Math.min(page, section.items.length - 1) : 0]}</p>
          <div className={styles.pager}><button type="button" aria-label={`Anterior: ${section.title}`} disabled={page === 0} onClick={() => setPage(value => value - 1)}>‹</button><span aria-live="polite">{page + 1} de {section.items.length}</span><button type="button" aria-label={`Siguiente: ${section.title}`} disabled={page >= section.items.length - 1} onClick={() => setPage(value => value + 1)}>›</button></div>
        </div></div></div>
      </div>)}
    </section>
    <p className={styles.footer}><span aria-hidden="true">ⓘ</span>{props.licenseWarning ?? `Conductor ${driver ? `${driver.id.slice(0, 8)}…` : "—"} · filtro MAIC activo: sin identidad-licencia vigentes no recibes ofertas.`}</p>
    <DetailsDialog open={allOpen} title="Requisitos de certificación" onClose={() => setAllOpen(false)}><ul className={styles.checklist}>{REQUISITOS_MINIMOS_CERTIFICACION.map(item => <li key={item.clave}><span>{item.etiqueta}</span><strong data-complete={checklist[item.clave]}>{checklist[item.clave] ? "✓ Listo" : "Pendiente"}</strong></li>)}</ul></DetailsDialog>
  </DriverDetailsShell>;
}
