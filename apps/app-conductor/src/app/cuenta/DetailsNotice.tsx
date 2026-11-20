"use client";
import { Button as BaseButton } from "@ruum/ui/base";
import { useRef } from "react";
import styles from "./details.module.css";

export function DetailsNotice({ message, error = false }: { message: string; error?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  return <>
    <div className={styles.notice} data-error={error} role={error ? "alert" : "status"}><BaseButton variant="ghost" type="button" onClick={() => dialog.current?.showModal()} aria-label="Ver aviso completo">{message}</BaseButton></div>
    <dialog ref={dialog} className={styles.dialog} aria-labelledby="details-notice-title"><h2 id="details-notice-title">{error ? "Revisa esta información" : "Información"}</h2><p>{message}</p><BaseButton variant="primary" type="button" className={styles.primary} onClick={() => dialog.current?.close()}>Entendido</BaseButton></dialog>
  </>;
}
