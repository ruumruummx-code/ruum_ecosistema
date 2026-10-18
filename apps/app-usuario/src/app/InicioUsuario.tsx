"use client";

import Link from "next/link";
import type { Database } from "@ruum/shared/types";
import { ETIQUETA_ESTADO_TRASLADO } from "@ruum/shared/states";
import { indiceEtapaActual } from "@ruum/ui";
import { obtenerViajeActivo } from "../lib/inicio";
import { TERMINOLOGIA_USUARIO } from "../lib/glosario";
import { ConductorAsignado } from "./ConductorAsignado";

type PasaporteRow = Database["public"]["Views"]["pasaporte_digital"]["Row"];
type UsuarioRow = Database["public"]["Tables"]["usuarios"]["Row"];
type VehiculoRow = Database["public"]["Tables"]["vehiculos"]["Row"];

export interface InicioUsuarioProps {
  usuario: UsuarioRow | null;
  traslados: PasaporteRow[];
  conductorFotoUrl?: string | null;
  vehiculos?: VehiculoRow[];
}

function tiempoEstimadoTexto(horas: number | null) {
  if (horas == null || !Number.isFinite(horas) || horas < 0) return "ETA por confirmar";
  const total = Math.round(horas * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `ETA ${h ? `${h}h ` : ""}${m}m`;
}

function Chevron() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function IconoInicio({ tipo }: { tipo: "auto" | "documento" | "soporte" | "ubicacion" | "usuario" }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {tipo === "auto" && <><path d="m5 10 2-5h10l2 5M4 10h16v8H4zM7 18v2m10-2v2M7 14h1m8 0h1" /></>}
    {tipo === "documento" && <><rect x="5" y="3" width="14" height="18" rx="3" /><path d="M9 8h6M9 12h6M9 16h3" /></>}
    {tipo === "soporte" && <><path d="M4 14v-3a8 8 0 0 1 16 0v3M18 18c0 2-2 3-6 3" /><rect x="3" y="11" width="4" height="7" rx="2" /><rect x="17" y="11" width="4" height="7" rx="2" /></>}
    {tipo === "ubicacion" && <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 0 1 14 0Z" /><circle cx="12" cy="10" r="2" /></>}
    {tipo === "usuario" && <><circle cx="12" cy="8" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2" /></>}
  </svg>;
}

function ProgresoInicio({ estado }: { estado: PasaporteRow["estado"] }) {
  const etapa = estado ? indiceEtapaActual(estado) : -1;
  // El pago se procesa antes de la operación: no implica entrega completada.
  const previo = etapa < 3 || estado === "pago_pendiente" || estado === "pago_completado";
  const actual = previo ? -1 : estado === "entrega_confirmada" ? 3 : etapa >= 5 || estado === "llegada_a_destino" ? 2 : etapa === 4 ? 1 : 0;
  return <ol className="home-stepper" aria-label="Progreso del traslado">
    {["Recolección", "En tránsito", "Entrega"].map((nombre, i) => {
      const completado = i < actual;
      const current = i === actual;
      const situacion = completado ? "Completada" : current ? "Actual" : "Pendiente";
      return <li key={nombre} className={completado ? "is-complete" : current ? "is-current" : "is-pending"} aria-current={current ? "step" : undefined}>
        <span className="home-step-dot" aria-hidden="true">{completado && <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m5 10 3 3 7-7" /></svg>}</span>
        <span className="home-step-name">{i + 1}. {nombre}</span>
        <span className="home-step-status">{situacion}</span>
      </li>;
    })}
  </ol>;
}

export function InicioUsuario({ usuario, traslados, conductorFotoUrl = null, vehiculos = [] }: InicioUsuarioProps) {
  const viaje = obtenerViajeActivo(traslados);
  const primerNombre = usuario?.nombre?.trim().split(/\s+/)[0];
  const nombre = primerNombre ? primerNombre.charAt(0).toUpperCase() + primerNombre.slice(1).toLowerCase() : null;
  const detalle = viaje?.traslado_id ? `/viajes/${viaje.traslado_id}` : "/mis-viajes";
  const ultimo = viaje ?? [...traslados].sort((a, b) => (b.creado_en ?? "").localeCompare(a.creado_en ?? ""))[0];
  const pasaporte = ultimo?.traslado_id ? `/viajes/${ultimo.traslado_id}` : "/pasaporte";
  const vehiculo = viaje ? [viaje.vehiculo_marca, viaje.vehiculo_modelo, viaje.vehiculo_anio].filter(Boolean).join(" ") || "Vehículo por confirmar" : "";
  const estado = viaje?.estado ? TERMINOLOGIA_USUARIO[viaje.estado] ?? ETIQUETA_ESTADO_TRASLADO[viaje.estado] : "En seguimiento";
  const conductor = viaje?.traslado_id && viaje.conductor_id && viaje.conductor_nombre && viaje.estado
    ? { trasladoId: viaje.traslado_id, estado: viaje.estado, nombre: viaje.conductor_nombre }
    : null;

  return <div className="user-dashboard">
    <section id="greetingBlock" aria-labelledby="saludo-usuario" className="home-greeting">
      <h1 id="saludo-usuario">{nombre ? `Hola, ${nombre}` : "Hola"}</h1>
      <p>Aquí va el estatus de tu traslado.</p>
    </section>

    <section id="activeTransferCard" aria-label={viaje ? `Traslado Activo #${viaje.traslado_id?.slice(0, 8).toUpperCase() ?? "—"}` : "Sin traslados activos"} className="home-transfer" aria-live="polite">
      {viaje ? <>
        <div className="home-transfer-top">
          <span className="home-active-chip"><span aria-hidden="true" />TRASLADO ACTIVO</span>
          <Link href={detalle} aria-label={`Ver seguimiento del traslado activo ${vehiculo}`} className="home-detail-button"><Chevron /></Link>
        </div>
        <Link href={detalle} className="home-vehicle-link"><h2 title={vehiculo}>{vehiculo}</h2></Link>
        <div className="home-route-row">
          <p className="home-route" title={`${viaje.origen_ciudad || viaje.origen_direccion || "Origen por confirmar"} → ${viaje.destino_ciudad || viaje.destino_direccion || "Destino por confirmar"}`}>
            <IconoInicio tipo="ubicacion" /><span>{viaje.origen_ciudad || viaje.origen_direccion || "Origen por confirmar"} <span aria-hidden="true">➜</span><span className="sr-only"> hacia </span> {viaje.destino_ciudad || viaje.destino_direccion || "Destino por confirmar"}</span>
          </p>
          <span className="home-plates" title={viaje.vehiculo_placas || "Sin placas"}>Placas {viaje.vehiculo_placas || "por confirmar"}</span>
        </div>
        <div className="home-progress">
          <div className="home-progress-heading"><span>{estado}</span><span title="Duración estimada del trayecto">{tiempoEstimadoTexto(viaje.tiempo_estimado_horas)}</span></div>
          <ProgresoInicio estado={viaje.estado} />
        </div>
        {conductor ? <ConductorAsignado trasladoId={conductor.trasladoId} estado={conductor.estado} nombre={conductor.nombre} fotoUrl={conductorFotoUrl} compacto /> : <div className="home-driver home-driver-pending"><span className="home-driver-avatar"><IconoInicio tipo="usuario" /></span><div><p>Tu conductor</p><span>{viaje.conductor_nombre || "Pendiente de asignación"}</span></div></div>}
      </> : <div className="home-empty">
        <span className="home-empty-icon"><IconoInicio tipo="auto" /></span>
        <h2>No tienes traslados activos</h2>
        <p>Solicita tu primer traslado y sigue cada etapa en tiempo real con evidencia fotográfica.</p>
        <Link href="/viajes/nuevo" className="home-empty-cta">Solicitar traslado <Chevron /></Link>
      </div>}
    </section>

    <section id="quickActions" aria-labelledby="acciones-rapidas" className="home-quick-actions">
      <h2 id="acciones-rapidas" className="sr-only">Acciones rápidas</h2>
      <Link href="/cuenta/vehiculos" className="home-quick-card" aria-label="Mis vehículos">
        <span className="home-module-icon home-icon-blue"><IconoInicio tipo="auto" /></span>
        <span className="home-module-copy"><strong>Mis vehículos</strong><span>{vehiculos.length} {vehiculos.length === 1 ? "registrado" : "registrados"}</span></span>
        <span className="home-module-chevron"><Chevron /></span>
      </Link>
      <Link href={pasaporte} className="home-quick-card" aria-label="Abrir pasaporte digital">
        <span className="home-module-icon home-icon-green"><IconoInicio tipo="documento" /></span>
        <span className="home-module-copy"><strong>Pasaporte</strong><span>Digital</span></span>
        <span className="home-module-chevron"><Chevron /></span>
      </Link>
    </section>

    <Link href="/soporte" className="home-support" aria-label="¿Necesitas ayuda? Soporte 24/7">
      <span className="home-module-icon home-icon-purple"><IconoInicio tipo="soporte" /></span>
      <span className="home-module-copy"><strong>¿Necesitas ayuda?</strong><span>Soporte 24/7</span></span>
      <span className="home-module-chevron"><Chevron /></span>
    </Link>
  </div>;
}
