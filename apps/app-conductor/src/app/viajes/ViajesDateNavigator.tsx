"use client";

import { claveDia, type DiaCalendario } from "./trips-utils";
import { WeekDaySelector } from "./WeekDaySelector";
import { TrasladosIcon } from "./TrasladosIcon";
import styles from "./traslados.module.css";

interface TrasladosDateNavigatorProps {
  calendario: DiaCalendario[];
  diaSeleccionado: string;
  diaHoy: string;
  onSelectDia: (clave: string) => void;
}

export function TrasladosDateNavigator({
  calendario,
  diaSeleccionado,
  diaHoy,
  onSelectDia
}: TrasladosDateNavigatorProps) {
  const diaCalendarioSeleccionado = calendario.find(({ dia }) => claveDia(dia) === diaSeleccionado) ?? calendario[0];

  function moverDia(delta: number) {
    const fecha = new Date(diaCalendarioSeleccionado?.dia ?? new Date());
    fecha.setUTCDate(fecha.getUTCDate() + delta);
    onSelectDia(claveDia(fecha));
  }
  const partes = diaCalendarioSeleccionado ? new Intl.DateTimeFormat("es-MX", { weekday: "short", day: "numeric", month: "short", timeZone: "America/Mexico_City" }).formatToParts(diaCalendarioSeleccionado.dia) : [];
  const parte = (tipo: Intl.DateTimeFormatPartTypes) => partes.find((p) => p.type === tipo)?.value.replaceAll(".", "") ?? "";
  const etiqueta = diaCalendarioSeleccionado ? [parte("weekday"), parte("day"), "DE", parte("month")].join(" ").toUpperCase() : "HOY";
  return <div className={styles.calendar}>
    <button type="button" className={styles.calendarArrow} onClick={() => moverDia(-1)} aria-label="Día anterior"><TrasladosIcon name="left" /></button>
    <WeekDaySelector dias={calendario} seleccionado={diaSeleccionado} hoy={diaHoy} onSelect={onSelectDia} />
    <button type="button" className={styles.calendarArrow} onClick={() => moverDia(1)} aria-label="Día siguiente"><TrasladosIcon name="right" /></button>
    <span className={styles.selectedDate} aria-live="polite"><time dateTime={diaSeleccionado}>{etiqueta}</time>{diaHoy && diaSeleccionado === diaHoy && <span>HOY</span>}</span>
  </div>;
}
