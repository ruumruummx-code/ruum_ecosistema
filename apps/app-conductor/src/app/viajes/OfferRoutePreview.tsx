"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { construirUrlMapaRutaConduccion } from "../../lib/mapbox-rutas";
import type { PasaporteRow } from "./trips-utils";
import styles from "./offer-preview.module.css";

export function OfferRoutePreview({ viaje }: { viaje: PasaporteRow }) {
  const [image, setImage] = useState<{ key: string; src: string } | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const { origen_lat: a, origen_lng: b, destino_lat: c, destino_lng: d } = viaje;
  const key = `${a},${b}:${c},${d}`;
  useEffect(() => {
    let active = true;
    if (a == null || b == null || c == null || d == null ||
      ![a, b, c, d].every(Number.isFinite) || Math.abs(a) > 90 || Math.abs(c) > 90 || Math.abs(b) > 180 || Math.abs(d) > 180) return;
    void construirUrlMapaRutaConduccion({ lat: a, lng: b }, { lat: c, lng: d }, null, { ancho: 600, alto: 160 })
      .then(src => { if (active && src) setImage({ key, src }); }).catch(() => undefined);
    return () => { active = false; };
  }, [a, b, c, d, key]);

  const src = image?.key === key && failed !== image.src ? image.src : null;
  return <div className={styles.previewMap} data-offer-map role="img" aria-label={`Ruta referencial: ${viaje.origen_ciudad || "origen"} a ${viaje.destino_ciudad || "destino"}${src ? "" : ". Esquema, no es una ruta de navegación"}`}>
    {src ? <Image src={src} alt="" fill sizes="440px" className={styles.mapImage} onError={() => setFailed(src)} /> : <>
      <svg viewBox="0 0 400 80" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 20H400M0 60H400M40 0V80M130 0V80M220 0V80M310 0V80" stroke="#fff" strokeWidth="8" />
        <path d="M0 45 80 10 190 65 290 20 400 48" fill="none" stroke="#d4e7d4" strokeWidth="15" />
        <path d="M45 40C100 2 135 67 200 40S300 55 355 28" fill="none" stroke="#2274ee" strokeWidth="4" />
        <circle cx="45" cy="40" r="7" fill="#00bcb9" stroke="white" strokeWidth="3" /><circle cx="355" cy="28" r="7" fill="#0866f5" stroke="white" strokeWidth="3" />
      </svg>
      <span className={styles.mapCaption}>Esquema referencial · {viaje.origen_ciudad || "Origen"} → {viaje.destino_ciudad || "Destino"}</span>
    </>}
  </div>;
}
