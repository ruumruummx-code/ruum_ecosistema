"use client";

import { Tabs } from "@ruum/ui";

import { useRef, type ChangeEvent, type ReactNode } from "react";
import Image from "next/image";
import { DriverDetailsShell, DetailIcon } from "../DriverDetailsShell";
import styles from "../details.module.css";

export type ProfileTab = "identidad" | "documentacion" | "ubicacion";
type Props = {
  initials: string; photo: string | null; rating: number | null; photoBusy: boolean; photoEnabled: boolean;
  tab: ProfileTab; onTab: (tab: ProfileTab) => void; onPhoto: (event: ChangeEvent<HTMLInputElement>) => void;
  busy: boolean; saveDisabled: boolean; onSave: () => void; children: ReactNode; feedback?: ReactNode;
};
export function DriverProfileView(props: Props) {
  const file = useRef<HTMLInputElement>(null);
  return <DriverDetailsShell kind="profile" footer={<button type="button" className={styles.primary} onClick={props.onSave} disabled={props.saveDisabled} aria-busy={props.busy}>{props.busy ? "Guardando cambios…" : "Guardar cambios"}<span aria-hidden="true">→</span></button>}>
    <div className={styles.heading}><h1>Perfil del Conductor</h1><p>Administra tus datos personales y contactos operativos.</p></div>
    <section className={styles.identityCard} aria-label="Identificación del conductor">
      <div className={styles.avatar}>{props.photo ? <Image src={props.photo} alt="Fotografía del conductor" width={70} height={70} unoptimized /> : props.initials}</div>
      <div className={styles.identityText}><h2>Conductor Ruum Ruum</h2><div className={styles.rating}><strong><span aria-hidden="true">★</span> {props.rating === null ? "—" : props.rating.toFixed(1)}</strong><span>Calificación del conductor</span></div><p>{props.photo ? "Fotografía de perfil activa para identificación operativa" : "Agrega tu fotografía para identificación operativa"}</p></div>
      <button type="button" className={styles.photoButton} disabled={!props.photoEnabled || props.photoBusy || props.busy} onClick={() => file.current?.click()} aria-label="Editar fotografía de perfil"><DetailIcon name="camera" /><span>{props.photoBusy ? "Subiendo…" : "Editar"}</span></button>
      <input ref={file} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={props.onPhoto} disabled={!props.photoEnabled || props.photoBusy} aria-label="Fotografía de perfil" />
    </section>
    <Tabs tabs={[{id:"identidad",etiqueta:"Identidad"},{id:"documentacion",etiqueta:"Documentación"},{id:"ubicacion",etiqueta:"Ubicación"}]} value={props.tab} onSeleccion={id=>props.onTab(id as typeof props.tab)} etiqueta="Secciones del perfil" renderPanel={()=>( <div className={styles.fieldsArea}   >{props.children}</div> )} />

    {props.feedback}

  </DriverDetailsShell>;
}
