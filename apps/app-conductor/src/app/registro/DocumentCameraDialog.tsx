"use client";

import { Button as BaseButton } from "@ruum/ui/base";
import { useEffect, useRef, useState } from "react";
import { ConductorDialog } from "../components/ConductorDialog";
import styles from "./registration.module.css";

export function DocumentCameraDialog({ etiqueta, nombreArchivo, onCerrar, onCapturar }: {
  etiqueta: string;
  nombreArchivo: string;
  onCerrar: () => void;
  onCapturar: (archivo: File) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [lista, setLista] = useState(false);
  const [capturando, setCapturando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let activo = true;
    let flujo: MediaStream | undefined;
    void navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
    }).then((media) => {
      if (!activo) {
        media.getTracks().forEach((pista) => pista.stop());
        return;
      }
      flujo = media;
      video.srcObject = media;
    }).catch(() => {
      if (activo) setError("No pudimos abrir la cámara. Revisa los permisos del navegador o adjunta un archivo.");
    });

    return () => {
      activo = false;
      flujo?.getTracks().forEach((pista) => pista.stop());
      video.srcObject = null;
    };
  }, []);

  function capturar() {
    const video = videoRef.current;
    if (!video?.videoWidth || !video.videoHeight) return;

    if (Math.min(video.videoWidth, video.videoHeight) < 600 || Math.max(video.videoWidth, video.videoHeight) < 800) {
      setError("La cámara debe proporcionar una imagen de al menos 800 × 600 px. Puedes adjuntar otra fotografía.");
      return;
    }

    const canvas = document.createElement("canvas");
    const escala = Math.min(1, 1920 / Math.max(video.videoWidth, video.videoHeight));
    canvas.width = Math.round(video.videoWidth * escala);
    canvas.height = Math.round(video.videoHeight * escala);
    const contexto = canvas.getContext("2d");
    if (!contexto) {
      setError("No pudimos guardar la fotografía. Intenta de nuevo.");
      return;
    }

    setError(null);
    setCapturando(true);
    try {
      contexto.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((imagen) => {
        if (!video.isConnected) return;
        setCapturando(false);
        if (!imagen) {
          setError("No pudimos guardar la fotografía. Intenta de nuevo.");
          return;
        }
        onCapturar(new File([imagen], nombreArchivo, { type: imagen.type }));
      }, "image/jpeg", 0.85);
    } catch {
      setCapturando(false);
      setError("No pudimos guardar la fotografía. Intenta de nuevo.");
    }
  }

  return <ConductorDialog open labelledBy="titulo-camara-documento" title={`Tomar foto de ${etiqueta}`}
    onClose={onCerrar} closeLabel="Cerrar cámara"
    footer={<BaseButton type="button" disabled={!lista || capturando} onClick={capturar}>Capturar foto</BaseButton>}
  >
    {!lista && !error && <p role="status">Abriendo la cámara…</p>}
    {error && <p role="alert" className="text-ui-danger">{error}</p>}
    <video ref={videoRef} muted autoPlay playsInline className={styles.documentVideo}
      aria-label="Vista previa de la cámara" onCanPlay={() => setLista(true)} />
  </ConductorDialog>;
}
