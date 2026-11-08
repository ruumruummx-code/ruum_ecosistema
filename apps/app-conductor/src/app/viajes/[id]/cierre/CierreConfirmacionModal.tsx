"use client";
import { TripDialog } from "../TripDialog";
import styles from "../trip-form.module.css";
export function CierreConfirmacionModal({abierto,onCerrar,onConfirmar,procesando,delivery=false}:{abierto:boolean;onCerrar:()=>void;onConfirmar:()=>void;procesando:boolean;delivery?:boolean}) {
  if(!abierto)return null;
  return <TripDialog title={delivery ? "Confirmar entrega" : "Finalizar servicio"} onClose={onCerrar} footer={<div className={styles.row}><button className={styles.secondary} type="button" onClick={onCerrar} disabled={procesando}>Cancelar</button><button className={`${styles.secondary} ${styles.confirmation}`} type="button" onClick={onConfirmar} disabled={procesando}>{delivery ? "Sí, confirmar entrega" : "Sí, finalizar servicio"}</button></div>}><p>{delivery ? "Se acreditará la entrega del vehículo y la firma del receptor. El servicio seguirá pendiente de su cierre final." : "Se finalizará el servicio con los registros acreditados. Verifica que los datos sean correctos antes de confirmar."}</p></TripDialog>;
}
