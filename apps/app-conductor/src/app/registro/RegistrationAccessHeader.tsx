import Image from "next/image";
import type { ReactNode } from "react";
import styles from "./registration.module.css";

export function RegistrationAccessHeader({ step, onBack, children }: { step: 1 | 2; onBack: () => void; children?: ReactNode }) {
  return <header className={styles.appBar}>
    <button type="button" onClick={onBack} aria-label="Atrás">‹ Atrás</button>
    <Image src="/imagenes/ruum-logo.svg" alt="Ruum Ruum" width={150} height={49} priority className={styles.accountLogo} />
    <div className={styles.segmentedProgress} role="progressbar" aria-label="Progreso de registro" aria-valuemin={0} aria-valuemax={5} aria-valuenow={step} aria-valuetext={`${step} de 5`}>
      <span>{step} de 5</span>
      <div aria-hidden="true">{Array.from({ length: 5 }, (_, index) => <i key={index} data-active={index < step} />)}</div>
    </div>
    {children}
  </header>;
}
