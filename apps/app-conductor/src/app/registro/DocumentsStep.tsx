"use client";

import { useRef, type ChangeEvent } from "react";
import type { DocumentoKey, EstadoDocumento } from "./registration-types";
import styles from "./registration.module.css";

const ITEMS: { key: DocumentoKey; title: string; subtitle: string; artwork: "front" | "back" | "passport" }[] = [
  { key: "licenciaFrente", title: "Licencia de conducir", subtitle: "Foto frontal", artwork: "front" },
  { key: "licenciaReverso", title: "Licencia de conducir", subtitle: "Foto reverso", artwork: "back" },
  { key: "identificacionOficial", title: "Identificación oficial", subtitle: "INE o pasaporte", artwork: "passport" }
];

function DocumentoIlustracion({ kind }: { kind: "front" | "back" | "passport" }) {
  if (kind === "passport") return <span className={`${styles.documentArtwork} ${styles.passportArtwork}`} aria-hidden="true">◎<small>PASAPORTE</small></span>;
  return <span className={`${styles.documentArtwork} ${kind === "front" ? styles.frontArtwork : styles.backArtwork}`} aria-hidden="true"><i /><b /><em /></span>;
}

function CameraIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h3l1.5-2h7L17 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z" /><circle cx="12" cy="13" r="3.25" /></svg>;
}

export function DocumentsStep({ sesionAutenticada, documentos, estadoDocumentos, erroresCampos, cambiarDocumento }: {
  sesionAutenticada: boolean;
  documentos: Record<DocumentoKey, File | null>;
  estadoDocumentos: Record<DocumentoKey, EstadoDocumento>;
  erroresCampos: Record<string, string>;
  cambiarDocumento: (campo: DocumentoKey, archivo: File | null) => void;
}) {
  const inputs = useRef<Partial<Record<DocumentoKey, HTMLInputElement | null>>>({});
  const seleccionar = (key: DocumentoKey) => inputs.current[key]?.click();
  const cambiar = (key: DocumentoKey, event: ChangeEvent<HTMLInputElement>) => {
    cambiarDocumento(key, event.target.files?.[0] ?? null);
    event.target.value = "";
  };

  return <fieldset className={styles.documentsStep}>
    <legend className="sr-only">Documentos</legend>
    <div className={styles.stepIntro}>
      <h1 id="titulo-registro-conductor">Documentos</h1>
      <p>Sube los documentos requeridos</p>
    </div>
    {!sesionAutenticada ? <p className={styles.documentAlert} role="alert">Primero confirma tu cuenta para cargar tus documentos.</p> : <div className={styles.documentRows} aria-label="Documentos requeridos">
      {ITEMS.map((item) => {
        const archivo = documentos[item.key];
        const estado = estadoDocumentos[item.key];
        const listo = Boolean(archivo) || estado === "subido";
        return <section key={item.key} className={styles.documentCard} aria-labelledby={`${item.key}-titulo`}>
          <DocumentoIlustracion kind={item.artwork} />
          <div className={styles.documentCopy}>
            <strong id={`${item.key}-titulo`}>{item.title}</strong>
            <span>{item.subtitle}</span>
            <small>{listo ? archivo?.name ?? "Documento cargado" : "Formatos: JPG, PNG, WEBP, PDF"}</small>
            {!listo && <small>Máximo 5 MB</small>}
            {erroresCampos[item.key] && <small className={styles.documentError} role="alert">{erroresCampos[item.key]}</small>}
          </div>
          <input ref={(element) => { inputs.current[item.key] = element; }} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" capture="environment" className="sr-only" aria-label={`Subir ${item.title} ${item.subtitle}`} onChange={(event) => cambiar(item.key, event)} />
          <button type="button" className={styles.uploadButton} onClick={() => seleccionar(item.key)} aria-label={`${listo ? "Cambiar" : "Subir"} ${item.title}, ${item.subtitle}`}>
            <CameraIcon /><span>{listo ? "Cambiar" : "Subir"}</span>
          </button>
        </section>;
      })}
    </div>}
    <aside className={styles.documentHint} role="note"><span aria-hidden="true">i</span><p>Asegúrate de que las imágenes sean claras, legibles y sin reflejos.</p></aside>
  </fieldset>;
}
