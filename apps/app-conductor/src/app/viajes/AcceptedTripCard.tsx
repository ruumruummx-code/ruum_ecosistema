"use client";
import { Card } from "@ruum/ui/base";

import { Button as BaseButton } from "@ruum/ui/base";
import Link from "next/link";
import type { ReactNode } from "react";
import type { PasaporteRow, DetalleOperativo } from "./trips-utils";
import { formatearDuracion, nombreVehiculo, clasificarMisTraslados } from "./trips-utils";
import { TripPreviewCard } from "./TripPreviewCard";

function getEstadoCardInfo(estado: string) {
  switch (estado) {
    case "conductor_asignado":
      return {
        status: "pending" as const,
        titulo: "PENDIENTE DE INICIO",
        descripcion: "Dirígete al punto de origen."
      };
    case "conductor_en_camino_al_origen":
      return {
        status: "active" as const,
        titulo: "EN CAMINO AL ORIGEN",
        descripcion: "Dirígete al punto de recolección."
      };
    case "conductor_en_punto_de_recoleccion":
    case "verificacion_vehiculo_en_proceso":
    case "evidencia_inicial_en_proceso":
    case "evidencia_inicial_completada":
    case "vehiculo_recibido":
      return {
        status: "active" as const,
        titulo: "EN PUNTO DE ORIGEN",
        descripcion: "Realiza la recepción y evidencia del vehículo."
      };
    case "traslado_en_curso":
      return {
        status: "active" as const,
        titulo: "TRASLADO EN CURSO",
        descripcion: "Conduce de forma segura al destino."
      };
    case "llegada_a_destino":
    case "evidencia_final_en_proceso":
    case "evidencia_final_completada":
      return {
        status: "active" as const,
        titulo: "LLEGADA A DESTINO",
        descripcion: "Entrega la unidad y registra la evidencia final."
      };
    case "entrega_confirmada":
      return { status: "active" as const, titulo: "CIERRE PENDIENTE", descripcion: "Revisa y finaliza el servicio." };
    case "servicio_cerrado":
      return {
        status: "success" as const,
        titulo: "TRASLADO FINALIZADO",
        descripcion: "El traslado ha sido concluido."
      };
    default:
      return { status: "pending" as const, titulo: "CONSULTAR ESTADO", descripcion: "Revisa el estado del traslado antes de continuar." };
  }
}

function clasesEstado(status: string): string {
  switch (status) {
    case "success":
      return "border-ui-success bg-ui-success-soft text-ui-success";
    case "active":
      return "border-ui-brand bg-ui-brand-soft text-ui-brand";
    case "pending":
      return "border-ui-warning bg-ui-warning-soft text-ui-warning";
    case "error":
      return "border-ui-danger bg-ui-danger-soft text-ui-danger";
    default:
      return "border-ui-line bg-ui-card text-ui-fg-muted";
  }
}

interface AcceptedTripCardProps {
  viaje: PasaporteRow;
  detalle: DetalleOperativo;
  onReject: (viaje: PasaporteRow) => void;
  hrefDetalle: string;
  compact?: boolean;
  mapPreview?: ReactNode;
}

export function AcceptedTripCard({
  viaje,
  detalle,
  onReject,
  hrefDetalle,
  compact = false,
  mapPreview,
}: AcceptedTripCardProps) {
  const cardInfo = getEstadoCardInfo(viaje.estado || "");
  const readOnly = !["conductor_asignado", "conductor_en_camino_al_origen", "conductor_en_punto_de_recoleccion", "verificacion_vehiculo_en_proceso", "evidencia_inicial_en_proceso", "evidencia_inicial_completada", "vehiculo_recibido", "traslado_en_curso", "llegada_a_destino", "evidencia_final_en_proceso", "evidencia_final_completada", "entrega_confirmada"].includes(viaje.estado || "");
  const grupo = viaje.estado ? clasificarMisTraslados(viaje) : null;
  const grupoEtiqueta = grupo === "en-curso" ? "En curso" : grupo === "proximos" ? "Próximos" : grupo === "por-cerrar" ? "Por cerrar" : undefined;
  if (compact) return <TripPreviewCard viaje={viaje} detalle={detalle} hrefDetalle={hrefDetalle} mapPreview={mapPreview} accepted={{ label: cardInfo.titulo, tone: cardInfo.status, grupo: grupoEtiqueta, readOnly, onReject: !readOnly ? () => onReject(viaje) : undefined }} />;
  const folio = viaje.traslado_id ? viaje.traslado_id.slice(0, 8).toUpperCase() : "POR CONFIRMAR";
  const ganancia = viaje.ganancia_conductor != null
    ? `$${viaje.ganancia_conductor.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : "$0.00";

  const origen = viaje.origen_ciudad || "Por confirmar";
  const destino = viaje.destino_ciudad || "Por confirmar";
  const autoNombre = nombreVehiculo(viaje);

  const horaInicio = detalle.fechaHora
    ? new Intl.DateTimeFormat("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/Mexico_City" }).format(new Date(detalle.fechaHora))
    : "10:30";

  const duracionHoras = viaje.tiempo_estimado_horas || null;
  const duracionTexto = formatearDuracion(duracionHoras);
  const distanciaTexto = viaje.distancia_km != null ? `${viaje.distancia_km.toFixed(1)} km` : "Por confirmar";


  return (
    <Card asChild><article className="border border-ui-line rounded-lg bg-ui-card p-4 shadow-ui-md w-full flex flex-col gap-3 text-left select-none">
      {/* Cabecera: ID + Tarifa + Botón de Opciones */}
      <div className="flex items-center justify-between gap-2 border-b border-ui-line/15 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-body text-xs font-extrabold uppercase tracking-wider bg-ui-success/15 text-ui-success  border border-ui-success/30">
            <svg className="w-2.5 h-2.5 shrink-0 text-ui-success " fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            ACEPTADO
          </span>
          <span className="font-mono text-xs font-extrabold text-ui-fg-muted tracking-wider uppercase">
            ID {folio}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-display text-xs sm:text-sm font-black text-ui-fg leading-none tabular-nums bg-ui-card border border-ui-line/20 px-2.5 py-1 rounded-lg">
            {ganancia}
          </span>
          <BaseButton variant="ghost"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onReject(viaje);
            }}
            className="p-2 min-h-11 min-w-11 flex items-center justify-center text-ui-fg-muted hover:text-ui-fg transition-colors shrink-0 cursor-pointer rounded-lg hover:bg-ui-card"
            aria-label="Opciones de traslado"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="5" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="19" r="1.5" />
            </svg>
          </BaseButton>
        </div>
      </div>

      {/* Indicador de Estado */}
      <div className="flex flex-col text-left">
        <span
          className={`inline-flex min-h-[28px] items-center gap-1.5 rounded-full border px-2.5 py-1 font-body text-xs font-semibold ${clasesEstado(cardInfo.status)}`}
        >
          {cardInfo.titulo}
        </span>
        <p className="font-body text-xs text-ui-fg-muted mt-1 leading-snug">
          {cardInfo.descripcion}
        </p>
      </div>

      {/* Vehículo */}
      {autoNombre !== "Vehículo" && (
        <div className="flex items-center gap-2 text-xs font-bold text-ui-fg">
          <span>🚗</span>
          <span className="truncate">{autoNombre}</span>
        </div>
      )}

      {/* Conector gráfico de Línea de Ruta */}
      <div className="flex items-center justify-between gap-3 py-2 bg-ui-card/60 border border-ui-line/15 rounded-xl px-3">
        <div className="flex flex-col text-left min-w-0 flex-1">
          <span className="font-display text-xs font-bold text-ui-success  tracking-widest uppercase">Origen</span>
          <span className="font-display text-xs font-black text-ui-fg leading-tight truncate mt-0.5">{origen}</span>
        </div>

        <div className="flex items-center gap-1 shrink-0 px-1 select-none" aria-hidden="true">
          <span className="h-2 w-2 rounded-full border-2 border-ui-success bg-transparent shrink-0" />
          <div className="h-[2px] w-6 sm:w-10 bg-gradient-to-r from-ui-success via-ui-line/40 to-ui-brand rounded-full" />
          <span className="h-2 w-2 rounded-full bg-ui-brand shrink-0" />
        </div>

        <div className="flex flex-col text-right min-w-0 flex-1">
          <span className="font-display text-xs font-bold text-ui-brand tracking-widest uppercase">Destino</span>
          <span className="font-display text-xs font-black text-ui-fg leading-tight truncate mt-0.5">{destino}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 select-none border-t border-ui-line/15 pt-2.5">
        <div className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-ui-fg-muted shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <div className="flex flex-col text-left">
            <span className="text-ui-fg-muted text-xs font-bold uppercase tracking-wider leading-none">Hora</span>
            <span className="text-ui-fg text-xs font-extrabold mt-0.5 leading-none">{horaInicio}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 border-l border-ui-line/15 pl-2">
          <svg className="w-3.5 h-3.5 text-ui-fg-muted shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 15 15" />
          </svg>
          <div className="flex flex-col text-left">
            <span className="text-ui-fg-muted text-xs font-bold uppercase tracking-wider leading-none">Duración</span>
            <span className="text-ui-fg text-xs font-extrabold mt-0.5 leading-none">{duracionTexto}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 border-l border-ui-line/15 pl-2">
          <svg className="w-3.5 h-3.5 text-ui-fg-muted shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M3 22 L9 2 L15 2 L21 22" />
            <path d="M12 2 L12 22" strokeDasharray="2 2" />
            <path d="M6 14 L18 14" />
          </svg>
          <div className="flex flex-col text-left">
            <span className="text-ui-fg-muted text-xs font-bold uppercase tracking-wider leading-none">Distancia</span>
            <span className="text-ui-fg text-xs font-extrabold mt-0.5 leading-none">{distanciaTexto}</span>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <Link
        href={hrefDetalle}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-ui-brand px-5 py-3 font-body text-base font-semibold text-ui-on-brand transition hover:brightness-105 mt-0.5"
      >
        INICIAR TRASLADO →
      </Link>
    </article></Card>
  );
}
