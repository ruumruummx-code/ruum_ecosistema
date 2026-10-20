"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { listarNotificacionesConductor, marcarNotificacionLeida, type NotificacionConductor } from "@ruum/api/drivers";
import { crearClienteNavegador } from "../../lib/supabase-browser";
import styles from "./notifications.module.css";

type FiltroTab = "todas" | "no_leidas" | "leidas";

const tabs: { id: FiltroTab; label: string }[] = [
  { id: "todas", label: "Todas" },
  { id: "no_leidas", label: "Sin leer" },
  { id: "leidas", label: "Leídas" }
];

export default function CentroNotificaciones() {
  const router = useRouter();
  const [items, setItems] = useState<NotificacionConductor[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState<FiltroTab>("todas");

  const cargar = useCallback(async () => {
    try {
      setItems(await listarNotificacionesConductor(crearClienteNavegador(), 100));
    } catch {
      // La pantalla conserva el último estado disponible ante un fallo transitorio.
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
    const actualizar = () => void cargar();
    window.addEventListener("ruum:notificaciones-actualizar", actualizar);
    return () => window.removeEventListener("ruum:notificaciones-actualizar", actualizar);
  }, [cargar]);

  const noLeidas = items.filter((item) => !item.leida_en);
  const leidas = items.filter((item) => Boolean(item.leida_en));
  const visibles = filtro === "no_leidas" ? noLeidas : filtro === "leidas" ? leidas : items;

  async function abrir(item: NotificacionConductor) {
    try {
      await marcarNotificacionLeida(crearClienteNavegador(), item.id);
    } catch {
      // El aviso se volverá a sincronizar en la próxima carga.
    }
    setItems((actuales) => actuales.map((actual) => actual.id === item.id ? { ...actual, leida_en: actual.leida_en ?? new Date().toISOString() } : actual));
    router.push(item.destino);
  }

  const contador = (tab: FiltroTab) => tab === "no_leidas" ? noLeidas.length : tab === "leidas" ? leidas.length : items.length;
  const esVacio = !cargando && visibles.length === 0;

  return (
    <div className={styles.screen}>
      <header className={styles.appBar}>
        <Link href="/panel" aria-label="Ruum Ruum, inicio" className={styles.brand}><Image src="/imagenes/ruum-logo.svg" alt="Ruum Ruum" width={170} height={55} priority /></Link>
        <Link href="/cuenta" className={styles.profile} aria-label="Abrir cuenta"><svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><circle cx="12" cy="8" r="3.6" /><path d="M4.5 20c0-3.7 3.3-6.2 7.5-6.2s7.5 2.5 7.5 6.2" /></svg></Link>
      </header>

      <main className={styles.content}>
        <section className={styles.heading} aria-labelledby="titulo-notificaciones">
          <h1 id="titulo-notificaciones">Notificaciones y Avisos</h1>
          <p>Tus avisos y alertas operativas permanecen guardados en este centro.</p>
        </section>

        <nav className={styles.tabs} aria-label="Filtros de notificaciones">
          {tabs.map((tab) => {
            const activa = filtro === tab.id;
            return <button key={tab.id} type="button" onClick={() => setFiltro(tab.id)} aria-pressed={activa} className={activa ? styles.activeTab : undefined}><span>{tab.label}</span><strong>{contador(tab.id)}</strong></button>;
          })}
        </nav>

        {esVacio ? (
          <section className={styles.empty} aria-live="polite">
            <div className={styles.sparkles} aria-hidden><span>✦</span><i>✦</i><b>✦</b></div>
            <h2>¡Todo al día!</h2>
            <p>{filtro === "no_leidas" ? "No tienes avisos pendientes por leer." : "Aquí aparecerán tus próximos avisos de servicio, ganancias y alertas operativas."}</p>
          </section>
        ) : cargando ? (
          <section className={styles.empty} aria-busy="true"><div className={styles.sparkles} aria-hidden>⋯</div><p>Cargando avisos…</p></section>
        ) : (
          <section className={styles.list} aria-label="Lista de notificaciones">
            {visibles.map((item) => <button key={item.id} type="button" onClick={() => void abrir(item)} className={styles.item}>
              <span className={item.leida_en ? styles.readDot : styles.unreadDot} aria-hidden />
              <span><strong>{item.titulo}</strong><small>{item.cuerpo}</small></span><span aria-hidden>›</span>
            </button>)}
          </section>
        )}
      </main>

      <nav className={styles.bottomNav} aria-label="Navegación principal">
        <Link href="/panel"><svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10Z" /><path d="M9 21v-7h6v7" /></svg><span>Inicio</span></Link>
        <Link href="/viajes"><svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m5 17 1.5-7h11L19 17" /><path d="M4 17h16v3H4zM8 10l1.3-3h5.4l1.3 3" /></svg><span>Traslados</span></Link>
        <Link href="/cuenta"><svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.4-7 8-7s8 3 8 7" /></svg><span>Cuenta</span></Link>
      </nav>
    </div>
  );
}
