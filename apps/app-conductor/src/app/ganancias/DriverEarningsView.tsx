"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { DatosGananciasConductor } from "@ruum/api/services";
import { CONTACTOS_SOPORTE_CONDUCTOR } from "../../lib/contactos-soporte";
import { ConductorIcon } from "@/components/icons";
import type { EarningsPeriod, summarizeEarnings } from "./earnings-summary";
import styles from "./earnings.module.css";

type IconName = "bell" | "chart" | "car" | "clock" | "bank";
function Icon({ name }: { name: IconName }) {
  return <ConductorIcon name={name} size={24} strokeWidth={1.8} />;
}
const money = (value: number) => new Intl.NumberFormat("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
const paymentDate = (value: string) => {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", year: "numeric", timeZone: "America/Mexico_City" }).format(date) : "Fecha no disponible";
};
type Props = { data: DatosGananciasConductor | null; summary: ReturnType<typeof summarizeEarnings> | null; period: EarningsPeriod; onPeriod: (period: EarningsPeriod) => void; loading: boolean; error: string | null };

export function DriverEarningsView({ data, summary, period, onPeriod, loading, error }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [requestOpen, setRequestOpen] = useState(false);
  useEffect(() => { if (requestOpen) dialog.current?.showModal(); else dialog.current?.close(); }, [requestOpen]);
  const payments = [...(data?.payouts ?? [])].sort((a, b) => (b.procesado_en ?? b.creado_en).localeCompare(a.procesado_en ?? a.creado_en)).slice(0, 2);
  const ready = !loading && !error && summary;
  const bank = data?.datosBancarios;
  return <div className={styles.screen} data-driver-earnings>
    <header className={styles.header}>
      <Link href="/panel" prefetch={false}>‹ Atrás</Link>
      <Image src="/imagenes/ruum-logo.svg" alt="Ruum Ruum" width={150} height={49} priority />
      <Link href="/notificaciones" prefetch={false} className={styles.bell} aria-label="Notificaciones"><Icon name="bell" /><i aria-hidden="true" /></Link>
    </header>
    <div className={styles.heading}><h1>Mis ganancias</h1><p>Aquí puedes ver tus ingresos y pagos</p></div>
    <div className={styles.tabs} role="tablist" aria-label="Periodo de ganancias">
      {([['semana', 'Esta semana'], ['mes', 'Este mes']] as const).map(([id, label]) => <button key={id} id={`periodo-${id}`} type="button" role="tab" aria-selected={period === id} aria-controls="resumen-ganancias" onClick={() => onPeriod(id)}>{label}</button>)}
    </div>
    <section id="resumen-ganancias" role="tabpanel" aria-labelledby={`periodo-${period}`} aria-busy={loading} className={styles.summary}>
      <div className={styles.total}>
        <div><p>Ganancias totales</p><h2 data-testid="earnings-total">{ready ? `$${money(summary.amount)}` : "—"}<small>MXN</small></h2></div>
        <span className={styles.chart}><Icon name="chart" /></span>
        <div className={styles.trend}>
          {ready && summary.trend !== null ? <><strong data-negative={summary.trend < 0}>{summary.trend < 0 ? '↓' : '↑'} {summary.trend > 0 ? '+' : ''}{summary.trend}%</strong><span>vs. {period === "semana" ? "semana" : "mes"} anterior</span></> : <span>{loading ? "Cargando ganancias…" : error ? "Ganancias no disponibles" : summary?.incomplete ? "Hay importes pendientes de confirmar" : "Sin comparación disponible"}</span>}
        </div>
      </div>
      <div className={styles.metrics}>
        <div className={styles.metric}><span className={styles.metricIcon}><Icon name="car" /></span><div><h2>Viajes completados</h2><strong data-testid="earnings-trips">{ready ? summary.count : "—"}</strong><p className={styles.difference} data-negative={ready ? summary.tripDifference < 0 : undefined}>{ready ? `${summary.tripDifference > 0 ? '+' : ''}${summary.tripDifference} ${summary.tripDifference < 0 ? '↓' : '↑'}` : "—"}</p></div></div>
        <div className={styles.metric}><span className={styles.metricIcon}><Icon name="clock" /></span><div><h2>Horas en línea</h2><strong>—</strong><p>Sin registro</p></div></div>
      </div>
    </section>
    <section className={styles.payments} aria-labelledby="ultimos-pagos">
      <div className={styles.sectionHeading}><h2 id="ultimos-pagos">Últimos pagos</h2><Link href="/ganancias/historial" prefetch={false}>Ver todos <span aria-hidden="true">›</span></Link></div>
      <div className={styles.paymentList}>
        {loading ? <p className={styles.message} role="status">Cargando pagos…</p> : error ? <p className={styles.message} role="alert">{error}</p> : payments.length ? payments.map(payment => <div key={payment.id} className={styles.payment}>
          <span className={styles.bank}><Icon name="bank" /></span>
          <div className={styles.paymentLabel}><h3>Transferencia bancaria</h3><time dateTime={payment.procesado_en ?? payment.creado_en}>{paymentDate(payment.procesado_en ?? payment.creado_en)}</time></div>
          <div className={styles.paymentAmount} data-status={payment.estado}><strong>{payment.estado === "procesado" ? "+ " : ""}${money(Number(payment.monto_neto))}</strong><span>{payment.estado === "procesado" ? "Completado" : payment.estado === "pendiente" ? "Pendiente" : "Fallido"}</span></div>
        </div>) : <p className={styles.message}>Aún no tienes pagos registrados.</p>}
      </div>
    </section>
    <button type="button" className={styles.primary} disabled={loading || !!error} onClick={() => setRequestOpen(true)}>Solicitar pago <span aria-hidden="true">→</span></button>
    <dialog ref={dialog} className={styles.dialog} aria-labelledby="solicitar-pago-titulo" onCancel={() => setRequestOpen(false)} onClose={() => setRequestOpen(false)}>
      <header><h2 id="solicitar-pago-titulo">Solicitar pago</h2><button type="button" aria-label="Cerrar solicitud de pago" onClick={() => setRequestOpen(false)}>×</button></header>
      <p>El equipo operativo revisa y programa los pagos. Contacta a soporte para solicitar la revisión de tu saldo.</p>
      <p>{bank ? bank.estado === "verificada" ? `Cuenta verificada: ${bank.banco} · terminación ${bank.clabe.slice(-4)}.` : bank.estado === "en_revision" ? "Tus datos bancarios están en revisión." : "Tus datos bancarios requieren corrección." : "Registra tus datos bancarios para recibir depósitos."}</p>
      {bank?.estado !== "verificada" && <Link href="/cuenta/datos-bancarios" className={styles.secondary}>Revisar datos bancarios</Link>}
      <a href={CONTACTOS_SOPORTE_CONDUCTOR.soporte.whatsapp.href} target="_blank" rel="noopener noreferrer" className={styles.primary}>Contactar a soporte</a>
    </dialog>
  </div>;
}
