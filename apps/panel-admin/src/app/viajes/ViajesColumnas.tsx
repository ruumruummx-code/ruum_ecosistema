"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { AdminDataTableColumn } from "../AdminDataTable";
import type { TrazabilidadMasivaTraslado } from "@ruum/api/services";
import type { PasaporteRow } from "./ViajesTipos";
import {
  obtenerInicioProgramado,
  obtenerUltimaActualizacion,
  textoRuta,
  estadoSla,
  responsableOperativo
} from "./ViajesTipos";
import {
  FechaOperativa,
  VehiculoOperativo,
  SlaOperativo,
  EstadoOperativo,
  IncidenciaOperativa
} from "./ViajesComponentes";

export function useColumnasTraslados(trazabilidadPorTraslado: Map<string, TrazabilidadMasivaTraslado>) {
  return useMemo<AdminDataTableColumn<PasaporteRow>[]>(
    () => [
      {
        id: "folio",
        header: "Folio",
        sortValue: (v) => v.traslado_id ?? "",
        cell: (v) =>
          v.traslado_id ? (
            <Link href={`/viajes/${v.traslado_id}`} className="font-mono-ruum text-sm text-ui-brand-soft-fg hover:underline">
              {v.traslado_id.slice(0, 8).toUpperCase()}
            </Link>
          ) : (
            <span className="text-ui-fg-muted">Sin folio</span>
          )
      },
      {
        id: "inicio_programado",
        header: "Inicio programado",
        sortValue: (v) => obtenerInicioProgramado(v) ?? "",
        cell: (v) => <FechaOperativa fechaIso={obtenerInicioProgramado(v)} />
      },
      {
        id: "ruta",
        header: "Ruta",
        sortValue: (v) => textoRuta(v),
        cell: (v) => {
          const trazabilidad = v.traslado_id ? trazabilidadPorTraslado.get(v.traslado_id) : null;
          return (
            <div className="grid min-w-56 gap-1">
              <span className="font-body text-sm font-semibold text-ui-fg">
                {v.origen_ciudad ?? v.origen_direccion ?? "Origen sin dato"}
              </span>
              <span className="font-body text-xs text-ui-fg-muted">
                a {v.destino_ciudad ?? v.destino_direccion ?? "Destino sin dato"}
              </span>
              {trazabilidad && (
                <span className="w-fit rounded-full border border-ui-brand/25 bg-ui-brand-soft px-2.5 py-1 font-body text-xs font-semibold text-ui-brand">
                  Masivo · {trazabilidad.fila.referencia_externa ?? trazabilidad.carga.nombre_archivo}
                </span>
              )}
            </div>
          );
        }
      },
      {
        id: "vehiculo",
        header: "Vehículo",
        sortValue: (v) => `${v.vehiculo_marca ?? ""} ${v.vehiculo_modelo ?? ""} ${v.vehiculo_placas ?? ""}`,
        cell: (v) => <VehiculoOperativo traslado={v} />
      },
      {
        id: "conductor",
        header: "Conductor",
        sortValue: (v) => v.conductor_nombre ?? "",
        cell: (v) => v.conductor_nombre ?? <span className="font-body text-sm font-semibold text-ui-warning">Sin asignar</span>
      },
      {
        id: "sla",
        header: "SLA",
        sortValue: (v) => estadoSla(v).prioridad,
        cell: (v) => <SlaOperativo traslado={v} />
      },
      {
        id: "estatus",
        header: "Estado",
        sortValue: (v) => v.estado ?? "",
        cell: (v) => <EstadoOperativo estado={v.estado} />
      },
      {
        id: "incidencia",
        header: "Incidencia",
        sortValue: (v) => Number(v.incidencias_abiertas ?? 0),
        cell: (v) => <IncidenciaOperativa traslado={v} />
      },
      {
        id: "ultima_actualizacion",
        header: "Última actualización",
        sortValue: (v) => obtenerUltimaActualizacion(v) ?? "",
        cell: (v) => <FechaOperativa fechaIso={obtenerUltimaActualizacion(v)} compacta />
      },
      {
        id: "responsable",
        header: "Responsable",
        sortValue: (v) => responsableOperativo(v),
        cell: (v) => <span className="font-body text-sm font-semibold text-ui-fg-muted">{responsableOperativo(v)}</span>
      }
    ],
    [trazabilidadPorTraslado]
  );
}
