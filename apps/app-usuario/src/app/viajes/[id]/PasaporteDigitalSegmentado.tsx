"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { Aviso, EstadoBadge, Icono } from "@ruum/ui";
import { formatearPrecio } from "@ruum/shared/utils";
import { ETIQUETA_TIPO_INCIDENCIA, ETIQUETA_TIPO_VEHICULO, MENSAJES_CLAVE_UX } from "@ruum/shared/constants";
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
import type {
  Calificacion,
  Disputa,
  FotoEvidenciaVisual,
  Incidencia,
  Pago,
  Pasaporte,
  ReclamoSeguroUsuario,
} from "./tipos-pasaporte";
import type { Database } from "@ruum/shared/types";
import type { UbicacionTraslado } from "@ruum/api/services";
import {
  EncabezadoTarjeta,
  EvidenciaDurante,
  EvidenciaMomento,
  FilaInfo,
  LineaTiempoVisual,
  TarjetaPasaporte,
  calcularHorasDesdeCierre,
  formatoDuracion,
  formatoFecha,
  humanizar,
  IconoAuto,
  IconoTarjeta,
} from "./piezas-pasaporte";

import type { DatosTraslado } from "./obtenerDatosTraslado";

function IconoEscudoGnp({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function IconoPinTab({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7Z" />
      <circle cx="12" cy="10" r="2.6" />
    </svg>
  );
}

function IconoCamaraTab({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 8h3l2-2.5h6L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="13.5" r="3.2" />
    </svg>
  );
}

function IconoAutoTab({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 11 2 11.5 2 12v4c0 .6.4 1 1 1h2" />
      <circle cx="7" cy="17" r="2" />
      <path d="M9 17h6" />
      <circle cx="17" cy="17" r="2" />
    </svg>
  );
}

function IconoReciboTab({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 7h8M8 11h8M8 15h4" />
    </svg>
  );
}

function IconoChatAccion({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function IconoTelefonoAccion({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function IconoSosAccion({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 9v4M12 17h.01" />
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    </svg>
  );
}

export type PestanaPasaporte = "en_ruta" | "fotos" | "unidad" | "recibo";

export interface PasaporteDigitalSegmentadoProps {
  pasaporte: Pasaporte;
  traslado: DatosTraslado["traslado"];
  vehiculo: DatosTraslado["vehiculo"];
  conductor: DatosTraslado["conductor"];
  evidencia: FotoEvidenciaVisual[];
  incidencias: Incidencia[];
  disputas: Disputa[];
  reclamosSeguro: ReclamoSeguroUsuario[];
  calificacion: Calificacion | null;
  pagos: Pago[];
  ultimaUbicacion: UbicacionTraslado | null;
}

export function PasaporteDigitalSegmentado({
  pasaporte,
  traslado,
  vehiculo,
  conductor,
  evidencia,
  incidencias,
  disputas,
  reclamosSeguro,
  calificacion,
  pagos,
  ultimaUbicacion,
}: PasaporteDigitalSegmentadoProps) {
  const [chatAbierto, setChatAbierto] = useState(false);
  const tablistId = useId();

  const estado: Database["public"]["Enums"]["estado_traslado"] =
    pasaporte.estado ?? "solicitud_creada";
  const trasladoId = pasaporte.traslado_id ?? "";

  // Determinar pestaña inicial según el estado del traslado
  const esViajeCerrado = [
    "servicio_cerrado",
    "entrega_confirmada",
    "pago_completado",
    "reclamo_resuelto",
    "disputa_resuelta",
    "servicio_cancelado",
    "traslado_fallido",
  ].includes(estado);

  const [pestanaActiva, setPestanaActiva] = useState<PestanaPasaporte>(
    esViajeCerrado ? "fotos" : "en_ruta"
  );

  // Cálculos de datos
  const evidenciaInicial = evidencia.filter((foto) => foto.tipo === "inicial");
  const evidenciaFinal = evidencia.filter((foto) => foto.tipo === "final");
  const precioBase = pasaporte.precio_final ?? pasaporte.precio_cotizado ?? 0;
  const vehiculoNombre = [pasaporte.vehiculo_marca, pasaporte.vehiculo_modelo, pasaporte.vehiculo_anio]
    .filter(Boolean)
    .join(" ");
  const horasDesdeCierre = calcularHorasDesdeCierre(pasaporte.actualizado_en);
  const dentroDeVentanaPostCierre = horasDesdeCierre <= 72;
  const mostrarPromptCalificacion =
    estado === "servicio_cerrado" &&
    !calificacion &&
    Boolean(pasaporte.conductor_id) &&
    dentroDeVentanaPostCierre;
  const puedeAbrirDisputa =
    ["servicio_cerrado", "reclamo_resuelto", "cierre_operativo_con_incidencia_abierta"].includes(
      estado
    ) && dentroDeVentanaPostCierre;

  const folioCorto = `#RR-${trasladoId.slice(0, 4).toUpperCase()}`;
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
  const totalPagosCompletados = pagos
    .filter((p) => p.estado === "completado")
    .reduce((sum, p) => sum + (p.monto ?? 0), 0);

  const totalPagado = Math.max(pasaporte.monto_pagado ?? 0, totalPagosCompletados);

  const estadosPostPagoConfirmado: Database["public"]["Enums"]["estado_traslado"][] = [
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
    "pago_completado",
    "servicio_cerrado",
  ];

  const pagoRealizado =
    totalPagado > 0 ||
    pagos.some((p) => p.estado === "completado") ||
    estadosPostPagoConfirmado.includes(estado);

  const montoMostrado = pagoRealizado && totalPagado === 0 && precioBase > 0 ? precioBase : totalPagado;
  const saldoPendiente = Math.max(0, precioBase - montoMostrado);

  const estadoPago =
    pagoRealizado || (precioBase > 0 && montoMostrado >= precioBase)
      ? "Pagado"
      : montoMostrado > 0
        ? "Pago parcial"
        : "Pendiente";
  const soporteHref = `/soporte?viaje=${trasladoId}`;

  const tieneConductor = Boolean(nombreConductor && pasaporte.conductor_id);

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-4 sm:py-8 pb-32 flex flex-col gap-4">
      {/* Cabecera compacta con botón atrás y compartir */}
      <div className="flex items-center gap-3.5 rounded-2xl border border-[#e6edf6] bg-white px-3 py-3 dark:border-[#1a3a5c] dark:bg-[#0a2342]">
        <Link
          href="/mis-viajes"
          aria-label="Volver a mis traslados"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#edf4fe] text-[#0a2342] transition-colors hover:bg-[#dbe7f6] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#104ca0] dark:bg-[#0f2d52] dark:text-[#f6f8fb]"
        >
          <Icono nombre="atras" className="size-[18px]" strokeWidth={2} />
        </Link>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#104ca0] dark:text-[#6ba8ff]">Pasaporte Oficial</p>
          <h1 className="text-[18px] font-bold tracking-tight text-[#0a2342] leading-snug dark:text-[#f6f8fb]">Pasaporte Digital</h1>
        </div>
        <div className="ml-auto shrink-0">
          <CompartirPasaporte folio={folioCorto} variante="cabecera" />
        </div>
      </div>

      {/* HERO CARD: "Credencial Oficial del Traslado" */}
      <section
        aria-label="Credencial del Pasaporte Digital"
        className="relative overflow-hidden rounded-[26px] bg-[#0a2342] p-5 text-white shadow-[0_16px_32px_-12px_rgba(10,35,66,0.4)] dark:border dark:border-[#1a3a5c] dark:bg-[#061529]"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <EstadoBadge estado={estado} />
            <span className="rounded-full bg-white/10 px-2.5 py-0.5 font-mono text-[11px] font-semibold tracking-wider text-white/90">
              {folioCorto}
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 border border-amber-400/40 px-2.5 py-0.5 text-[11px] font-bold text-amber-200">
            <IconoEscudoGnp /> Cobertura GNP
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-[20px] font-extrabold tracking-tight text-white leading-snug">
              {vehiculoNombre || "Vehículo registrado"}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-white/80">
              {placasVehiculo && (
                <span className="rounded bg-white/15 px-2 py-0.5 font-mono font-bold tracking-wider text-white">
                  {placasVehiculo}
                </span>
              )}
              {colorVehiculo && <span>· {colorVehiculo}</span>}
              {tipoVehiculoEtiqueta && <span>· {tipoVehiculoEtiqueta}</span>}
            </div>
          </div>
          <div
            aria-hidden="true"
            className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 border border-white/10 text-white shadow-inner"
          >
            <IconoAuto />
          </div>
        </div>

        {/* Resumen de trayecto */}
        <div className="mt-4 flex items-center justify-between border-t border-white/15 pt-3.5 text-[12.5px] font-semibold text-white/90">
          <div className="flex items-center gap-1.5 min-w-0 max-w-[44%]">
            <span className="size-2 rounded-full bg-[#4ade80] shrink-0" aria-hidden="true" />
            <span className="truncate">{pasaporte.origen_ciudad ?? "Origen"}</span>
          </div>
          <span className="shrink-0 text-[11px] font-medium text-white/60">
            {distanciaTexto ? `→ ${distanciaTexto} →` : "→"}
          </span>
          <div className="flex items-center justify-end gap-1.5 min-w-0 max-w-[44%]">
            <span className="truncate">{pasaporte.destino_ciudad ?? "Destino"}</span>
            <span className="size-2 rounded-full bg-[#f59e0b] shrink-0" aria-hidden="true" />
          </div>
        </div>
      </section>

      {/* Avisos relevantes */}
      {pasaporte.tiene_incidencia_abierta && (
        <Aviso tono="atencion">
          Este traslado tiene una incidencia abierta. Nuestro equipo te mantendrá informado.
        </Aviso>
      )}
      {pasaporte.estado === "servicio_cerrado" && (
        <Aviso tono="info">{MENSAJES_CLAVE_UX.cierre}</Aviso>
      )}

      {/* SEGMENTED CONTROL: 4 Pestañas Móviles Ergonómicas */}
      <div
        id={tablistId}
        role="tablist"
        aria-label="Pestañas del Pasaporte Digital"
        className="sticky top-2 z-30 grid grid-cols-4 gap-1.5 rounded-2xl border border-[#e6edf6] bg-white/95 p-1.5 shadow-sm backdrop-blur-md dark:border-[#1a3a5c] dark:bg-[#0f2d52]/90"
      >
        <button
          type="button"
          role="tab"
          id="tab-en_ruta"
          aria-selected={pestanaActiva === "en_ruta"}
          aria-controls="panel-en_ruta"
          onClick={() => setPestanaActiva("en_ruta")}
          className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 px-1 text-center transition-all cursor-pointer ${
            pestanaActiva === "en_ruta"
              ? "bg-[#0a2342] text-white shadow-xs font-bold dark:bg-[#4d94ff] dark:text-[#061529]"
              : "text-[#4e5f80] hover:text-[#0a2342] font-semibold dark:text-[#a8b5cc] dark:hover:text-[#f6f8fb]"
          }`}
        >
          <IconoPinTab />
          <span className="text-[11.5px] leading-tight">En Ruta</span>
        </button>

        <button
          type="button"
          role="tab"
          id="tab-fotos"
          aria-selected={pestanaActiva === "fotos"}
          aria-controls="panel-fotos"
          onClick={() => setPestanaActiva("fotos")}
          className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 px-1 text-center transition-all cursor-pointer ${
            pestanaActiva === "fotos"
              ? "bg-[#0a2342] text-white shadow-xs font-bold dark:bg-[#4d94ff] dark:text-[#061529]"
              : "text-[#4e5f80] hover:text-[#0a2342] font-semibold dark:text-[#a8b5cc] dark:hover:text-[#f6f8fb]"
          }`}
        >
          <IconoCamaraTab />
          <span className="text-[11.5px] leading-tight">Fotos</span>
        </button>

        <button
          type="button"
          role="tab"
          id="tab-unidad"
          aria-selected={pestanaActiva === "unidad"}
          aria-controls="panel-unidad"
          onClick={() => setPestanaActiva("unidad")}
          className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 px-1 text-center transition-all cursor-pointer ${
            pestanaActiva === "unidad"
              ? "bg-[#0a2342] text-white shadow-xs font-bold dark:bg-[#4d94ff] dark:text-[#061529]"
              : "text-[#4e5f80] hover:text-[#0a2342] font-semibold dark:text-[#a8b5cc] dark:hover:text-[#f6f8fb]"
          }`}
        >
          <IconoAutoTab />
          <span className="text-[11.5px] leading-tight">Unidad</span>
        </button>

        <button
          type="button"
          role="tab"
          id="tab-recibo"
          aria-selected={pestanaActiva === "recibo"}
          aria-controls="panel-recibo"
          onClick={() => setPestanaActiva("recibo")}
          className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 px-1 text-center transition-all cursor-pointer ${
            pestanaActiva === "recibo"
              ? "bg-[#0a2342] text-white shadow-xs font-bold dark:bg-[#4d94ff] dark:text-[#061529]"
              : "text-[#4e5f80] hover:text-[#0a2342] font-semibold dark:text-[#a8b5cc] dark:hover:text-[#f6f8fb]"
          }`}
        >
          <IconoReciboTab />
          <span className="text-[11.5px] leading-tight">Recibo</span>
        </button>
      </div>

      {/* ========================================================
          PESTAÑA 1: EN RUTA & CONDUCTOR
          ======================================================== */}
      {pestanaActiva === "en_ruta" && (
        <div id="panel-en_ruta" role="tabpanel" aria-labelledby="tab-en_ruta" className="flex flex-col gap-4">
          {/* Conductor asignado con botones directos de Chat y Llamada */}
          <TarjetaPasaporte id="conductor" titulo="Conductor asignado">
            <EncabezadoTarjeta
              id="conductor"
              icono={
                <IconoTarjeta d="M12 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM5 20c0-3.9 3.1-7 7-7s7 3.1 7 7M16 11l2 2 4-4" />
              }
              titulo="Conductor asignado"
            />
            {nombreConductor ? (
              <div className="rounded-[20px] border border-[#e6edf6] bg-[#f8fafd] p-4 dark:border-[#1a3a5c] dark:bg-[#061529]/60">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5 min-w-0">
                    {conductor?.foto_perfil_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={conductor.foto_perfil_url}
                        alt={`Fotografía de ${nombreConductor}`}
                        className="size-14 shrink-0 rounded-full border-2 border-white object-cover shadow-sm"
                      />
                    ) : (
                      <span
                        aria-hidden="true"
                        className="flex size-14 shrink-0 items-center justify-center rounded-full border-2 border-white bg-[#edf4fe] text-[18px] font-bold text-[#104ca0] shadow-sm dark:bg-[#0f2d52] dark:text-[#6ba8ff]"
                      >
                        {iniciales(nombreConductor)}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-[16px] font-bold text-[#0a2342] dark:text-[#f6f8fb]">{nombreConductor}</p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-[#4e5f80] dark:text-[#a8b5cc]">
                        <span className="inline-flex items-center rounded-full bg-[#e9f3ee] px-2 py-0.5 font-semibold text-[#08705f] dark:bg-[#0a2e1f] dark:text-[#4dd9a3]">
                          {humanizar(conductor?.nivel_operativo_vigente ?? pasaporte.conductor_nivel) ?? "Certificado"}
                        </span>
                        {calificacionConductor != null && (
                          <span className="font-semibold text-[#0a2342] dark:text-[#f6f8fb]">
                            ★ {Number(calificacionConductor).toFixed(1)}
                          </span>
                        )}
                        <span>· ID: {(conductor?.id ?? pasaporte.conductor_id ?? "").slice(0, 8).toUpperCase()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Acciones directas con el conductor */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setChatAbierto((prev) => !prev)}
                      aria-label="Abrir o cerrar chat con el conductor"
                      className={`flex size-10 items-center justify-center rounded-xl border text-[15px] transition-transform active:scale-95 cursor-pointer ${
                        chatAbierto
                          ? "bg-[#0a2342] text-white border-[#0a2342] dark:bg-[#4d94ff] dark:text-[#061529]"
                          : "bg-white text-[#0a2342] border-[#d7e4f2] hover:bg-[#eef3fa] dark:bg-[#0a2342] dark:text-[#f6f8fb] dark:border-[#2d4f73]"
                      }`}
                    >
                      <IconoChatAccion />
                    </button>
                    <Link
                      href={soporteHref}
                      aria-label="Llamar al conductor vía soporte enmascarado"
                      className="flex size-10 items-center justify-center rounded-xl border border-emerald-200 bg-white text-emerald-700 transition-transform active:scale-95 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                    >
                      <IconoTelefonoAccion />
                    </Link>
                  </div>
                </div>

                {pasaporte.conductor_id && (
                  <p className="mt-2.5 text-[11.5px] leading-relaxed text-[#4e5f80] dark:text-[#a8b5cc]">
                    {MENSAJES_CLAVE_UX.conductor_asignado}
                  </p>
                )}
              </div>
            ) : (
              <div className="rounded-[20px] border border-dashed border-[#e6edf6] bg-[#f8fafd] p-4 text-center dark:border-[#1a3a5c] dark:bg-[#061529]/60">
                <p className="text-[14px] font-bold text-[#0a2342] dark:text-[#f6f8fb]">Por asignar</p>
                <p className="mt-1 text-[12px] text-[#4e5f80] dark:text-[#a8b5cc]">
                  Te notificaremos en cuanto un conductor certificado tome tu traslado.
                </p>
              </div>
            )}

            {/* Panel de Chat desplegable */}
            {(chatAbierto || !tieneConductor) && (
              <div id="chat-conductor" className="mt-3 scroll-mt-28">
                <ChatTraslado trasladoId={trasladoId} estado={estado} />
              </div>
            )}
          </TarjetaPasaporte>

          {/* Seguimiento de Ruta en tiempo real */}
          <TarjetaPasaporte id="ruta" titulo="Ruta del traslado">
            <EncabezadoTarjeta
              id="ruta"
              icono={
                <IconoTarjeta d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11Z M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
              }
              titulo="Ruta del traslado"
            />
            <SeguimientoTrasladoTiempoReal
              trasladoId={trasladoId}
              estado={estado}
              origen={{ lat: pasaporte.origen_lat, lng: pasaporte.origen_lng }}
              destino={{ lat: pasaporte.destino_lat, lng: pasaporte.destino_lng }}
              ubicacionInicial={ultimaUbicacion}
            />

            <div className="mt-4 flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#e9f3ee] text-[#08705f] dark:bg-[#0a2e1f] dark:text-[#4dd9a3]"
                >
                  <IconoTarjeta d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11Z" className="size-3" />
                </span>
                <p className="text-[14px] font-medium text-[#0a2342] dark:text-[#f6f8fb]">
                  {traslado?.origen_ciudad ?? pasaporte.origen_ciudad ?? "Origen pendiente"}
                  <small className="mt-0.5 block text-[12px] font-normal text-[#4e5f80] dark:text-[#a8b5cc]">
                    {traslado?.origen_direccion ?? pasaporte.origen_direccion ?? "Dirección registrada"}
                  </small>
                </p>
              </div>
              <div aria-hidden="true" className="ml-[11px] h-4 w-0 border-l-2 border-dashed border-[#cbd7e6] dark:border-[#1a3a5c]" />
              <div className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#fef4e6] text-[#765100] dark:bg-[#3d2e00] dark:text-[#ffc933]"
                >
                  <IconoTarjeta d="M5 21V4m0 1h12l-2.5 4L17 13H5" className="size-3" />
                </span>
                <p className="text-[14px] font-medium text-[#0a2342] dark:text-[#f6f8fb]">
                  {traslado?.destino_ciudad ?? pasaporte.destino_ciudad ?? "Destino pendiente"}
                  <small className="mt-0.5 block text-[12px] font-normal text-[#4e5f80] dark:text-[#a8b5cc]">
                    {traslado?.destino_direccion ?? pasaporte.destino_direccion ?? "Dirección registrada"}
                  </small>
                </p>
              </div>
            </div>

            {(duracionEstimada || distanciaTexto) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {duracionEstimada && (
                  <span className="rounded-full bg-[#edf4fe] px-3 py-1 text-[11px] font-semibold text-[#104ca0] dark:bg-[#0f2d52] dark:text-[#6ba8ff]">
                    Tiempo estimado: {duracionEstimada}
                  </span>
                )}
                {distanciaTexto && (
                  <span className="rounded-full bg-[#edf4fe] px-3 py-1 text-[11px] font-semibold text-[#104ca0] dark:bg-[#0f2d52] dark:text-[#6ba8ff]">
                    Distancia: {distanciaTexto}
                  </span>
                )}
              </div>
            )}
          </TarjetaPasaporte>

          {/* Línea de tiempo visual */}
          <TarjetaPasaporte id="linea-tiempo" titulo="Línea de tiempo">
            <EncabezadoTarjeta
              id="linea-tiempo"
              icono={<IconoTarjeta d="M4 6h16M4 12h16M4 18h10M18 16.5a2.5 2.5 0 1 0 0 .01" />}
              titulo="Progreso del servicio"
            />
            <LineaTiempoVisual
              estadoActual={estado}
              pagoRealizado={pagoRealizado}
              tieneConductor={tieneConductor}
            />
          </TarjetaPasaporte>

          {mostrarPromptCalificacion && (
            <section id="calificacion" aria-label="Califica tu traslado" className="scroll-mt-28">
              <CalificarTraslado
                trasladoId={trasladoId}
                conductorId={pasaporte.conductor_id}
                mostrar={mostrarPromptCalificacion}
              />
            </section>
          )}
        </div>
      )}

      {/* ========================================================
          PESTAÑA 2: FOTOS Y EVIDENCIA 360°
          ======================================================== */}
      {pestanaActiva === "fotos" && (
        <div id="panel-fotos" role="tabpanel" aria-labelledby="tab-fotos" className="flex flex-col gap-4">
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
                descripcion="Fotos finales exteriores e interiores, kilometraje y combustible final, confirmación de entrega y observaciones finales."
                fotos={evidenciaFinal}
              />
            </div>
          </TarjetaPasaporte>

          {/* Reportes e incidencias */}
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
                  <li key={incidencia.id} className="rounded-2xl border border-[#e6edf6] px-4 py-3 dark:border-[#1a3a5c]">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-[14px] font-semibold text-[#0a2342] dark:text-[#f6f8fb]">
                        {ETIQUETA_TIPO_INCIDENCIA[incidencia.tipo]}
                      </p>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                          incidencia.resuelta
                            ? "bg-[#e9f3ee] text-[#08705f] dark:bg-[#0a2e1f] dark:text-[#4dd9a3]"
                            : "bg-[#fef4e6] text-[#765100] dark:bg-[#3d2e00] dark:text-[#ffc933]"
                        }`}
                      >
                        {incidencia.resuelta ? "Resuelta" : "Abierta"}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[13px] text-[#4e5f80] dark:text-[#a8b5cc]">{incidencia.descripcion}</p>
                    <p className="mt-1.5 text-[11px] text-[#4e5f80] dark:text-[#a8b5cc]">
                      {incidencia.momento ? String(incidencia.momento).replaceAll("_", " ") : "Traslado"} ·{" "}
                      {formatoFecha(incidencia.creada_en)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mb-4 flex items-center gap-2.5 text-[14px] text-[#4e5f80] dark:text-[#a8b5cc]">
                <span
                  aria-hidden="true"
                  className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#e9f3ee] text-[#08705f] dark:bg-[#0a2e1f] dark:text-[#4dd9a3]"
                >
                  <IconoTarjeta d="m5 12.5 4.5 4.5L19 7.5" className="size-3.5" />
                </span>
                Sin incidencias reportadas
              </p>
            )}

            <div className="flex flex-col gap-3">
              <ReportarIncidenciaUsuario trasladoId={trasladoId} />
              <CancelarTraslado
                trasladoId={trasladoId}
                estado={estado}
                precio={precioBase}
                fechaProgramada={traslado?.fecha_hora_programada ?? null}
                conductorAsignado={Boolean(pasaporte.conductor_id)}
              />
              <AbrirDisputa trasladoId={trasladoId} disponible={puedeAbrirDisputa} />
            </div>

            {(disputas.length > 0 || reclamosSeguro.length > 0) && (
              <div className="mt-4 flex flex-col gap-2.5 border-t border-[#e6edf6] pt-4 dark:border-[#1a3a5c]">
                {disputas.map((disputa) => (
                  <div key={disputa.id} className="rounded-2xl border border-[#e6edf6] px-4 py-3 dark:border-[#1a3a5c]">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-[14px] font-semibold text-[#0a2342] dark:text-[#f6f8fb]">
                        {disputa.tipo ? String(disputa.tipo).replaceAll("_", " ") : "Disputa"}
                      </p>
                      <span className="shrink-0 text-[11px] text-[#4e5f80] dark:text-[#a8b5cc]">
                        {disputa.estado ? String(disputa.estado).replaceAll("_", " ") : ""}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[13px] text-[#4e5f80] dark:text-[#a8b5cc]">{disputa.descripcion}</p>
                    {disputa.resolucion && (
                      <p className="mt-1.5 text-[13px] text-[#08705f] dark:text-[#4dd9a3]">
                        Resolución: {String(disputa.resolucion).replaceAll("_", " ")}
                        {disputa.resolucion_detalle ? ` · ${disputa.resolucion_detalle}` : ""}
                      </p>
                    )}
                  </div>
                ))}
                {reclamosSeguro.map((reclamo) => (
                  <div key={reclamo.id} className="rounded-2xl border border-[#e6edf6] px-4 py-3 dark:border-[#1a3a5c]">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-[14px] font-semibold text-[#0a2342] dark:text-[#f6f8fb]">Reclamo de seguro</p>
                      <span className="shrink-0 text-[11px] text-[#4e5f80] dark:text-[#a8b5cc]">
                        {reclamo.estado ? String(reclamo.estado).replaceAll("_", " ") : ""}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[13px] text-[#4e5f80] dark:text-[#a8b5cc]">
                      Abierto {formatoFecha(reclamo.abierto_en)}
                      {reclamo.resuelto_en ? ` · Resuelto ${formatoFecha(reclamo.resuelto_en)}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </TarjetaPasaporte>
        </div>
      )}

      {/* ========================================================
          PESTAÑA 3: VEHÍCULO & DETALLES
          ======================================================== */}
      {pestanaActiva === "unidad" && (
        <div id="panel-unidad" role="tabpanel" aria-labelledby="tab-unidad" className="flex flex-col gap-4">
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
                className="flex size-20 shrink-0 items-center justify-center rounded-2xl border-2 border-white bg-[#edf4fe] text-[#104ca0] shadow-sm dark:bg-[#0f2d52] dark:text-[#6ba8ff]"
              >
                <IconoAuto />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[18px] font-bold text-[#0a2342] dark:text-[#f6f8fb]">{vehiculoNombre || "Vehículo"}</p>
                {tipoVehiculoEtiqueta && (
                  <p className="mt-0.5 text-[12px] font-medium text-[#4e5f80] dark:text-[#a8b5cc]">{tipoVehiculoEtiqueta}</p>
                )}
                {placasVehiculo && (
                  <p className="mt-1.5 inline-block rounded-full bg-[#edf4fe] px-3 py-1 text-[13px] font-semibold tracking-wider text-[#0a2342] dark:bg-[#0f2d52] dark:text-[#f6f8fb]">
                    {placasVehiculo}
                  </p>
                )}
                <p className="mt-1.5 truncate text-[12px] text-[#4e5f80] dark:text-[#a8b5cc]">
                  VIN: {vinVehiculo ?? "pendiente de registro"}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <FilaInfo etiqueta="Color" valor={colorVehiculo} />
              <FilaInfo etiqueta="Transmisión" valor={transmisionVehiculo} />
              <FilaInfo etiqueta="Condición declarada" valor={condicionVehiculo} />
            </div>
          </TarjetaPasaporte>

          <TarjetaPasaporte id="info-traslado" titulo="Información del traslado">
            <EncabezadoTarjeta
              id="info-traslado"
              icono={
                <IconoTarjeta d="M8 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M9 5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V5ZM9 12h6M9 16h4" />
              }
              titulo="Parámetros operativos"
            />
            <div className="flex flex-col gap-3">
              <FilaInfo etiqueta="Tipo de servicio" valor={tipoServicio} />
              <FilaInfo etiqueta="Ventana recolección" valor={ventanaRecoleccion} />
              <FilaInfo etiqueta="Ventana entrega" valor={ventanaEntrega} />
              <FilaInfo etiqueta="Motivo" valor={motivoServicio} />
            </div>
          </TarjetaPasaporte>

          {(traslado?.contacto_entrega_nombre || traslado?.contacto_recepcion_nombre) && (
            <TarjetaPasaporte id="contactos" titulo="Contactos en punto">
              <EncabezadoTarjeta
                id="contactos"
                icono={<IconoTarjeta d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />}
                titulo="Contactos autorizados"
              />
              <div className="flex flex-col gap-3">
                {traslado?.contacto_entrega_nombre && (
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-[#e6edf6] bg-[#f8fafd] p-3 text-[13px] dark:border-[#1a3a5c] dark:bg-[#061529]/60">
                    <div>
                      <span className="block text-[10.5px] font-bold uppercase tracking-wider text-[#08705f] dark:text-[#4dd9a3]">
                        Entrega en origen
                      </span>
                      <span className="font-bold text-[#0a2342] dark:text-[#f6f8fb]">{traslado.contacto_entrega_nombre}</span>
                      {traslado.contacto_entrega_telefono && (
                        <span className="block text-[12px] text-[#4e5f80] dark:text-[#a8b5cc]">{traslado.contacto_entrega_telefono}</span>
                      )}
                    </div>
                    {traslado.contacto_entrega_telefono && (
                      <a
                        href={`tel:${traslado.contacto_entrega_telefono}`}
                        aria-label={`Llamar a ${traslado.contacto_entrega_nombre}`}
                        className="flex size-9 items-center justify-center rounded-xl bg-white text-emerald-700 border border-emerald-200 shadow-sm active:scale-95 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      >
                        <IconoTelefonoAccion className="size-3.5" />
                      </a>
                    )}
                  </div>
                )}
                {traslado?.contacto_recepcion_nombre && (
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-[#eef2f7] bg-[#f8fafd] p-3 text-[13px] dark:border-[#1a3a5c] dark:bg-[#061529]/60">
                    <div>
                      <span className="block text-[10.5px] font-bold uppercase tracking-wider text-[#b36b1e]">
                        Recibe en destino
                      </span>
                      <span className="font-bold text-[#0a2342] dark:text-[#f6f8fb]">{traslado.contacto_recepcion_nombre}</span>
                      {traslado.contacto_recepcion_telefono && (
                        <span className="block text-[12px] text-[#4e5f80] dark:text-[#a8b5cc]">{traslado.contacto_recepcion_telefono}</span>
                      )}
                    </div>
                    {traslado.contacto_recepcion_telefono && (
                      <a
                        href={`tel:${traslado.contacto_recepcion_telefono}`}
                        aria-label={`Llamar a ${traslado.contacto_recepcion_nombre}`}
                        className="flex size-9 items-center justify-center rounded-xl bg-white text-amber-700 border border-amber-200 shadow-sm active:scale-95 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      >
                        <IconoTelefonoAccion className="size-3.5" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </TarjetaPasaporte>
          )}
        </div>
      )}

      {/* ========================================================
          PESTAÑA 4: RECIBO & FACTURACIÓN
          ======================================================== */}
      {pestanaActiva === "recibo" && (
        <div id="panel-recibo" role="tabpanel" aria-labelledby="tab-recibo" className="flex flex-col gap-4">
          <TarjetaPasaporte id="pago" titulo="Información de pago">
            <EncabezadoTarjeta
              id="pago"
              icono={
                <IconoTarjeta d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7ZM3 10h18M7 15h4" />
              }
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
                        ? "text-[#08705f] font-bold dark:text-[#4dd9a3]"
                        : estadoPago === "Pago parcial"
                          ? "text-[#765100] font-bold dark:text-[#ffc933]"
                          : "text-[#4e5f80] font-bold dark:text-[#a8b5cc]"
                    }
                  >
                    {estadoPago}
                  </span>
                }
              />
            </div>
            <div className="mt-2 flex items-center justify-between gap-3 rounded-2xl border border-[#e6edf6] bg-[#f8fafd] p-4 dark:border-[#1a3a5c] dark:bg-[#061529]/60">
              <span className="text-[14px] font-medium text-[#4e5f80] dark:text-[#a8b5cc]">Total pagado</span>
              <span className="text-[22px] font-extrabold tracking-tight text-[#0a2342] dark:text-[#f6f8fb]">
                {formatearPrecio(montoMostrado)}
              </span>
            </div>
            <p className="mt-2 text-[12px] text-[#4e5f80] dark:text-[#a8b5cc]">
              {pasaporte.estado === "servicio_cerrado"
                ? "Factura disponible en tu correo registrado."
                : "Factura disponible al finalizar el traslado."}
            </p>
            <p className="mt-3 text-[13px] leading-5 text-[#4e5f80] dark:text-[#a8b5cc]">{MENSAJES_CLAVE_UX.pago}</p>

            {pagos.length > 0 && (
              <div className="mt-4 flex flex-col gap-3">
                {pagos.map((pago, indice) => (
                  <div
                    key={pago.id}
                    className="flex items-center justify-between gap-3 border-t border-[#e6edf6] pt-3 text-[14px] dark:border-[#1a3a5c]"
                  >
                    <span className="text-[#0a2342] dark:text-[#f6f8fb]">
                      Pago {indice + 1} de {pagos.length} · {humanizar(pago.metodo) ?? pago.metodo}
                      {pago.momento ? ` · ${String(pago.momento).replaceAll("_", " ")}` : ""}
                    </span>
                    <span className="shrink-0 font-mono-ruum font-semibold text-[#0a2342] dark:text-[#f6f8fb]">
                      {formatearPrecio(pago.monto ?? 0)}
                    </span>
                  </div>
                ))}
                <p className="text-[12px] text-[#4e5f80] dark:text-[#a8b5cc]" role="status">
                  Total pagado {formatearPrecio(montoMostrado)} de {formatearPrecio(precioBase)}.
                  {saldoPendiente > 0 ? ` Restan ${formatearPrecio(saldoPendiente)}.` : " Sin saldo pendiente."}
                </p>
              </div>
            )}

            {pagoRealizado && (
              <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-[#e9f3ee] p-4 text-[#08705f] dark:border-emerald-800 dark:bg-[#0a2e1f]/60 dark:text-[#4dd9a3]">
                <div className="flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-full bg-[#08705f] text-xs font-bold text-white dark:bg-[#4dd9a3] dark:text-[#061529]">
                    ✓
                  </span>
                  <p className="text-sm font-bold text-[#0a2342] dark:text-[#f6f8fb]">Pago registrado con éxito</p>
                </div>
                <p className="mt-1 text-xs text-[#4e5f80] dark:text-[#a8b5cc]">
                  Tu pago de {formatearPrecio(montoMostrado || precioBase)} fue procesado correctamente a través de Stripe. No tienes saldo pendiente.
                </p>
              </div>
            )}

            {pasaporte.estado === "cotizacion_generada" && !pagoRealizado && pasaporte.precio_cotizado != null && (
              <div className="mt-4 rounded-2xl border border-[#FFC400]/40 bg-[#FFC400]/10 p-4">
                <div className="flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-full bg-[#FFC400] text-xs font-black text-slate-950">
                    $
                  </span>
                  <p className="font-display text-sm font-bold text-slate-900">Cotización lista para confirmación</p>
                </div>
                <p className="mt-2 font-body text-xs text-slate-800">
                  El equipo operativo calculó la tarifa de tu traslado:{" "}
                  <strong className="text-slate-950 font-bold text-sm">
                    {formatearPrecio(pasaporte.precio_cotizado)}
                  </strong>
                  . Revisa los detalles y acéptala para continuar.
                </p>
                <AceptarCotizacion
                  trasladoId={trasladoId}
                  tipoPago={pasaporte.tipo_pago ?? "anticipado"}
                />
              </div>
            )}

            {pasaporte.estado === "cotizacion_aceptada" &&
              !pagoRealizado &&
              pasaporte.tipo_pago === "anticipado" &&
              precioBase > 0 && (
                <div className="mt-4 rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4">
                  <p className="font-display text-sm font-bold text-slate-900">
                    Cotización aceptada · Pago anticipado
                  </p>
                  <p className="mt-1 font-body text-xs text-slate-700">
                    Para asignar un conductor certificado a tu traslado, completa el pago con tarjeta seguro.
                  </p>
                  {traslado?.cotizacion_expira_en ? (
                    <PagoRecuperable
                      trasladoId={trasladoId}
                      monto={precioBase}
                      cotizacionExpiraEn={traslado.cotizacion_expira_en}
                    />
                  ) : (
                    <PagoTraslado trasladoId={trasladoId} monto={precioBase} />
                  )}
                </div>
              )}

            {pasaporte.estado === "pago_pendiente" && !pagoRealizado && (
              <div className="mt-4">
                {precioBase > 0 ? (
                  <div className="rounded-2xl border border-[#FFC400]/40 bg-[#FFC400]/10 p-4">
                    <p className="font-display text-sm font-bold text-slate-900">Pago pendiente del traslado</p>
                    <p className="mt-1 font-body text-xs text-slate-700">
                      El servicio ha llegado a su destino. Completa el pago pendiente para finalizar el servicio.
                    </p>
                    <PagoTraslado trasladoId={trasladoId} monto={precioBase} />
                  </div>
                ) : (
                  <Aviso tono="atencion">
                    Pago pendiente. El cobro al cierre se activará en cuanto operación confirme el precio final.
                  </Aviso>
                )}
              </div>
            )}
          </TarjetaPasaporte>

          {/* Cobertura GNP y Legal */}
          <div className="rounded-2xl border border-[#c8e6d8] bg-[#e9f3ee] p-4 text-[12.5px] leading-relaxed text-[#1a4a34] dark:border-[#135939] dark:bg-[#0a2e1f]/70 dark:text-[#a8b5cc]">
            <p className="font-bold flex items-center gap-1.5 text-[#08705f] dark:text-[#4dd9a3]">
              <IconoEscudoGnp /> Cobertura de Traslado Respaldada por GNP
            </p>
            <p className="mt-1 text-[12px] text-[#4e5f80] dark:text-[#a8b5cc]">
              Póliza integral activa durante todo el recorrido oficial documentado. Cualquier reclamación queda
              respaldada mediante el reporte inmutable del Pasaporte Digital.
            </p>
          </div>

          {/* Exportar PDF oficial */}
          <div className="mt-2 [&>*]:w-full [&_button]:min-h-[52px]">
            <ExportarPasaportePdf />
          </div>
        </div>
      )}

      {/* FLOATING ACTION DOCK (Pulgar inferior ergonómico) */}
      <div className="sticky bottom-6 z-20 flex items-center gap-2.5 rounded-2xl border border-[#e6edf6] bg-white/95 p-3 shadow-[0_8px_24px_rgba(10,35,66,0.12)] backdrop-blur dark:border-[#1a3a5c] dark:bg-[#0a2342]/95">
        <Link
          href={soporteHref}
          className="flex-1 inline-flex min-h-[48px] items-center justify-center gap-1.5 rounded-xl border border-[#d7e1ee] bg-[#f8fafd] px-3 font-body text-[12.5px] font-bold text-[#0a2342] transition-transform active:scale-95 hover:bg-[#f0f5fe] dark:border-[#2d4f73] dark:bg-[#0f2d52] dark:text-[#f6f8fb]"
        >
          <IconoSosAccion className="text-amber-600 dark:text-amber-400" />
          <span>Asistencia 24/7</span>
        </Link>
        <div className="flex-1 [&>*]:w-full [&_button]:min-h-[48px]">
          <CompartirPasaporte folio={folioCorto} />
        </div>
      </div>
    </div>
  );
}
