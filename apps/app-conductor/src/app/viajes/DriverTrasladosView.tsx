"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { TrasladosDateNavigator } from "./ViajesDateNavigator";
import { TrasladosSearch } from "./ViajesSearch";
import { TrasladosIcon, TrasladosEmptyIllustration } from "./TrasladosIcon";
import type { DiaCalendario } from "./trips-utils";
import styles from "./traslados.module.css";

type Props = {
  online: boolean; refreshing: boolean; loading: boolean; notifications: number;
  offers: number; accepted: number; showingOffers: boolean; filtered: boolean; sortActive: boolean;
  calendar: DiaCalendario[]; selectedDay: string; today: string;
  onSelectDay: (day: string) => void; onTab: (offers: boolean) => void;
  onRefresh: () => void; onHelp: () => void; onSort: () => void; onClear: () => void;
  filters: ReactNode; children?: ReactNode; notice?: string | null;
};

export function DriverTrasladosView(props: Props) {
  const screenRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDialogElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        screenRef.current?.style.setProperty("--traslados-height", `${viewport.height}px`);
        screenRef.current?.style.setProperty("--traslados-top", `${viewport.offsetTop}px`);
      });
    };
    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => { cancelAnimationFrame(frame); viewport.removeEventListener("resize", update); viewport.removeEventListener("scroll", update); };
  }, []);
  useEffect(() => {
    if (menuOpen) menuRef.current?.showModal();
    else menuRef.current?.close();
  }, [menuOpen]);

  return <div ref={screenRef} className={styles.screen} data-driver-traslados>
    <div className={styles.body}>
      <header className={styles.header}>
        <button type="button" className={styles.menuButton} aria-label="Abrir menú del conductor" aria-expanded={menuOpen} aria-controls="menu-conductor-traslados" onClick={() => setMenuOpen(true)}><TrasladosIcon name="menu" /></button>
        <div className={styles.heading}>
          <p>CONDUCTOR</p><h1>Traslados</h1>
          <div className={styles.live}><span data-online={props.online} aria-hidden="true" />{props.online ? "En vivo" : "Sin conexión"}<button type="button" onClick={props.onRefresh} disabled={props.refreshing} aria-busy={props.refreshing}>{props.refreshing ? "Recargando…" : "Recargar"}</button></div>
        </div>
        <div className={styles.quickActions}>
          <button type="button" aria-label="Ayuda y soporte rápido" onClick={props.onHelp}>?</button>
          <Link href="/notificaciones" aria-label={props.notifications ? `Notificaciones (${props.notifications} sin leer)` : "Notificaciones"} prefetch={false}><TrasladosIcon name="bell" />{props.notifications > 0 && <span className={styles.notificationDot} />}</Link>
        </div>
      </header>
      <div className={styles.search}><TrasladosSearch placeholder={props.showingOffers ? "Buscar ofertas..." : "Buscar aceptados..."} /></div>
      <div className={styles.tabs} role="tablist" aria-label="Vistas de traslados">
        <button type="button" role="tab" id="tab-ofertas" aria-controls="panel-traslados" aria-selected={props.showingOffers} onClick={() => props.onTab(true)}>Ofertas ({props.offers})</button>
        <button type="button" role="tab" id="tab-aceptados" aria-controls="panel-traslados" aria-selected={!props.showingOffers} onClick={() => props.onTab(false)}>Aceptados ({props.accepted})</button>
      </div>
      <TrasladosDateNavigator calendario={props.calendar} diaSeleccionado={props.selectedDay} diaHoy={props.today} onSelectDia={props.onSelectDay} />
      {props.notice && <details className={styles.notice}><summary>Información de los traslados</summary><p role="status">{props.notice}</p></details>}
      <section id="panel-traslados" role="tabpanel" aria-labelledby={props.showingOffers ? "tab-ofertas" : "tab-aceptados"} className={styles.content} aria-busy={props.loading}>
        {props.loading ? <output className={styles.loading}>Cargando traslados…</output> : props.children ?? <div className={styles.empty}>
          <TrasladosEmptyIllustration />
          <h2>{props.filtered ? "Sin resultados con estos filtros" : "Sin traslados para este día"}</h2>
          <p>{props.filtered ? "Ningún traslado coincide con tu búsqueda. Prueba otra fecha o limpia los filtros." : props.showingOffers ? "No hay ofertas programadas en esta fecha. Revisa otro día o cambia el orden a Mayor ganancia." : "No tienes traslados aceptados para esta fecha. Acepta una oferta para verla aquí."}</p>
          <div className={styles.emptyActions}>
            <button type="button" className={styles.primary} aria-pressed={!props.filtered && props.showingOffers ? props.sortActive : undefined} onClick={props.filtered ? props.onClear : props.showingOffers ? props.onSort : () => props.onTab(true)}><TrasladosIcon name="sort" />{props.filtered ? "Limpiar filtros" : props.showingOffers ? "Ordenar por mayor ganancia" : "Buscar ofertas disponibles"}</button>
            <Link className={styles.secondary} href="/panel" prefetch={false}>Volver al panel</Link>
          </div>
        </div>}
      </section>
    </div>
    <nav className={styles.bottomNav} aria-label="Navegación principal">
      <Link href="/panel" prefetch={false}><TrasladosIcon name="home" />Inicio</Link>
      <Link href="/viajes" aria-current="page" prefetch={false}><TrasladosIcon name="truck" />Traslados</Link>
      <Link href="/cuenta" prefetch={false}><TrasladosIcon name="user" />Cuenta</Link>
    </nav>
    <dialog ref={menuRef} id="menu-conductor-traslados" className={styles.drawer} aria-labelledby="titulo-menu-traslados" onCancel={() => setMenuOpen(false)} onClose={() => setMenuOpen(false)}>
      <header><h2 id="titulo-menu-traslados">Menú del conductor</h2><button type="button" aria-label="Cerrar menú" onClick={() => setMenuOpen(false)}><TrasladosIcon name="close" /></button></header>
      <nav aria-label="Más opciones"><Link href="/panel">Inicio</Link><Link href="/ganancias">Ganancias</Link><Link href="/notificaciones">Notificaciones</Link><Link href="/cuenta">Cuenta</Link></nav>
      <h3>Vista y filtros de traslados</h3>{props.filters}
    </dialog>
  </div>;
}
