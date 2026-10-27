"use client";
import { useEffect, useId, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { CompartirPasaporte } from "./CompartirPasaporte";
import { SeguimientoTrasladoTiempoReal } from "./SeguimientoTrasladoTiempoReal";
import { ChatTraslado } from "./ChatTraslado";
import { MobileBottomSheet } from "../../../components/MobileBottomSheet";
import type { PasaporteDigitalSegmentadoProps } from "./DetallesPasaporte";
import styles from "./pasaporte.module.css";
export type { PasaporteDigitalSegmentadoProps } from "./DetallesPasaporte";
export type PestanaPasaporte = "en_ruta" | "fotos" | "chat" | "unidad" | "recibo";
const Detalles = dynamic(() => import("./DetallesPasaporte").then(m => m.DetallesPasaporte));
const tabs = [{ id: "en_ruta", label: "En Ruta" }, { id: "fotos", label: "Fotos" }, { id: "chat", label: "Chat" }] as const;
export function PasaporteDigitalSegmentado(props: PasaporteDigitalSegmentadoProps) {
    const { pasaporte: p, evidencia, ultimaUbicacion } = props;
    const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("en_ruta");
    const [details, setDetails] = useState<"unidad" | "recibo" | "fotos" | null>(null);
    const [photo, setPhoto] = useState<(typeof evidencia)[number] | null>(null);
    const id = useId();
    const root = useRef<HTMLDivElement>(null);
    const folio = `#RR-${(p.traslado_id ?? "").slice(0, 4).toUpperCase()}`;
    useEffect(() => {
        const aplicarFragmento = () => {
            const fragmento = window.location.hash;
            if (fragmento === "#chat-conductor" || fragmento === "#chat") setTab("chat");
            else if (fragmento === "#fotos") setTab("fotos");
            else if (!fragmento || fragmento === "#en-ruta") setTab("en_ruta");
        };
        aplicarFragmento();
        window.addEventListener("hashchange", aplicarFragmento);
        return () => window.removeEventListener("hashchange", aplicarFragmento);
    }, [p.traslado_id]);
    useEffect(() => {
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const viewport = window.visualViewport;
        let layoutWidth = window.innerWidth;
        let fullHeight = window.innerHeight;
        const resize = () => {
            if (!root.current || !viewport)
                return;
            if (layoutWidth !== window.innerWidth) {
                layoutWidth = window.innerWidth;
                fullHeight = window.innerHeight;
            }
            fullHeight = Math.max(fullHeight, window.innerHeight);
            root.current.dataset.keyboard = String(viewport.height < fullHeight - 100);
            root.current.style.height = `${viewport.height}px`;
            root.current.style.top = `${viewport.offsetTop}px`;
        };
        resize();
        viewport?.addEventListener("resize", resize);
        viewport?.addEventListener("scroll", resize);
        return () => { document.body.style.overflow = previous; viewport?.removeEventListener("resize", resize); viewport?.removeEventListener("scroll", resize); };
    }, []);
    return <div ref={root} className={styles.dashboard}>
    <header className={styles.header}><Link href="/mis-viajes" aria-label="Volver a mis traslados">‹ Atrás</Link><h1>Pasaporte {folio}</h1><CompartirPasaporte folio={folio} variante="cabecera"/></header>
    <div className={styles.vehicle}><strong>{[p.vehiculo_marca, p.vehiculo_modelo, p.vehiculo_anio].filter(Boolean).join(" ") || "Vehículo registrado"}{p.vehiculo_placas ? ` · ${p.vehiculo_placas}` : ""}</strong><span>{p.origen_ciudad ?? "Origen"} ➔ {p.destino_ciudad ?? "Destino"}</span></div>
    <div role="tablist" aria-label="Pestañas del Pasaporte Digital" className={styles.tabs}>
      {tabs.map((t, i) => <button key={t.id} type="button" id={`${id}-${t.id}`} role="tab" aria-selected={tab === t.id} aria-controls={`${id}-panel-${t.id}`} tabIndex={tab === t.id ? 0 : -1} onClick={() => setTab(t.id)} onKeyDown={e => {
                const next = e.key === "ArrowRight" ? (i + 1) % 3 : e.key === "ArrowLeft" ? (i + 2) % 3 : e.key === "Home" ? 0 : e.key === "End" ? 2 : -1;
                if (next < 0)
                    return;
                e.preventDefault();
                setTab(tabs[next].id);
                (e.currentTarget.parentElement?.children[next] as HTMLElement)?.focus();
            }}>{t.label}</button>)}
    </div>
    <div className={styles.content}>
      <section role="tabpanel" id={`${id}-panel-en_ruta`} aria-labelledby={`${id}-en_ruta`} hidden={tab !== "en_ruta"} className={styles.panel}>
        <SeguimientoTrasladoTiempoReal trasladoId={p.traslado_id ?? ""} estado={p.estado} origen={{ lat: p.origen_lat, lng: p.origen_lng }} destino={{ lat: p.destino_lat, lng: p.destino_lng }} ubicacionInicial={ultimaUbicacion} activo={tab === "en_ruta"}/>
        <div className={styles.tools} style={{ left: "auto" }}><button type="button" onClick={() => setDetails("unidad")}>Datos y recibo</button></div>
      </section>
      <section role="tabpanel" id={`${id}-panel-fotos`} aria-labelledby={`${id}-fotos`} hidden={tab !== "fotos"} className={styles.panel}>
        {evidencia.length ? <div className={styles.photos}>{evidencia.slice(0, 6).map(f => <button key={f.id} type="button" onClick={() => setPhoto(f)} aria-label={`Abrir foto ${f.tipo} ${f.angulo}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {f.url_visual?.startsWith("https://") ? <img src={f.url_visual} alt={`${f.tipo} · ${f.angulo}`}/> : <span>Imagen no disponible</span>}<span>{f.tipo} · {f.angulo}</span>
        </button>)}</div> : <div className={styles.empty}>Las evidencias aparecerán aquí cuando el conductor las registre.</div>}
        <button className={styles.photoAction} type="button" onClick={() => setDetails("fotos")}>Ver todas las evidencias y reportes{evidencia.length > 6 ? ` (${evidencia.length})` : ""}</button>
      </section>
      <section role="tabpanel" id={`${id}-panel-chat`} aria-labelledby={`${id}-chat`} hidden={tab !== "chat"} className={styles.panel}>{tab === "chat" && <div className={styles.chat}><ChatTraslado conservarEstado trasladoId={p.traslado_id ?? ""} estado={p.estado ?? "solicitud_creada"}/></div>}</section>
    </div>
    <footer className={styles.footer}><Link href={`/soporte?viaje=${p.traslado_id}`}>⚠ Asistencia 24/7</Link><div><CompartirPasaporte folio={folio}/></div></footer>
    <MobileBottomSheet open={details !== null} onClose={() => setDetails(null)} title="Detalles del traslado">{details && <><nav className={styles.detailsMenu} aria-label="Detalles"><button type="button" onClick={() => setDetails("unidad")}>Unidad</button><button type="button" onClick={() => setDetails("recibo")}>Recibo</button><button type="button" onClick={() => setDetails("fotos")}>Reportes</button></nav><Detalles {...props} seccion={details}/></>}</MobileBottomSheet>
    <MobileBottomSheet open={photo !== null} onClose={() => setPhoto(null)} title="Evidencia del vehículo" fullScreen>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {photo?.url_visual?.startsWith("https://") && <img className={styles.photoFull} src={photo.url_visual} alt={`${photo.tipo} · ${photo.angulo}`}/>}
    </MobileBottomSheet>
  </div>;
}
