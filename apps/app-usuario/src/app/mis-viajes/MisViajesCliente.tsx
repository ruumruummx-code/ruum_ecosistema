"use client";

import { useMemo, useState, useEffect, useTransition, useRef } from "react";
import Link from "next/link";
import { ETIQUETA_TIPO_VEHICULO } from "@ruum/shared/constants";
import type { Database } from "@ruum/shared/types";
import { EtapasTrasladoUsuario } from "../EtapasTrasladoUsuario";
import { MobileBottomSheet } from "../../components/MobileBottomSheet";

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
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 11l1.5-4.5h11L19 11M4 11h16v6a1 1 0 0 1-1 1h-1a2 2 0 0 1-4 0H10a2 2 0 0 1-4 0H5a1 1 0 0 1-1-1v-6z" />
      <circle cx="7.5" cy="17.5" r="1.5" />
      <circle cx="16.5" cy="17.5" r="1.5" />
    </svg>
  );
}

function IconoRelojVerde({ className = "size-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 6 12 12 15 15" />
    </svg>
  );
}

function IconoDolarCoral({ className = "size-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="12" y1="2" x2="12" y2="22" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function IconoCalendarioPlus({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="3" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="12" y1="13" x2="12" y2="19" />
      <line x1="9" y1="16" x2="15" y2="16" />
    </svg>
  );
}

function IconoPinRuta({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function IconoGraficoBarras({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
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
    "cotizacion_aceptada",
    "servicio_confirmado",
    "pendiente_de_conductor",
  ].includes(estado)) return "programados";
  return "activos";
}

const PILDORA_POR_PESTAÑA: Record<PestañaTraslados, { tono: TonoPildora; borde: string }> = {
  activos: { tono: "active", borde: "border-l-emerald-500" },
  programados: { tono: "scheduled", borde: "border-l-amber-500" },
  finalizados: { tono: "completed", borde: "border-l-slate-400" },
  cancelados: { tono: "cancelled", borde: "border-l-rose-500" },
};

const PILDORA_CLASE: Record<TonoPildora, string> = {
  active: "bg-[#e9f3ee] text-[#08705f] border border-[#c8e6d8] dark:bg-[#0a2e1f] dark:text-[#4dd9a3] dark:border-[#135939]",
  scheduled: "bg-[#fef4e6] text-[#765100] border border-[#f3d8a2] dark:bg-[#3d2e00] dark:text-[#ffc933] dark:border-[#664d00]",
  completed: "bg-[#eff3f8] text-[#3b4c68] border border-[#d7e1ee] dark:bg-[#1a2e4a] dark:text-[#a8b5cc] dark:border-[#2d476e]",
  cancelled: "bg-[#fdeaea] text-[#9a2637] border border-[#f6ccd2] dark:bg-[#3d0f1a] dark:text-[#ff6b7a] dark:border-[#661a29]",
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

function IlustracionEmptyTraslados() {
  return (
    <div className="relative mx-auto mb-2 flex size-28 items-center justify-center sm:size-32" aria-hidden="true">
      <svg viewBox="0 0 140 120" fill="none" className="h-full w-full">
        {/* Silueta urbana de fondo */}
        <rect x="22" y="44" width="22" height="42" rx="3" fill="#e2e8f0" fillOpacity="0.8" />
        <rect x="48" y="32" width="26" height="54" rx="3" fill="#cbd5e1" fillOpacity="0.7" />
        <rect x="78" y="48" width="20" height="38" rx="3" fill="#e2e8f0" fillOpacity="0.8" />
        <rect x="102" y="54" width="22" height="32" rx="3" fill="#cbd5e1" fillOpacity="0.6" />
        <ellipse cx="26" cy="38" rx="12" ry="5" fill="#f1f5f9" />
        <ellipse cx="114" cy="36" rx="14" ry="6" fill="#f1f5f9" />

        {/* Resplandor circular principal */}
        <circle cx="70" cy="62" r="38" fill="#e8f1fd" className="dark:fill-[#0c2848]" />

        {/* Círculo central con auto azul */}
        <g transform="translate(50, 42)">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#0052cc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 11l1.5-4.5h11L19 11M4 11h16v6a1 1 0 0 1-1 1h-1a2 2 0 0 1-4 0H10a2 2 0 0 1-4 0H5a1 1 0 0 1-1-1v-6z" />
            <circle cx="7.5" cy="17.5" r="1.5" />
            <circle cx="16.5" cy="17.5" r="1.5" />
          </svg>
        </g>
      </svg>
    </div>
  );
}

function FichaVacia({ hayBusqueda, hayFiltro, pestana, onLimpiar }: { hayBusqueda: boolean; hayFiltro: boolean; pestana: PestañaTraslados; onLimpiar: () => void }) {
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
    <div className="rounded-[28px] border border-[#e2e8f0] bg-white p-6 text-center shadow-xs dark:border-[#1a3a5c] dark:bg-[#0a2342] sm:p-8">
      <IlustracionEmptyTraslados />
      <h2 className="text-[18px] font-extrabold tracking-tight text-[#0a2342] dark:text-[#f6f8fb] sm:text-[20px]">{titulo}</h2>
      <p className="mx-auto mt-2 max-w-sm text-[13.5px] font-medium leading-relaxed text-[#566889] dark:text-[#a8b5cc]">{descripcion}</p>
      
      <div className="mt-5 flex justify-center">
        {hayBusqueda || hayFiltro ? (
          <button type="button" className="h-12 rounded-2xl bg-[#0052cc] px-6 text-[14.5px] font-bold text-white shadow-sm transition hover:bg-[#0041a8] cursor-pointer" onClick={onLimpiar}>
            Limpiar filtros
          </button>
        ) : (
          <Link
            href="/viajes/nuevo"
            className="inline-flex h-[48px] items-center justify-center gap-2 rounded-2xl bg-[#0052cc] px-7 text-[15px] font-bold text-white shadow-md transition hover:bg-[#0041a8] active:scale-[0.98] cursor-pointer"
          >
            <span aria-hidden="true" className="text-lg">＋</span> Crear traslado
          </Link>
        )}
      </div>

      {/* 3 Beneficios destacados al pie de la tarjeta vacía (Prototipo V2) */}
      {!hayBusqueda && !hayFiltro && (
        <div className="mt-8 grid grid-cols-3 gap-2 border-t border-[#edf2f7] pt-6 dark:border-[#1a3a5c]/80 sm:gap-4">
          <div className="flex flex-col items-center text-center">
            <span className="flex size-9 items-center justify-center rounded-xl bg-[#edf4fe] text-[#2563eb] dark:bg-[#0f2d52] dark:text-[#6ba8ff]">
              <IconoCalendarioPlus />
            </span>
            <span className="mt-2 text-[11.5px] font-bold text-[#0a2342] dark:text-[#f6f8fb]">Programa</span>
            <span className="text-[10.5px] text-[#64748b] dark:text-[#a8b5cc]">tus viajes</span>
          </div>
          <div className="flex flex-col items-center text-center">
            <span className="flex size-9 items-center justify-center rounded-xl bg-[#edf4fe] text-[#2563eb] dark:bg-[#0f2d52] dark:text-[#6ba8ff]">
              <IconoPinRuta />
            </span>
            <span className="mt-2 text-[11.5px] font-bold text-[#0a2342] dark:text-[#f6f8fb]">Gestiona</span>
            <span className="text-[10.5px] text-[#64748b] dark:text-[#a8b5cc]">tus rutas</span>
          </div>
          <div className="flex flex-col items-center text-center">
            <span className="flex size-9 items-center justify-center rounded-xl bg-[#edf4fe] text-[#2563eb] dark:bg-[#0f2d52] dark:text-[#6ba8ff]">
              <IconoGraficoBarras />
            </span>
            <span className="mt-2 text-[11.5px] font-bold text-[#0a2342] dark:text-[#f6f8fb]">Lleva un</span>
            <span className="text-[10.5px] text-[#64748b] dark:text-[#a8b5cc]">mejor control</span>
          </div>
        </div>
      )}
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

  // Debounce búsqueda 300ms con aria-busy y skeleton
  useEffect(() => {
    if (busquedaInput === busqueda) return;
    setBuscando(true);
    const t = setTimeout(() => {
      startTransition(() => {
        setBusqueda(busquedaInput);
        setBuscando(false);
      });
    }, 300);
    return () => clearTimeout(t);
  }, [busquedaInput, busqueda]);

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
        const folio = `${pasaporte.traslado_id ?? ""} ${folioCorto(pasaporte.traslado_id)}`.toLowerCase();
        const veh = vehiculoNombre(pasaporte).toLowerCase();
        const origen = `${pasaporte.origen_ciudad ?? ""} ${pasaporte.origen_direccion ?? ""} ${traslado?.origen_ciudad ?? ""} ${traslado?.origen_direccion ?? ""}`.toLowerCase();
        const destino = `${pasaporte.destino_ciudad ?? ""} ${pasaporte.destino_direccion ?? ""} ${traslado?.destino_ciudad ?? ""} ${traslado?.destino_direccion ?? ""}`.toLowerCase();
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
    setBuscando(false);
  }

  function handlePestanaChange(nueva: PestañaTraslados) {
    startTransition(() => setPestana(nueva));
  }

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
    <div className="user-transfers-view flex flex-col gap-3.5 pb-8 sm:gap-4.5">
      {/* Pestañas de categorías estilo cápsula (Pills alineadas al prototipo) */}
      <div
        aria-label="Filtrar por estado del traslado"
        role="group"
        ref={tablistRef}
        onKeyDown={handleTablistKeyDown}
        className="flex gap-1 overflow-x-auto rounded-full bg-[#f1f5fa] p-1 dark:bg-[#0c233f]"
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
              className={`flex-1 min-w-[84px] py-2 px-3 text-[13px] font-bold rounded-full transition-all cursor-pointer text-center ${
                activo
                  ? "bg-[#0052cc] text-white shadow-sm"
                  : "text-[#64748b] hover:text-[#0a2342] dark:text-[#94a3b8] dark:hover:text-white"
              }`}
            >
              {etiqueta}
              {id === "programados" && conteos[id] > 0 && (
                <span
                  className="ml-1.5 inline-flex size-4.5 items-center justify-center rounded-full bg-white/20 text-[10px] font-extrabold text-current"
                  title={`${conteos[id]} programados`}
                >
                  {new Intl.NumberFormat("es-MX", { notation: conteos[id] >= 1000 ? "compact" : "standard", maximumFractionDigits: 0 }).format(conteos[id])}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Resumen: 3 Tarjetas métricas con fondos pasteles según prototipo */}
      <dl aria-label="Resumen de traslados" className="grid grid-cols-3 gap-2.5 sm:gap-3.5">
        {/* Total (Azul) */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-[#d6e4f8] bg-[#edf4fe] p-3 text-center dark:border-[#1a3a60] dark:bg-[#0c2646]">
          <span className="text-[#2563eb] dark:text-[#4d94ff]">
            <IconoCarroFrente className="size-5" />
          </span>
          <dd className="mt-1 text-[22px] font-extrabold tracking-tight text-[#0a2342] dark:text-[#f6f8fb]">
            {Traslados.length}
          </dd>
          <dt className="text-[11.5px] font-semibold text-[#64748b] dark:text-[#a8b5cc]">Total</dt>
        </div>

        {/* Activos (Verde) */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-[#cbeed9] bg-[#eaf8f0] p-3 text-center dark:border-[#135939] dark:bg-[#09281e]">
          <span className="text-[#10b981] dark:text-[#34d399]">
            <IconoRelojVerde className="size-5" />
          </span>
          <dd className="mt-1 text-[22px] font-extrabold tracking-tight text-[#0a2342] dark:text-[#f6f8fb]">
            {conteos.activos}
          </dd>
          <dt className="text-[11.5px] font-semibold text-[#64748b] dark:text-[#a8b5cc]">Activos</dt>
        </div>

        {/* Gastado (Coral/Rosa) */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-[#f9d7d7] bg-[#fdf0f0] p-3 text-center dark:border-[#591d24] dark:bg-[#331418]">
          <span className="text-[#ef4444] dark:text-[#f87171]">
            <IconoDolarCoral className="size-5" />
          </span>
          <dd className="mt-1 text-[22px] font-extrabold tracking-tight text-[#0a2342] dark:text-[#f6f8fb]">
            {formatoGastado(gastoTotal)}
          </dd>
          <dt className="text-[11.5px] font-semibold text-[#64748b] dark:text-[#a8b5cc]">Gastado</dt>
        </div>
      </dl>

      {/* Buscador y botón de filtro */}
      <section aria-label="Buscar y filtrar traslados" className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2.5 rounded-2xl border border-[#e2e8f0] bg-white px-4 py-3 shadow-xs dark:border-[#1a3a5c] dark:bg-[#0a2342]">
          <IconoBuscar className="size-4.5 shrink-0 text-[#64748b] dark:text-[#a8b5cc]" />
          <label htmlFor="buscar-traslado" className="sr-only">
            Buscar traslado
          </label>
          <input
            id="buscar-traslado"
            type="search"
            value={busquedaInput}
            onChange={(event) => setBusquedaInput(event.target.value)}
            placeholder="Buscar por vehículo, destino o # de traslado"
            className="w-full border-0 bg-transparent p-0 text-[14px] font-medium text-[#0a2342] outline-none placeholder:text-[#64748b] dark:text-[#f6f8fb] dark:placeholder:text-[#a8b5cc]"
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
              "flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors cursor-pointer",
              filtroAbierto || tipoVehiculoSeleccionado
                ? "bg-[#0052cc] text-white dark:bg-[#4d94ff] dark:text-[#061529]"
                : "text-[#64748b] hover:bg-[#edf4fe] hover:text-[#0052cc] dark:text-[#a8b5cc] dark:hover:bg-[#0f2d52] dark:hover:text-[#f6f8fb]",
            ].join(" ")}
          >
            <IconoFiltro className="size-4.5" />
          </button>
        </div>
        <div className="flex items-center gap-2 px-1">
          <p id="busqueda-ayuda" className="sr-only text-[12px] text-[#4e5f80] dark:text-[#a8b5cc]">
            Folio, placa, vehículo, ciudad o conductor
          </p>
          {buscando && (
            <span className="inline-flex items-center gap-1 text-xs text-[#4e5f80] dark:text-[#a8b5cc]" role="status" aria-live="polite">
              <span className="size-3 animate-spin rounded-full border-2 border-[#eef2f7] border-t-[#0052cc]" aria-hidden />
              Buscando…
            </span>
          )}
        </div>

        <MobileBottomSheet open={filtroAbierto} onClose={() => setFiltroAbierto(false)} title="Filtrar traslados">
          <div id="panel-filtros-traslados">
            <label className="mb-2 block text-[14px] font-bold text-[#0a2342] dark:text-[#f6f8fb]" htmlFor="tipo-vehiculo">
              Tipo de vehículo
            </label>
            <select
              id="tipo-vehiculo"
              value={tipoVehiculoSeleccionado}
              onChange={(event) => setTipoVehiculoSeleccionado(event.target.value)}
              className="min-h-12 w-full rounded-xl border border-[#e6edf6] bg-white px-3 text-[16px] text-[#0a2342] dark:border-[#1a3a5c] dark:bg-[#061529] dark:text-[#f6f8fb]"
            >
              <option value="">Todos los vehículos</option>
              {tiposVehiculo.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
            {(busqueda || tipoVehiculoSeleccionado) && (
              <button
                type="button"
                onClick={limpiarFiltros}
                className="mt-3 min-h-11 w-full rounded-xl border border-[#dae5f2] bg-[#f0f5fe] px-4 text-[14px] font-bold text-[#0a2342] dark:border-[#1a3a5c] dark:bg-[#0f2d52] dark:text-[#f6f8fb]"
              >
                Limpiar filtros
              </button>
            )}
            <button
              type="button"
              className="mt-4 flex h-12 w-full items-center justify-center rounded-2xl bg-[#0052cc] text-[14.5px] font-bold text-white shadow-sm transition hover:bg-[#0041a8] cursor-pointer"
              onClick={() => setFiltroAbierto(false)}
            >
              Aplicar filtros
            </button>
          </div>
        </MobileBottomSheet>
      </section>

      {/* Lista de traslados o Tarjeta Empty State */}
      <section
        id="lista-traslados"
        aria-live="polite"
        aria-busy={isPending || buscando}
        aria-label={`Lista de traslados ${pestana} — ${filtrados.length} resultados`}
        className="flex flex-col gap-3"
        tabIndex={0}
      >
        {isPending || buscando ? (
          <div className="flex flex-col gap-3.5" role="status" aria-label="Cargando traslados">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : filtrados.length === 0 ? (
          <FichaVacia
            hayBusqueda={Boolean(busqueda.trim())}
            hayFiltro={Boolean(tipoVehiculoSeleccionado)}
            pestana={pestana}
            onLimpiar={limpiarFiltros}
          />
        ) : (
          <>
            <div className="flex items-center justify-between px-1 text-[13px] font-semibold text-[#64748b] dark:text-[#a8b5cc]">
              <span>
                {filtrados.length} {filtrados.length === 1 ? "traslado" : "traslados"}
              </span>
              <Link
                href="/viajes/nuevo"
                className="inline-flex items-center gap-1 text-[13px] font-bold text-[#0052cc] hover:underline dark:text-[#4d94ff]"
              >
                ＋ Crear traslado
              </Link>
            </div>
            {filtrados.map(({ pasaporte, traslado }) => {
              const { label } = estadoVisual(pasaporte);
              const { tono, borde } = PILDORA_POR_PESTAÑA[pestana];
              const folio = folioCorto(pasaporte.traslado_id);
              const urlViaje = pasaporte.traslado_id ? `/viajes/${pasaporte.traslado_id}` : "/mis-viajes";
              const nombreVehiculo = vehiculoNombre(pasaporte);
              const origenCiudad = pasaporte.origen_ciudad ?? traslado?.origen_ciudad;
              const destinoCiudad = pasaporte.destino_ciudad ?? traslado?.destino_ciudad;
              const esPagoPendiente = pasaporte.estado === "cotizacion_aceptada" || pasaporte.estado === "pago_pendiente";
              const esActiva = tono === "active";
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
                    "rounded-2xl border border-[#e6edf6] border-l-4 bg-white p-5 shadow-xs transition hover:shadow-md dark:border-[#1a3a5c] dark:bg-[#0a2342]",
                    borde,
                    tono === "cancelled" ? "opacity-[0.85]" : "",
                  ].join(" ")}
                >
                  <div className="mb-3.5 flex items-start justify-between gap-3">
                    <span className={["inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-bold tracking-tight", PILDORA_CLASE[tono]].join(" ")}>
                      {esActiva && <span aria-hidden="true" className="size-1.5 animate-pulse rounded-full bg-emerald-500" />}
                      {label}
                    </span>
                    <span className="shrink-0 rounded-full bg-[#f2f6fb] px-2.5 py-1 text-[11.5px] font-mono font-bold text-[#4e5f80] dark:bg-[#1a3a5c] dark:text-[#a8b5cc]">
                      {folio}
                    </span>
                  </div>

                  <div className="mb-3.5 flex items-center gap-3.5">
                    <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-[13px] bg-[#edf4fe] text-[#0052cc] dark:bg-[#0f2d52] dark:text-[#6ba8ff]">
                      <IconoCarroFrente className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-[15px] font-bold text-[#0a2342] dark:text-[#f6f8fb]">
                        {nombreVehiculo}
                      </h3>
                      <p className="truncate text-[12.5px] font-medium text-[#64748b] dark:text-[#a8b5cc]">
                        {origenCiudad} → {destinoCiudad}
                      </p>
                    </div>
                  </div>

                  {/* Trayecto / Datos secundarios */}
                  <div className="flex items-center justify-between border-t border-[#f1f5fa] pt-3 text-[12px] font-medium text-[#64748b] dark:border-[#1a3a5c] dark:text-[#a8b5cc]">
                    <span>Conductor: <strong className="font-semibold text-[#0a2342] dark:text-[#f6f8fb]">{conductor}</strong></span>
                    <span>{datoSecundario}</span>
                  </div>

                  <div className="mt-3.5 flex justify-end">
                    <Link
                      href={urlViaje}
                      className="inline-flex h-9 items-center justify-center rounded-xl bg-[#f0f4fa] px-4 text-[13px] font-bold text-[#0052cc] transition hover:bg-[#e2ecf9] dark:bg-[#0f2d52] dark:text-[#6ba8ff]"
                    >
                      {etiquetaBoton}
                    </Link>
                  </div>
                </article>
              );
            })}
          </>
        )}
      </section>
    </div>
  );
}