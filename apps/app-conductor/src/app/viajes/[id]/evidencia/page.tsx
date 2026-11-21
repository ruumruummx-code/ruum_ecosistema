"use client";
import { Button as BaseButton, Input as BaseInput, NativeSelect as BaseSelect } from "@ruum/ui/base";
import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { AnguloEvidencia } from "@ruum/shared/types";
import { TripFormFrame } from "../TripFormFrame";
import { TripDialog } from "../TripDialog";
import { useEvidenciaPageLogic } from "./useEvidenciaPageLogic";
import { fotoSrc } from "./evidence-requirements";
import { EvidenciaCsatSheet } from "./EvidenciaCsatSheet";
import styles from "../trip-form.module.css";

const PHOTOS: {angle:AnguloEvidencia; label:string; instruction:string}[] = [
  {angle:"frente",label:"Frente",instruction:"Incluye el frente completo y la placa."},
  {angle:"trasera",label:"Parte trasera",instruction:"Incluye la parte trasera completa y la placa."},
  {angle:"lado_piloto",label:"Lateral del piloto",instruction:"Muestra todo el lateral del piloto."},
  {angle:"lado_copiloto",label:"Lateral del copiloto",instruction:"Muestra todo el lateral del copiloto."},
  {angle:"tablero",label:"Tablero e interior",instruction:"Incluye el tablero y el odómetro legible."}
];
const STEPS=[...PHOTOS.map(p=>p.label),"Llaves","Mediciones","Documentos","Observaciones","Revisión"];
export default function PaginaEvidencia() {
  const {id}=useParams<{id:string}>(); const r=useEvidenciaPageLogic(id);
  const [preview,setPreview]=useState(false); const [step,setStep]=useState(0); const [steps,setSteps]=useState(false);
  const photo=PHOTOS.at(step)!; const captured=photo ? r.obtenerFoto(photo.angle) : null;
  const docFields=[
    {label:"Tarjeta de circulación",value:r.tarjetaCirculacion,set:r.setTarjetaCirculacion},
    {label:"Talón de verificación",value:r.talonVerificacion,set:r.setTalonVerificacion},
    {label:"Holograma de verificación",value:r.hologramaVerificacion,set:r.setHologramaVerificacion},
    {label:"Placa delantera",value:r.placaDelantera,set:r.setPlacaDelantera},
    {label:"Placa trasera",value:r.placaTrasera,set:r.setPlacaTrasera}
  ];
  const advance=()=>{ if(step<9)setStep(step+1);else void r.finalizar(); };
  if(r.cargando || !r.pasaporte || !r.tipo) return <TripFormFrame id={id} title="Registro del vehículo" primary={r.cargando ? "Cargando…" : "Reintentar"} busy={r.cargando} onPrimary={()=>location.reload()}>
    <h1>{r.cargando ? "Cargando evidencias" : "Registro no disponible"}</h1><p role={r.cargando ? "status" : "alert"}>{r.aviso || "Vuelve al traslado para consultar el paso actual."}</p><Link href={`/viajes/${id}`}>Volver al traslado</Link>
  </TripFormFrame>;
  const final=r.tipo==="final";
  // Lo pendiente se calcula aquí para que la revisión lleve directo a cada paso y no se envíe incompleto.
  const fotosCapturadas=PHOTOS.filter(p=>r.obtenerFoto(p.angle)).length;
  const primeraFotoFaltante=PHOTOS.findIndex(p=>!r.obtenerFoto(p.angle));
  const fotosPorSubir=PHOTOS.filter(p=>{const f=r.obtenerFoto(p.angle);return f && !f.sincronizada;}).length;
  const docsRegistrados=docFields.filter(d=>d.value).length;
  const pendientes=[
    ...(primeraFotoFaltante>=0 ? [{label:`Fotografías (${fotosCapturadas} de 5)`,step:primeraFotoFaltante}] : []),
    ...(r.llavesCount<0 ? [{label:"Cantidad de llaves",step:5}] : []),
    ...(!r.kilometraje.trim()||r.gasolinaSegments<0 ? [{label:"Kilometraje y combustible",step:6}] : []),
    ...(docsRegistrados<5 ? [{label:`Documentos (${docsRegistrados} de 5)`,step:7}] : []),
    ...(r.presentaDanosNuevos&&!r.obtenerFoto("dano_previo") ? [{label:"Fotografía del daño",step:8}] : [])
  ];
  const eligible=step<5 ? !!captured : step===5 ? Number.isSafeInteger(r.llavesCount)&&r.llavesCount>=0 : step===6 ? !!r.kilometraje.trim() && r.gasolinaSegments>=0 : step===7 ? docsRegistrados===5 : step===9 ? pendientes.length===0 : true;
  return <>
    <TripFormFrame id={id} title={`Registro ${final ? "final" : "inicial"}`} step={step} total={STEPS.length} stepLabel={STEPS.at(step)!}
      onPrevious={step>0 ? ()=>setStep(step-1) : undefined} onSteps={()=>setSteps(true)}
      primary={step===9 ? "Enviar evidencias" : step<5 && !captured ? "Tomar fotografía" : "Continuar"}
      onPrimary={step<5 && !captured ? ()=>void r.capturar(photo.angle) : advance}
      disabled={!eligible && !(step<5&&!captured)} busy={!!r.enviando} error={r.error} notice={r.aviso||r.avisoExito}>
      <input ref={r.inputArchivoRef} type="file" accept="image/*" capture="environment" hidden onChange={e=>{void r.procesarArchivoSeleccionado(e.target.files?.[0]);e.target.value="";}} />
      <h1>{step<5 ? PHOTOS.at(step)!.label : STEPS.at(step)!}</h1>
      {step<5 && <>
        <p>Foto {step+1} de 5. {photo.instruction}</p>
        {captured && fotoSrc(captured) ? <BaseButton variant="ghost" type="button" className={styles.photoButton} onClick={()=>setPreview(true)} aria-label="Ampliar fotografía">
          {/* eslint-disable-next-line @next/next/no-img-element -- Vista previa de captura local o URL firmada. */}
          <img className={styles.preview} src={fotoSrc(captured)!} alt={`Evidencia: ${photo.label}`} /><span className={styles.photoBadge}><span aria-hidden="true">✓ </span>Ampliar fotografía</span>
        </BaseButton> : <div className={styles.photoPlaceholder}><span aria-hidden="true" className={styles.photoPlaceholderIcon}>📷</span><span>La fotografía aparecerá aquí</span></div>}
        {captured && <p role="status">{captured.sincronizada ? "Sincronizada" : "Guardada en el dispositivo; pendiente de sincronización"}</p>}

      </>}
      {step===5 && <><p>Registra las llaves físicas {final ? "entregadas" : "recibidas"}.</p><label>Cantidad de llaves<BaseInput type="number" inputMode="numeric" min={0} step={1} value={r.llavesCount<0 ? "" : r.llavesCount} onChange={e=>r.setLlavesCount(e.target.value==="" ? -1 : Number(e.target.value))} /></label><p>Cuenta las llaves con el contacto antes de continuar.</p></>}
      {step===6 && <><label>Kilometraje actual<BaseInput inputMode="numeric" value={r.kilometraje} onChange={e=>r.setKilometraje(e.target.value.replace(/[^0-9]/g,""))} /></label>
        <label>Nivel de combustible<BaseSelect value={r.gasolinaSegments<0 ? "" : r.gasolinaSegments} onChange={e=>r.setGasolinaSegments(e.target.value==="" ? -1 : Number(e.target.value))}><option value="">Selecciona</option>{[[0,"Vacío"],[1,"Reserva"],[2,"1/4"],[4,"1/2"],[6,"3/4"],[8,"Lleno"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}</BaseSelect></label></>}
      {step===7 && <><p>Indica si cada documento está presente.</p><div className={styles.docList}>{docFields.map(d=><label key={d.label} className={styles.docRow}>{d.label}<BaseSelect value={d.value} onChange={e=>d.set(e.target.value)}><option value="">Selecciona</option><option value="si">Presente</option><option value="no">Ausente</option></BaseSelect></label>)}</div><p>Una ausencia queda sujeta a las reglas de operación.</p></>}
      {step===8 && <><label>Observaciones (opcional)<textarea maxLength={1000} rows={3} value={r.notas} onChange={e=>r.setNotas(e.target.value)} /></label><label>{final ? "¿Hay daños nuevos?" : "¿El vehículo tiene daños previos?"}<BaseSelect value={r.presentaDanosNuevos ? "si" : "no"} onChange={e=>r.setPresentaDanosNuevos(e.target.value==="si")}><option value="no">No</option><option value="si">Sí</option></BaseSelect></label>{r.presentaDanosNuevos && <BaseButton variant="ghost" type="button" onClick={()=>void r.capturar("dano_previo")} disabled={!!r.enviando}>{r.obtenerFoto("dano_previo") ? "Volver a fotografiar el daño" : final ? "Fotografiar daño nuevo" : "Fotografiar daño previo"}</BaseButton>}</>}
      {step===9 && <><p role="status">{pendientes.length ? `Te ${pendientes.length===1 ? "falta 1 punto" : `faltan ${pendientes.length} puntos`}. Toca uno para completarlo.` : "Todo listo. Ya puedes enviar las evidencias."}</p>
        {pendientes.length>0 && <ul className={styles.checklist}>{pendientes.map(p=><li key={p.label}><BaseButton variant="ghost" type="button" className={styles.pendingItem} onClick={()=>setStep(p.step)}>{p.label}</BaseButton></li>)}</ul>}
        {fotosPorSubir>0 && <p>{fotosPorSubir===1 ? "1 fotografía se está subiendo" : `${fotosPorSubir} fotografías se están subiendo`}. Mantén la conexión para poder enviar.</p>}
        <p>{r.borradorLocalGuardado ? "Tu avance está guardado en este teléfono mientras la app siga abierta." : "Tu avance todavía no se guarda en este teléfono."}</p></>}
    </TripFormFrame>
    {preview && captured && <TripDialog title={`Fotografía: ${photo.label}`} onClose={()=>setPreview(false)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- Revisión completa de evidencia, sin recorte. */}
      <img src={fotoSrc(captured)!} alt={`Evidencia completa: ${photo.label}`} className="h-auto w-full object-contain" />
      <BaseButton variant="outline" type="button" className={styles.secondary} disabled={!!r.enviando} onClick={()=>{setPreview(false);void r.capturar(photo.angle);}}>Volver a tomar fotografía</BaseButton>
    </TripDialog>}
    {steps && <TripDialog title="Pasos del registro" onClose={()=>setSteps(false)}><div className={styles.steps}>{STEPS.map((s,i)=><BaseButton variant="ghost" key={s} type="button" onClick={()=>{setStep(i);setSteps(false);}} aria-current={step===i ? "step" : undefined}>{i+1}. {s}</BaseButton>)}<BaseButton variant="ghost" type="button" onClick={()=>{void r.guardarBorrador();setSteps(false);}}>Guardar borrador</BaseButton><BaseButton variant="ghost" type="button" onClick={()=>{void r.drenarCola();setSteps(false);}}>Reintentar sincronización</BaseButton></div></TripDialog>}
    <EvidenciaCsatSheet showCsatSheet={r.showCsatSheet} setShowCsatSheet={r.setShowCsatSheet} csatValor={r.csatValor} setCsatValor={r.setCsatValor} cesValor={r.cesValor} setCesValor={r.setCesValor} enviandoFeedback={r.enviandoFeedback} setEnviandoFeedback={r.setEnviandoFeedback} onEnviarFeedback={r.enviarFeedback} onOmitirFeedback={r.omitirFeedback} />
  </>;
}
