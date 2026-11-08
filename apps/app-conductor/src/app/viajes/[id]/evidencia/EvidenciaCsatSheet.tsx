"use client";
import { TripDialog } from "../TripDialog";
import styles from "../trip-form.module.css";

interface EvidenciaCsatSheetProps {
  showCsatSheet: boolean;
  setShowCsatSheet: (v: boolean) => void;
  csatValor: number | null;
  setCsatValor: (v: number | null) => void;
  cesValor: number | null;
  setCesValor: (v: number | null) => void;
  enviandoFeedback: boolean;
  setEnviandoFeedback: (v: boolean) => void;
  onEnviarFeedback: () => Promise<void>;
  onOmitirFeedback: () => void;
}

export function EvidenciaCsatSheet({showCsatSheet,csatValor,setCsatValor,cesValor,setCesValor,enviandoFeedback,onEnviarFeedback,onOmitirFeedback}:EvidenciaCsatSheetProps) {
 if(!showCsatSheet)return null;
 return <TripDialog title="Evidencia enviada" onClose={onOmitirFeedback} footer={<div className={styles.row}><button className={styles.secondary} type="button" onClick={onOmitirFeedback}>Omitir encuesta</button><button className={styles.secondary} type="button" disabled={enviandoFeedback||csatValor==null||cesValor==null} onClick={()=>void onEnviarFeedback()}>{enviandoFeedback ? "Enviando…" : "Enviar opinión"}</button></div>}>
 <div className={styles.content}><p>La encuesta es opcional; el envío de evidencia ya se realizó.</p><label>¿Qué tan fácil fue registrar la evidencia?<select value={csatValor??""} onChange={e=>setCsatValor(Number(e.target.value))}><option value="" disabled>Selecciona</option>{[1,2,3,4,5].map(v=><option key={v} value={v}>{v} de 5</option>)}</select></label><label>¿Cuánto esfuerzo requirió?<select value={cesValor??""} onChange={e=>setCesValor(Number(e.target.value))}><option value="" disabled>Selecciona</option>{[1,2,3,4,5,6,7].map(v=><option key={v} value={v}>{v} de 7</option>)}</select></label></div>
 </TripDialog>;
}
