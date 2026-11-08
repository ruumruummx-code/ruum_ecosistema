"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useViajeActivo } from "../ViajeActivoContext";
import { EmergencyPanel } from "./[id]/EmergencyPanel";
import { ConductorScreen } from "../components/ConductorScreen";
import { ConductorDialog } from "../components/ConductorDialog";
import { TrasladosSearch } from "./ViajesSearch";
import { TrasladosIcon, TrasladosEmptyIllustration } from "./TrasladosIcon";
import type { DiaCalendario } from "./trips-utils";
import styles from "./traslados.module.css";

type Props = {
  online: boolean; refreshing: boolean; loading: boolean; notifications: number;
  offers: number; accepted: number; history?: number; showingOffers: boolean; vista?: "disponibles" | "mis-Traslados" | "historial"; filtered: boolean; sortActive: boolean;
  calendar: DiaCalendario[]; selectedDay: string; today: string;
  allDates?: boolean; onAllDates?: () => void;
  onSelectDay: (day: string) => void; onTab: (tab: boolean | string) => void;
  onRefresh: () => void; onHelp: () => void; onSort: () => void; onClear: () => void;
  filters: ReactNode; children?: ReactNode; notice?: string | null;
};

export function DriverTrasladosView(props: Props) {
  const { viajeActivo } = useViajeActivo();
  const [menuOpen, setMenuOpen] = useState(false);

  return <div data-driver-traslados><ConductorScreen variant="list" label="Lista y búsqueda de traslados" className={styles.screen}>
    <div className={styles.body}>
      <header className={styles.header}>
        <button type="button" className={styles.menuButton} aria-label="Abrir menú del conductor" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><TrasladosIcon name="menu" /></button>
        <div className={styles.heading}>
          <p>CONDUCTOR</p><h1>Traslados</h1>

        </div>
        <div className={styles.quickActions}>
          {viajeActivo ? <EmergencyPanel trasladoId={viajeActivo.trasladoId} compact headerPill pillLabel="SOS" /> : <>
          <button type="button" aria-label="Ayuda y soporte rápido" onClick={props.onHelp}>?</button>
          <Link href="/notificaciones" aria-label={props.notifications ? `Notificaciones (${props.notifications} sin leer)` : "Notificaciones"} prefetch={false}><TrasladosIcon name="bell" />{props.notifications > 0 && <span className={styles.notificationDot} />}</Link>
          </>}
        </div>
      </header>

      <div className={styles.tabs} role="group" aria-label="Vistas de traslados">
        <button type="button" aria-pressed={props.showingOffers} aria-label={`Ofertas (${props.offers})`} onClick={() => props.onTab(true)}>Disponibles ({props.offers})</button>
        <button type="button" aria-pressed={!props.showingOffers && (!props.vista || props.vista === "mis-Traslados")} aria-label={`Aceptados (${props.accepted})`} onClick={() => props.onTab(false)}>Mis Traslados ({props.accepted})</button>
        <button type="button" aria-pressed={props.vista === "historial"} aria-label={`Historial (${props.history ?? 0})`} onClick={() => props.onTab("historial")}>Historial ({props.history ?? 0})</button>
      </div>
      <div className={styles.searchRow}><div className={styles.search}><TrasladosSearch placeholder={props.showingOffers ? "Buscar ofertas..." : "Buscar aceptados..."} /></div><button type="button" className={styles.filterButton} aria-label="Abrir filtros avanzados" aria-haspopup="dialog" onClick={() => setMenuOpen(true)}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18" /><circle cx="8" cy="6" r="2" fill="currentColor" /><circle cx="16" cy="12" r="2" fill="currentColor" /><circle cx="9" cy="18" r="2" fill="currentColor" /></svg></button></div>
      {props.notice && <details className={styles.notice}><summary>Información de los traslados</summary><p role="status">{props.notice}</p></details>}
      <section id="panel-traslados" aria-label="Resultados del filtro"  className={styles.content} aria-busy={props.loading}>
        {props.loading ? <output className={styles.loading}>Cargando traslados…</output> : props.children ?? <div className={styles.empty}>
          <TrasladosEmptyIllustration />
          <h2>{props.filtered ? "Sin resultados con estos filtros" : !props.allDates ? "Sin traslados para este día" : props.showingOffers ? "Sin ofertas disponibles" : "Sin traslados aceptados"}</h2>
          <p>{props.filtered ? "Ningún traslado coincide con tu búsqueda. Prueba otra fecha o limpia los filtros." : props.showingOffers ? "No hay ofertas en esta vista. Consulta todas las fechas o recarga para actualizar." : "No tienes traslados aceptados en esta vista. Acepta una oferta para verla aquí."}</p>
          <div className={styles.emptyActions}>
            <button type="button" className={styles.primary} disabled={props.refreshing}
              onClick={props.filtered ? props.onClear : !props.showingOffers ? () => props.onTab(true) : !props.allDates ? props.onAllDates : props.onRefresh}>
              {props.filtered ? "Limpiar filtros" : !props.showingOffers ? "Buscar ofertas disponibles" : !props.allDates ? "Ver todas las fechas" : props.refreshing ? "Recargando…" : "Recargar ofertas"}
            </button>
            <Link className={styles.secondary} href="/panel" prefetch={false}>Volver al panel</Link>
          </div>
        </div>}
      </section>
    </div>
    </ConductorScreen>
    <ConductorDialog open={menuOpen} title="Vista y filtros" labelledBy="titulo-menu-traslados" closeLabel="Cerrar filtros" onClose={() => setMenuOpen(false)} footer={<button type="button" className={styles.applyFilters} onClick={() => setMenuOpen(false)}>Ver resultados</button>}>
      <nav aria-label="Más opciones"><Link href="/panel">Inicio</Link><Link href="/ganancias">Ganancias</Link><Link href="/notificaciones">Notificaciones</Link><Link href="/cuenta">Cuenta</Link></nav>
          <div className={styles.live}><span data-online={props.online} aria-hidden="true" />{props.online ? "En vivo" : "Sin conexión"}<button type="button" onClick={props.onRefresh} disabled={props.refreshing} aria-busy={props.refreshing}>{props.refreshing ? "Recargando…" : "Recargar"}</button></div>
      <button type="button" onClick={() => { setMenuOpen(false); props.onHelp(); }}>Ayuda y soporte</button>
      <h3>Fecha del traslado</h3><p>{props.allDates ? "Todas las fechas" : props.selectedDay}</p>
      <label className={styles.dateInput}>Elegir fecha<input type="date" value={props.selectedDay} onChange={event => { if (event.target.value) props.onSelectDay(event.target.value); }} /></label>
      <button type="button" className={styles.secondary} aria-pressed={props.allDates} onClick={props.onAllDates}>Todas las fechas</button>
      {props.filters}
    </ConductorDialog>
  </div>;
}
