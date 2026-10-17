import Link from "next/link";
import { PASOS_REGISTRO, type EstadoGuardadoRemoto } from "./registration-types";
import styles from "./registration.module.css";

export function RegistrationProgress({ paso, onBack, borradorLocalGuardado, sesionAutenticada, estadoGuardadoRemoto, detalleGuardadoRemoto }: {
  paso: number; onBack: () => void; borradorLocalGuardado: boolean;
  sesionAutenticada: boolean; estadoGuardadoRemoto: EstadoGuardadoRemoto;
  detalleGuardadoRemoto: string | null;
}) {
  const porcentaje = Math.round(((paso + 1) / PASOS_REGISTRO.length) * 100);
  const guardado = sesionAutenticada ? estadoGuardadoRemoto : borradorLocalGuardado ? "guardado" : "inactivo";
  return (
    <header className={styles.appBar}>
      <button type="button" onClick={onBack} aria-label="Atrás">‹ Atrás</button>
      <h1 id="titulo-registro-conductor">{PASOS_REGISTRO[paso].shortTitle} ({paso + 1}/{PASOS_REGISTRO.length})</h1>
      {paso === 0 ? <Link href="/login">Entrar</Link> : <span aria-hidden="true" />}
      <progress className={styles.progress} value={porcentaje} max={100} aria-label="Progreso de registro" />
      <output className="sr-only" aria-live="polite" title={detalleGuardadoRemoto ?? undefined}>
        {guardado === "guardando" ? "Guardando borrador" : guardado === "guardado" ? "Borrador guardado" : guardado === "sin_conexion" ? "Sin conexión; guardado local" : guardado === "error" ? `Error al guardar: ${detalleGuardadoRemoto ?? "Reintenta la conexión"}` : ""}
      </output>
    </header>
  );
}
