"use client";
import { useState } from "react";
import { Button } from "@ruum/ui";
export function ExportarPasaportePdf({ trasladoId }: { trasladoId: string }) {
  const [ocupado,setOcupado] = useState(false);
  const [error,setError] = useState<string | null>(null);
  async function exportar() {
    if (ocupado) return;
    setOcupado(true); setError(null);
    try {
      const respuesta = await fetch(`/api/viajes/${encodeURIComponent(trasladoId)}/pasaporte`,{cache:"no-store"});
      if (!respuesta.ok) { const datos = await respuesta.json(); throw new Error(datos.error || "No pudimos exportar el pasaporte."); }
      const blob = await respuesta.blob();
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement("a"); enlace.href=url; enlace.download=`pasaporte-${trasladoId}.pdf`;
      document.body.appendChild(enlace); enlace.click(); enlace.remove();
      window.setTimeout(() => URL.revokeObjectURL(url),30000);
    } catch (err) { setError(err instanceof Error ? err.message : "No pudimos exportar el pasaporte."); }
    finally { setOcupado(false); }
  }
  return <div><Button variant="secondary" disabled={ocupado || !trasladoId} onClick={() => void exportar()}>{ocupado ? "Preparando PDF…" : "Exportar pasaporte completo"}</Button>{error && <p role="alert" className="text-xs text-danger">{error}</p>}</div>;
}
