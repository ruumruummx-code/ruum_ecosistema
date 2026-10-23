"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  const [sincronizando, setSincronizando] = useState<string | null>(null);
  const [erroresLectura, setErroresLectura] = useState(() => new Map<string, string>());
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const pendiente = useRef<string | null>(null);
  const montado = useRef(true);
  const cargaActual = useRef(0);

  const cargar = useCallback(async () => {
    // Una recarga antigua no debe deshacer una lectura optimista en curso.
    if (pendiente.current) return;
    const solicitud = ++cargaActual.current;
    try {
      const resultado = await listarNotificacionesConductor(crearClienteNavegador(), 100);
      if (!montado.current || solicitud !== cargaActual.current) return;
      setItems(resultado);
      setErroresLectura(actuales => {
        const siguientes = new Map(actuales);
        for (const item of resultado) if (item.leida_en) siguientes.delete(item.id);
        return siguientes;
      });
      setErrorCarga(null);
    } catch {
      if (montado.current && solicitud === cargaActual.current) setErrorCarga("No pudimos actualizar tus avisos. Intenta de nuevo.");
    } finally {
      if (montado.current && solicitud === cargaActual.current) setCargando(false);
    }
  }, []);

  useEffect(() => {
    montado.current = true;
    void cargar();
    const actualizar = () => void cargar();
    window.addEventListener("ruum:notificaciones-actualizar", actualizar);
    return () => {
      montado.current = false;
      window.removeEventListener("ruum:notificaciones-actualizar", actualizar);
    };
  }, [cargar]);

  const noLeidas = items.filter((item) => !item.leida_en);
  const leidas = items.filter((item) => Boolean(item.leida_en));
  const visibles = filtro === "no_leidas" ? items.filter(item => !item.leida_en || item.id === sincronizando) : filtro === "leidas" ? leidas : items;

  async function abrir(item: NotificacionConductor) {
    if (pendiente.current) return;
    if (item.leida_en) { router.push(item.destino); return; }
    pendiente.current = item.id;
    cargaActual.current++;
    setSincronizando(item.id);
    setErroresLectura(actuales => { const siguientes = new Map(actuales); siguientes.delete(item.id); return siguientes; });
    setItems(actuales => actuales.map(actual => actual.id === item.id ? { ...actual, leida_en: new Date().toISOString() } : actual));
    try {
      await marcarNotificacionLeida(crearClienteNavegador(), item.id);
      if (!montado.current) return;
      window.dispatchEvent(new Event("ruum:notificaciones-actualizar"));
      router.push(item.destino);
    } catch {
      if (!montado.current) return;
      setItems(actuales => actuales.map(actual => actual.id === item.id ? { ...actual, leida_en: item.leida_en } : actual));
      setErroresLectura(actuales => new Map(actuales).set(item.id, "No pudimos confirmar la lectura. Reintenta o abre el aviso sin actualizar su estado."));
    } finally {
      pendiente.current = null;
      if (montado.current) setSincronizando(null);
    }
  }

  const contador = (tab: FiltroTab) => tab === "no_leidas" ? noLeidas.length : tab === "leidas" ? leidas.length : items.length;
  const esVacio = !cargando && !errorCarga && visibles.length === 0;

  return (
    <div className={styles.screen}>
      <header className={styles.appBar}>
        <Link href="/panel" aria-label="Ruum Ruum, inicio" className={styles.brand}><Image src="/imagenes/ruum-logo.svg" alt="Ruum Ruum" width={170} height={55} priority /></Link>
        <Link href="/cuenta" className={styles.profile} aria-label="Abrir cuenta"><svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><circle cx="12" cy="8" r="3.6" /><path d="M4.5 20c0-3.7 3.3-6.2 7.5-6.2s7.5 2.5 7.5 6.2" /></svg></Link>
      </header>

      <div className={styles.content}>
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

        {errorCarga && <div className={styles.readError} role="alert"><p>{errorCarga}</p><button type="button" onClick={() => void cargar()}>Reintentar carga de avisos</button></div>}

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
            {visibles.map((item) => <article key={item.id} className={styles.notice} data-notification-id={item.id} data-read={Boolean(item.leida_en)}>
              <button type="button" onClick={() => void abrir(item)} disabled={Boolean(sincronizando)} aria-busy={sincronizando === item.id} aria-describedby={`lectura-${item.id}`} className={styles.item}>
                <span className={item.leida_en ? styles.readDot : styles.unreadDot} aria-hidden />
                <span><strong>{item.titulo}</strong><small>{item.cuerpo}</small></span><span aria-hidden>›</span>
              </button>
              <p id={`lectura-${item.id}`} role="status" className={styles.readStatus}>{sincronizando === item.id ? "Leída · sincronizando…" : item.leida_en ? "Leída" : "Sin leer"}</p>
              {erroresLectura.has(item.id) && <div className={styles.readError}>
                <p role="alert">{erroresLectura.get(item.id)}</p>
                <button type="button" disabled={Boolean(sincronizando)} onClick={() => void abrir(item)}>Reintentar guardar lectura</button>
                <Link href={item.destino}>Abrir aviso sin actualizar lectura</Link>
              </div>}
            </article>)}
          </section>
        )}
      </div>

      </div>
  );
}
