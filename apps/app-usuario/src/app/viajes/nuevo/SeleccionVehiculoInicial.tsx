"use client";

import { useCallback, useRef, useState } from "react";
import { useDialogAccesible } from "@ruum/ui";
import type { useNuevoTraslado } from "./hooks/useNuevoTraslado";

/** El identificador de la URL solo se resuelve contra la lista de la sesión actual. */
export function SeleccionVehiculoInicial({ t, vehiculoId }: { t: ReturnType<typeof useNuevoTraslado>; vehiculoId: string }) {
  const [cerrado, setCerrado] = useState(false);
  const cerrar = useCallback(() => setCerrado(true), []);
  const cierreRef = useRef<HTMLButtonElement>(null);
  const dialog = useDialogAccesible({ abierto: !cerrado, focoInicial: cierreRef, alCancelar: cerrar });
  const vehiculo = t.vehiculosGuardados.find(v => v.id === vehiculoId);
  if (cerrado) return null;
  return <dialog ref={dialog} aria-labelledby="titulo-vehiculo-inicial" className="m-auto w-full max-w-lg rounded-2xl border bg-[var(--ruum-surface,#fff)] p-6 text-[var(--ruum-text)] shadow-xl backdrop:bg-black/50">
    <h2 id="titulo-vehiculo-inicial" className="text-lg font-bold">Confirmar vehículo del traslado</h2>
    {t.cargandoSesion ? <p role="status" className="mt-4">Cargando los vehículos de tu cuenta…</p> : vehiculo ? <>
      <p className="mt-4 font-bold">{[vehiculo.marca, vehiculo.modelo, vehiculo.anio].filter(Boolean).join(" ")}</p>
      <p className="mt-2 text-sm">Placas: {vehiculo.placas?.trim() || "Sin placas"}</p>
      <p className="mt-2 text-sm">Al confirmar, estos datos reemplazarán la selección actual del formulario. Revisa los detalles antes de cotizar.</p>
      <button type="button" className="mt-4 rounded-xl bg-blue-700 p-3 font-bold text-white" onClick={() => { t.aplicarVehiculoGuardado(vehiculo); cerrar(); }}>Usar este vehículo</button>
    </> : <p role="alert" className="mt-4">Este vehículo no está disponible en tu cuenta. Selecciona otro o captura los datos en el formulario.</p>}
    <button ref={cierreRef} type="button" onClick={cerrar} className="mt-4 block rounded-xl border p-3 text-sm">Continuar sin cambiar vehículo</button>
  </dialog>;
}
