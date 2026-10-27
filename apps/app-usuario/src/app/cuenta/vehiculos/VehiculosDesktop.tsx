"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ETIQUETA_TIPO_VEHICULO } from "@ruum/shared/constants";
import type { Vehiculo } from "../cuenta-ui";
import { VehicleListItem, nombreVehiculo } from "./VehicleListItem";

const normalizar = (valor: string) => valor.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
export function VehiculosDesktop({ vehiculos }: { vehiculos: Vehiculo[] }) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [tipo, setTipo] = useState("");
  const [orden, setOrden] = useState("recientes");
  const tipos = [...new Set(vehiculos.map(v => v.tipo).filter((v): v is NonNullable<typeof v> => Boolean(v)))];
  const filtrados = vehiculos.filter(v => (!tipo || v.tipo === tipo) && normalizar([nombreVehiculo(v), v.placas, v.alias].filter(Boolean).join(" ")).includes(normalizar(busqueda)));
  const ordenados = [...filtrados].sort((a, b) => orden === "nombre" ? nombreVehiculo(a).localeCompare(nombreVehiculo(b), "es") : (Number.isFinite(Date.parse(b.creado_en)) ? Date.parse(b.creado_en) : 0) - (Number.isFinite(Date.parse(a.creado_en)) ? Date.parse(a.creado_en) : 0));
  const limpiar = () => { setBusqueda(""); setTipo(""); };

  return <div className="mx-auto max-w-5xl space-y-6">
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div><h1 className="font-display text-2xl font-bold">Mis vehículos</h1><p className="mt-2 text-sm text-[var(--ruum-text-secondary)]">Consulta los vehículos registrados en tu cuenta y elige uno para tu próximo traslado.</p></div>
      <div className="flex flex-wrap gap-3 text-sm"><button type="button" onClick={() => router.refresh()} className="rounded-xl border p-3">Actualizar vehículos</button><Link href="/viajes/nuevo" className="rounded-xl bg-blue-700 p-3 font-bold text-white">Nuevo traslado con vehículo</Link></div>
    </header>
    {vehiculos.length > 0 && <div className="flex flex-wrap items-end gap-3">
      <label className="min-w-56 flex-1 text-sm">Buscar por marca, modelo, placas o alias<input type="search" value={busqueda} onChange={e => setBusqueda(e.target.value)} className="mt-1 block w-full rounded-xl border bg-[var(--ruum-surface)] p-3" /></label>
      <label className="text-sm">Tipo de vehículo<select value={tipo} onChange={e => setTipo(e.target.value)} className="mt-1 block rounded-xl border bg-[var(--ruum-surface)] p-3"><option value="">Todos los tipos</option>{tipos.map(t => <option key={t} value={t}>{ETIQUETA_TIPO_VEHICULO[t] ?? t}</option>)}</select></label>
      <label className="text-sm">Ordenar por<select value={orden} onChange={e => setOrden(e.target.value)} className="mt-1 block rounded-xl border bg-[var(--ruum-surface)] p-3"><option value="recientes">Registro más reciente</option><option value="nombre">Nombre del vehículo</option></select></label>
      <button type="button" onClick={limpiar} className="rounded-xl border p-3 text-sm">Limpiar filtros</button>
    </div>}
    <p role="status" className="text-sm text-[var(--ruum-text-secondary)]">Mostrando {ordenados.length} de {vehiculos.length} vehículos</p>
    {ordenados.length > 0 ? <ul aria-label="Vehículos guardados" className="divide-y overflow-hidden rounded-2xl border bg-[var(--ruum-surface)]">{ordenados.map(v => <VehicleListItem key={v.id} vehiculo={v} />)}</ul> : <section className="rounded-2xl border bg-[var(--ruum-surface)] p-10 text-center">
      <h2 className="font-bold">{vehiculos.length === 0 ? "Sin vehículos registrados" : "No se encontraron vehículos"}</h2>
      <p className="mt-2 text-sm">{vehiculos.length === 0 ? "Captura los datos de tu vehículo al solicitar un traslado para registrarlo en tu cuenta." : "Prueba otra búsqueda o limpia los filtros."}</p>
      {vehiculos.length === 0 ? <Link href="/viajes/nuevo" className="mt-4 inline-block text-blue-700 underline dark:text-blue-300">Crear primer traslado</Link> : <button type="button" onClick={limpiar} className="mt-4 text-blue-700 underline dark:text-blue-300">Mostrar todos</button>}
    </section>}
  </div>;
}
