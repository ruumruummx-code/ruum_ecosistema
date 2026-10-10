import Link from "next/link";
import type { ReactNode } from "react";
import { firmarUrlsEvidencia, obtenerPasaporteDigital, obtenerUltimaUbicacionTraslado } from "@ruum/api/services";
import type { FotoEvidenciaConUrlVisual, UbicacionTraslado } from "@ruum/api/services";
import {
  listarDisputasTraslado,
  listarFotosEvidencia,
  listarIncidenciasTraslado,
  listarPagosTraslado,
  listarReclamosTraslado,
  obtenerCalificacionTraslado,
  obtenerConductorTraslado,
  obtenerResumenTraslado,
  obtenerTrasladoConRelaciones,
  obtenerVehiculoTraslado
} from "@ruum/api/transfers";
import { Aviso, EstadoBadge, Icono } from "@ruum/ui";
import { formatearPrecio } from "@ruum/shared/utils";
import { ETIQUETA_TIPO_INCIDENCIA, ETIQUETA_TIPO_VEHICULO, MENSAJES_CLAVE_UX } from "@ruum/shared/constants";
import { ETIQUETA_ESTADO_TRASLADO } from "@ruum/shared/states";
import type { Database } from "@ruum/shared/types";
import { crearClienteServidor } from "@/lib/supabase-server";
import { iniciales } from "../../cuenta/cuenta-utils";
import { ChatTraslado } from "./ChatTraslado";
import { ReportarIncidenciaUsuario } from "./ReportarIncidencia";
import { CancelarTraslado } from "./CancelarTraslado";
import { CalificarTraslado } from "./CalificarTraslado";
import { AbrirDisputa } from "./AbrirDisputa";
import { SeguimientoTrasladoTiempoReal } from "./SeguimientoTrasladoTiempoReal";
import { EvidenciaComparativa } from "./EvidenciaComparativa";
import { ExportarPasaportePdf } from "./ExportarPasaportePdf";
import { CompartirPasaporte } from "./CompartirPasaporte";
import { AceptarCotizacion } from "./AceptarCotizacion";
import { PagoRecuperable } from "./PagoRecuperable";
import { PagoTraslado } from "./PagoTraslado";
import { AccionesRapidasPasaporte } from "./AccionesRapidasPasaporte";

import { NavegacionUsuario } from "../../NavegacionUsuario";

// El Pasaporte contiene datos protegidos por sesión y cambia con el estado
// operativo del traslado; nunca debe prerenderizarse ni servirse desde caché.
export const dynamic = "force-dynamic";
export const dynamicParams = true;

type Pasaporte = Database["public"]["Views"]["pasaporte_digital"]["Row"];
type Traslado = Pick<
  Database["public"]["Tables"]["traslados"]["Row"],
  | "origen_direccion"
  | "origen_ciudad"
  | "destino_direccion"
  | "destino_ciudad"
  | "contacto_entrega_nombre"
  | "contacto_entrega_telefono"
  | "contacto_recepcion_nombre"
  | "contacto_recepcion_telefono"
  | "fecha_hora_programada"
  | "cotizacion_expira_en"
  | "tipo_servicio"
  | "motivo_servicio"
  | "ventana_recoleccion"
  | "ventana_entrega"
>;
type Vehiculo = Pick<
  Database["public"]["Tables"]["vehiculos"]["Row"],
  | "tipo"
  | "marca"
  | "modelo"
  | "anio"
  | "vin"
  | "condicion"
  | "color"
  | "transmision"
  | "placas"
  | "tiene_tarjeta_circulacion"
  | "tiene_verificacion"
  | "tiene_placas"
  | "puede_circular_rodando"
>;
type Conductor = Pick<
  Database["public"]["Tables"]["conductores"]["Row"],
  "id" | "nombre" | "estado" | "nivel_operativo_vigente" | "calificacion_promedio" | "traslados_completados" | "foto_perfil_url"
>;
type FotoEvidencia = Database["public"]["Tables"]["evidencia_fotos"]["Row"];
type FotoEvidenciaVisual = FotoEvidenciaConUrlVisual<FotoEvidencia>;
type Incidencia = Database["public"]["Tables"]["incidencias"]["Row"];
type Pago = Database["public"]["Tables"]["pagos"]["Row"];
type Calificacion = Database["public"]["Tables"]["calificaciones_traslado"]["Row"];
type Disputa = Database["public"]["Tables"]["disputas"]["Row"];
type ReclamoSeguroUsuario = Pick<
  Database["public"]["Tables"]["reclamos_seguro"]["Row"],
  "id" | "traslado_id" | "estado" | "abierto_en" | "resuelto_en"
>;
type EstadoTraslado = Database["public"]["Enums"]["estado_traslado"];

const LINEA_TIEMPO: { estado: EstadoTraslado; etiqueta: string }[] = [
  { estado: "solicitud_creada", etiqueta: "Solicitud creada" },
  { estado: "cotizacion_generada", etiqueta: "Tarifa asignada" },
  { estado: "pago_completado", etiqueta: "Pago realizado" },
  { estado: "conductor_asignado", etiqueta: "Conductor asignado" },
  { estado: "conductor_en_camino_al_origen", etiqueta: "Conductor en camino al origen" },
  { estado: "vehiculo_recibido", etiqueta: "Vehículo localizado" },
  { estado: "evidencia_inicial_completada", etiqueta: "Check inicial cargado" },
  { estado: "traslado_en_curso", etiqueta: "En camino al destino" },
  { estado: "evidencia_final_completada", etiqueta: "Check final cargado" },
  { estado: "entrega_confirmada", etiqueta: "Entrega confirmada" },
  { estado: "servicio_cerrado", etiqueta: "Traslado finalizado" }
];

const ORDEN_ESTADOS: EstadoTraslado[] = [
  "usuario_pendiente_verificacion",
  "usuario_verificado",
  "solicitud_creada",
  "documentacion_pendiente",
  "documentacion_en_revision",
  "documentacion_validada",
  "cotizacion_generada",
  // M14: falta este estado válido (orden canónico: ESTADOS_TRASLADO) dejaba
  // estadoDePaso en "pendiente" para todo el timeline de ese traslado.
  "cotizacion_aceptada",
  "servicio_confirmado",
  "pendiente_de_conductor",
  "conductor_asignado",
  "conductor_en_camino_al_origen",
  "conductor_en_punto_de_recoleccion",
  "verificacion_vehiculo_en_proceso",
  "evidencia_inicial_en_proceso",
  "evidencia_inicial_completada",
  "vehiculo_recibido",
  "traslado_en_curso",
  "incidencia_reportada",
  "llegada_a_destino",
  "evidencia_final_en_proceso",
  "evidencia_final_completada",
  "entrega_confirmada",
  "pago_pendiente",
  "pago_completado",
  "servicio_cerrado"
];

const ETIQUETA_ANGULO: Record<FotoEvidencia["angulo"], string> = {
  frente: "Frente",
  lado_piloto: "Lado piloto",
  lado_copiloto: "Lado copiloto",
  trasera: "Trasera",
  tablero: "Tablero",
  dano_previo: "Daño visible",
  adicional: "Adicional"
};

function formatoFecha(fecha: string | null | undefined) {
  if (!fecha) return "Pendiente";
  try {
    const d = new Date(fecha);
    if (isNaN(d.getTime())) return "Pendiente";
    return new Intl.DateTimeFormat("es-MX", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "America/Mexico_City"
    }).format(d);
  } catch {
    return "Pendiente";
  }
}

function estadoDePaso(estadoActual: EstadoTraslado, estadoPaso: EstadoTraslado) {
  const indiceActual = ORDEN_ESTADOS.indexOf(estadoActual);
  const indicePaso = ORDEN_ESTADOS.indexOf(estadoPaso);
  if (indiceActual < 0 || indicePaso < 0) return "pendiente";
  if (indiceActual > indicePaso) return "completado";
  if (indiceActual === indicePaso) return "actual";
  return "pendiente";
}

function calcularHorasDesdeCierre(actualizadoEn: string | null) {
  if (!actualizadoEn) return Number.POSITIVE_INFINITY;
  return (Date.now() - new Date(actualizadoEn).getTime()) / (1000 * 60 * 60);
}

async function obtenerDatos(id: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return {
      pasaporte: null,
      traslado: null,
      vehiculo: null,
      conductor: null,
      evidencia: [] as FotoEvidenciaVisual[],
      incidencias: [] as Incidencia[],
      disputas: [] as Disputa[],
      reclamosSeguro: [] as ReclamoSeguroUsuario[],
      calificacion: null as Calificacion | null,
      pagos: [] as Pago[],
      ultimaUbicacion: null as UbicacionTraslado | null,
    };
  }

  try {
    const { crearClienteServidor } = await import("@/lib/supabase-server");
    const cliente = await crearClienteServidor();

    // 1. Intentar obtener el pasaporte digital desde la vista oficial
    let pasaporte: Pasaporte | null = null;
    try {
      pasaporte = await obtenerPasaporteDigital(cliente, id);
    } catch (err) {
      console.warn("[obtenerDatos] Error en obtenerPasaporteDigital, probando fallback directo:", err);
    }

    // 2. Fallback resiliente: consultar tabla traslados directamente si la vista no devuelve datos
    if (!pasaporte) {
      let tRow: Record<string, unknown> | null = null;
      try {
        const rel = await obtenerTrasladoConRelaciones(cliente, id);
        tRow = rel.traslado
          ? ({ ...rel.traslado, vehiculos: rel.vehiculo, conductores: rel.conductor } as unknown as Record<string, unknown>)
          : null;
      } catch {
        tRow = null;
      }

      if (tRow) {
        const v = tRow.vehiculos as any;
        const c = tRow.conductores as any;
        pasaporte = {
          traslado_id: tRow.id as string,
          usuario_id: tRow.usuario_id as string,
          vehiculo_id: (tRow.vehiculo_id as string) ?? null,
          conductor_id: (tRow.conductor_id as string) ?? null,
          estado: tRow.estado as EstadoTraslado,
          tiene_incidencia_abierta: (tRow.tiene_incidencia_abierta as boolean) ?? false,
          tipo_pago: (tRow.tipo_pago as Database["public"]["Enums"]["tipo_pago"]) ?? null,
          causa_fallido: (tRow.causa_fallido as Database["public"]["Enums"]["causa_fallido"]) ?? null,
          precio_cotizado: (tRow.precio_cotizado as number) ?? null,
          precio_final: (tRow.precio_final as number) ?? null,
          creado_en: tRow.creado_en as string,
          actualizado_en: tRow.actualizado_en as string,
          vehiculo_tipo: v?.tipo ?? null,
          vehiculo_marca: v?.marca ?? null,
          vehiculo_modelo: v?.modelo ?? null,
          vehiculo_anio: v?.anio ?? null,
          conductor_nombre: c?.nombre ?? null,
          conductor_estado: c?.estado ?? null,
          conductor_nivel: c?.nivel_operativo_vigente ?? null,
          conductor_calificacion: c?.calificacion_promedio ?? null,
          evidencia_inicial_fotos_sincronizadas: 0,
          evidencia_final_fotos_sincronizadas: 0,
          incidencias_abiertas: 0,
          monto_pagado: 0,
          origen_lat: (tRow.origen_lat as number) ?? null,
          origen_lng: (tRow.origen_lng as number) ?? null,
          destino_lat: (tRow.destino_lat as number) ?? null,
          destino_lng: (tRow.destino_lng as number) ?? null,
          distancia_km: (tRow.distancia_km as number) ?? null,
          tiempo_estimado_horas: (tRow.tiempo_estimado_horas as number) ?? null,
          vehiculo_categoria_tarifa: v?.categoria_tarifa ?? null,
          vehiculo_gama: v?.gama ?? null,
          vehiculo_condicion: v?.condicion ?? null,
          origen_direccion: (tRow.origen_direccion as string) ?? null,
          origen_ciudad: (tRow.origen_ciudad as string) ?? null,
          origen_referencias: (tRow.origen_referencias as string) ?? null,
          destino_direccion: (tRow.destino_direccion as string) ?? null,
          destino_ciudad: (tRow.destino_ciudad as string) ?? null,
          destino_referencias: (tRow.destino_referencias as string) ?? null,
          contacto_entrega_nombre: (tRow.contacto_entrega_nombre as string) ?? null,
          contacto_entrega_telefono: (tRow.contacto_entrega_telefono as string) ?? null,
          contacto_recepcion_nombre: (tRow.contacto_recepcion_nombre as string) ?? null,
          contacto_recepcion_telefono: (tRow.contacto_recepcion_telefono as string) ?? null,
          vehiculo_color: v?.color ?? null,
          vehiculo_placas: v?.placas ?? null,
          vehiculo_vin: v?.vin ?? null,
          ganancia_conductor: null
        };
      }
    }

    if (!pasaporte) {
      return {
        pasaporte: null,
        traslado: null,
        vehiculo: null,
        conductor: null,
        evidencia: [] as FotoEvidenciaVisual[],
        incidencias: [] as Incidencia[],
        disputas: [] as Disputa[],
        reclamosSeguro: [] as ReclamoSeguroUsuario[],
        calificacion: null as Calificacion | null,
        pagos: [] as Pago[],
        ultimaUbicacion: null as UbicacionTraslado | null,
      };
    }

    const vehiculoId = pasaporte.vehiculo_id;
    const conductorId = pasaporte.conductor_id;

    const [
      trasladoRes,
      vehiculoRes,
      conductorRes,
      fotosEvidencia,
      incidencias,
      disputas,
      reclamosSeguro,
      calificacion,
      pagos,
      ultimaUbicacion
    ] = await Promise.all([
      obtenerResumenTraslado(cliente, id).then((data) => ({ data })),
      obtenerVehiculoTraslado(cliente, vehiculoId).then((data) => ({ data })),
      obtenerConductorTraslado(cliente, conductorId).then((data) => ({ data })),
      listarFotosEvidencia(cliente, id).then((data) => ({ data })),
      listarIncidenciasTraslado(cliente, id).then((data) => ({ data })),
      listarDisputasTraslado(cliente, id).then((data) => ({ data })),
      listarReclamosTraslado(cliente, id).then((data) => ({ data })),
      obtenerCalificacionTraslado(cliente, id).then((data) => ({ data })),
      listarPagosTraslado(cliente, id).then((data) => ({ data })),
      obtenerUltimaUbicacionTraslado(cliente, id).catch(() => null)
    ]);

    let evidenciaFirmada: FotoEvidenciaVisual[] = [];
    try {
      const fotos = (fotosEvidencia?.data ?? []) as FotoEvidencia[];
      evidenciaFirmada = await firmarUrlsEvidencia(cliente, fotos);
    } catch {
      evidenciaFirmada = (((fotosEvidencia?.data ?? []) as FotoEvidencia[]) || []).map((f) => ({
        ...f,
        url_visual: null
      }));
    }

    return {
      pasaporte,
      traslado: trasladoRes?.data ?? null,
      vehiculo: vehiculoRes?.data ?? null,
      conductor: conductorRes?.data ?? null,
      evidencia: evidenciaFirmada,
      incidencias: (incidencias?.data ?? []) as Incidencia[],
      disputas: (disputas?.data ?? []) as Disputa[],
      reclamosSeguro: (reclamosSeguro?.data ?? []) as ReclamoSeguroUsuario[],
      calificacion: calificacion?.data ?? null,
      pagos: (pagos?.data ?? []) as Pago[],
      ultimaUbicacion: ultimaUbicacion ?? null
    };
  } catch (error) {
    console.error("[obtenerDatos]", error);
    return {
      pasaporte: null,
      traslado: null,
      vehiculo: null,
      conductor: null,
      evidencia: [] as FotoEvidenciaVisual[],
      incidencias: [] as Incidencia[],
      disputas: [] as Disputa[],
      reclamosSeguro: [] as ReclamoSeguroUsuario[],
      calificacion: null as Calificacion | null,
      pagos: [] as Pago[],
      ultimaUbicacion: null as UbicacionTraslado | null,
    };
  }
}

/* ---------- Iconos del pasaporte (SVG inline, sin dependencias) ---------- */

// Capa compartida (@ruum/ui): conserva la API y el tamaño por defecto.
function IconoTarjeta({ d, className = "size-3.5" }: { d: string; className?: string }) {
  return <Icono d={d} className={className} />;
}

function IconoAuto({ className = "size-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5.2 10.5 6.7 6.8A2 2 0 0 1 8.55 5.5h6.9a2 2 0 0 1 1.85 1.3l1.5 3.7c1.05.32 1.7 1.28 1.7 2.38v4.37a1 1 0 0 1-1 1h-1.4a1 1 0 0 1-1-1v-.75H6.9v.75a1 1 0 0 1-1 1H4.5a1 1 0 0 1-1-1v-4.37c0-1.1.65-2.06 1.7-2.38Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M6.5 10.5h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="7.2" cy="14.4" r="1.3" fill="currentColor" />
      <circle cx="16.8" cy="14.4" r="1.3" fill="currentColor" />
    </svg>
  );
}

function IconoPersona({ className = "size-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.6" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4.5 19.5c0-3.6 3.4-6 7.5-6s7.5 2.4 7.5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function humanizar(valor: string | null | undefined): string | null {
  if (!valor) return null;
  const texto = valor.replaceAll("_", " ").trim();
  if (!texto) return null;
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function formatoDuracion(horas: number | null | undefined): string | null {
  if (horas == null || Number.isNaN(Number(horas))) return null;
  const totalMin = Math.round(Number(horas) * 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h <= 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

/* ---------- Piezas visuales de la tarjeta pasaporte ---------- */

function TarjetaPasaporte({
  id,
  titulo,
  children,
}: {
  id: string;
  titulo: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-titulo`}
      className="scroll-mt-28 rounded-[22px] border border-[#eef2f7] bg-white p-5 shadow-[0_6px_16px_rgba(0,0,0,0.01)]"
    >
      {children}
    </section>
  );
}

function EncabezadoTarjeta({ id, icono, titulo }: { id: string; icono: ReactNode; titulo: string }) {
  return (
    <h2 id={`${id}-titulo`} className="mb-4 flex items-center gap-2.5 text-[16px] font-bold text-[#0b1e33]">
      <span
        aria-hidden="true"
        className="flex size-7 items-center justify-center rounded-[10px] bg-[#f0f5fe] text-[#2e5a88]"
      >
        {icono}
      </span>
      {titulo}
    </h2>
  );
}

function FilaInfo({ etiqueta, valor }: { etiqueta: string; valor: ReactNode }) {
  return (
    <div className="flex items-start text-[14px] leading-snug">
      <span className="w-[130px] shrink-0 font-medium text-[#6f7e94]">{etiqueta}</span>
      <span className="flex-1 font-semibold text-[#1a293b]">{valor}</span>
    </div>
  );
}

function LineaTiempoVisual({ estadoActual }: { estadoActual: EstadoTraslado }) {
  return (
    <ol className="mt-1.5 flex flex-col gap-0.5">
      {LINEA_TIEMPO.map((paso) => {
        const estado = estadoDePaso(estadoActual, paso.estado);
        return (
          <li key={paso.etiqueta} className="flex gap-3.5 py-2 text-[13px]">
            <span
              aria-hidden="true"
              className={[
                "mt-1 size-2.5 shrink-0 rounded-full",
                estado === "completado"
                  ? "bg-[#0b1e33] shadow-[0_0_0_3px_#e6edf6]"
                  : estado === "actual"
                    ? "bg-[#2e9e6b] shadow-[0_0_0_3px_#d6f0e3]"
                    : "bg-[#cbd7e6]",
              ].join(" ")}
            />
            <span className="flex-1">
              <span
                className={[
                  "block font-semibold",
                  estado === "pendiente" ? "font-medium text-[#a6b7cb]" : "text-[#1a293b]",
                  estado === "actual" ? "font-bold text-[#0b1e33]" : "",
                ].join(" ")}
              >
                {paso.etiqueta}
              </span>
              <span className="mt-0.5 block text-[11px] text-[#8b9bb0]">
                {estado === "actual" ? "Estado actual" : estado === "completado" ? "Completado" : "Pendiente"}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function EvidenciaMomento({
  titulo,
  descripcion,
  fotos
}: {
  titulo: string;
  descripcion: string;
  fotos: FotoEvidenciaVisual[];
}) {
  return (
    <div className="border-t border-ink/10 pt-5 first:border-t-0 first:pt-0">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-body text-sm font-semibold">{titulo}</h3>
          <p className="mt-1 font-body text-xs leading-5 text-ink/55">{descripcion}</p>
        </div>
        <span className="shrink-0 font-mono-ruum text-xs text-ink/50">{fotos.length} fotos</span>
      </div>

      {fotos.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {fotos.map((foto) => (
            <div key={foto.id} className="overflow-hidden rounded-lg border border-ink/10 bg-mist">
              {foto.url_visual?.startsWith("http") ? (
                // eslint-disable-next-line @next/next/no-img-element -- URL firmada temporal de Supabase Storage.
                <img src={foto.url_visual} alt={ETIQUETA_ANGULO[foto.angulo]} className="aspect-[4/3] w-full object-cover" />
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center bg-ink/5 px-3 text-center font-body text-xs text-ink/45">
                  Foto registrada
                </div>
              )}
              <div className="border-t border-ink/10 px-3 py-2">
                <p className="font-body text-xs font-medium">{ETIQUETA_ANGULO[foto.angulo]}</p>
                <p className="mt-0.5 font-body text-xs text-ink/45">
                  {foto.sincronizada ? "Sincronizada" : "Pendiente de sincronizar"} · {formatoFecha(foto.capturada_en)}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 rounded-lg border border-dashed border-ink/15 px-3 py-3 font-body text-sm text-ink/50">
          Aún no hay evidencia cargada para este momento.
        </p>
      )}
    </div>
  );
}

function EvidenciaDurante({
  pasaporte,
  traslado,
  incidencias
}: {
  pasaporte: Pasaporte;
  traslado: Traslado | null;
  incidencias: Incidencia[];
}) {
  return (
    <div className="border-t border-ink/10 pt-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-body text-sm font-semibold">Evidencia durante el traslado</h3>
          <p className="mt-1 font-body text-xs leading-5 text-ink/55">
            Actualizaciones de estatus, ubicación general, hitos del recorrido, paradas autorizadas, incidencias y
            mensajes operativos relevantes.
          </p>
        </div>
        <span className="shrink-0 font-mono-ruum text-xs text-ink/50">{incidencias.length} incidencias</span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-ink/10 px-3 py-3">
          <p className="font-body text-xs uppercase tracking-wide text-ink/45">Estatus</p>
          <p className="mt-1 font-body text-sm font-medium">
            {pasaporte.estado ? ETIQUETA_ESTADO_TRASLADO[pasaporte.estado] : "Estado por confirmar"}
          </p>
        </div>
        <div className="rounded-lg border border-ink/10 px-3 py-3">
          <p className="font-body text-xs uppercase tracking-wide text-ink/45">Último hito</p>
          <p className="mt-1 font-body text-sm font-medium">{formatoFecha(pasaporte.actualizado_en)}</p>
        </div>
        <div className="rounded-lg border border-ink/10 px-3 py-3">
          <p className="font-body text-xs uppercase tracking-wide text-ink/45">Ruta general</p>
          <p className="mt-1 font-body text-sm font-medium">
            {traslado ? `${traslado.origen_ciudad} → ${traslado.destino_ciudad}` : "Pendiente"}
          </p>
        </div>
      </div>
      {incidencias.length > 0 && (
        <div className="mt-4 space-y-2">
          {incidencias.slice(0, 2).map((incidencia) => (
            <div key={incidencia.id} className="rounded-lg border border-warn/25 bg-warn-soft/40 px-3 py-2">
              <p className="font-body text-sm font-medium">{ETIQUETA_TIPO_INCIDENCIA[incidencia.tipo]}</p>
              <p className="mt-1 font-body text-xs text-ink/55">{incidencia.descripcion}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default async function PaginaTraslado({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { pasaporte, traslado, vehiculo, conductor, evidencia, incidencias, disputas, reclamosSeguro, calificacion, pagos, ultimaUbicacion } = await obtenerDatos(id);

  // R2 defense-in-depth: verificar que el traslado pertenece al usuario autenticado (RLS puede fallar)
  if (pasaporte?.usuario_id) {
    try {
      const { crearClienteServidor: crearClienteAuth } = await import("@/lib/supabase-server");
      const clienteAuth = await crearClienteAuth();
      const {
        data: { user },
      } = await clienteAuth.auth.getUser();
      if (!user) {
        // Tratar como no encontrado para no filtrar existencia (IDOR)
        return (
          <>
      <NavegacionUsuario variante="claro" />
      <main className="user-v2-scope user-v2-page user-v2-secondary-screen"><div className="w-full max-w-md mx-auto py-20 px-4 text-center">
              <p className="font-display text-xs font-bold uppercase tracking-widest text-[#FFC400]">Traslado no encontrado</p>
              <h1 className="mt-3 font-display text-2xl font-black text-white">No encontramos ese traslado</h1>
              <p className="mt-3 max-w-sm mx-auto font-body text-xs leading-relaxed text-[#8E9CAE]">
                Revisa el enlace o el folio. Si recién lo creaste, puede tardar unos segundos en sincronizarse con la plataforma.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link
                  href="/mis-viajes"
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#FFC400] px-5 py-2.5 font-display text-xs font-black uppercase tracking-wider text-[#0B111B] shadow-md transition hover:bg-[#e6b000]"
                >
                  Ver mis traslados
                </Link>
              </div>
            </div>
          </main>
    </>
        );
      }

      // `pasaporte.usuario_id` referencia public.usuarios.id; no es el mismo
      // UUID que auth.users.id. Resolver primero el perfil evita rechazar
      // traslados legítimos como "no encontrados".
      const { obtenerUsuarioIdPorAuth } = await import("@ruum/api/identity");
      const perfilId = await obtenerUsuarioIdPorAuth(clienteAuth, user.id);
      if (!perfilId || perfilId !== pasaporte.usuario_id) {
        // Tratar como no encontrado para no filtrar existencia (IDOR)
        return (
          <>
      <NavegacionUsuario variante="claro" />
      <main className="user-v2-scope user-v2-page user-v2-secondary-screen"><div className="w-full max-w-md mx-auto py-20 px-4 text-center">
              <p className="font-display text-xs font-bold uppercase tracking-widest text-[#FFC400]">Traslado no encontrado</p>
              <h1 className="mt-3 font-display text-2xl font-black text-white">No encontramos ese traslado</h1>
              <p className="mt-3 max-w-sm mx-auto font-body text-xs leading-relaxed text-[#8E9CAE]">
                Revisa el enlace o el folio. Si recién lo creaste, puede tardar unos segundos en sincronizarse con la plataforma.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link
                  href="/mis-viajes"
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#FFC400] px-5 py-2.5 font-display text-xs font-black uppercase tracking-wider text-[#0B111B] shadow-md transition hover:bg-[#e6b000]"
                >
                  Ver mis traslados
                </Link>
              </div>
            </div>
          </main>
    </>
        );
      }
    } catch {
      // Si falla la verificación de sesión, no exponer datos
      return (
        <>
      <NavegacionUsuario variante="claro" />
      <main className="user-v2-scope user-v2-page user-v2-secondary-screen"><div className="w-full max-w-md mx-auto py-20 px-4 text-center">
            <p className="font-display text-xs font-bold uppercase tracking-widest text-[#FFC400]">Traslado no encontrado</p>
            <h1 className="mt-3 font-display text-2xl font-black text-white">No encontramos ese traslado</h1>
            <p className="mt-3 max-w-sm mx-auto font-body text-xs leading-relaxed text-[#8E9CAE]">No pudimos verificar tu sesión. Intenta iniciar sesión de nuevo.</p>
          </div>
        </main>
    </>
      );
    }
  }

  if (!pasaporte) {
    return (
      <>
      <NavegacionUsuario variante="claro" />
      <main className="user-v2-scope user-v2-page user-v2-secondary-screen"><div className="w-full max-w-md mx-auto py-20 px-4 text-center">
          <p className="font-display text-xs font-bold uppercase tracking-widest text-[#FFC400]">
            Traslado no encontrado
          </p>
          <h1 className="mt-3 font-display text-2xl font-black text-white">No encontramos ese traslado</h1>
          <p className="mt-3 max-w-sm mx-auto font-body text-xs leading-relaxed text-[#8E9CAE]">
            Revisa el enlace o el folio. Si recién lo creaste, puede tardar unos segundos en sincronizarse con la plataforma.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/mis-viajes"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#FFC400] px-5 py-2.5 font-display text-xs font-black uppercase tracking-wider text-[#0B111B] shadow-md transition hover:bg-[#e6b000]"
            >
              Ver mis traslados
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#1C2A3E] bg-[#0A1220] px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-slate-300 transition hover:border-[#FFC400]/40 hover:text-white"
            >
              Inicio
            </Link>
          </div>
        </div>
      </main>
    </>
    );
  }

  if (!pasaporte.traslado_id || !pasaporte.estado) {
    return (
      <>
      <NavegacionUsuario variante="claro" />
      <main className="user-v2-scope user-v2-page user-v2-secondary-screen"><div className="w-full max-w-md mx-auto py-20 px-4 text-center">
          <p className="font-display text-xs font-bold uppercase tracking-widest text-[#FFC400]">
            Traslado incompleto
          </p>
          <h1 className="mt-3 font-display text-2xl font-black text-white">No pudimos cargar el estado del traslado</h1>
          <p className="mt-3 max-w-sm mx-auto font-body text-xs leading-relaxed text-[#8E9CAE]">
            Vuelve a intentarlo. Si el problema continúa, contacta a nuestro equipo de soporte.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/mis-viajes"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#FFC400] px-5 py-2.5 font-display text-xs font-black uppercase tracking-wider text-[#0B111B] shadow-md transition hover:bg-[#e6b000]"
            >
              Ver mis traslados
            </Link>
          </div>
        </div>
      </main>
    </>
    );
  }

  const evidenciaInicial = evidencia.filter((foto) => foto.tipo === "inicial");
  const evidenciaFinal = evidencia.filter((foto) => foto.tipo === "final");
  const precioBase = pasaporte.precio_final ?? pasaporte.precio_cotizado ?? 0;
  const vehiculoNombre = [pasaporte.vehiculo_marca, pasaporte.vehiculo_modelo, pasaporte.vehiculo_anio]
    .filter(Boolean)
    .join(" ");
  const horasDesdeCierre = calcularHorasDesdeCierre(pasaporte.actualizado_en);
  const dentroDeVentanaPostCierre = horasDesdeCierre <= 72;
  const mostrarPromptCalificacion =
    pasaporte.estado === "servicio_cerrado" && !calificacion && Boolean(pasaporte.conductor_id) && dentroDeVentanaPostCierre;
  const puedeAbrirDisputa =
    ["servicio_cerrado", "reclamo_resuelto", "cierre_operativo_con_incidencia_abierta"].includes(pasaporte.estado) &&
    dentroDeVentanaPostCierre;

  const folioCorto = `#RR-${pasaporte.traslado_id.slice(0, 4).toUpperCase()}`;
  const tipoServicio = humanizar(traslado?.tipo_servicio) ?? "Traslado estándar";
  const motivoServicio = humanizar(traslado?.motivo_servicio) ?? "Por definir";
  const ventanaRecoleccion =
    traslado?.ventana_recoleccion ??
    (traslado?.fecha_hora_programada ? formatoFecha(traslado.fecha_hora_programada) : null) ??
    "Por definir";
  const ventanaEntrega = traslado?.ventana_entrega ?? "Por definir";
  const colorVehiculo = vehiculo?.color ?? pasaporte.vehiculo_color ?? "No registrado";
  const transmisionVehiculo = humanizar(vehiculo?.transmision) ?? "No registrada";
  const condicionVehiculo = humanizar(vehiculo?.condicion ?? pasaporte.vehiculo_condicion) ?? "No registrada";
  const placasVehiculo = vehiculo?.placas ?? pasaporte.vehiculo_placas;
  const vinVehiculo = vehiculo?.vin ?? pasaporte.vehiculo_vin;
  const tipoVehiculoEtiqueta = (vehiculo?.tipo ?? pasaporte.vehiculo_tipo)
    ? (ETIQUETA_TIPO_VEHICULO[(vehiculo?.tipo ?? pasaporte.vehiculo_tipo) as keyof typeof ETIQUETA_TIPO_VEHICULO] ??
      humanizar(vehiculo?.tipo ?? pasaporte.vehiculo_tipo))
    : null;
  const nombreConductor = conductor?.nombre ?? pasaporte.conductor_nombre;
  const calificacionConductor = conductor?.calificacion_promedio ?? pasaporte.conductor_calificacion;
  const duracionEstimada = formatoDuracion(pasaporte.tiempo_estimado_horas);
  const distanciaTexto =
    pasaporte.distancia_km != null ? `${Number(pasaporte.distancia_km).toLocaleString("es-MX")} km` : null;
  const metodoPago =
    pagos.length > 0 && pagos[0]?.metodo
      ? humanizar(String(pagos[0].metodo))
      : (humanizar(pasaporte.tipo_pago) ?? "Por definir");
  const saldoPendiente = precioBase - (pasaporte.monto_pagado ?? 0);
  const estadoPago =
    precioBase > 0 && (pasaporte.monto_pagado ?? 0) >= precioBase
      ? "Pagado"
      : (pasaporte.monto_pagado ?? 0) > 0
        ? "Pago parcial"
        : "Pendiente";
  const soporteHref = `/soporte?viaje=${pasaporte.traslado_id}`;

  return (
    <>
      <NavegacionUsuario variante="claro" />
      <main className="user-v2-scope user-v2-page user-v2-secondary-screen"><div className="w-full max-w-2xl mx-auto px-4 py-4 sm:py-8 pb-28 flex flex-col gap-4">
      {/* Cabecera del pasaporte */}
      <div className="flex items-center gap-3.5 border-b border-[#f0f4fa] bg-white px-1 py-3">
        <Link
          href="/mis-viajes"
          aria-label="Volver a mis traslados"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#f2f6fc] text-[#0b1e33] transition-colors hover:bg-[#e6eef9] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#1677ff]"
        >
          <Icono nombre="atras" className="size-[18px]" strokeWidth={2} />
        </Link>
        <div className="min-w-0">
          <h1 className="text-[18px] font-bold tracking-tight text-[#0b1e33]">Pasaporte Digital</h1>
          <p className="mt-0.5 text-[12px] font-medium text-[#6b7c94]">Traslado {folioCorto}</p>
        </div>
        <div className="ml-auto shrink-0">
          <CompartirPasaporte folio={folioCorto} variante="cabecera" />
        </div>
      </div>

      {/* Estado y folio */}
      <div className="flex items-center justify-between gap-3">
        <EstadoBadge estado={pasaporte.estado} />
        <span className="shrink-0 rounded-full bg-[#f2f6fc] px-3.5 py-1.5 text-[14px] font-semibold text-[#5e718a]">
          {folioCorto}
        </span>
      </div>

      {pasaporte.tiene_incidencia_abierta && (
        <Aviso tono="atencion">
          Este traslado tiene una incidencia abierta. Nuestro equipo te mantendrá informado.
        </Aviso>
      )}

      {pasaporte.estado === "servicio_cerrado" && <Aviso tono="info">{MENSAJES_CLAVE_UX.cierre}</Aviso>}

      <AccionesRapidasPasaporte trasladoId={pasaporte.traslado_id} estado={pasaporte.estado} />

      {/* 1. Información del traslado */}
      <TarjetaPasaporte id="info-traslado" titulo="Información del traslado">
        <EncabezadoTarjeta
          id="info-traslado"
          icono={
            <IconoTarjeta d="M8 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M9 5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V5ZM9 12h6M9 16h4" />
          }
          titulo="Información del traslado"
        />
        <div className="flex flex-col gap-3">
          <FilaInfo etiqueta="Tipo de servicio" valor={tipoServicio} />
          <FilaInfo etiqueta="Ventana recolección" valor={ventanaRecoleccion} />
          <FilaInfo etiqueta="Ventana entrega" valor={ventanaEntrega} />
          <FilaInfo etiqueta="Motivo" valor={motivoServicio} />
        </div>
      </TarjetaPasaporte>

      {/* 2. Datos del vehículo */}
      <TarjetaPasaporte id="datos-vehiculo" titulo="Datos del vehículo">
        <EncabezadoTarjeta
          id="datos-vehiculo"
          icono={
            <IconoTarjeta d="M5 16 6.5 9.5A2 2 0 0 1 8.5 8h7a2 2 0 0 1 2 1.5L19 16M5 16h14M5 16v3.5M19 16v3.5M7.5 19.5h.01M16.5 19.5h.01" />
          }
          titulo="Datos del vehículo"
        />
        <div className="mb-4 flex items-center gap-4">
          <span
            aria-hidden="true"
            className="flex size-20 shrink-0 items-center justify-center rounded-2xl border-2 border-white bg-[#dfe8f3] text-[#2e5a88] shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
          >
            <IconoAuto />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[18px] font-bold text-[#0b1e33]">{vehiculoNombre || "Vehículo"}</p>
            {tipoVehiculoEtiqueta && (
              <p className="mt-0.5 text-[12px] font-medium text-[#6b7c94]">{tipoVehiculoEtiqueta}</p>
            )}
            {placasVehiculo && (
              <p className="mt-1.5 inline-block rounded-full bg-[#f0f4fa] px-3 py-1 text-[13px] font-semibold tracking-wider text-[#1f2c3d]">
                {placasVehiculo}
              </p>
            )}
            <p className="mt-1.5 truncate text-[12px] text-[#6b7c94]">VIN: {vinVehiculo ?? "pendiente de registro"}</p>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <FilaInfo etiqueta="Color" valor={colorVehiculo} />
          <FilaInfo etiqueta="Transmisión" valor={transmisionVehiculo} />
          <FilaInfo etiqueta="Condición declarada" valor={condicionVehiculo} />
        </div>
      </TarjetaPasaporte>

      {/* 3. Conductor asignado */}
      <TarjetaPasaporte id="conductor" titulo="Conductor asignado">
        <EncabezadoTarjeta
          id="conductor"
          icono={
            <IconoTarjeta d="M12 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM5 20c0-3.9 3.1-7 7-7s7 3.1 7 7M16 11l2 2 4-4" />
          }
          titulo="Conductor asignado"
        />
        {nombreConductor ? (
          <div className="rounded-[18px] border border-[#e9f0f8] bg-[#f8fafd] p-4">
            <div className="flex items-center gap-4">
              {conductor?.foto_perfil_url ? (
                // eslint-disable-next-line @next/next/no-img-element -- URL de fotografía del conductor
                <img
                  src={conductor.foto_perfil_url}
                  alt={`Fotografía de ${nombreConductor}`}
                  className="size-[70px] shrink-0 rounded-full border-2 border-white object-cover shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="flex size-[70px] shrink-0 items-center justify-center rounded-full border-2 border-white bg-[#d1ddeb] text-[24px] font-bold text-[#0b1e33] shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
                >
                  {iniciales(nombreConductor)}
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate text-[17px] font-bold text-[#0b1e33]">{nombreConductor}</p>
                <p className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px] text-[#4d6079]">
                  <span className="inline-flex items-center rounded-full bg-[#dff0e6] px-2.5 py-0.5 text-[11px] font-semibold text-[#1f6b4a]">
                    {humanizar(conductor?.nivel_operativo_vigente ?? pasaporte.conductor_nivel) ?? "Certificado"}
                  </span>
                  <span>
                    {calificacionConductor != null
                      ? `${Number(calificacionConductor).toFixed(1)} / 5`
                      : "Sin calificación"}
                  </span>
                  <span>{conductor ? `ID: ${conductor.id.slice(0, 8).toUpperCase()}` : "ID pendiente"}</span>
                </p>
              </div>
            </div>
            {pasaporte.conductor_id && (
              <p className="mt-3 text-[12px] leading-5 text-[#4d6079]">{MENSAJES_CLAVE_UX.conductor_asignado}</p>
            )}
          </div>
        ) : (
          <div className="rounded-[18px] border border-dashed border-[#cbd7e6] bg-[#f8fafd] p-4">
            <p className="text-[15px] font-bold text-[#0b1e33]">Por asignar</p>
            <p className="mt-1 text-[13px] text-[#4d6079]">
              Te avisamos en cuanto un conductor certificado tome tu traslado.
            </p>
          </div>
        )}
        <div id="chat-conductor" className="mt-3 scroll-mt-28">
          <ChatTraslado trasladoId={pasaporte.traslado_id} estado={pasaporte.estado} />
        </div>
      </TarjetaPasaporte>

      {/* 4. Ruta del traslado */}
      <TarjetaPasaporte id="ruta" titulo="Ruta del traslado">
        <EncabezadoTarjeta
          id="ruta"
          icono={
            <IconoTarjeta d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11Z M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
          }
          titulo="Ruta del traslado"
        />
        <SeguimientoTrasladoTiempoReal
          trasladoId={pasaporte.traslado_id ?? id}
          estado={pasaporte.estado}
          origen={{ lat: pasaporte.origen_lat, lng: pasaporte.origen_lng }}
          destino={{ lat: pasaporte.destino_lat, lng: pasaporte.destino_lng }}
          ubicacionInicial={ultimaUbicacion}
        />
        <div className="mt-4 flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#e2f0e9] text-[#1f6b4a]"
            >
              <IconoTarjeta d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11Z" className="size-3" />
            </span>
            <p className="text-[14px] font-medium text-[#1a293b]">
              {traslado?.origen_ciudad ?? pasaporte.origen_ciudad ?? "Origen pendiente"}
              <small className="mt-0.5 block text-[12px] font-normal text-[#6f7e94]">
                {traslado?.origen_direccion ?? pasaporte.origen_direccion ?? "Dirección registrada"}
              </small>
            </p>
          </div>
          <div aria-hidden="true" className="ml-[11px] h-4 w-0 border-l-2 border-dashed border-[#cbd7e6]" />
          <div className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#fef0e0] text-[#b36b1e]"
            >
              <IconoTarjeta d="M5 21V4m0 1h12l-2.5 4L17 13H5" className="size-3" />
            </span>
            <p className="text-[14px] font-medium text-[#1a293b]">
              {traslado?.destino_ciudad ?? pasaporte.destino_ciudad ?? "Destino pendiente"}
              <small className="mt-0.5 block text-[12px] font-normal text-[#6f7e94]">
                {traslado?.destino_direccion ?? pasaporte.destino_direccion ?? "Dirección registrada"}
              </small>
            </p>
          </div>
        </div>
        {(duracionEstimada || distanciaTexto) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {duracionEstimada && (
              <span className="rounded-full bg-[#eef3fa] px-2.5 py-1 text-[11px] font-semibold text-[#2e5a88]">
                Tiempo estimado: {duracionEstimada}
              </span>
            )}
            {distanciaTexto && (
              <span className="rounded-full bg-[#eef3fa] px-2.5 py-1 text-[11px] font-semibold text-[#2e5a88]">
                {distanciaTexto}
              </span>
            )}
          </div>
        )}
        {(traslado?.contacto_entrega_nombre || traslado?.contacto_recepcion_nombre) && (
          <div className="mt-4 flex flex-col gap-3 border-t border-[#f0f4fa] pt-4">
            {traslado?.contacto_entrega_nombre && (
              <FilaInfo
                etiqueta="Entrega"
                valor={`${traslado.contacto_entrega_nombre}${traslado.contacto_entrega_telefono ? ` · ${traslado.contacto_entrega_telefono}` : ""}`}
              />
            )}
            {traslado?.contacto_recepcion_nombre && (
              <FilaInfo
                etiqueta="Recibe"
                valor={`${traslado.contacto_recepcion_nombre}${traslado.contacto_recepcion_telefono ? ` · ${traslado.contacto_recepcion_telefono}` : ""}`}
              />
            )}
          </div>
        )}
      </TarjetaPasaporte>

      {mostrarPromptCalificacion && (
        <section id="calificacion" aria-label="Califica tu traslado" className="scroll-mt-28">
          <CalificarTraslado
            trasladoId={pasaporte.traslado_id}
            conductorId={pasaporte.conductor_id}
            mostrar={mostrarPromptCalificacion}
          />
        </section>
      )}

      {/* 5. Línea de tiempo */}
      <TarjetaPasaporte id="linea-tiempo" titulo="Línea de tiempo">
        <EncabezadoTarjeta
          id="linea-tiempo"
          icono={
            <IconoTarjeta d="M4 6h16M4 12h16M4 18h10M18 16.5a2.5 2.5 0 1 0 0 .01" />
          }
          titulo="Línea de tiempo"
        />
        <LineaTiempoVisual estadoActual={pasaporte.estado} />
      </TarjetaPasaporte>

      {/* 6. Evidencia del vehículo */}
      <TarjetaPasaporte id="evidencia" titulo="Evidencia del vehículo">
        <EncabezadoTarjeta
          id="evidencia"
          icono={
            <IconoTarjeta d="M4 8h3l2-2.5h6L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z M12 16.5a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z" />
          }
          titulo="Evidencia del vehículo"
        />
        <div className="flex flex-col gap-6">
          <EvidenciaMomento
            titulo="Check inicial"
            descripcion={MENSAJES_CLAVE_UX.evidencia_inicial}
            fotos={evidenciaInicial}
          />
          <EvidenciaComparativa
            inicial={evidenciaInicial}
            final={evidenciaFinal}
            tieneIncidenciaAbierta={incidencias.some((i) => !i.resuelta)}
          />
          <EvidenciaDurante pasaporte={pasaporte} traslado={traslado} incidencias={incidencias} />
          <EvidenciaMomento
            titulo="Check final"
            descripcion="Fotos finales exteriores e interiores, kilometraje y combustible final, confirmación de entrega, observaciones finales y aceptación del receptor cuando aplique."
            fotos={evidenciaFinal}
          />
        </div>
      </TarjetaPasaporte>
      {/* 7. Reportes o incidencias */}
      <TarjetaPasaporte id="reportes" titulo="Reportes o incidencias">
        <EncabezadoTarjeta
          id="reportes"
          icono={
            <IconoTarjeta d="M12 8v5m0 3.5h.01M10.3 3.9 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
          }
          titulo="Reportes o incidencias"
        />
        {incidencias.length > 0 ? (
          <ul className="mb-4 flex flex-col gap-2.5">
            {incidencias.map((incidencia) => (
              <li key={incidencia.id} className="rounded-2xl border border-[#eef2f7] px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[14px] font-semibold text-[#1a293b]">{ETIQUETA_TIPO_INCIDENCIA[incidencia.tipo]}</p>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${incidencia.resuelta ? "bg-[#e9f3ee] text-[#1f6b4a]" : "bg-[#fef0e0] text-[#b36b1e]"}`}
                  >
                    {incidencia.resuelta ? "Resuelta" : "Abierta"}
                  </span>
                </div>
                <p className="mt-1.5 text-[13px] text-[#4d6079]">{incidencia.descripcion}</p>
                <p className="mt-1.5 text-[11px] text-[#8b9bb0]">
                  {incidencia.momento ? String(incidencia.momento).replaceAll("_", " ") : "Traslado"} ·{" "}
                  {formatoFecha(incidencia.creada_en)}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mb-4 flex items-center gap-2.5 text-[14px] text-[#4d6079]">
            <span
              aria-hidden="true"
              className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#e9f3ee] text-[#1f6b4a]"
            >
              <IconoTarjeta d="m5 12.5 4.5 4.5L19 7.5" className="size-3.5" />
            </span>
            Sin incidencias reportadas
          </p>
        )}
        <div className="flex flex-col gap-3">
          <ReportarIncidenciaUsuario trasladoId={pasaporte.traslado_id} />
          <CancelarTraslado
            trasladoId={pasaporte.traslado_id}
            estado={pasaporte.estado}
            precio={precioBase}
            fechaProgramada={traslado?.fecha_hora_programada ?? null}
            conductorAsignado={Boolean(pasaporte.conductor_id)}
          />
          <AbrirDisputa trasladoId={pasaporte.traslado_id} disponible={puedeAbrirDisputa} />
        </div>
        {(disputas.length > 0 || reclamosSeguro.length > 0) && (
          <div className="mt-4 flex flex-col gap-2.5 border-t border-[#f0f4fa] pt-4">
            {disputas.map((disputa) => (
              <div key={disputa.id} className="rounded-2xl border border-[#eef2f7] px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[14px] font-semibold text-[#1a293b]">
                    {disputa.tipo ? String(disputa.tipo).replaceAll("_", " ") : "Disputa"}
                  </p>
                  <span className="shrink-0 text-[11px] text-[#8b9bb0]">
                    {disputa.estado ? String(disputa.estado).replaceAll("_", " ") : ""}
                  </span>
                </div>
                <p className="mt-1.5 text-[13px] text-[#4d6079]">{disputa.descripcion}</p>
                {disputa.resolucion && (
                  <p className="mt-1.5 text-[13px] text-[#1f6b4a]">
                    Resolución: {String(disputa.resolucion).replaceAll("_", " ")}
                    {disputa.resolucion_detalle ? ` · ${disputa.resolucion_detalle}` : ""}
                  </p>
                )}
              </div>
            ))}
            {reclamosSeguro.map((reclamo) => (
              <div key={reclamo.id} className="rounded-2xl border border-[#eef2f7] px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[14px] font-semibold text-[#1a293b]">Reclamo de seguro</p>
                  <span className="shrink-0 text-[11px] text-[#8b9bb0]">
                    {reclamo.estado ? String(reclamo.estado).replaceAll("_", " ") : ""}
                  </span>
                </div>
                <p className="mt-1.5 text-[13px] text-[#4d6079]">
                  Abierto {formatoFecha(reclamo.abierto_en)}
                  {reclamo.resuelto_en ? ` · Resuelto ${formatoFecha(reclamo.resuelto_en)}` : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </TarjetaPasaporte>

      {/* 8. Información de pago */}
      <TarjetaPasaporte id="pago" titulo="Información de pago">
        <EncabezadoTarjeta
          id="pago"
          icono={<IconoTarjeta d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7ZM3 10h18M7 15h4" />}
          titulo="Información de pago"
        />
        <div className="flex flex-col gap-3">
          <FilaInfo etiqueta="Método de pago" valor={metodoPago ?? "Por definir"} />
          <FilaInfo
            etiqueta="Estado"
            valor={
              <span
                className={
                  estadoPago === "Pagado"
                    ? "text-[#1f6b4a]"
                    : estadoPago === "Pago parcial"
                      ? "text-[#b36b1e]"
                      : "text-[#4d6079]"
                }
              >
                {estadoPago}
              </span>
            }
          />
        </div>
        <div className="mt-2 flex items-center justify-between gap-3 rounded-2xl border border-[#e9f0f8] bg-[#f7faff] p-4">
          <span className="text-[14px] font-medium text-[#4d6079]">Total pagado</span>
          <span className="text-[22px] font-extrabold tracking-tight text-[#0b1e33]">
            {formatearPrecio(pasaporte.monto_pagado ?? 0)}
          </span>
        </div>
        <p className="mt-2 text-[12px] text-[#7e8fa8]">
          {pasaporte.estado === "servicio_cerrado"
            ? "Factura disponible en tu correo registrado."
            : "Factura disponible al finalizar."}
        </p>
        <p className="mt-3 text-[13px] leading-5 text-[#4d6079]">{MENSAJES_CLAVE_UX.pago}</p>
        {pagos.length > 0 && (
          <div className="mt-4 flex flex-col gap-3">
            {pagos.map((pago, indice) => (
              <div
                key={pago.id}
                className="flex items-center justify-between gap-3 border-t border-[#f0f4fa] pt-3 text-[14px]"
              >
                <span className="text-[#1a293b]">
                  Pago {indice + 1} de {pagos.length} · {humanizar(pago.metodo) ?? pago.metodo}
                  {pago.momento ? ` · ${String(pago.momento).replaceAll("_", " ")}` : ""}
                </span>
                <span className="shrink-0 font-mono-ruum font-semibold text-[#0b1e33]">{formatearPrecio(pago.monto ?? 0)}</span>
              </div>
            ))}
            <p className="text-[12px] text-[#4d6079]" role="status">
              Total pagado {formatearPrecio(pasaporte.monto_pagado ?? 0)} de {formatearPrecio(precioBase)}.
              {saldoPendiente > 0 ? ` Restan ${formatearPrecio(saldoPendiente)}.` : " Sin saldo pendiente."}
            </p>
          </div>
        )}
        {pasaporte.estado === "cotizacion_generada" && pasaporte.precio_cotizado != null && (
          <div className="mt-4 rounded-2xl border border-[#FFC400]/40 bg-[#FFC400]/10 p-4">
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-[#FFC400] text-xs font-black text-slate-950">
                $
              </span>
              <p className="font-display text-sm font-bold text-white">Cotización lista para confirmación</p>
            </div>
            <p className="mt-2 font-body text-xs text-[#d7dce5]">
              El equipo operativo calculó la tarifa de tu traslado:{" "}
              <strong className="text-[#FFC400] font-bold text-sm">{formatearPrecio(pasaporte.precio_cotizado)}</strong>
              . Revisa los detalles y acéptala para continuar con la asignación del conductor.
            </p>
            <AceptarCotizacion trasladoId={pasaporte.traslado_id} tipoPago={pasaporte.tipo_pago ?? "anticipado"} />
          </div>
        )}
        {pasaporte.estado === "cotizacion_aceptada" && pasaporte.tipo_pago === "anticipado" && precioBase > 0 && (
          <div className="mt-4 rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4">
            <p className="font-display text-sm font-bold text-white">Cotización aceptada · Pago anticipado</p>
            <p className="mt-1 font-body text-xs text-[#d7dce5]">
              Para que nuestro equipo confirme y asigne un conductor certificado a tu traslado, completa el pago con
              tarjeta.
            </p>
            {traslado?.cotizacion_expira_en ? (
              <PagoRecuperable
                trasladoId={pasaporte.traslado_id}
                monto={precioBase}
                cotizacionExpiraEn={traslado.cotizacion_expira_en}
              />
            ) : (
              <PagoTraslado trasladoId={pasaporte.traslado_id} monto={precioBase} />
            )}
          </div>
        )}
        {pasaporte.estado === "pago_pendiente" && (
          <div className="mt-4">
            {precioBase > 0 ? (
              <div className="rounded-2xl border border-[#FFC400]/40 bg-[#FFC400]/10 p-4">
                <p className="font-display text-sm font-bold text-white">Pago pendiente del traslado</p>
                <p className="mt-1 font-body text-xs text-[#d7dce5]">
                  El servicio ha llegado a su destino. Completa el pago pendiente para finalizar el servicio.
                </p>
                <PagoTraslado trasladoId={pasaporte.traslado_id} monto={precioBase} />
              </div>
            ) : (
              <Aviso tono="atencion">
                Pago pendiente. El cobro al cierre se activará en cuanto operación confirme el precio final.
              </Aviso>
            )}
          </div>
        )}
      </TarjetaPasaporte>

      {/* 9. Contacto con soporte */}
      <TarjetaPasaporte id="soporte" titulo="Contacto con soporte">
        <EncabezadoTarjeta
          id="soporte"
          icono={
            <IconoTarjeta d="M4 13v-1a8 8 0 0 1 16 0v1M4 13a2 2 0 0 1 2-2h1v6H6a2 2 0 0 1-2-2v-2ZM20 13a2 2 0 0 0-2-2h-1v6h1a2 2 0 0 0 2-2v-2ZM17 17c0 2-1.8 3-4 3h-1" />
          }
          titulo="Contacto con soporte"
        />
        <Link
          href={soporteHref}
          className="flex items-center gap-3 rounded-2xl border-l-4 border-l-[#e8a23e] bg-[#fef7e8] p-3.5 text-[#4a3a22] transition-transform active:scale-[0.99]"
        >
          <span aria-hidden="true" className="shrink-0 text-[#b36b1e]">
            <IconoTarjeta
              d="M4 13v-1a8 8 0 0 1 16 0v1M4 13a2 2 0 0 1 2-2h1v6H6a2 2 0 0 1-2-2v-2ZM20 13a2 2 0 0 0-2-2h-1v6h1a2 2 0 0 0 2-2v-2ZM17 17c0 2-1.8 3-4 3h-1"
              className="size-5"
            />
          </span>
          <span className="flex-1">
            <span className="block text-[14px] font-bold">Soporte Ruum Ruum</span>
            <span className="block text-[12px] opacity-80">Atención 24/7 · Respuesta inmediata</span>
          </span>
          <span aria-hidden="true" className="shrink-0 text-[18px] font-bold">
            ›
          </span>
        </Link>
        <div className="mt-3 flex gap-2.5">
          <Link
            href={soporteHref}
            className="rounded-full bg-[#eef3fa] px-3 py-1.5 text-[11px] font-semibold text-[#2e5a88]"
          >
            Llamar
          </Link>
          <Link
            href={soporteHref}
            className="rounded-full bg-[#eef3fa] px-3 py-1.5 text-[11px] font-semibold text-[#2e5a88]"
          >
            Chat
          </Link>
        </div>
        <p className="mt-3 text-[13px] leading-5 text-[#4d6079]">{MENSAJES_CLAVE_UX.comunicacion}</p>
      </TarjetaPasaporte>

      {/* Barra inferior de acciones */}
      <div className="sticky bottom-[84px] z-20 flex gap-3 rounded-[20px] border border-[#eef2f7] bg-white/95 p-3 shadow-[0_-6px_18px_rgba(0,0,0,0.06)] backdrop-blur">
        <div className="flex flex-1 [&>*]:w-full [&_button]:min-h-[52px]">
          <ExportarPasaportePdf />
        </div>
        <CompartirPasaporte folio={folioCorto} />
      </div>
      </div>
    </main>
    </>
  );
}
