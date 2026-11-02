"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { listarTicketsSoporte, resolverTicketSoporte } from "@ruum/api/services";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "../../lib/supabase-browser";
import type { Database } from "@ruum/shared/types";
type Ticket = Database["public"]["Tables"]["tickets_soporte"]["Row"];
export function TicketsSoporte() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const cargar = useCallback(async () => {
    setError(""); setCargando(true);
    try {
      if (!tieneSupabaseConfigurado()) throw new Error("No disponible");
      setTickets(await listarTicketsSoporte(crearClienteNavegador()));
    } catch { setError("No pudimos consultar las consultas de soporte."); }
    finally { setCargando(false); }
  }, []);
  useEffect(() => { void cargar(); }, [cargar]);
  async function resolver(id: string) {
    if (ocupado) return;
    setOcupado(id); setError("");
    try { await resolverTicketSoporte(crearClienteNavegador(), id); await cargar(); }
    catch { setError("No se confirmó la resolución del ticket."); }
    finally { setOcupado(null); }
  }
  return <section aria-label="Consultas de soporte" className="mt-5 rounded-xl border border-border-default bg-surface-primary p-5">
    <h2 className="text-lg font-semibold">Consultas de soporte</h2>
    <p className="text-sm">Consultas generales y de plataforma, con o sin traslado. Se muestran las 100 más recientes.</p>
    <button type="button" disabled={cargando || Boolean(ocupado)} onClick={() => void cargar()} className="my-3 underline">Actualizar consultas</button>
    {error && <p role="alert">{error}</p>}
    {cargando ? <p role="status">Cargando consultas…</p> : !error && tickets.length === 0 ? <p>No hay consultas registradas.</p> : <ul className="space-y-3">{tickets.map(t => <li key={t.id} className="rounded-lg border border-border-default p-3">
      <h3 className="font-semibold">{t.motivo}</h3><p className="break-all text-xs">SOP-{t.id.toUpperCase()}</p>
      <p className="break-all text-xs">Solicitante: {t.auth_user_id}</p>
      <p className="whitespace-pre-wrap break-words">{t.descripcion}</p><p>Estado: {t.estado}</p>
      <p className="text-sm">Recibido: {new Date(t.creado_en).toLocaleString("es-MX")}</p>
      {t.traslado_id && <Link href={`/viajes/${t.traslado_id}`} className="mr-4 underline">Ver traslado relacionado</Link>}
      {t.estado === "abierto" && <button type="button" disabled={Boolean(ocupado)} onClick={() => void resolver(t.id)} className="underline">{ocupado === t.id ? "Guardando…" : "Marcar resuelto"}</button>}
    </li>)}</ul>}
  </section>;
}
