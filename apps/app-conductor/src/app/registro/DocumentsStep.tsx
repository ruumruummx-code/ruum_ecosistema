"use client";

import { Button as BaseButton } from "@ruum/ui/base";
import { useRef, useState, type ChangeEvent } from "react";
import { esNativo } from "../../lib/capacitor";
import { DocumentCameraDialog } from "./DocumentCameraDialog";
import { ETIQUETA_DOCUMENTO, TIPOS_DOCUMENTO, type DocumentoKey, type EstadoDocumento } from "./registration-types";
import styles from "./registration.module.css";

const ITEMS: { key: DocumentoKey; title: string; subtitle: string }[] = [
  { key: "licenciaFrente", title: "Licencia · Frente", subtitle: "Foto frontal" },
  { key: "licenciaReverso", title: "Licencia · Reverso", subtitle: "Foto reverso" },
  { key: "identificacionOficial", title: "Identificación oficial", subtitle: "INE o pasaporte" }
];

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
  const inputFoto = useRef<HTMLInputElement>(null);
  const destinoFoto = useRef<DocumentoKey | null>(null);
  const [camaraWeb, setCamaraWeb] = useState<DocumentoKey | null>(null);
  const [capturandoNativa, setCapturandoNativa] = useState<DocumentoKey | null>(null);
  const [errorCamara, setErrorCamara] = useState<DocumentoKey | null>(null);

  const cambiar = (campo: DocumentoKey | null, event: ChangeEvent<HTMLInputElement>) => {
    const archivo = event.target.files?.[0];
    event.target.value = "";
    if (!campo || !archivo) return;
    setErrorCamara(null);
    cambiarDocumento(campo, archivo);
  };

  async function tomarFoto(campo: DocumentoKey) {
    setErrorCamara(null);
    if (!esNativo()) {
      if (typeof navigator.mediaDevices?.getUserMedia === "function") {
        setCamaraWeb(campo);
      } else {
        destinoFoto.current = campo;
        inputFoto.current?.click();
      }
      return;
    }

    setCapturandoNativa(campo);
    try {
      const { capturarFoto } = await import("../../lib/camara");
      const foto = await capturarFoto();
      const base64 = foto?.dataUrl.split(",", 2)[1];
      if (base64) {
        const binario = atob(base64);
        const bytes = new Uint8Array(binario.length);
        for (let indice = 0; indice < binario.length; indice += 1) {
          bytes[indice] = binario.charCodeAt(indice);
        }
        cambiarDocumento(campo, new File([bytes], `${TIPOS_DOCUMENTO[campo]}.jpg`, { type: "image/jpeg" }));
      }
    } catch (error) {
      if (!(error instanceof Error && /cancel/i.test(error.message))) setErrorCamara(campo);
    } finally {
      setCapturandoNativa(null);
    }
  }

  return <fieldset className={styles.documentsStep}>
    <legend className="sr-only">Documentos</legend>
    <div className={styles.stepIntro}>
      <h1 id="titulo-registro-conductor">Documentos</h1>
      <p>JPG, PNG, WEBP o PDF, hasta 5 MB. Imágenes legibles, sin reflejos.</p>
    </div>
    {!sesionAutenticada ? <p className={styles.documentAlert} role="alert">Primero confirma tu cuenta para cargar tus documentos.</p> : <div className={styles.documentRows} aria-label="Documentos requeridos">
      <input ref={inputFoto} type="file" accept="image/*" capture="environment" hidden
        onChange={(event) => cambiar(destinoFoto.current, event)} />
      {ITEMS.map((item) => {
        const archivo = documentos[item.key];
        const estado = estadoDocumentos[item.key];
        const listo = Boolean(archivo) || estado === "subido";
        const etiqueta = ETIQUETA_DOCUMENTO[item.key];
        return <section key={item.key} className={styles.documentCard} aria-labelledby={`${item.key}-titulo`}>
          <div className={styles.documentCopy}>
            <strong id={`${item.key}-titulo`}>{item.title}</strong>
            <small>{listo ? archivo?.name ?? "Documento cargado" : item.subtitle}</small>
            {errorCamara === item.key
              ? <small className={styles.documentError} role="alert">No pudimos abrir la cámara. Revisa los permisos o adjunta un archivo.</small>
              : erroresCampos[item.key] && <small className={styles.documentError} role="alert">{erroresCampos[item.key]}</small>}
          </div>
          <input ref={(element) => { inputs.current[item.key] = element; }} type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf" hidden
            onChange={(event) => cambiar(item.key, event)} />
          <div className={styles.documentActions}>
            <BaseButton variant="secondary" type="button" onClick={() => void tomarFoto(item.key)}
              disabled={capturandoNativa !== null} aria-label={`Tomar foto de ${etiqueta}`}>
              <CameraIcon /><span>{capturandoNativa === item.key ? "Abriendo…" : "Tomar foto"}</span>
            </BaseButton>
            <BaseButton variant="outline" type="button" onClick={() => inputs.current[item.key]?.click()}
              disabled={capturandoNativa !== null} aria-label={`Adjuntar archivo de ${etiqueta}`}>
              Adjuntar archivo
            </BaseButton>
          </div>
        </section>;
      })}
      {camaraWeb && <DocumentCameraDialog
        etiqueta={ETIQUETA_DOCUMENTO[camaraWeb]}
        nombreArchivo={`${TIPOS_DOCUMENTO[camaraWeb]}.jpg`}
        onCerrar={() => setCamaraWeb(null)}
        onCapturar={(archivo) => {
          cambiarDocumento(camaraWeb, archivo);
          setCamaraWeb(null);
        }}
      />}
    </div>}

  </fieldset>;
}
