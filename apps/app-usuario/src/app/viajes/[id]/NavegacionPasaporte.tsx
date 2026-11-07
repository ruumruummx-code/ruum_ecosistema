"use client";

import type { ReactNode } from "react";
import { Tabs } from "@ruum/ui";
import type { PestanaPasaporte } from "./PasaporteDigitalSegmentado";
import { IconoPinTab, IconoCamaraTab, IconoAutoTab, IconoReciboTab } from "./iconos-pasaporte";

const PESTANAS = [
  { id: "en_ruta", etiqueta: "En Ruta", Icono: IconoPinTab },
  { id: "fotos", etiqueta: "Fotos", Icono: IconoCamaraTab },
  { id: "unidad", etiqueta: "Unidad", Icono: IconoAutoTab },
  { id: "recibo", etiqueta: "Recibo", Icono: IconoReciboTab },
] as const;

export function NavegacionPasaporte({ id, activa, onCambiar, renderPanel }: { id: string; activa: PestanaPasaporte; onCambiar: (pestana: PestanaPasaporte) => void; renderPanel: (id: PestanaPasaporte) => ReactNode }) {
  return <Tabs idPrefix={id} etiqueta="Pestañas del Pasaporte Digital" value={activa} onSeleccion={next=>onCambiar(next as PestanaPasaporte)} tabs={PESTANAS.map(p=>({id:p.id,etiqueta:<><p.Icono />{p.etiqueta}</>}))} renderPanel={next=>renderPanel(next as PestanaPasaporte)} />;
}
