"use client";

import Link from "next/link";
import { Aviso, PassportCard } from "@ruum/ui";
import { ETIQUETA_TIPO_VEHICULO } from "@ruum/shared/constants";
import { resumenClasificacionVehiculo } from "@ruum/shared/catalogos";
import type { Database } from "@ruum/shared/types";
import type { FinanzasTrasladoAdmin, TrazabilidadMasivaTraslado } from "@ruum/api/services";

type PasaporteRow = Database["public"]["Views"]["pasaporte_digital"]["Row"];

function fechaAdministrativa(fechaIso: string | null | undefined) {
  return fechaIso ? new Date(fechaIso).toLocaleString("es-MX") : "Pendiente";
}

function dinero(valor: number | null | undefined) {
  return (valor ?? 0).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

interface ViajeDetalleCardsProps {
  pasaporte: PasaporteRow;
  finanzas: FinanzasTrasladoAdmin | null;
  trazabilidadMasiva: TrazabilidadMasivaTraslado | null;
}

export function ViajeDetalleCards({
  pasaporte,
  finanzas,
  trazabilidadMasiva
}: ViajeDetalleCardsProps) {
  const clasificacionCatalogo = resumenClasificacionVehiculo(
    pasaporte.vehiculo_marca ?? "",
    pasaporte.vehiculo_modelo ?? "",
  );

  return (
    <>
      {trazabilidadMasiva && (
        <div className="mt-6">
          <PassportCard>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-body text-xs uppercase tracking-wide text-ui-fg-muted">Origen corporativo</p>
                <h2 className="mt-1 font-display text-lg font-semibold text-ui-fg">Carga masiva</h2>
                <p className="mt-1 font-body text-sm text-ui-fg-muted">
                  Archivo {trazabilidadMasiva.carga.nombre_archivo} · fila {trazabilidadMasiva.fila.numero_fila}
                </p>
              </div>
              <span className="w-fit rounded-full border border-ui-brand/25 bg-ui-brand-soft px-3 py-1.5 font-body text-xs font-semibold text-ui-brand">
                Corporativo
              </span>
            </div>
            <dl className="mt-4 grid gap-3 font-body text-sm sm:grid-cols-2">
              <div>
                <dt className="text-ui-fg-muted">Referencia externa</dt>
                <dd className="mt-1 font-mono-ruum text-xs text-ui-fg">{trazabilidadMasiva.fila.referencia_externa ?? "Sin referencia"}</dd>
              </div>
              <div>
                <dt className="text-ui-fg-muted">Lote</dt>
                <dd className="mt-1 font-mono-ruum text-xs text-ui-fg">{trazabilidadMasiva.carga.id.slice(0, 8).toUpperCase()}</dd>
              </div>
              <div>
                <dt className="text-ui-fg-muted">Resultado del lote</dt>
                <dd className="mt-1 text-ui-fg">
                  {trazabilidadMasiva.carga.filas_creadas} creadas · {trazabilidadMasiva.carga.filas_error} error
                </dd>
              </div>
              <div>
                <dt className="text-ui-fg-muted">Procesado</dt>
                <dd className="mt-1 text-ui-fg">{fechaAdministrativa(trazabilidadMasiva.carga.creado_en)}</dd>
              </div>
            </dl>
          </PassportCard>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Bloque 1 — Resumen */}
        <PassportCard>
          <p className="font-body text-xs uppercase tracking-wide text-ui-fg-muted">Resumen</p>
          <dl className="mt-3 space-y-2 font-body text-sm">
            <div className="flex justify-between">
              <dt className="text-ui-fg-muted">Tipo de servicio</dt>
              <dd className="capitalize">{pasaporte.tipo_pago?.replaceAll("_", " ") ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ui-fg-muted">Creado</dt>
              <dd>{fechaAdministrativa(pasaporte.creado_en)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ui-fg-muted">Conductor</dt>
              <dd>{pasaporte.conductor_nombre ?? "Sin asignar"}</dd>
            </div>
          </dl>
        </PassportCard>

        {/* Bloque 2 — Finanzas */}
        <PassportCard>
          <p className="font-body text-xs uppercase tracking-wide text-ui-fg-muted">Finanzas</p>
          {finanzas ? (
            <dl className="mt-3 space-y-2 font-body text-sm">
              <div className="flex justify-between">
                <dt className="text-ui-fg-muted">Precio operativo</dt>
                <dd>{dinero(finanzas.precioOperativo)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ui-fg-muted">Pagos cobrados</dt>
                <dd>{dinero(finanzas.ingresosCobrados)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ui-fg-muted">Gastos</dt>
                <dd>{dinero(finanzas.gastosOperativos)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ui-fg-muted">Pago conductor</dt>
                <dd>{dinero(finanzas.pagoConductor)}</dd>
              </div>
              <div className="flex justify-between border-t border-ui-line pt-2 font-semibold">
                <dt>Margen estimado</dt>
                <dd className={finanzas.margenEstimado < 0 ? "text-ui-danger" : "text-ui-success"}>{dinero(finanzas.margenEstimado)}</dd>
              </div>
              <div className="flex justify-between text-xs">
                <dt className="text-ui-fg-muted">Corte</dt>
                <dd>{fechaAdministrativa(finanzas.corteEn)}</dd>
              </div>
            </dl>
          ) : (
            <p className="mt-3 font-body text-sm text-ui-fg-muted">Finanzas no disponibles para este rol o entorno.</p>
          )}
        </PassportCard>

        {/* Bloque 3 — Vehículo */}
        <PassportCard>
          <p className="font-body text-xs uppercase tracking-wide text-ui-fg-muted">Vehículo</p>
          <dl className="mt-3 space-y-2 font-body text-sm">
            <div className="flex justify-between">
              <dt className="text-ui-fg-muted">Marca / modelo</dt>
              <dd>
                {pasaporte.vehiculo_marca} {pasaporte.vehiculo_modelo}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ui-fg-muted">Año</dt>
              <dd>{pasaporte.vehiculo_anio}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ui-fg-muted">Tipo</dt>
              <dd>{pasaporte.vehiculo_tipo ? ETIQUETA_TIPO_VEHICULO[pasaporte.vehiculo_tipo] : "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ui-fg-muted">Clasificación catálogo</dt>
              <dd className="text-right">{clasificacionCatalogo ?? "Sin coincidencia"}</dd>
            </div>
          </dl>
        </PassportCard>

        {/* Bloque 4 — Evidencia */}
        <PassportCard>
          <p className="font-body text-xs uppercase tracking-wide text-ui-fg-muted">Evidencia</p>
          <dl className="mt-3 space-y-2 font-body text-sm">
            <div className="flex justify-between">
              <dt className="text-ui-fg-muted">Inicial</dt>
              <dd className="font-mono-ruum">{pasaporte.evidencia_inicial_fotos_sincronizadas} / 5 fotos</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ui-fg-muted">Final</dt>
              <dd className="font-mono-ruum">{pasaporte.evidencia_final_fotos_sincronizadas} / 5 fotos</dd>
            </div>
          </dl>
          {pasaporte.tiene_incidencia_abierta && (
            <div className="mt-3">
              <Aviso tono="atencion">Incidencia abierta en este traslado.</Aviso>
            </div>
          )}
        </PassportCard>

        {/* Bloque 5 — Pagos */}
        <PassportCard>
          <p className="font-body text-xs uppercase tracking-wide text-ui-fg-muted">Pagos</p>
          <dl className="mt-3 space-y-2 font-body text-sm">
            <div className="flex justify-between">
              <dt className="text-ui-fg-muted">Tarifa cotizada</dt>
              <dd className="font-mono-ruum">${pasaporte.precio_cotizado?.toLocaleString("es-MX") ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ui-fg-muted">Tarifa final</dt>
              <dd className="font-mono-ruum">${pasaporte.precio_final?.toLocaleString("es-MX") ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ui-fg-muted">Monto pagado</dt>
              <dd className="font-mono-ruum">${pasaporte.monto_pagado?.toLocaleString("es-MX") ?? "0"}</dd>
            </div>
          </dl>
          <p className="mt-3 font-body text-xs text-ui-fg-muted">
            Pago al conductor, gastos y margen estimado: pendiente (ver &quot;Pagos&quot; en la barra lateral, próximamente).
          </p>
        </PassportCard>
      </div>
    </>
  );
}
