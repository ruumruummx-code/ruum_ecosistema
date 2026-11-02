"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ExportarPasaportePdf } from "../viajes/[id]/ExportarPasaportePdf";

export type PasaporteAnterior = {
  id: string;
  marca: string | null;
  modelo: string | null;
  anio: number | null;
  placas: string | null;
  origen: string | null;
  destino: string | null;
  cerradoEn: string | null;
  creadoEn: string | null;
};
const TAMANO_PAGINA = 10;
function instante(p: PasaporteAnterior) {
  const fecha = Date.parse(p.cerradoEn ?? p.creadoEn ?? "");
  return Number.isFinite(fecha) ? fecha : 0;
}
function fecha(p: PasaporteAnterior) {
  const valor = instante(p);
  if (!valor) return "Fecha no disponible";
  return `${p.cerradoEn ? "Cierre" : "Registro"}: ${new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeZone: "America/Mexico_City" }).format(new Date(valor))}`;
}
export function HistorialPasaportes({ pasaportes }: { pasaportes: PasaporteAnterior[] }) {
  const [pagina, setPagina] = useState(0);
  const ordenados = useMemo(() => [...pasaportes].sort((a, b) => instante(b) - instante(a)), [pasaportes]);
  const totalPaginas = Math.max(1, Math.ceil(ordenados.length / TAMANO_PAGINA));
  const actual = Math.min(pagina, totalPaginas - 1);
  const inicio = actual * TAMANO_PAGINA;
  return <section className="user-v2-scope mx-auto w-full max-w-4xl space-y-5 p-5 sm:p-6">
    <header className="space-y-2">
      <h1 className="text-2xl font-bold">Pasaportes anteriores</h1>
      <p>No tienes un traslado activo. Consulta el expediente o descarga el pasaporte de tus traslados finalizados.</p>
      <div className="flex flex-wrap gap-4 text-sm underline"><Link href="/mis-viajes">Ver mis traslados</Link><Link href="/viajes/nuevo">Solicitar nuevo traslado</Link></div>
    </header>
    <p role="status" aria-live="polite">Mostrando {ordenados.length ? inicio + 1 : 0}–{Math.min(inicio + TAMANO_PAGINA, ordenados.length)} de {ordenados.length} pasaportes</p>
    <ul className="space-y-4" aria-label="Pasaportes de traslados finalizados">
      {ordenados.slice(inicio, inicio + TAMANO_PAGINA).map(p => {
        const folio = p.id.slice(0, 8).toUpperCase();
        return <li key={p.id}>
          <article aria-label={`Pasaporte ${folio}`} className="space-y-3 rounded-2xl border border-[var(--user-color-border)] bg-[var(--user-color-surface)] p-4">
            <h2 className="font-semibold">Pasaporte {folio}</h2>
            <p>{[p.marca, p.modelo, p.anio].filter(Boolean).join(" ") || "Vehículo registrado"}{p.placas ? ` · ${p.placas}` : ""}</p>
            <p>{p.origen || "Origen sin registrar"} → {p.destino || "Destino sin registrar"}</p>
            <p className="text-sm">{fecha(p)}</p>
            <div className="flex flex-wrap items-center gap-4">
              <Link href={`/viajes/${encodeURIComponent(p.id)}`} aria-label={`Ver pasaporte ${folio}`} className="font-semibold underline">Ver pasaporte</Link>
              <div role="group" aria-label={`Descargar pasaporte ${folio}`}><ExportarPasaportePdf trasladoId={p.id} /></div>
            </div>
          </article>
        </li>;
      })}
    </ul>
    {totalPaginas > 1 && <nav aria-label="Páginas de pasaportes" className="flex items-center justify-between gap-3">
      <button type="button" disabled={actual === 0} onClick={() => setPagina(actual - 1)} className="rounded-lg border px-4 py-2 disabled:opacity-50">Anteriores</button>
      <span>Página {actual + 1} de {totalPaginas}</span>
      <button type="button" disabled={actual + 1 === totalPaginas} onClick={() => setPagina(actual + 1)} className="rounded-lg border px-4 py-2 disabled:opacity-50">Siguientes</button>
    </nav>}
  </section>;
}
