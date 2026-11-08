"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ConductorScreen } from "../components/ConductorScreen";
import styles from "./registration.module.css";
const Slots=createContext<{header:HTMLElement|null;action:HTMLElement|null}|null>(null);
export function RegistrationHeader({children}:{children:ReactNode}) { const slots=useContext(Slots);return slots?.header ? createPortal(children,slots.header) : null; }
export function RegistrationAction({children}:{children:ReactNode}) { const slots=useContext(Slots);return slots?.action ? createPortal(children,slots.action) : null; }
export function RegistrationShell({children,account=false,identity=false,completion=false}:{children:ReactNode;compact?:boolean;account?:boolean;identity?:boolean;completion?:boolean}) {
  const [header,setHeader]=useState<HTMLDivElement|null>(null);const [action,setAction]=useState<HTMLDivElement|null>(null);
  return <Slots.Provider value={{header,action}}><ConductorScreen variant="form" label="Registro de conductor" className={[styles.screen,account?styles.stepOne:"",identity?styles.identity:"",completion?styles.completionStep:""].join(" ")}
    header={<div ref={setHeader} className={styles.headerSlot}/>} footer={<div ref={setAction} className={styles.actionSlot}/>}>{children}</ConductorScreen></Slots.Provider>;
}
