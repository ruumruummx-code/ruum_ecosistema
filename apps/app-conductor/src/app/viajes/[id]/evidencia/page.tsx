"use client";
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
  const [preview,setPreview]=useState(false); const [step,setStep]=useState(0); const [steps,setSteps]=useState(false); const [documents,setDocuments]=useState(0);
  const photo=PHOTOS.at(step)!; const captured=photo ? r.obtenerFoto(photo.angle) : null;
  const docFields=[
    {label:"Tarjeta de circulación",value:r.tarjetaCirculacion,set:r.setTarjetaCirculacion},
    {label:"Talón de verificación",value:r.talonVerificacion,set:r.setTalonVerificacion},
    {label:"Holograma de verificación",value:r.hologramaVerificacion,set:r.setHologramaVerificacion},
    {label:"Placa delantera",value:r.placaDelantera,set:r.setPlacaDelantera},
    {label:"Placa trasera",value:r.placaTrasera,set:r.setPlacaTrasera}
  ];
  const advance=()=>{ if(step===7 && documents<4){setDocuments(documents+1);return;} if(step<9)setStep(step+1);else void r.finalizar(); };
  if(r.cargando || !r.pasaporte || !r.tipo) return <TripFormFrame id={id} title="Registro del vehículo" primary={r.cargando ? "Cargando…" : "Reintentar"} busy={r.cargando} onPrimary={()=>location.reload()}>
    <h1>{r.cargando ? "Cargando evidencias" : "Registro no disponible"}</h1><p role={r.cargando ? "status" : "alert"}>{r.aviso || "Vuelve al traslado para consultar el paso actual."}</p><Link href={`/viajes/${id}`}>Volver al traslado</Link>
  </TripFormFrame>;
  const final=r.tipo==="final";
  const eligible=step<5 ? !!captured : step===5 ? Number.isSafeInteger(r.llavesCount)&&r.llavesCount>=0 : step===6 ? !!r.kilometraje.trim() && r.gasolinaSegments>=0 : step===7 ? !!docFields.at(documents)!.value : true;
  return <>
    <TripFormFrame id={id} title={`Registro ${final ? "final" : "inicial"}`} step={step} total={STEPS.length} stepLabel={STEPS.at(step)!}
      onPrevious={step>0 ? ()=>{if(step===7&&documents>0)setDocuments(documents-1);else setStep(step-1);} : undefined} onSteps={()=>setSteps(true)}
      primary={step===9 ? "Enviar evidencias" : step<5 && !captured ? "Tomar fotografía" : "Continuar"}
      onPrimary={step<5 && !captured ? ()=>void r.capturar(photo.angle) : advance}
      disabled={!eligible && !(step<5&&!captured)} busy={!!r.enviando} error={r.error} notice={r.aviso||r.avisoExito}>
      <input ref={r.inputArchivoRef} type="file" accept="image/*" capture="environment" hidden onChange={e=>{void r.procesarArchivoSeleccionado(e.target.files?.[0]);e.target.value="";}} />
      <h1>{step<5 ? PHOTOS.at(step)!.label : STEPS.at(step)!}</h1>
      {step<5 && <>
        <p>Foto {step+1} de 5. {photo.instruction}</p>
        {captured && fotoSrc(captured) ? <button type="button" className={styles.photoButton} onClick={()=>setPreview(true)} aria-label="Ampliar fotografía">
          {/* eslint-disable-next-line @next/next/no-img-element -- Vista previa de captura local o URL firmada. */}
          <img className={styles.preview} src={fotoSrc(captured)!} alt={`Evidencia: ${photo.label}`} /><span>Ampliar fotografía</span>
        </button> : <div className={styles.photoPlaceholder}>La fotografía aparecerá aquí</div>}
        {captured && <p role="status">{captured.sincronizada ? "Sincronizada" : "Guardada en el dispositivo; pendiente de sincronización"}</p>}

      </>}
      {step===5 && <><p>Registra las llaves físicas {final ? "entregadas" : "recibidas"}.</p><label>Cantidad de llaves<input type="number" inputMode="numeric" min={0} step={1} value={r.llavesCount<0 ? "" : r.llavesCount} onChange={e=>r.setLlavesCount(e.target.value==="" ? -1 : Number(e.target.value))} /></label><p>Cuenta las llaves con el contacto antes de continuar.</p></>}
      {step===6 && <><label>Kilometraje actual<input inputMode="numeric" value={r.kilometraje} onChange={e=>r.setKilometraje(e.target.value.replace(/[^0-9]/g,""))} /></label>
        <label>Nivel de combustible<select value={r.gasolinaSegments<0 ? "" : r.gasolinaSegments} onChange={e=>r.setGasolinaSegments(e.target.value==="" ? -1 : Number(e.target.value))}><option value="">Selecciona</option>{[[0,"Vacío"],[1,"Reserva"],[2,"1/4"],[4,"1/2"],[6,"3/4"],[8,"Lleno"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label></>}
      {step===7 && <><p>Comprobación {documents+1} de 5</p><label>{docFields.at(documents)!.label}<select value={docFields.at(documents)!.value} onChange={e=>docFields.at(documents)!.set(e.target.value)}><option value="">Selecciona</option><option value="si">Sí, presente</option><option value="no">No, ausente</option></select></label><p>Registra lo observado. Una ausencia queda sujeta a las reglas de operación.</p></>}
      {step===8 && <><label>Observaciones (opcional)<textarea maxLength={1000} rows={3} value={r.notas} onChange={e=>r.setNotas(e.target.value)} /></label>{final && <><label>¿Hay daños nuevos?<select value={r.presentaDanosNuevos ? "si" : "no"} onChange={e=>r.setPresentaDanosNuevos(e.target.value==="si")}><option value="no">No</option><option value="si">Sí</option></select></label>{r.presentaDanosNuevos && <button type="button" onClick={()=>void r.capturar("dano_previo")} disabled={!!r.enviando}>{r.obtenerFoto("dano_previo") ? "Volver a capturar daño" : "Fotografiar daño nuevo"}</button>}</>}</>}
      {step===9 && <><p role="status">{r.borradorLocalGuardado ? "Borrador local en esta pestaña" : "Borrador local no confirmado"}</p><p>El servidor validará los requisitos.</p><ul className={styles.checklist}>
        <li>Fotos capturadas: {r.fotosObligCapturadas}/5</li><li>Sincronizadas: {r.angulosObligatorios.filter(a=>r.obtenerFoto(a)?.sincronizada).length}/5</li>
        <li>Llaves: {r.llavesCount<0 ? "Pendiente" : r.llavesCount}</li><li>Odómetro: {r.kilometraje||"Pendiente"}</li><li>Combustible: {r.gasolinaSegments<0 ? "Pendiente" : r.getFuelText(r.gasolinaSegments)}</li><li>Documentos comprobados: {docFields.filter(d=>d.value).length}/5</li>
        </ul></>}
    </TripFormFrame>
    {preview && captured && <TripDialog title={`Fotografía: ${photo.label}`} onClose={()=>setPreview(false)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- Revisión completa de evidencia, sin recorte. */}
      <img src={fotoSrc(captured)!} alt={`Evidencia completa: ${photo.label}`} className="h-auto w-full object-contain" />
      <button type="button" className={styles.secondary} disabled={!!r.enviando} onClick={()=>{setPreview(false);void r.capturar(photo.angle);}}>Volver a tomar fotografía</button>
    </TripDialog>}
    {steps && <TripDialog title="Pasos del registro" onClose={()=>setSteps(false)}><div className={styles.steps}>{STEPS.map((s,i)=><button key={s} type="button" onClick={()=>{setStep(i);setSteps(false);}} aria-current={step===i ? "step" : undefined}>{i+1}. {s}</button>)}<button type="button" onClick={()=>{void r.guardarBorrador();setSteps(false);}}>Guardar borrador</button><button type="button" onClick={()=>{void r.drenarCola();setSteps(false);}}>Reintentar sincronización</button></div></TripDialog>}
    <EvidenciaCsatSheet showCsatSheet={r.showCsatSheet} setShowCsatSheet={r.setShowCsatSheet} csatValor={r.csatValor} setCsatValor={r.setCsatValor} cesValor={r.cesValor} setCesValor={r.setCesValor} enviandoFeedback={r.enviandoFeedback} setEnviandoFeedback={r.setEnviandoFeedback} onEnviarFeedback={r.enviarFeedback} onOmitirFeedback={r.omitirFeedback} />
  </>;
}
