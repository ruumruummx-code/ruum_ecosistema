"use client";
import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ConductorScreen } from "../../components/ConductorScreen";
import { EmergencyPanel } from "./EmergencyPanel";
import { TripSupportDialog } from "./TripSupportDialog";
import { TripDialog } from "./TripDialog";
import styles from "./trip-form.module.css";

export function TripFormFrame({ id, title, step, total, stepLabel, onPrevious, onSteps, primary, onPrimary, disabled, busy, error, notice, tools, children }: {
  id:string; title:string; step?:number; total?:number; stepLabel?:string; onPrevious?:()=>void; onSteps?:()=>void;
  primary:string; onPrimary?:()=>void; disabled?:boolean; busy?:boolean; error?:string|null; notice?:string|null; tools?:ReactNode; children:ReactNode;
}) {
  const [support,setSupport]=useState(false); const [details,setDetails]=useState(false);
  return <div data-trip-stage data-trip-form>
    <ConductorScreen variant="form" label={title} header={<>
      <header className={styles.safety}>
        {onPrevious ? <button type="button" onClick={onPrevious} aria-label="Paso anterior">←</button> : <Link href={`/viajes/${id}`} aria-label="Volver al traslado">←</Link>}
        <p>{title}</p><button type="button" onClick={()=>setSupport(true)} aria-label="Soporte">Ayuda</button>
        <EmergencyPanel trasladoId={id} compact headerPill pillLabel="SOS" />
      </header>
      {step != null && total != null && <div className={styles.progress}><p role="status">Paso {step+1} de {total} · {stepLabel}</p>{onSteps && <button type="button" onClick={onSteps}>Ver pasos</button>}</div>}
    </>} footer={<section data-trip-primary className={styles.footer}>
      {error && <div role="alert" className={styles.error}><p>{error.length>130 ? "No se pudo completar la acción. Consulta el motivo." : error}</p>{error.length>130 && <button type="button" onClick={()=>setDetails(true)}>Ver motivo completo</button>}</div>}
      {notice && <button type="button" className={styles.notice} onClick={()=>setDetails(true)}>Ver estado del registro</button>}
      <button type="button" className={styles.primary} disabled={disabled||busy} aria-busy={busy} onClick={onPrimary}>{busy ? "Procesando…" : primary}</button>
    </section>}><div className={styles.content}>{children}{tools}</div></ConductorScreen>
    {support && <TripSupportDialog onClose={()=>setSupport(false)} />}
    {details && <TripDialog title="Estado del registro" onClose={()=>setDetails(false)}><p className={styles.complete}>{error||notice}</p></TripDialog>}
  </div>;
}
