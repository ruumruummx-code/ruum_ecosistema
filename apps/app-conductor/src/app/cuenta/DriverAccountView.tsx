"use client";
import { PageHeader } from "@ruum/ui/base";

import { Button as BaseButton } from "@ruum/ui/base";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@ruum/ui/base";
import type { GlobalSyncSnapshot } from "../../lib/offline-sync-status";
import { AccountIcon, type AccountIconName } from "./AccountIcon";
import styles from "./account.module.css";

const sections: { href: string; title: string; icon: AccountIconName }[] = [
  { href: "/cuenta/perfil", title: "Perfil", icon: "user" },
  { href: "/cuenta/documentos", title: "Documentos", icon: "document" },
  { href: "/cuenta/certificacion", title: "Certificación", icon: "medal" },
  { href: "/cuenta/datos-bancarios", title: "Datos bancarios", icon: "card" },
];
type Props = { initials: string | null; unread: number; loading: boolean; sync: GlobalSyncSnapshot | null; loggingOut: boolean; logoutError: string | null; onLogout: () => void; onOpenLogout: () => void };

export function DriverAccountView(props: Props) {
  const logoutDialog = useRef<HTMLDialogElement>(null);
  const settingsDialog = useRef<HTMLDialogElement>(null);
  const [openDialog, setOpenDialog] = useState<"logout" | "settings" | null>(null);
  useEffect(() => {
    if (openDialog === "logout") logoutDialog.current?.showModal(); else logoutDialog.current?.close();
    if (openDialog === "settings") settingsDialog.current?.showModal(); else settingsDialog.current?.close();
  }, [openDialog]);
  const syncOK = props.sync?.status === "todo_sincronizado";
  const syncText = syncOK ? "Sincronizado — todo al día" : props.sync?.message ?? "Comprobando sincronización…";
  return <div className={styles.screen} data-driver-account>
    <div className={styles.body}>
      <div className="flex justify-end">
        <Button variant="outline" type="button" aria-label="Opciones de cuenta" aria-haspopup="dialog" aria-expanded={openDialog === "settings"} aria-busy={props.loading} onClick={() => setOpenDialog("settings")} className="min-h-11 rounded-full border border-ui-line bg-ui-card px-4 text-sm text-ui-fg">Ajustes de cuenta</Button>
      </div>
      <PageHeader titulo="Cuenta" descripcion="Administra tu información y configuración" className="[&_h1]:text-2xl [&_p]:block" />
      {props.sync?.status !== "accion_requerida" && <div className={styles.sync} role="status" aria-live="polite" aria-atomic="true" data-state={props.sync?.status ?? "loading"}>
        {syncOK ? <AccountIcon name="check" /> : <span aria-hidden="true">{props.sync ? "!" : "…"}</span>}<span>{syncText}</span>
        {props.sync && ["error_recuperable", "conflicto_revision"].includes(props.sync.status) && <Link href="/cuenta/soporte">Ayuda</Link>}
      </div>}
      <nav className={styles.options} aria-label="Configuración de cuenta">
        {sections.map(section => <Link key={section.href} href={section.href} prefetch={false} className={styles.option}>
          <span className={styles.optionIcon} data-icon={section.icon}><AccountIcon name={section.icon} /></span>
          <span className={styles.optionText}><strong>{section.title}</strong></span>
          <span className={styles.chevron}><AccountIcon name="right" /></span>
        </Link>)}
      </nav>
      <BaseButton variant="ghost" type="button" className={styles.logout} onClick={() => { props.onOpenLogout(); setOpenDialog("logout"); }}><AccountIcon name="logout" />Cerrar sesión</BaseButton>
    </div>
    <dialog ref={settingsDialog} className={styles.dialog} aria-labelledby="account-settings-title" onCancel={() => setOpenDialog(null)} onClose={() => setOpenDialog(current => current === "settings" ? null : current)}>
      <header><h2 id="account-settings-title">Ajustes de cuenta</h2><BaseButton variant="ghost" type="button" aria-label="Cerrar ajustes" onClick={() => setOpenDialog(null)}>×</BaseButton></header>
      <nav aria-label="Más ajustes"><Link href="/cuenta/preferencias">Preferencias</Link><Link href="/cuenta/seguridad">Seguridad</Link><Link href="/cuenta/legal">Marco legal</Link></nav>
    </dialog>
    <dialog ref={logoutDialog} className={styles.dialog} aria-labelledby="account-logout-title" onCancel={event => { if (props.loggingOut) event.preventDefault(); else setOpenDialog(null); }} onClose={() => setOpenDialog(current => current === "logout" ? null : current)}>
      <h2 id="account-logout-title">¿Cerrar sesión?</h2><p>Saldrás de tu cuenta de conductor en este dispositivo.</p>
      {props.logoutError && <p className={styles.error} role="alert">{props.logoutError}</p>}
      <BaseButton variant="primary" type="button" className={styles.confirmLogout} disabled={props.loggingOut} onClick={props.onLogout}>{props.loggingOut ? "Cerrando sesión…" : "Sí, cerrar sesión"}</BaseButton>
      <BaseButton variant="outline" type="button" className={styles.cancel} disabled={props.loggingOut} onClick={() => setOpenDialog(null)}>Cancelar</BaseButton>
    </dialog>
  </div>;
}
