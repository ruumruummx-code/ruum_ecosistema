"use client";

import { useRef, useState } from "react";
import type { TipoDocumentoConductor } from "@ruum/api/services";
import { DriverDetailsShell, DetailIcon } from "../DriverDetailsShell";
import { DetailsNotice } from "../DetailsNotice";
import type { buildDocumentChecklist } from "./document-checklist";
import styles from "../details.module.css";

type Item = ReturnType<typeof buildDocumentChecklist>[number];
type Props = { items: Item[]; loading: boolean; error: string | null; message: string | null; uploading: TipoDocumentoConductor | null; enabled: boolean; onUpload: (type: TipoDocumentoConductor, file: File, previousId?: string) => void; onContinue: () => void; onRetry: () => void };
export function DriverDocumentsView(props: Props) {
  const file = useRef<HTMLInputElement>(null);
  const selected = useRef<Item | null>(null);
  const detail = useRef<HTMLDialogElement>(null);
  const [activeItem, setActiveItem] = useState<Item | null>(null);
  const openFile = (item: Item) => { selected.current = item; file.current?.click(); };
  const showDetail = (item: Item) => { setActiveItem(item); detail.current?.showModal(); };
  return <DriverDetailsShell kind="documents">
    <div className={styles.heading}><h1>Expediente de Documentos</h1><p>Consulta y actualiza tu documentación requerida para mantener tu cuenta activa.</p></div>
    <section className={styles.documentList} aria-label="Documentos requeridos" aria-busy={props.loading}>
      {props.items.map(item => <div key={item.type} className={styles.documentRow} data-status={item.status}>
        <button type="button" className={styles.documentInfo} disabled={props.loading || !!props.uploading || !props.enabled} aria-label={`${item.title}: ${props.loading ? "Cargando" : item.label}. Ver documento`} onClick={() => showDetail(item)}>
          <span className={styles.documentIcon}><DetailIcon name={item.icon} /></span>
          <span className={styles.documentText}><strong>{item.title}</strong><span className={styles.documentStatus} data-state={item.status}><i aria-hidden="true">{item.complete ? "✓" : "◷"}</i>{props.loading ? "Cargando…" : props.uploading === item.type ? "Subiendo…" : item.label}</span></span>
        </button>
        <button type="button" className={styles.upload} disabled={props.loading || !!props.uploading || !props.enabled} onClick={() => openFile(item)} aria-label={`Subir ${item.title}`}>{props.uploading === item.type ? "Subiendo…" : "Subir"}</button>
        <button type="button" className={styles.documentChevron} disabled={props.loading || !!props.uploading || !props.enabled} onClick={() => showDetail(item)} aria-label={`Ver detalles de ${item.title}`}>›</button>
      </div>)}
    </section>
    <input ref={file} type="file" hidden accept="image/jpeg,image/png,image/webp,application/pdf" aria-label="Archivo del documento" onChange={event => { const target = event.currentTarget; const upload = target.files?.[0]; if (upload && selected.current) props.onUpload(selected.current.type, upload, selected.current.document?.id); target.value = ""; selected.current = null; }} />
    {props.error ? <><DetailsNotice message={props.error} error /><button type="button" className={styles.retry} onClick={props.onRetry}>Reintentar carga</button></> : props.message ? <DetailsNotice message={props.message} /> : null}
    <button type="button" className={styles.primary} disabled={props.loading || !!props.error || !!props.uploading || !props.enabled || !props.items.every(item => item.complete)} onClick={props.onContinue}>Continuar<span aria-hidden="true">→</span></button>
    <dialog ref={detail} className={styles.dialog} aria-labelledby="document-detail-title"><h2 id="document-detail-title">{activeItem?.title}</h2><p>{activeItem?.label}</p>{activeItem?.document?.motivo_rechazo && <p>{activeItem.document.motivo_rechazo}</p>}<p>Sube una imagen JPG, PNG, WEBP o un PDF de hasta 10 MB. Los archivos se envían a revisión; cargarlos no equivale a su aprobación.</p><button type="button" className={styles.primary} onClick={() => { detail.current?.close(); if (activeItem) openFile(activeItem); }}>Subir documento</button><button type="button" className={styles.retry} onClick={() => detail.current?.close()}>Cerrar</button></dialog>
  </DriverDetailsShell>;
}
