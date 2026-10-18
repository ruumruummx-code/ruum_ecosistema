"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { GlobalSyncSnapshot } from "../../lib/offline-sync-status";
import { AccountIcon, type AccountIconName } from "./AccountIcon";
import styles from "./account.module.css";

const sections: { href: string; title: string; description: string; icon: AccountIconName }[] = [
  { href: "/cuenta/perfil", title: "Perfil", description: "Tu información personal", icon: "user" },
  { href: "/cuenta/documentos", title: "Documentos", description: "Carga y revisa tus documentos", icon: "document" },
  { href: "/cuenta/certificacion", title: "Certificación", description: "Estado y detalles de tu certificación", icon: "medal" },
  { href: "/cuenta/datos-bancarios", title: "Datos bancarios", description: "Administra tu cuenta de depósito", icon: "card" },
];
type Props = { initials: string | null; unread: number; loading: boolean; sync: GlobalSyncSnapshot | null; loggingOut: boolean; logoutError: string | null; onLogout: () => void; onOpenLogout: () => void };

export function DriverAccountView(props: Props) {
  const screen = useRef<HTMLDivElement>(null);
  const logoutDialog = useRef<HTMLDialogElement>(null);
  const settingsDialog = useRef<HTMLDialogElement>(null);
  const [openDialog, setOpenDialog] = useState<"logout" | "settings" | null>(null);
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const update = () => {
      screen.current?.style.setProperty("--account-height", `${viewport.height}px`);
      screen.current?.style.setProperty("--account-top", `${viewport.offsetTop}px`);
    };
    update(); viewport.addEventListener("resize", update); viewport.addEventListener("scroll", update);
    return () => { viewport.removeEventListener("resize", update); viewport.removeEventListener("scroll", update); };
  }, []);
  useEffect(() => {
    if (openDialog === "logout") logoutDialog.current?.showModal(); else logoutDialog.current?.close();
    if (openDialog === "settings") settingsDialog.current?.showModal(); else settingsDialog.current?.close();
  }, [openDialog]);
  const syncOK = props.sync?.status === "todo_sincronizado";
  const syncText = syncOK ? "Sincronizado — todo al día" : props.sync?.message ?? "Comprobando sincronización…";
  return <div className={styles.screen} ref={screen} data-driver-account>
    <div className={styles.body}>
      <header className={styles.header}>
        <Link href="/panel" prefetch={false} className={styles.brand} aria-label="Ruum Ruum Driver Service, inicio"><Image src="/imagenes/ruum-logo.svg" alt="Ruum Ruum" width={170} height={55} priority /><span>DRIVER SERVICE</span></Link>
        <div className={styles.quickActions}>
          <Link href="/notificaciones" prefetch={false} aria-label={props.unread ? `Notificaciones (${props.unread} sin leer)` : "Notificaciones"}><AccountIcon name="bell" />{props.unread > 0 && <i className={styles.notificationDot} aria-hidden="true" />}</Link>
          <Link href="/cuenta/soporte" prefetch={false} aria-label="Soporte"><AccountIcon name="support" /></Link>
          <button type="button" aria-label="Opciones de cuenta" aria-haspopup="dialog" aria-expanded={openDialog === "settings"} aria-busy={props.loading} onClick={() => setOpenDialog("settings")}>{props.initials ?? <AccountIcon name="user" />}</button>
        </div>
      </header>
      <div className={styles.heading}><h1>Cuenta</h1><p>Administra tu información y configuración</p></div>
      <div className={styles.sync} role="status" aria-live="polite" aria-atomic="true" data-state={props.sync?.status ?? "loading"}>
        {syncOK ? <AccountIcon name="check" /> : <span aria-hidden="true">{props.sync ? "!" : "…"}</span>}<span>{syncText}</span>
        {props.sync && ["accion_requerida", "error_recuperable", "conflicto_revision"].includes(props.sync.status) && <Link href={props.sync.status === "accion_requerida" ? "/login?next=/cuenta" : "/cuenta/soporte"}>{props.sync.status === "accion_requerida" ? "Entrar" : "Ayuda"}</Link>}
      </div>
      <nav className={styles.options} aria-label="Configuración de cuenta">
        {sections.map(section => <Link key={section.href} href={section.href} prefetch={false} className={styles.option}>
          <span className={styles.optionIcon} data-icon={section.icon}><AccountIcon name={section.icon} /></span>
          <span className={styles.optionText}><strong>{section.title}</strong><span>{section.description}</span></span>
          <span className={styles.chevron}><AccountIcon name="right" /></span>
        </Link>)}
      </nav>
      <button type="button" className={styles.logout} onClick={() => { props.onOpenLogout(); setOpenDialog("logout"); }}><AccountIcon name="logout" />Cerrar sesión</button>
    </div>
    <nav className={styles.bottomNav} aria-label="Navegación principal">
      {([{ href: "/panel", label: "Inicio", icon: "home" }, { href: "/viajes", label: "Traslados", icon: "car" }, { href: "/ganancias", label: "Ganancias", icon: "wallet" }, { href: "/cuenta", label: "Cuenta", icon: "user" }] as const).map(item => <Link key={item.href} href={item.href} prefetch={false} aria-current={item.href === "/cuenta" ? "page" : undefined}><AccountIcon name={item.icon} /><span>{item.label}</span></Link>)}
    </nav>
    <dialog ref={settingsDialog} className={styles.dialog} aria-labelledby="account-settings-title" onCancel={() => setOpenDialog(null)} onClose={() => setOpenDialog(current => current === "settings" ? null : current)}>
      <header><h2 id="account-settings-title">Ajustes de cuenta</h2><button type="button" aria-label="Cerrar ajustes" onClick={() => setOpenDialog(null)}>×</button></header>
      <nav aria-label="Más ajustes"><Link href="/cuenta/preferencias">Preferencias</Link><Link href="/cuenta/seguridad">Seguridad</Link><Link href="/cuenta/legal">Marco legal</Link></nav>
    </dialog>
    <dialog ref={logoutDialog} className={styles.dialog} aria-labelledby="account-logout-title" onCancel={event => { if (props.loggingOut) event.preventDefault(); else setOpenDialog(null); }} onClose={() => setOpenDialog(current => current === "logout" ? null : current)}>
      <h2 id="account-logout-title">¿Cerrar sesión?</h2><p>Saldrás de tu cuenta de conductor en este dispositivo.</p>
      {props.logoutError && <p className={styles.error} role="alert">{props.logoutError}</p>}
      <button type="button" className={styles.confirmLogout} disabled={props.loggingOut} onClick={props.onLogout}>{props.loggingOut ? "Cerrando sesión…" : "Sí, cerrar sesión"}</button>
      <button type="button" className={styles.cancel} disabled={props.loggingOut} onClick={() => setOpenDialog(null)}>Cancelar</button>
    </dialog>
  </div>;
}
