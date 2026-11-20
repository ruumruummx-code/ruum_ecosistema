"use client";
import { Button as BaseButton, NativeSelect as BaseSelect } from "@ruum/ui/base";
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
 return <TripDialog title="Evidencia enviada" onClose={onOmitirFeedback} footer={<div className={styles.row}><BaseButton variant="outline" className={styles.secondary} type="button" onClick={onOmitirFeedback}>Omitir encuesta</BaseButton><BaseButton variant="outline" className={styles.secondary} type="button" disabled={enviandoFeedback||csatValor==null||cesValor==null} onClick={()=>void onEnviarFeedback()}>{enviandoFeedback ? "Enviando…" : "Enviar opinión"}</BaseButton></div>}>
 <div className={styles.content}><p>La encuesta es opcional; el envío de evidencia ya se realizó.</p><label>¿Qué tan fácil fue registrar la evidencia?<BaseSelect value={csatValor??""} onChange={e=>setCsatValor(Number(e.target.value))}><option value="" disabled>Selecciona</option>{[1,2,3,4,5].map(v=><option key={v} value={v}>{v} de 5</option>)}</BaseSelect></label><label>¿Cuánto esfuerzo requirió?<BaseSelect value={cesValor??""} onChange={e=>setCesValor(Number(e.target.value))}><option value="" disabled>Selecciona</option>{[1,2,3,4,5,6,7].map(v=><option key={v} value={v}>{v} de 7</option>)}</BaseSelect></label></div>
 </TripDialog>;
}
