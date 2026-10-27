"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { enlaceBuscarUbicacion, normalizarBusqueda, type FuenteUbicacion, type UbicacionUsuario } from "./ubicaciones-usuario";

const ETIQUETAS: Record<FuenteUbicacion, string> = { perfil: "Domicilio del perfil", origen: "Origen de traslado", destino: "Destino de traslado" };

export function UbicacionesDesktop({ ubicaciones }: { ubicaciones: UbicacionUsuario[] }) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [fuente, setFuente] = useState("todas");
  const filtradas = ubicaciones.filter(u => (fuente === "todas" || u.fuentes.includes(fuente as FuenteUbicacion)) && normalizarBusqueda(u.direccion + " " + u.ciudad).includes(normalizarBusqueda(busqueda)));
  const limpiar = () => { setBusqueda(""); setFuente("todas"); };

  return <div className="mx-auto max-w-5xl space-y-6">
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div><h1 className="font-display text-2xl font-bold text-[var(--ruum-text)]">Mis ubicaciones</h1><p className="mt-2 max-w-xl text-sm text-[var(--ruum-text-secondary)]">Consulta las direcciones de tu perfil y de tus traslados. Puedes buscarlas al cotizar un nuevo servicio.</p></div>
      <div className="flex flex-wrap gap-3 text-sm">
        <button type="button" onClick={() => router.refresh()} className="rounded-xl border p-3">Actualizar ubicaciones</button>
        <Link href="/viajes/nuevo" className="rounded-xl bg-blue-700 p-3 font-bold text-white">Nuevo traslado</Link>
      </div>
    </header>
    <aside className="rounded-2xl border bg-[var(--ruum-surface-subtle)] p-4 text-sm text-[var(--ruum-text-secondary)]">
      El domicilio de tu perfil se modifica en <Link href="/cuenta/datos-personales" className="text-blue-700 underline dark:text-blue-300">Datos personales</Link>. Las direcciones del historial corresponden a servicios registrados; no se modifican ni eliminan desde esta pantalla.
    </aside>
    {ubicaciones.length > 0 && <div className="flex flex-wrap items-end gap-3">
      <label className="min-w-60 flex-1 text-sm">Buscar dirección o ciudad<input type="search" value={busqueda} onChange={e => setBusqueda(e.target.value)} className="mt-1 block w-full rounded-xl border bg-[var(--ruum-surface)] p-3" /></label>
      <label className="text-sm">Mostrar<select value={fuente} onChange={e => setFuente(e.target.value)} className="mt-1 block rounded-xl border bg-[var(--ruum-surface)] p-3"><option value="todas">Todas las ubicaciones</option>{Object.entries(ETIQUETAS).map(([valor, etiqueta]) => <option key={valor} value={valor}>{etiqueta}</option>)}</select></label>
      <button type="button" onClick={limpiar} className="rounded-xl border p-3 text-sm">Limpiar filtros</button>
    </div>}
    <p role="status" className="text-sm text-[var(--ruum-text-secondary)]">Mostrando {filtradas.length} de {ubicaciones.length} ubicaciones</p>
    {filtradas.length === 0 ? <section className="rounded-2xl border bg-[var(--ruum-surface)] p-8 text-center">
      <h2 className="font-bold">{ubicaciones.length === 0 ? "Aún no tienes direcciones registradas" : "No se encontraron ubicaciones"}</h2>
      <p className="mt-2 text-sm">{ubicaciones.length === 0 ? "Completa el domicilio de tu perfil o registra un traslado para consultar sus direcciones aquí." : "Prueba otra dirección o ciudad, o limpia los filtros."}</p>
      {ubicaciones.length === 0 ? <Link href="/cuenta/datos-personales" className="mt-4 inline-block text-blue-700 underline dark:text-blue-300">Completar domicilio del perfil</Link> : <button type="button" onClick={limpiar} className="mt-4 text-blue-700 underline dark:text-blue-300">Mostrar todas</button>}
    </section> : <div className="grid gap-4 xl:grid-cols-2">
      {filtradas.map(u => <article key={u.id} className="min-w-0 space-y-3 rounded-2xl border bg-[var(--ruum-surface)] p-5">
        <div className="flex flex-wrap gap-2">{u.fuentes.map(f => <span key={f} className="rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-800 dark:bg-blue-950 dark:text-blue-200">{ETIQUETAS[f]}</span>)}</div>
        <h2 className="break-words font-bold">{u.direccion}</h2>
        <p className="text-sm text-[var(--ruum-text-secondary)]">{u.ciudad || "Ciudad no registrada"}</p>
        {u.ultimoUso && <p className="text-xs text-[var(--ruum-text-secondary)]">Último traslado registrado: {new Intl.DateTimeFormat("es-MX", { timeZone: "America/Mexico_City", dateStyle: "medium" }).format(new Date(u.ultimoUso))}</p>}
        <div className="flex flex-wrap gap-4 text-sm font-semibold text-blue-700 dark:text-blue-300">
          <Link href={enlaceBuscarUbicacion(u, "origen")}>Buscar como origen</Link>
          <Link href={enlaceBuscarUbicacion(u, "destino")}>Buscar como destino</Link>
          {u.fuentes.includes("perfil") && <Link href="/cuenta/datos-personales">Editar domicilio del perfil</Link>}
        </div>
        <p className="text-xs text-[var(--ruum-text-secondary)]">Selecciona y confirma la dirección sugerida en el cotizador antes de continuar.</p>
      </article>)}
    </div>}
  </div>;
}
