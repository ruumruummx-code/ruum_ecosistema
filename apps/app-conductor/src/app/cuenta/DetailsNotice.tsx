"use client";
import { useRef } from "react";
import styles from "./details.module.css";

export function DetailsNotice({ message, error = false }: { message: string; error?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  return <>
    <div className={styles.notice} data-error={error} role={error ? "alert" : "status"}><button type="button" onClick={() => dialog.current?.showModal()} aria-label="Ver aviso completo">{message}</button></div>
    <dialog ref={dialog} className={styles.dialog} aria-labelledby="details-notice-title"><h2 id="details-notice-title">{error ? "Revisa esta información" : "Información"}</h2><p>{message}</p><button type="button" className={styles.primary} onClick={() => dialog.current?.close()}>Entendido</button></dialog>
  </>;
}
