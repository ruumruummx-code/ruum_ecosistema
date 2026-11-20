import { Button as BaseButton } from "@ruum/ui/base";
import { useState } from "react";
import styles from "./registration.module.css";

export function RegistrationNotice({ message }: { message?: string | null }) {
  const [dismissed, setDismissed] = useState<string | null>(null);
  return message && message !== dismissed ? (
    <div className={styles.notice} role="status" aria-atomic="true">
      <span>{message}</span>
      <BaseButton variant="ghost" type="button" onClick={() => setDismissed(message)} aria-label="Cerrar aviso">×</BaseButton>
    </div>
  ) : null;
}
