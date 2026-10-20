"use client";

import { useEffect, useRef, useState } from "react";
import { Aviso } from "@ruum/ui";
import { DatosSensiblesTooltip } from "../cuenta/datos-sensibles";
import { DocumentUploadField } from "./DocumentUploadField";
import type { DocumentoKey, EstadoDocumento } from "./registration-types";
import styles from "./registration.module.css";

const ITEMS: { key: DocumentoKey; title: string; subtitle: string; icon: string }[] = [
  { key: "licenciaFrente", title: "Licencia de conducir", subtitle: "Foto frontal", icon: "▤" },
  { key: "licenciaReverso", title: "Licencia de conducir", subtitle: "Foto reverso", icon: "▤" },
  { key: "identificacionOficial", title: "Identificación oficial", subtitle: "INE o pasaporte", icon: "▣" }
];

export function DocumentsStep({ sesionAutenticada, documentos, estadoDocumentos, erroresCampos, cambiarDocumento }: {
  sesionAutenticada: boolean;
  documentos: Record<DocumentoKey, File | null>;
  estadoDocumentos: Record<DocumentoKey, EstadoDocumento>;
  erroresCampos: Record<string, string>;
  cambiarDocumento: (campo: DocumentoKey, archivo: File | null) => void;
}) {
  const [activo, setActivo] = useState<DocumentoKey | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const touchStart = useRef<number | null>(null);
  const seleccionado = ITEMS.find((item) => item.key === activo);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (activo && !dialog.open) dialog.showModal();
    if (!activo && dialog.open) dialog.close();
  }, [activo]);

  const close = () => setActivo(null);
  const status = (key: DocumentoKey) => {
    const state = estadoDocumentos[key];
    if (state === "subido") return { label: "Verificado", tone: "done" };
    if (state === "subiendo") return { label: "Subiendo", tone: "review" };
    if (state === "listo") return { label: "Listo", tone: "review" };
    if (state === "error") return { label: "Revisar", tone: "error" };
    return documentos[key] ? { label: "En revisión", tone: "review" } : { label: "Sin cargar", tone: "empty" };
  };

  return (
    <fieldset className={styles.documentsStep}>
      <div className={styles.documentsIntro}>
        <span>Documentos requeridos</span><DatosSensiblesTooltip tipo="documentos" />
      </div>
      {!sesionAutenticada ? <Aviso tono="atencion">Primero confirma tu cuenta. Después podrás cargar documentos y continuar desde cualquier dispositivo.</Aviso> : <>
        <div className={styles.documentRows} aria-label="Documentos requeridos">
          {ITEMS.map((item) => {
            const badge = status(item.key);
            const filename = documentos[item.key]?.name;
            return <button key={item.key} type="button" className={styles.documentRow} onClick={() => setActivo(item.key)} aria-label={`${item.title}, ${item.subtitle}: ${badge.label}`}>
              <span className={styles.documentIcon} aria-hidden="true">{item.icon}</span>
              <span className={styles.documentName}><strong>{item.title}</strong><small>{filename ? "Archivo seleccionado" : item.subtitle}</small></span>
              <span className={`${styles.documentBadge} ${styles[`badge_${badge.tone}`]}`}>{badge.label}</span>
            </button>;
          })}
        </div>
      </>}
      {erroresCampos.cuentaVerificada && <p role="alert" className="font-body text-sm font-medium text-danger-action">{erroresCampos.cuentaVerificada}</p>}
      <dialog ref={dialogRef} className={`${styles.sheet} ${styles.documentSheet}`} aria-labelledby="document-sheet-title" onCancel={(event) => { event.preventDefault(); close(); }} onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientY ?? null; }} onTouchEnd={(event) => { const end = event.changedTouches[0]?.clientY; if (touchStart.current !== null && end !== undefined && end - touchStart.current > 65) close(); touchStart.current = null; }}>
        {seleccionado && <>
          <div className={styles.sheetHeader}><h2 id="document-sheet-title">{seleccionado.title} · {seleccionado.subtitle}</h2><button type="button" onClick={close} aria-label="Cerrar">×</button></div>
          <div className={styles.sheetBody}>
            <p className={styles.documentInstructions}>Sube una imagen clara y completa. Formatos JPG, PNG, WEBP o PDF · máximo 10 MB.</p>
            <DocumentUploadField etiqueta={`${seleccionado.title} (${seleccionado.subtitle.toLowerCase()})`} archivo={documentos[activo!]} estado={estadoDocumentos[activo!]} error={erroresCampos[activo!] || undefined} onSeleccionar={(file) => cambiarDocumento(activo!, file)} />
          </div>
          <div className={styles.sheetFooter}><button type="button" onClick={close}>Listo</button></div>
        </>}
      </dialog>
    </fieldset>
  );
}
