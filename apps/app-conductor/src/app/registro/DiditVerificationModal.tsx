"use client";

import { Button, Aviso } from "@ruum/ui";
import { ConductorDialog } from "../components/ConductorDialog";
import styles from "./registration.module.css";
import { useEffect, useRef } from "react";

interface Props {
  isOpen: boolean;
  url: string | null;
  cargando: boolean;
  error: string | null;
  onCerrar: () => void;
  onReintentar: () => void;
  onFinalizar: () => void;
}

function esUrlDiditValida(url: string | null | undefined): url is string {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed.startsWith("https://")) return false;
  try {
    const parsed = new URL(trimmed);
    // Didit usa dos dominios oficiales:
    // - verify.didit.me: para el iframe del frontend
    // - verification.didit.me: para la API y URLs de sesión
    // Ambos son válidos y están en la allowlist de CSP.
    return parsed.hostname === "verify.didit.me" || parsed.hostname === "verification.didit.me";
  } catch {
    return false;
  }
}

export function DiditVerificationModal({
  isOpen,
  url,
  cargando,
  error,
  onCerrar,
  onReintentar,
  onFinalizar
}: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleMessage = (event: MessageEvent) => {
      if(!["https://verify.didit.me","https://verification.didit.me"].includes(event.origin) || event.source!==iframeRef.current?.contentWindow)return;
      let data = event.data;
      if (!data) return;
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch {
          // Mantener como string si no es JSON
        }
      }
      if (
        data === "didit:complete" ||
        data === "didit:cancel" ||
        data?.type === "didit:complete" ||
        data?.type === "didit:cancel" ||
        data?.type === "didit:verification:complete" ||
        data?.type === "didit:verification:completed" ||
        data?.status === "complete" ||
        data?.status === "completed" ||
        data?.status === "approved" ||
        data?.status === "declined" ||
        data?.event === "verification.completed" ||
        data?.event === "didit:completed" ||
        data?.message === "didit:complete"
      ) {
        onFinalizar();
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [isOpen, onFinalizar]);

  if (!isOpen) return null;

  const urlValida = esUrlDiditValida(url);

  const abrirEnNuevaVentana = () => {
    if (urlValida && url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return <ConductorDialog open title="Verificación de identidad" labelledBy="titulo-didit" onClose={onCerrar} closeLabel="Cerrar verificación" footer={urlValida && !cargando && !error ? <Button onClick={onFinalizar}>Ya completé la verificación</Button> : undefined}>
    <div className={styles.diditContent}>
      {cargando ? <p role="status">Iniciando verificación de identidad…</p> : error ? <><Aviso tono="danger">{error}</Aviso><Button onClick={onReintentar}>Reintentar verificación</Button></> : urlValida && url ? <>
        <p>Prueba de vida y validación biométrica.</p><button type="button" onClick={abrirEnNuevaVentana}>Abrir en nueva ventana</button>
        <iframe ref={iframeRef} src={url} title="Verificación de identidad Didit" className={styles.diditFrame}
          allow="camera; microphone; geolocation; fullscreen; accelerometer; gyroscope; display-capture; autoplay"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-top-navigation allow-top-navigation-by-user-activation"
          referrerPolicy="strict-origin-when-cross-origin" />
        <p>Cuando termines, vuelve a la aplicación.</p>
      </> : <><Aviso tono="atencion">No recibimos un enlace válido de verificación.</Aviso><Button onClick={onReintentar}>Reintentar verificación</Button></>}
    </div>
  </ConductorDialog>;
}
