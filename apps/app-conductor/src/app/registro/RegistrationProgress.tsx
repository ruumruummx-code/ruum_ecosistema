import { RegistrationAccessHeader } from "./RegistrationAccessHeader";
import { PASOS_REGISTRO, type EstadoGuardadoRemoto } from "./registration-types";
import styles from "./registration.module.css";

export function RegistrationProgress({ paso, onBack, borradorLocalGuardado, sesionAutenticada, estadoGuardadoRemoto, detalleGuardadoRemoto }: {
  paso: number; onBack: () => void; borradorLocalGuardado: boolean;
  sesionAutenticada: boolean; estadoGuardadoRemoto: EstadoGuardadoRemoto;
  detalleGuardadoRemoto: string | null;
}) {
  const porcentaje = Math.round(((paso + 1) / PASOS_REGISTRO.length) * 100);
  const guardado = sesionAutenticada ? estadoGuardadoRemoto : borradorLocalGuardado ? "guardado" : "inactivo";
  const estadoGuardado = <output className="sr-only" aria-live="polite" title={detalleGuardadoRemoto ?? undefined}>
    {guardado === "guardando" ? "Guardando borrador" : guardado === "guardado" ? "Borrador guardado" : guardado === "sin_conexion" ? "Sin conexión; guardado local" : guardado === "error" ? `Error al guardar: ${detalleGuardadoRemoto ?? "Reintenta la conexión"}` : ""}
  </output>;
  if (paso === 0) return <RegistrationAccessHeader step={1} onBack={onBack}>{estadoGuardado}</RegistrationAccessHeader>;
  if (paso === 1) return <RegistrationAccessHeader step={2} onBack={onBack}>{estadoGuardado}</RegistrationAccessHeader>;
  if (paso >= 3) return <RegistrationAccessHeader step={paso + 1 as 4 | 5} onBack={onBack}>{estadoGuardado}</RegistrationAccessHeader>;
  return (
    <header className={styles.appBar}>
      <button type="button" onClick={onBack} aria-label="Atrás">‹ Atrás</button>
        <h1 id="titulo-registro-conductor">{PASOS_REGISTRO[paso].shortTitle} ({paso + 1}/{PASOS_REGISTRO.length})</h1>
        <span aria-hidden="true" />
        <progress className={styles.progress} value={porcentaje} max={100} aria-label="Progreso de registro" />
      {estadoGuardado}
    </header>
  );
}
