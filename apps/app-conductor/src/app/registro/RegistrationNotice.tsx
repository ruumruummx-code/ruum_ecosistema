import { useEffect, useState } from "react";
import styles from "./registration.module.css";

export function RegistrationNotice({ message }: { message?: string | null }) {
  const [dismissed, setDismissed] = useState<string | null>(null);
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setDismissed(message), 7000);
    return () => window.clearTimeout(timer);
  }, [message]);
  return message && message !== dismissed ? (
    <div className={styles.notice} role="status" aria-atomic="true">
      <span>{message}</span>
      <button type="button" onClick={() => setDismissed(message)} aria-label="Cerrar aviso">×</button>
    </div>
  ) : null;
}
