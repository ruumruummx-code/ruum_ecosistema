"use client";
import { Card } from "@ruum/ui/base";

import { Button as BaseButton } from "@ruum/ui/base";
import Link from "next/link";
import type { ReactNode } from "react";
import { ETIQUETA_TIPO_VEHICULO } from "@ruum/shared/constants";
import type { PasaporteRow, DetalleOperativo } from "./trips-utils";
import { formatearDuracion, nombreVehiculo } from "./trips-utils";
import { OfferPreviewCard } from "./OfferPreviewCard";

function extraerColonia(direccion: string | null): string {
  if (!direccion) return "";
  const partes = direccion.split(",").map((p) => p.trim());
  return partes[1] ?? partes[0] ?? "";
}

function extraerCiudad(ciudad: string | null, direccion: string | null): string {
  if (ciudad) return ciudad;
  if (!direccion) return "";
  const partes = direccion.split(",").map((p) => p.trim());
  return partes[2] ?? partes[1] ?? partes[0] ?? "";
}

interface OfertaCardProps {
  viaje: PasaporteRow;
  detalle: DetalleOperativo;
  hrefDetalle: string;
  compact?: boolean;
  mapPreview?: ReactNode;
}

export function OfertaCard({ viaje, detalle, hrefDetalle, compact = false, mapPreview }: OfertaCardProps) {
  if (compact) return <OfferPreviewCard viaje={viaje} detalle={detalle} hrefDetalle={hrefDetalle} mapPreview={mapPreview} />;
  const folio = viaje.traslado_id ? viaje.traslado_id.slice(0, 8).toUpperCase() : "SIN ID";

  const ganancia = viaje.ganancia_conductor != null
    ? new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(viaje.ganancia_conductor)
    : "Por confirmar";

  const coloniaOrigen = extraerColonia(viaje.origen_direccion);
  const ciudadOrigen = extraerCiudad(viaje.origen_ciudad, viaje.origen_direccion);
  const coloniaDestino = extraerColonia(viaje.destino_direccion);
  const ciudadDestino = extraerCiudad(viaje.destino_ciudad, viaje.destino_direccion);

  const autoNombre = nombreVehiculo(viaje);
  const tipoVehiculo = viaje.vehiculo_tipo ? ETIQUETA_TIPO_VEHICULO[viaje.vehiculo_tipo] : null;

  const horaInicio = detalle.fechaHora
    ? new Intl.DateTimeFormat("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/Mexico_City" }).format(new Date(detalle.fechaHora))
    : null;

  const distanciaTexto = viaje.distancia_km != null
    ? `${new Intl.NumberFormat("es-MX", { maximumFractionDigits: viaje.distancia_km < 10 ? 1 : 0 }).format(viaje.distancia_km)} km`
    : null;

  const duracionTexto = formatearDuracion(viaje.tiempo_estimado_horas);

  return (
    <Card asChild><article className="border border-ui-line rounded-lg bg-ui-card overflow-hidden select-none text-left flex flex-col gap-0 shadow-ui-md">
      {/* Cabecera: ID resaltado + Tipo de Auto + Tarifa */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5 border-b border-ui-line/15 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex min-h-[28px] items-center gap-1.5 rounded-full border border-ui-brand bg-ui-brand-soft px-2.5 py-1 font-body text-xs font-semibold text-ui-brand shrink-0">
            Oferta disponible
          </span>
          <BaseButton variant="ghost"
            type="button"
            onClick={() => {
              if (navigator.clipboard) void navigator.clipboard.writeText(folio);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-ui-line/80 bg-ui-card px-2.5 py-1 font-mono text-xs font-bold tracking-widest uppercase text-ui-fg hover:border-ui-brand hover:text-ui-brand transition-colors focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-ui-brand"
            aria-label={`Copiar folio ${folio}`}
            title="Copiar ID"
          >
            <span className="size-1.5 rounded-full bg-ui-brand animate-pulse" aria-hidden />
            ID {folio}
          </BaseButton>
          {tipoVehiculo && (
            <span className="px-2 py-0.5 rounded-md bg-ui-card border border-ui-line/30 text-xs font-bold text-ui-fg-muted uppercase">
              {tipoVehiculo}
            </span>
          )}
        </div>
        <span className="font-display text-base font-black text-ui-fg leading-none tabular-nums shrink-0">
          {ganancia}
        </span>
      </div>

      {/* Vehículo si tiene marca/modelo */}
      {autoNombre !== "Vehículo" && (
        <div className="px-4 pt-2.5 pb-0 flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-ui-card border border-ui-line/20 text-ui-fg-muted" aria-hidden>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2" />
              <circle cx="7" cy="17" r="2" />
              <circle cx="17" cy="17" r="2" />
              <path d="M13 6h5l2 3v4h-3" />
            </svg>
          </span>
          <span className="font-display text-xs font-bold text-ui-fg leading-tight truncate">
            {autoNombre}
          </span>
        </div>
      )}

      {/* Ruta: Origen ➔ Destino — colonia, ciudad o municipio */}
      <div className="px-4 py-3 flex flex-col gap-2.5">
        {/* Origen */}
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 shrink-0 flex flex-col items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full border-2 border-ui-success bg-transparent" />
            <span className="w-[1px] h-3.5 bg-ui-line/30" />
          </div>
          <div className="flex flex-col min-w-0">
            {coloniaOrigen ? (
              <span className="font-display text-xs sm:text-sm font-black text-ui-fg leading-tight truncate">
                {coloniaOrigen}
              </span>
            ) : (
              <span className="font-display text-xs sm:text-sm font-black text-ui-fg leading-tight truncate">
                {viaje.origen_direccion?.split(",")[0]?.trim() || "Origen por confirmar"}
              </span>
            )}
            <span className="font-body text-xs text-ui-fg-muted leading-tight truncate mt-0.5">
              {ciudadOrigen || viaje.origen_ciudad || "Ciudad / Municipio por confirmar"}
            </span>
            {viaje.origen_direccion && viaje.origen_direccion.split(",").length > 2 && (
              <span className="font-body text-xs text-ui-fg-muted leading-tight truncate">
                {viaje.origen_direccion}
              </span>
            )}
          </div>
        </div>

        {/* Destino */}
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 shrink-0">
            <span className="h-2.5 w-2.5 rounded-full bg-ui-brand flex-none block" />
          </div>
          <div className="flex flex-col min-w-0">
            {coloniaDestino ? (
              <span className="font-display text-xs sm:text-sm font-black text-ui-fg leading-tight truncate">
                {coloniaDestino}
              </span>
            ) : (
              <span className="font-display text-xs sm:text-sm font-black text-ui-fg leading-tight truncate">
                {viaje.destino_direccion?.split(",")[0]?.trim() || "Destino por confirmar"}
              </span>
            )}
            <span className="font-body text-xs text-ui-fg-muted leading-tight truncate mt-0.5">
              {ciudadDestino || viaje.destino_ciudad || "Ciudad / Municipio por confirmar"}
            </span>
            {viaje.destino_direccion && viaje.destino_direccion.split(",").length > 2 && (
              <span className="font-body text-xs text-ui-fg-muted leading-tight truncate">
                {viaje.destino_direccion}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats: Hora · Distancia · Duración */}
      <div className="flex items-center divide-x divide-ui-line/15 border-t border-ui-line/15 bg-ui-card/40">
        {horaInicio ? (
          <div className="flex flex-1 flex-col items-center gap-0.5 py-2.5">
            <span className="text-ui-fg-muted text-xs font-extrabold uppercase tracking-widest leading-none">Inicio</span>
            <span className="font-display text-xs font-black text-ui-fg mt-1 tabular-nums leading-none">{horaInicio}</span>
          </div>
        ) : null}
        {distanciaTexto ? (
          <div className="flex flex-1 flex-col items-center gap-0.5 py-2.5">
            <span className="text-ui-fg-muted text-xs font-extrabold uppercase tracking-widest leading-none">Distancia</span>
            <span className="font-display text-xs font-black text-ui-fg mt-1 tabular-nums leading-none">{distanciaTexto}</span>
          </div>
        ) : null}
        <div className="flex flex-1 flex-col items-center gap-0.5 py-2.5">
          <span className="text-ui-fg-muted text-xs font-extrabold uppercase tracking-widest leading-none">Duración</span>
          <span className="font-display text-xs font-black text-ui-fg mt-1 tabular-nums leading-none">{duracionTexto}</span>
        </div>
      </div>

      {/* CTA */}
      <div className="p-3 bg-ui-card/60 border-t border-ui-line/15">
        <Link
          href={hrefDetalle}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-ui-brand px-5 py-3 font-body text-base font-semibold text-ui-on-brand transition hover:brightness-105"
        >
          Ver oferta →
        </Link>
      </div>
    </article></Card>
  );
}
