"use client";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { ConductorDialog } from "../components/ConductorDialog";
import styles from "./registration.module.css";
export function RegistrationSheet({title,onClose,onSave,children,saving=false}:{title:string;kind:"address"|"contact";onClose:()=>void;onSave:()=>boolean;children:ReactNode;saving?:boolean}) {
 const ref=useRef<HTMLDivElement>(null);
 useEffect(()=>{const node=ref.current;const handler=(event:KeyboardEvent)=>{if(event.key==="Enter"&&event.target instanceof HTMLInputElement){event.preventDefault();if(!saving&&onSave())onClose();}};node?.addEventListener("keydown",handler);return()=>node?.removeEventListener("keydown",handler);},[onSave,onClose,saving]);
 const id=useId();const save=()=>{if(!saving&&onSave())onClose();};
 return <ConductorDialog open title={title} labelledBy={id} onClose={onClose} closeLabel={`Cerrar ${title}`} footer={<div className={styles.sheetFooter}><button type="button" onClick={onClose}>Cancelar</button><button type="button" onClick={save} disabled={saving}>Guardar</button></div>}>
 <div ref={ref} className={styles.sheetBody}>{children}</div></ConductorDialog>;
}
