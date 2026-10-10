"use client";

import { useMemo, useState, useEffect, useTransition, useRef } from "react";
import Link from "next/link";
import { ETIQUETA_TIPO_VEHICULO } from "@ruum/shared/constants";
import type { Database } from "@ruum/shared/types";
import { progresoPorEstadoTraslado } from "../../lib/inicio";

type Pasaporte = Database["public"]["Views"]["pasaporte_digital"]["Row"];
type Traslado = Pick<
  Database["public"]["Tables"]["traslados"]["Row"],
  "id" | "origen_direccion" | "origen_ciudad" | "destino_direccion" | "destino_ciudad" | "fecha_hora_programada"
>;
type PestañaTraslados = "activos" | "programados" | "finalizados" | "cancelados";

export interface ViajeLista {
  pasaporte: Pasaporte;
  traslado: Traslado | null;
}

type TonoPildora = "active" | "scheduled" | "completed" | "cancelled";

function IconoBuscar({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function IconoFiltro({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="10" y1="12" x2="20" y2="12" />
      <line x1="6" y1="18" x2="20" y2="18" />
      <circle cx="7" cy="6" r="2" fill="currentColor" fillOpacity="0.2" />
      <circle cx="7" cy="12" r="2" fill="currentColor" fillOpacity="0.2" />
      <circle cx="17" cy="18" r="2" fill="currentColor" fillOpacity="0.2" />
    </svg>
  );
}

function IconoCarroFrente({ className = "size-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.04 3H5.81l1.04-3zM19 17H5v-4.66l.12-.34h13.77l.11.34V17z" />
      <circle cx="7.5" cy="14.5" r="1.5" />
      <circle cx="16.5" cy="14.5" r="1.5" />
    </svg>
  );
}

function IconoUsuario({ className = "size-3" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 19.5c0-3.6 3.4-6 7.5-6s7.5 2.4 7.5 6" />
    </svg>
  );
}

function IconoReloj({ className = "size-3" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

function IconoRuta({ className = "size-3" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="6" cy="19" r="2.2" />
      <circle cx="18" cy="5" r="2.2" />
      <path d="M8.2 19H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.8" />
    </svg>
  );
}

function IconoChevron({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function IconoSoporte({ className = "size-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
      <path d="M4 14h2v5H4a2 2 0 0 1-2-2v-1a2 2 0 0 1 2-2ZM20 14h-2v5h2a2 2 0 0 0 2-2v-1a2 2 0 0 0-2-2Z" />
      <path d="M18 20c-1 .9-2.3 1.5-4 1.5h-1" />
    </svg>
  );
}

function IconoCalendario({ className = "size-3" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M7 3.5v3M17 3.5v3M3.5 9h17" />
    </svg>
  );
}

function folioCorto(trasladoId: string | null | undefined): string {
  return trasladoId ? `#RR-${trasladoId.slice(0, 4).toUpperCase()}` : "#RR-—";
}

function primerNombre(nombre: string | null | undefined): string | null {
  const valor = nombre?.trim().split(/\s+/)[0];
  if (!valor) return null;
  return `${valor.charAt(0).toUpperCase()}${valor.slice(1).toLowerCase()}.`;
}

function formatoDuracion(horas: number | null | undefined): string | null {
  if (horas == null || Number.isNaN(Number(horas))) return null;
  const totalMin = Math.round(Number(horas) * 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h <= 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

function formatoGastado(total: number): string {
  if (total >= 1000) {
    const miles = total / 1000;
    return `$${miles >= 100 ? Math.round(miles).toString() : miles.toFixed(1).replace(/\.0$/, "")}k`;
  }
  return `$${Math.round(total).toLocaleString("es-MX")}`;
}

function vehiculoNombre(p: Pasaporte): string {
  const partes = [p.vehiculo_marca, p.vehiculo_modelo, p.vehiculo_anio].filter(Boolean);
  return partes.length > 0 ? partes.join(" ") : "Vehículo";
}

function vehiculoTipo(p: Pasaporte): string {
  if (!p.vehiculo_tipo) return "Sedán";
  return ETIQUETA_TIPO_VEHICULO[p.vehiculo_tipo] ?? p.vehiculo_tipo;
}

function pestañaDeViaje(p: Pasaporte): PestañaTraslados {
  const estado = String(p.estado ?? "");
  if (estado === "servicio_cancelado" || estado === "traslado_fallido") return "cancelados";
  if (["servicio_cerrado", "reclamo_resuelto", "disputa_resuelta"].includes(estado)) return "finalizados";
  if ([
    "solicitud_creada",
    "documentacion_pendiente",
    "documentacion_en_revision",
    "documentacion_validada",
    "cotizacion_generada",
    // M14: cotizacion_aceptada es estado válido (fuente: ESTADOS_TRASLADO) y
    // espera pago, como pago_pendiente en InicioUsuario → "Programado".
    // Sin esto caía en "activos" mientras el inicio lo mostraba programado.
    "cotizacion_aceptada",
    "servicio_confirmado",
    "pendiente_de_conductor",
  ].includes(estado)) return "programados";
  return "activos";
}

const PILDORA_POR_PESTAÑA: Record<PestañaTraslados, { tono: TonoPildora; borde: string }> = {
  activos: { tono: "active", borde: "border-l-[#4ade80]" },
  programados: { tono: "scheduled", borde: "border-l-[#8b5cf6]" },
  finalizados: { tono: "completed", borde: "border-l-[#cbd5e1]" },
  cancelados: { tono: "cancelled", borde: "border-l-[#f87171]" },
};

const PILDORA_CLASE: Record<TonoPildora, string> = {
  active: "bg-[#e9f3ee] text-[#1f6b4a]",
  scheduled: "bg-[#f2eef9] text-[#5e3b8c]",
  completed: "bg-[#eef3fa] text-[#2e5a88]",
  cancelled: "bg-[#fdeaea] text-[#b33c3c]",
};

function estadoVisual(p: Pasaporte): { label: string } {
  switch (String(p.estado ?? "")) {
    case "pendiente_de_conductor":
      return { label: "Pendiente de conductor" };
    case "cotizacion_aceptada":
    case "pago_pendiente":
      return { label: "Pago pendiente" };
    case "servicio_confirmado":
      return { label: "Confirmado" };
    case "servicio_cerrado":
    case "reclamo_resuelto":
    case "disputa_resuelta":
      return { label: "Completado" };
    case "servicio_cancelado":
    case "traslado_fallido":
      return { label: "Cancelado" };
    case "conductor_asignado":
      return { label: "Conductor asignado" };
    case "conductor_en_camino_al_origen":
      return { label: "En camino al origen" };
    case "conductor_en_punto_de_recoleccion":
      return { label: "Check origen" };
    case "verificacion_vehiculo_en_proceso":
    case "evidencia_inicial_en_proceso":
      return { label: "Check origen" };
    case "evidencia_inicial_completada":
      return { label: "Evidencia inicial lista" };
    case "vehiculo_recibido":
      return { label: "Vehículo recibido" };
    case "traslado_en_curso":
      return { label: "En camino al destino" };
    case "llegada_a_destino":
      return { label: "En punto de entrega" };
    case "evidencia_final_en_proceso":
      return { label: "Check final en curso" };
    case "evidencia_final_completada":
      return { label: "Evidencia final lista" };
    case "entrega_confirmada":
      return { label: "Entregado" };
    default:
      return { label: "En proceso" };
  }
}

function fechaProgramada(fecha: string | null): { fecha: string; hora: string } {
  if (!fecha) return { fecha: "Fecha pendiente", hora: "Hora pendiente" };
  const date = new Date(fecha);
  if (Number.isNaN(date.getTime())) return { fecha: "Fecha pendiente", hora: "Hora pendiente" };

  const hoy = new Date();
  const esHoy = date.getFullYear() === hoy.getFullYear() && date.getMonth() === hoy.getMonth() && date.getDate() === hoy.getDate();
  const fechaTexto = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", year: "numeric" }).format(date);
  const horaTexto = new Intl.DateTimeFormat("es-MX", { hour: "numeric", minute: "2-digit" }).format(date);
  return { fecha: esHoy ? `Hoy, ${fechaTexto}` : fechaTexto, hora: horaTexto };
}

function direccion(valor: string | null | undefined, fallback: string): string {
  return valor?.trim() || fallback;
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-[22px] border border-[#eef2f7] bg-white p-5" aria-hidden="true">
      <div className="flex gap-3">
        <div className="size-11 rounded-full bg-[#eef2f7]" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-24 rounded bg-[#eef2f7]" />
          <div className="h-3 w-40 rounded bg-[#eef2f7]" />
        </div>
      </div>
      <div className="mt-4 h-16 rounded-2xl bg-[#eef2f7]/70" />
      <div className="mt-4 h-10 rounded-2xl bg-[#eef2f7]/70" />
    </div>
  );
}

function FichaVacia({ hayBusqueda, hayFiltro, pestana }: { hayBusqueda: boolean; hayFiltro: boolean; pestana: PestañaTraslados }) {
  const etiquetasPestana: Record<PestañaTraslados, string> = {
    activos: "En curso",
    programados: "Por iniciar",
    finalizados: "Historial",
    cancelados: "Cancelados",
  };
  const titulo = hayBusqueda || hayFiltro ? "No se encontraron traslados" : `Sin traslados · ${etiquetasPestana[pestana]}`;
  const descripcion = hayBusqueda || hayFiltro
    ? "Prueba con otro término o ajusta el filtro de vehículo."
    : "Tus traslados aparecerán aquí tan pronto como los registres en la plataforma.";

  return (
    <div className="rounded-[22px] border border-[#eef2f7] bg-white px-6 py-12 text-center shadow-[0_6px_16px_rgba(0,0,0,0.02)]">
      <div aria-hidden="true" className="mx-auto mb-5 flex size-20 items-center justify-center rounded-[30px] bg-[#f2f6fc] text-[#a6b7cb]">
        <IconoCarroFrente className="size-[34px]" />
      </div>
      <h3 className="text-[17px] font-bold text-[#0b1e33]">{titulo}</h3>
      <p className="mx-auto mt-2 max-w-xs text-[14px] font-medium leading-relaxed text-[#7e8fa8]">{descripcion}</p>
      <Link
        href="/viajes/nuevo"
        className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#0b1e33] px-7 py-3.5 text-[14px] font-bold text-white"
      >
        Solicitar traslado
      </Link>
    </div>
  );
}

const PESTAÑAS: { id: PestañaTraslados; etiqueta: string }[] = [
  { id: "activos", etiqueta: "Activos" },
  { id: "programados", etiqueta: "Programados" },
  { id: "finalizados", etiqueta: "Finalizados" },
  { id: "cancelados", etiqueta: "Cancelados" },
];

export function MisTrasladosCliente({
  Traslados,
  pestanaInicial,
}: {
  Traslados: ViajeLista[];
  pestanaInicial: PestañaTraslados;
}) {
  const [pestana, setPestana] = useState<PestañaTraslados>(pestanaInicial);
  const [busquedaInput, setBusquedaInput] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [filtroAbierto, setFiltroAbierto] = useState(false);
  const [tipoVehiculoSeleccionado, setTipoVehiculoSeleccionado] = useState("");
  const [isPending, startTransition] = useTransition();
  const tablistRef = useRef<HTMLDivElement>(null);

  // C-09: debounce búsqueda 300ms con aria-busy y skeleton
  useEffect(() => {
    setBuscando(true);
    const t = setTimeout(() => {
      startTransition(() => {
        setBusqueda(busquedaInput);
        setBuscando(false);
      });
    }, 300);
    return () => clearTimeout(t);
  }, [busquedaInput]);

  const conteos = useMemo(() => {
    const counts: Record<PestañaTraslados, number> = { activos: 0, programados: 0, finalizados: 0, cancelados: 0 };
    for (const viaje of Traslados) counts[pestañaDeViaje(viaje.pasaporte)]++;
    return counts;
  }, [Traslados]);

  const tiposVehiculo = useMemo(() => {
    return Array.from(new Set(Traslados.map(({ pasaporte }) => vehiculoTipo(pasaporte)))).sort((a, b) => a.localeCompare(b, "es"));
  }, [Traslados]);

  const gastoTotal = useMemo(() => {
    return Traslados.reduce((acc, { pasaporte }) => acc + (Number(pasaporte.monto_pagado) || 0), 0);
  }, [Traslados]);

  const filtrados = useMemo(() => {
    let lista = Traslados.filter(({ pasaporte }) => pestañaDeViaje(pasaporte) === pestana);
    if (tipoVehiculoSeleccionado) {
      lista = lista.filter(({ pasaporte }) => vehiculoTipo(pasaporte) === tipoVehiculoSeleccionado);
    }
    if (busqueda.trim()) {
      const q = busqueda.trim().toLowerCase();
      lista = lista.filter(({ pasaporte, traslado }) => {
        const folio = pasaporte.traslado_id?.toLowerCase() ?? "";
        const veh = vehiculoNombre(pasaporte).toLowerCase();
        const origen = `${traslado?.origen_ciudad ?? ""} ${traslado?.origen_direccion ?? ""}`.toLowerCase();
        const destino = `${traslado?.destino_ciudad ?? ""} ${traslado?.destino_direccion ?? ""}`.toLowerCase();
        const conductor = (pasaporte.conductor_nombre ?? "").toLowerCase();
        const placas = (pasaporte.vehiculo_placas ?? "").toLowerCase();
        return folio.includes(q) || veh.includes(q) || origen.includes(q) || destino.includes(q) || conductor.includes(q) || placas.includes(q);
      });
    }
    return lista;
  }, [Traslados, pestana, busqueda, tipoVehiculoSeleccionado]);

  function limpiarFiltros() {
    setBusquedaInput("");
    setBusqueda("");
    setTipoVehiculoSeleccionado("");
  }

  function handlePestanaChange(nueva: PestañaTraslados) {
    startTransition(() => setPestana(nueva));
  }

  /* ACC-7 (auditoría): navegación por flechas + Home/End sobre los botones
     reales del grupo (patrón toolbar de WAI-ARIA). */
  function handleTablistKeyDown(e: React.KeyboardEvent) {
    const botones = Array.from(
      tablistRef.current?.querySelectorAll<HTMLButtonElement>("button:not([disabled])") ?? []
    );
    if (botones.length === 0) return;
    const idx = botones.indexOf(document.activeElement as HTMLButtonElement);
    if (idx < 0) return;

    let destino = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") destino = (idx + 1) % botones.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") destino = (idx - 1 + botones.length) % botones.length;
    else if (e.key === "Home") destino = 0;
    else if (e.key === "End") destino = botones.length - 1;

    if (destino >= 0) {
      e.preventDefault();
      botones[destino]?.focus();
      const id = (botones[destino]?.dataset.pestana ?? "") as PestañaTraslados;
      if (id) handlePestanaChange(id);
    }
  }

  return (
    <div className="flex flex-col gap-[18px]">
      <section aria-labelledby="titulo-mis-traslados">
        <h1 id="titulo-mis-traslados" className="text-[26px] font-extrabold tracking-tight text-[#0b1e33]">
          Traslados
        </h1>
      </section>

      {/* Pestañas estilo segmento con conteos */}
      <div
        aria-label="Filtrar por estado del traslado"
        role="group"
        ref={tablistRef}
        onKeyDown={handleTablistKeyDown}
        className="flex gap-1.5 overflow-x-auto rounded-[40px] bg-[#f2f6fb] p-[5px]"
        style={{ scrollbarWidth: "none" }}
      >
        {PESTAÑAS.map(({ id, etiqueta }) => {
          const activo = pestana === id;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={activo}
              data-pestana={id}
              tabIndex={activo ? 0 : -1}
              onClick={() => handlePestanaChange(id)}
              className={[
                "min-h-11 flex-1 whitespace-nowrap rounded-[30px] px-1.5 text-[13px] transition-all",
                activo
                  ? "bg-white font-bold text-[#0b1e33] shadow-[0_4px_12px_rgba(0,0,0,0.06)]"
                  : "font-semibold text-[#5c6e86]",
              ].join(" ")}
            >
              {etiqueta}
              {conteos[id] > 0 && (
                <span
                  className={[
                    "ml-1 inline-block rounded-[20px] px-[7px] py-[2px] align-[1px] text-[10px] font-bold",
                    activo ? "bg-[#0b1e33] text-white" : "bg-[#dfe8f3] text-[#2e5a88]",
                  ].join(" ")}
                >
                  {conteos[id]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Resumen: total / activos / gastado */}
      <dl className="flex rounded-[18px] border border-[#eef2f7] bg-white p-4 shadow-[0_4px_12px_rgba(0,0,0,0.01)]">
        {[
          { etiqueta: "Total", valor: String(Traslados.length) },
          { etiqueta: "Activos", valor: String(conteos.activos) },
          { etiqueta: "Gastado", valor: formatoGastado(gastoTotal) },
        ].map(({ etiqueta, valor }) => (
          <div key={etiqueta} className="flex-1 text-center first:border-l-0 border-l border-[#eef2f7]">
            <dd className="text-[20px] font-extrabold tracking-tight text-[#0b1e33]">{valor}</dd>
            <dt className="mt-[3px] text-[11px] font-semibold uppercase tracking-[0.4px] text-[#7e8fa8]">{etiqueta}</dt>
          </div>
        ))}
      </dl>

      {/* Buscador + filtro */}
      <section aria-label="Buscar y filtrar traslados" className="flex flex-col gap-2">
        <div className="flex items-center gap-2.5 rounded-2xl border border-[#eef2f7] bg-white px-4 py-[13px]">
          <IconoBuscar className="size-4 shrink-0 text-[#a6b7cb]" />
          <label htmlFor="buscar-traslado" className="sr-only">
            Buscar traslado
          </label>
          <input
            id="buscar-traslado"
            type="search"
            value={busquedaInput}
            onChange={(event) => setBusquedaInput(event.target.value)}
            placeholder="Buscar por vehículo, destino o # de traslado"
            className="w-full border-0 bg-transparent p-0 text-[14px] font-medium text-[#0b1e33] outline-none placeholder:font-medium placeholder:text-[#a6b7cb]"
            aria-busy={buscando}
            aria-describedby="busqueda-ayuda"
          />
          <button
            type="button"
            aria-controls="panel-filtros-traslados"
            aria-expanded={filtroAbierto}
            aria-label={tipoVehiculoSeleccionado ? `Filtrar por tipo de vehículo, filtro activo: ${tipoVehiculoSeleccionado}` : "Filtrar por tipo de vehículo"}
            onClick={() => setFiltroAbierto((abierto) => !abierto)}
            className={[
              "flex size-11 shrink-0 items-center justify-center rounded-xl transition-colors",
              filtroAbierto || tipoVehiculoSeleccionado
                ? "bg-[#0b1e33] text-white"
                : "text-[#a6b7cb] hover:bg-[#f2f6fc] hover:text-[#2e5a88]",
            ].join(" ")}
          >
            <IconoFiltro className="size-5" />
          </button>
        </div>
        <div className="flex items-center gap-2 px-1">
          <p id="busqueda-ayuda" className="text-[12px] text-[#7e8fa8]">Folio, placa, vehículo, ciudad o conductor</p>
          {buscando && <span className="inline-flex items-center gap-1 text-xs text-[#7e8fa8]" role="status" aria-live="polite"><span className="size-3 animate-spin rounded-full border-2 border-[#eef2f7] border-t-[#2e5a88]" aria-hidden />Buscando…</span>}
        </div>

        {filtroAbierto && (
          <div id="panel-filtros-traslados" className="rounded-2xl border border-[#eef2f7] bg-white p-4 shadow-[0_4px_12px_rgba(0,0,0,0.01)]">
            <label className="mb-2 block text-[14px] font-bold text-[#0b1e33]" htmlFor="tipo-vehiculo">Tipo de vehículo</label>
            <select
              id="tipo-vehiculo"
              value={tipoVehiculoSeleccionado}
              onChange={(event) => setTipoVehiculoSeleccionado(event.target.value)}
              className="min-h-12 w-full rounded-xl border border-[#eef2f7] bg-white px-3 text-[16px] text-[#0b1e33]"
            >
              <option value="">Todos los vehículos</option>
              {tiposVehiculo.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
            </select>
            {(busqueda || tipoVehiculoSeleccionado) && (
              <button
                type="button"
                onClick={limpiarFiltros}
                className="mt-3 min-h-11 w-full rounded-xl border border-[#dae5f2] bg-[#f0f5fe] px-4 text-[14px] font-bold text-[#0b1e33]"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}
      </section>

      {/* Lista de traslados */}
      <section
        id="lista-traslados"
        aria-live="polite"
        aria-busy={isPending || buscando}
        aria-label={`Lista de traslados ${pestana} — ${filtrados.length} resultados`}
        className="flex flex-col gap-3.5"
      >
        {(isPending || buscando) ? (
          <div className="flex flex-col gap-3.5" role="status" aria-label="Cargando traslados">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : filtrados.length === 0 ? (
          <FichaVacia hayBusqueda={Boolean(busqueda.trim())} hayFiltro={Boolean(tipoVehiculoSeleccionado)} pestana={pestana} />
        ) : (
          filtrados.map(({ pasaporte, traslado }) => {
            const { label } = estadoVisual(pasaporte);
            const { tono, borde } = PILDORA_POR_PESTAÑA[pestana];
            const folio = folioCorto(pasaporte.traslado_id);
            const urlViaje = pasaporte.traslado_id ? `/viajes/${pasaporte.traslado_id}` : "/mis-viajes";
            const nombreVehiculo = vehiculoNombre(pasaporte);
            const origenCiudad = pasaporte.origen_ciudad ?? traslado?.origen_ciudad;
            const destinoCiudad = pasaporte.destino_ciudad ?? traslado?.destino_ciudad;
            const esPagoPendiente = pasaporte.estado === "cotizacion_aceptada" || pasaporte.estado === "pago_pendiente";
            const esActiva = tono === "active";
            const progreso = progresoPorEstadoTraslado(pasaporte.estado);
            const conductor = primerNombre(pasaporte.conductor_nombre) ?? "Por asignar";
            const duracion = formatoDuracion(pasaporte.tiempo_estimado_horas);
            const distancia = pasaporte.distancia_km != null
              ? `${Number(pasaporte.distancia_km).toLocaleString("es-MX")} km`
              : null;
            const fecha = fechaProgramada(traslado?.fecha_hora_programada ?? null);
            const datoSecundario = duracion ?? distancia ?? fecha.fecha;
            const etiquetaBoton = esActiva ? "Pasaporte" : esPagoPendiente ? "Completar pago" : "Detalle";

            return (
              <article
                key={pasaporte.traslado_id ?? `${pasaporte.creado_en}-${pasaporte.estado}`}
                className={[
                  "rounded-[22px] border border-[#eef2f7] border-l-4 bg-white p-5 shadow-[0_6px_16px_rgba(0,0,0,0.02)]",
                  borde,
                  tono === "cancelled" ? "opacity-[0.85]" : "",
                ].join(" ")}
              >
                <div className="mb-3.5 flex items-start justify-between gap-3">
                  <span className={["inline-flex items-center gap-1.5 rounded-[30px] px-3 py-1.5 text-[11px] font-bold tracking-[0.2px]", PILDORA_CLASE[tono]].join(" ")}>
                    {esActiva && <span aria-hidden="true" className="size-1.5 animate-pulse rounded-full bg-[#4ade80] shadow-[0_0_0_2px_rgba(74,222,128,0.3)]" />}
                    {label}
                  </span>
                  <span className="shrink-0 rounded-[20px] bg-[#f7faff] px-3 py-[5px] text-[12px] font-semibold text-[#8b9bb0]">
                    {folio}
                  </span>
                </div>

                <div className="mb-3.5 flex items-center gap-3.5">
                  <span aria-hidden="true" className="flex size-[50px] shrink-0 items-center justify-center rounded-2xl bg-[#eef3fa] text-[#2e5a88]">
                    <IconoCarroFrente className="size-[22px]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-[17px] font-extrabold tracking-tight text-[#0b1e33]">{nombreVehiculo}</h2>
                    <p className="mt-[3px] text-[12px] font-semibold tracking-[0.5px] text-[#6b7c94]">
                      {pasaporte.vehiculo_placas ?? "Placas pendientes"}
                    </p>
                  </div>
                </div>

                {esActiva && (
                  <div className="mb-3 flex items-center gap-2.5">
                    <div
                      className="h-[5px] flex-1 overflow-hidden rounded-[10px] bg-[#e8eef6]"
                      role="progressbar"
                      aria-valuenow={progreso}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Avance del traslado ${nombreVehiculo}: ${label}`}
                    >
                      <div
                        className="h-full rounded-[10px]"
                        style={{ width: `${progreso}%`, background: "linear-gradient(90deg, #0b1e33, #2e5a88)" }}
                      />
                    </div>
                    <span className="whitespace-nowrap text-[12px] font-bold text-[#0b1e33]">{progreso}%</span>
                  </div>
                )}

                <div className="mb-3.5 rounded-2xl bg-[#f8fafd] px-4 py-3.5">
                  <div className="flex items-start gap-3">
                    <span aria-hidden="true" className="mt-[3px] size-2.5 shrink-0 rounded-full bg-[#2e9e6b] shadow-[0_0_0_3px_#e2f0e9]" />
                    <p className="text-[13px] font-semibold leading-snug text-[#1a293b]">
                      {direccion(origenCiudad, "Origen pendiente")}
                      <small className="mt-[1px] block text-[11px] font-medium text-[#8b9bb0]">
                        {direccion(traslado?.origen_direccion ?? pasaporte.origen_direccion, "Dirección registrada")}
                      </small>
                    </p>
                  </div>
                  <div className="mt-2.5 flex items-start gap-3">
                    <span aria-hidden="true" className="mt-[3px] size-2.5 shrink-0 rounded-full bg-[#e8a23e] shadow-[0_0_0_3px_#fef0e0]" />
                    <p className="text-[13px] font-semibold leading-snug text-[#1a293b]">
                      {direccion(destinoCiudad, "Destino pendiente")}
                      <small className="mt-[1px] block text-[11px] font-medium text-[#8b9bb0]">
                        {direccion(traslado?.destino_direccion ?? pasaporte.destino_direccion, "Dirección registrada")}
                      </small>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-[#f0f4fa] pt-3.5">
                  <div className="flex min-w-0 gap-4 text-[12px] font-medium text-[#6b7c94]">
                    <span className="inline-flex min-w-0 items-center gap-1.5">
                      <IconoUsuario className="shrink-0 text-[#8b9bb0]" />
                      <span className="truncate">{conductor}</span>
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-1.5">
                      {pestana === "programados" && !duracion
                        ? <IconoCalendario className="text-[#8b9bb0]" />
                        : distancia && !duracion
                          ? <IconoRuta className="text-[#8b9bb0]" />
                          : <IconoReloj className="text-[#8b9bb0]" />}
                      {datoSecundario}
                    </span>
                  </div>
                  <Link
                    href={urlViaje}
                    aria-label={`${etiquetaBoton} del traslado ${nombreVehiculo} ${folio}`}
                    className={[
                      "inline-flex min-h-11 shrink-0 items-center gap-[7px] whitespace-nowrap rounded-[30px] px-4 py-2 text-[12px] font-bold tracking-tight",
                      esActiva || esPagoPendiente
                        ? "bg-[#0b1e33] text-white shadow-[0_6px_14px_-4px_rgba(11,30,51,0.3)]"
                        : "border border-[#dae5f2] bg-[#f0f5fe] text-[#0b1e33]",
                    ].join(" ")}
                  >
                    {etiquetaBoton}
                    <IconoChevron className="size-3" />
                  </Link>
                </div>
              </article>
            );
          })
        )}
      </section>

      {filtrados.length > 0 && (
        <p className="py-2 text-center text-[12px] font-medium text-[#a6b7cb]">
          Actualizado hace un momento
        </p>
      )}

      <Link
        href="/soporte"
        className="flex min-h-[76px] items-center justify-between gap-3 rounded-2xl border border-[#eef2f7] bg-[#fbfdff] px-4 py-3.5 text-[#1677ff] transition-transform active:scale-[0.99]"
      >
        <span className="flex min-w-0 items-center gap-3">
          <IconoSoporte className="size-8 shrink-0" />
          <span className="min-w-0">
            <span className="block text-[12px] text-[#4d6079]">¿Dudas o necesitas ayuda con este traslado?</span>
            <span className="mt-1 block text-[14px] font-bold">Contactar soporte</span>
          </span>
        </span>
        <IconoChevron className="size-5 shrink-0" />
      </Link>
    </div>
  );
}
