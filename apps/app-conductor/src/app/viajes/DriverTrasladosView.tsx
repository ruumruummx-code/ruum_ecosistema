"use client";

import { Button as BaseButton, Input as BaseInput, ChipGroup, EmptyState } from "@ruum/ui/base";
import { useState, type ReactNode } from "react";
import { Aviso } from "@ruum/ui";
import Link from "next/link";
import { useViajeActivo } from "../ViajeActivoContext";
import { EmergencyPanel } from "./[id]/EmergencyPanel";
import { ConductorScreen } from "../components/ConductorScreen";
import { ConductorDialog } from "../components/ConductorDialog";
import { TrasladosSearch } from "./ViajesSearch";
import { TrasladosIcon } from "./TrasladosIcon";
import type { DiaCalendario } from "./trips-utils";
import styles from "./traslados.module.css";

type Props = {
  online: boolean; refreshing: boolean; loading: boolean; notifications: number;
  offers: number; accepted: number; history?: number; showingOffers: boolean; vista?: "disponibles" | "mis-Traslados" | "historial"; filtered: boolean; sortActive: boolean;
  calendar: DiaCalendario[]; selectedDay: string; today: string;
  allDates?: boolean; onAllDates?: () => void;
  onSelectDay: (day: string) => void; onTab: (tab: boolean | string) => void;
  onRefresh: () => void; onSort: () => void; onClear: () => void;
  filters: ReactNode; children?: ReactNode; notice?: string | null; error?: string | null;
};

export function DriverTrasladosView(props: Props) {
  const { viajeActivo } = useViajeActivo();
  const [menuOpen, setMenuOpen] = useState(false);

  return <div data-driver-traslados><ConductorScreen variant="list" label="Lista y búsqueda de traslados" className={styles.screen}>
    <div className={styles.body}>
      <header className={styles.header}>
        <div className={styles.heading}>
          <p>CONDUCTOR</p><h1>Traslados</h1>

        </div>
        <div className={styles.quickActions}>
          {viajeActivo && <EmergencyPanel trasladoId={viajeActivo.trasladoId} compact headerPill pillLabel="SOS" />}
        </div>
      </header>

      <ChipGroup etiqueta="Vistas de traslados" className="flex-nowrap overflow-x-auto pb-1 [&_button]:min-h-12"
        opciones={[
          { id: "disponibles", etiqueta: "Disponibles", conteo: props.offers },
          { id: "mis-Traslados", etiqueta: "Mis traslados", conteo: props.accepted },
          { id: "historial", etiqueta: "Historial", conteo: props.history ?? 0 },
        ]}
        valor={props.vista === "historial" ? "historial" : props.showingOffers ? "disponibles" : "mis-Traslados"}
        onCambio={value => props.onTab(value === "disponibles" ? true : value === "mis-Traslados" ? false : "historial")} />
      <div className={styles.searchRow}><div className={styles.search}><TrasladosSearch placeholder={props.showingOffers ? "Buscar ofertas..." : "Buscar aceptados..."} /></div><BaseButton variant="ghost" type="button" className={styles.filterButton} aria-label="Abrir filtros avanzados" aria-haspopup="dialog" onClick={() => setMenuOpen(true)}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18" /><circle cx="8" cy="6" r="2" fill="currentColor" /><circle cx="16" cy="12" r="2" fill="currentColor" /><circle cx="9" cy="18" r="2" fill="currentColor" /></svg></BaseButton></div>
      {props.error && !props.loading && (props.children || !props.online) && <div className={styles.notice}><Aviso tono="danger">{props.error}{props.online && <> <BaseButton variant="link" type="button" className="h-auto p-0" disabled={props.refreshing} onClick={props.onRefresh}>{props.refreshing ? "Reintentando…" : "Reintentar"}</BaseButton></>}</Aviso></div>}
      {props.notice && <div className={styles.notice}><Aviso tono={props.online ? "info" : "warning"}>{props.notice}</Aviso></div>}
      <section id="panel-traslados" aria-label="Resultados del filtro"  className={styles.content} aria-busy={props.loading}>
        {props.loading ? <output className={styles.loading}>Cargando traslados…</output> : props.children ?? (props.error && props.online ? <EmptyState
          icono={<TrasladosIcon name="truck" />}
          titulo="No pudimos cargar los traslados"
          descripcion={props.error}
          className="flex-1 [&>div:last-child]:w-full" accion={
          <div className={styles.emptyActions}>
            <BaseButton variant="primary" type="button" className={styles.primary} disabled={props.refreshing} data-trip-primary="true" onClick={props.onRefresh}>
              {props.refreshing ? "Reintentando…" : "Reintentar"}
            </BaseButton>
            <Link className={styles.secondary} href="/panel" prefetch={false}>Volver al panel</Link>
          </div>
        } /> : <EmptyState
          icono={<TrasladosIcon name="truck" />}
          titulo={props.filtered ? "Sin resultados con estos filtros" : !props.allDates ? "Sin traslados para este día" : props.showingOffers ? "Sin ofertas disponibles" : "Sin traslados aceptados"}
          descripcion={props.filtered ? "Ningún traslado coincide con tu búsqueda. Prueba otra fecha o limpia los filtros." : props.showingOffers ? "No hay ofertas en esta vista. Consulta todas las fechas o recarga para actualizar." : "No tienes traslados aceptados en esta vista. Acepta una oferta para verla aquí."}
          className="flex-1 [&>div:last-child]:w-full" accion={
          <div className={styles.emptyActions}>
            <BaseButton variant="primary" type="button" className={styles.primary} disabled={props.refreshing} data-trip-primary="true"
              onClick={props.filtered ? props.onClear : !props.showingOffers ? () => props.onTab(true) : !props.allDates ? props.onAllDates : props.onRefresh}>
              {props.filtered ? "Limpiar filtros" : !props.showingOffers ? "Buscar ofertas disponibles" : !props.allDates ? "Ver todas las fechas" : props.refreshing ? "Recargando…" : "Recargar ofertas"}
            </BaseButton>
            <Link className={styles.secondary} href="/panel" prefetch={false}>Volver al panel</Link>
          </div>
        } />)}
      </section>
    </div>
    </ConductorScreen>
    <ConductorDialog open={menuOpen} title="Vista y filtros" labelledBy="titulo-menu-traslados" closeLabel="Cerrar filtros" onClose={() => setMenuOpen(false)} footer={<BaseButton variant="primary" type="button" className={styles.applyFilters} onClick={() => setMenuOpen(false)}>Ver resultados</BaseButton>}>
          <div className={styles.live}><span data-online={props.online} aria-hidden="true" />{props.online ? "En vivo" : "Sin conexión"}<BaseButton variant="ghost" type="button" onClick={props.onRefresh} disabled={props.refreshing} aria-busy={props.refreshing}>{props.refreshing ? "Recargando…" : "Recargar"}</BaseButton></div>
      <h3>Fecha del traslado</h3><p>{props.allDates ? "Todas las fechas" : props.selectedDay}</p>
      <label className={styles.dateInput}>Elegir fecha<BaseInput type="date" value={props.selectedDay} onChange={event => { if (event.target.value) props.onSelectDay(event.target.value); }} /></label>
      <BaseButton variant="outline" type="button" className={styles.secondary} aria-pressed={props.allDates} onClick={props.onAllDates}>Todas las fechas</BaseButton>
      {props.filters}
    </ConductorDialog>
  </div>;
}
