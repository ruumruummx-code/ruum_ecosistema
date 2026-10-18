"use client";

import { claveDia, type DiaCalendario } from "./trips-utils";
import styles from "./traslados.module.css";

export function WeekDaySelector({
  dias,
  seleccionado,
  hoy,
  onSelect
}: {
  dias: DiaCalendario[];
  seleccionado: string;
  hoy: string;
  onSelect: (clave: string) => void;
}) {
  return <div className={styles.week} role="group" aria-label="Días de la semana">
    {dias.map(({ dia, Traslados }) => {
      const clave = claveDia(dia);
      const etiqueta = new Intl.DateTimeFormat("es-MX", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Mexico_City" }).format(dia);
      return <button type="button" key={clave} className={styles.day} aria-label={etiqueta} aria-pressed={clave === seleccionado} aria-current={clave === hoy ? "date" : undefined} onClick={() => onSelect(clave)}>
        <span>{["DO", "LU", "MA", "MI", "JU", "VI", "SÁ"][dia.getUTCDay()]}</span>
        <strong>{new Intl.DateTimeFormat("es-MX", { day: "numeric", timeZone: "America/Mexico_City" }).format(dia)}{Traslados.length > 0 && <i aria-hidden="true" />}</strong>
      </button>;
    })}
  </div>;
}
