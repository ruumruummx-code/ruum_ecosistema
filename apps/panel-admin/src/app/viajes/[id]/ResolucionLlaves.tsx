"use client";

import { useEffect, useState } from "react";
import { consultarInventarioLlaves, resolverInventarioLlaves } from "@ruum/api/custody";
import { crearClienteNavegador } from "@/lib/supabase-browser";

type Resolucion = { responsable: string; motivo: string; resuelta_en: string };

export function ResolucionLlaves({ trasladoId }: { trasladoId: string }) {
  const [inventario, setInventario] = useState<{ inicial: string | null; final: string | null } | null>(null);
  const [resolucion, setResolucion] = useState<Resolucion | null>(null);
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  useEffect(() => {
    let activo = true;
    const cliente = crearClienteNavegador();
    void consultarInventarioLlaves(cliente, trasladoId).then(resultado => {
      if (!activo) return;
      setInventario({ inicial: resultado.inicial, final: resultado.final });
      setResolucion(resultado.resolucion);
    }).catch(() => { if (activo) setError("No se pudo consultar el inventario de llaves."); });
    return () => { activo = false; };
  }, [trasladoId]);

  async function resolver(event: React.FormEvent) {
    event.preventDefault();
    setGuardando(true); setError("");
    try {
      const cliente = crearClienteNavegador();
      const data = await resolverInventarioLlaves(cliente, trasladoId, motivo);
      setResolucion(data);
    } catch (err) { setError(err instanceof Error ? err.message : (err as { message?: string })?.message ?? "No se pudo resolver el inventario."); }
    finally { setGuardando(false); }
  }

  if (error && !inventario) return <p role="alert">{error}</p>;
  if (!inventario || inventario.inicial === null || inventario.final === null || Number(inventario.inicial) === Number(inventario.final)) return null;
  return <section className="mt-6 rounded-xl border border-amber-500 p-4" aria-label="Resolución de llaves">
    <h2 className="font-bold">{resolucion ? "Diferencia de llaves · resolución documentada" : "Diferencia de llaves · cierre bloqueado hasta resolución"}</h2>
    <p>Origen: {inventario.inicial}. Destino: {inventario.final}.</p>
    {resolucion ? <p role="status">Autorizado por {resolucion.responsable} el {new Date(resolucion.resuelta_en).toLocaleString("es-MX")}. Motivo: {resolucion.motivo}. Se conserva el inventario original.</p> : <form onSubmit={resolver}>
      <label htmlFor="motivo-llaves">Confirma con operación si la diferencia fue física o de captura y documenta la resolución</label>
      <textarea id="motivo-llaves" className="mt-2 block w-full rounded border p-2" minLength={10} required value={motivo} onChange={(event) => setMotivo(event.target.value)} />
      <button type="submit" className="mt-3 rounded border px-4 py-2" disabled={guardando || motivo.trim().length < 10}>{guardando ? "Registrando…" : "Autorizar cierre excepcional"}</button>
    </form>}
    {error && <p role="alert">{error}</p>}
  </section>;
}
