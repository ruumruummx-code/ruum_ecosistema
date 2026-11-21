"use client";
import { Button as BaseButton } from "@ruum/ui/base";
import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ConductorScreen } from "../../components/ConductorScreen";
import { EmergencyPanel } from "./EmergencyPanel";
import { TripSupportDialog } from "./TripSupportDialog";
import styles from "./trip-form.module.css";

export function TripFormFrame({ id, title, step, total, stepLabel, onPrevious, onSteps, primary, onPrimary, disabled, busy, error, notice, tools, children }: {
  id:string; title:string; step?:number; total?:number; stepLabel?:string; onPrevious?:()=>void; onSteps?:()=>void;
  primary:string; onPrimary?:()=>void; disabled?:boolean; busy?:boolean; error?:string|null; notice?:string|null; tools?:ReactNode; children:ReactNode;
}) {
  const [support,setSupport]=useState(false);
  return <div data-trip-stage data-trip-form>
    <ConductorScreen variant="form" label={title} header={<>
      <header className={styles.safety}>
        {onPrevious ? <BaseButton variant="ghost" type="button" onClick={onPrevious} aria-label="Paso anterior">←</BaseButton> : <Link href={`/viajes/${id}`} aria-label="Volver al traslado">←</Link>}
        <p>{title}</p><BaseButton variant="ghost" type="button" onClick={()=>setSupport(true)} aria-label="Soporte">Ayuda</BaseButton>
        <EmergencyPanel trasladoId={id} compact headerPill pillLabel="SOS" />
      </header>
      {step != null && total != null && (
        <div className={styles.progressContainer}>
          <div
            className={styles.progressBar}
            role="progressbar"
            aria-valuenow={step + 1}
            aria-valuemin={1}
            aria-valuemax={total}
            aria-label="Progreso del checklist"
          >
            <div
              className={styles.progressFill}
              style={{ width: `${Math.round(((step + 1) / total) * 100)}%` }}
            />
          </div>
          <div className={styles.progress}>
            <p role="status">Paso {step+1} de {total} · {stepLabel}</p>
            {onSteps && <BaseButton variant="ghost" type="button" onClick={onSteps}>Ver pasos</BaseButton>}
          </div>
        </div>
      )}
    </>} footer={<section data-trip-primary className={styles.footer}>
      {/* Errores y avisos siempre visibles y completos: el conductor no debe abrir nada para saber qué pasó. */}
      {error && <div role="alert" className={styles.error}><p>{error}</p></div>}
      {!error && notice && <p role="status" className={styles.noticeText}>{notice}</p>}
      <BaseButton variant="primary" type="button" className={styles.primary} disabled={disabled||busy} aria-busy={busy} onClick={onPrimary}>{busy ? "Procesando…" : primary}</BaseButton>
    </section>}><div className={styles.content}>{children}{tools}</div></ConductorScreen>
    {support && <TripSupportDialog onClose={()=>setSupport(false)} />}
  </div>;
}
