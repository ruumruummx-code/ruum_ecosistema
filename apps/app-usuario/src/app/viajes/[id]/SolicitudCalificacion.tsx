"use client";

import { useEffect, useState } from "react";
import { obtenerCalificacionTraslado } from "@ruum/api/transfers";
import { crearClienteNavegador } from "@/lib/supabase-browser";
import { MobileBottomSheet } from "../../../components/MobileBottomSheet";
import { CalificarTraslado } from "./CalificarTraslado";

export function SolicitudCalificacion({ trasladoId, conductorId, estado, cerradoEn, calificada }: {
  trasladoId: string; conductorId: string | null; estado: string | null;
  cerradoEn: string | null; calificada?: boolean;
}) {
  const [abierta, setAbierta] = useState(false);
  const [guardada, setGuardada] = useState(false);
  const [consulta, setConsulta] = useState<{ id: string; calificada: boolean } | null>(null);
  const [error, setError] = useState(false);
  const [intento, setIntento] = useState(0);
  const horas = cerradoEn ? (Date.now() - Date.parse(cerradoEn)) / 3_600_000 : NaN;
  const elegible = estado === "servicio_cerrado" && Boolean(conductorId) && horas >= 0 && horas <= 72;

  useEffect(() => {
    if (!elegible || calificada !== undefined) return;
    let vigente = true;
    setError(false);
    void obtenerCalificacionTraslado(crearClienteNavegador(), trasladoId)
      .then(dato => { if (vigente) setConsulta({ id: trasladoId, calificada: Boolean(dato) }); })
      .catch(() => { if (vigente) setError(true); });
    return () => { vigente = false; };
  }, [elegible, calificada, trasladoId, intento]);

  const yaCalificada = calificada ?? (consulta?.id === trasladoId ? consulta.calificada : null);
  if (!elegible || yaCalificada || (guardada && !abierta)) return null;
  return <>
    {error ? <p role="alert">No pudimos consultar tu evaluación. <button type="button" onClick={() => setIntento(v => v + 1)}>Reintentar evaluación</button></p> : yaCalificada === false && !guardada ? <div className="flex shrink-0 items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-slate-900" role="region" aria-label="Evaluación pendiente">
      <p className="text-sm">Tu traslado terminó. ¿Cómo fue el servicio?</p>
      <button type="button" className="min-h-11 shrink-0 rounded-lg bg-slate-900 px-3 text-sm font-semibold text-white" onClick={() => setAbierta(true)}>Calificar traslado</button>
    </div> : null}
    <MobileBottomSheet open={abierta} onClose={() => setAbierta(false)} title="Calificar traslado">
      {abierta && <CalificarTraslado trasladoId={trasladoId} conductorId={conductorId} mostrar onEnviada={() => setGuardada(true)} />}
    </MobileBottomSheet>
  </>;
}
