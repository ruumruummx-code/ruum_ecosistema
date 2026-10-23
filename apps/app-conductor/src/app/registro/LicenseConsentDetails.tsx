import { useLayoutEffect, useId, useRef } from "react";
import styles from "./registration.module.css";

export function LicenseConsentDetails({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useLayoutEffect(() => {
    const dialog = ref.current;
    const previousFocus = document.activeElement;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, []);
  return <dialog ref={ref} className={styles.sheet} aria-labelledby={titleId}
    onCancel={(event) => { event.preventDefault(); onClose(); }}>
    <header className={styles.sheetHeader}>
      <h2 id={titleId}>Declaración y autorizaciones</h2>
      <button type="button" onClick={onClose} aria-label="Cerrar declaración">×</button>
    </header>
    <div className={styles.sheetBody}>
      <p className={styles.legalDetails}>Al pulsar Continuar, declaras que tu licencia está vigente y no tiene suspensiones, y que no tienes procesos legales activos relacionados con el manejo de vehículos.</p>
      <p className={styles.legalDetails}>Autorizas la verificación de antecedentes penales e infracciones de conducción ante las autoridades correspondientes y el tratamiento de tus datos biométricos y de geolocalización para la verificación de identidad con Didit.</p>
      <p className={styles.legalDetails}><a href="/legal/privacidad?volver=%2Fregistro" target="_blank" rel="noopener noreferrer">Aviso de Privacidad</a> · <a href="/legal/terminos?volver=%2Fregistro" target="_blank" rel="noopener noreferrer">Términos de servicio</a></p>
    </div>
    <footer className={styles.sheetFooter}><button type="button" onClick={onClose}>Cerrar</button></footer>
  </dialog>;
}
