"use client";
import React, { memo } from "react";
import { Button, PassportCard, Aviso } from "@ruum/ui";
import { MENSAJES_CLAVE_UX } from "@ruum/shared/constants";
import type { PrevisualizacionTarifa } from "@ruum/api/services";
import { CONDICIONES_VEHICULO, VENTANAS_PREDEFINIDAS, formatearDistancia, formatearTiempo } from "../constants";
import type { DatosFormulario, TipoRutaTraslado } from "../types";

export interface AccionesPasoDetalles {
  actualizar: <K extends keyof DatosFormulario>(campo: K, valor: DatosFormulario[K]) => void;
  onEditarAgenda: () => void;
  setAceptaPoliticasPagoCancelacion: (valor: boolean) => void;
  enviarSolicitud: () => Promise<void>;
  onRevisarTarifa: () => void;
}

export interface PasoDetallesProps {
  datos: DatosFormulario;
  acciones: AccionesPasoDetalles;
  previsualizacion: PrevisualizacionTarifa | null;
  previsualizando: boolean;
  momentoPago: { momento: "anticipado" | "al_cierre"; razon: string };
  categoriaCatalogo: string;
  gamaCatalogo: string;
  rutaEstimacion: {
    distanciaKm?: number;
    tiempoEstimadoHoras?: number;
  } | null;
  politicaCancelacion: { mensaje: string };
  aceptaPoliticasPagoCancelacion: boolean;
  enviando: boolean;
  cargandoSesion: boolean;
  tarifaPreviaAceptada: boolean;
}

function PasoDetallesComponent({
  datos,
  acciones,
  previsualizacion,
  previsualizando,
  categoriaCatalogo,
  gamaCatalogo,
  rutaEstimacion,
  politicaCancelacion,
  aceptaPoliticasPagoCancelacion,
  tarifaPreviaAceptada
}: PasoDetallesProps) {
  const {
    actualizar,
    onEditarAgenda,
    setAceptaPoliticasPagoCancelacion,
    onRevisarTarifa,
  } = acciones;

  return (
    <div className="space-y-4">
      <PassportCard>
        <div className="grid gap-4">
          {/* Agenda aceptada: visible como resumen de solo lectura */}
          <div className="rounded-xl border border-ink/15 bg-mist p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-body text-xs font-semibold uppercase tracking-wide text-ink/45">Fecha y horario de recolección</p>
                <p className="mt-1 font-body text-sm font-bold text-ink">
                  {datos.modalidadProgramacion === "lo_antes_posible"
                    ? "⚡ Lo antes posible"
                    : `📅 ${datos.fechaHoraProgramada ? datos.fechaHoraProgramada.replace("T", " ") : "Programado"}`}
                </p>
              </div>
              <button
                type="button"
                onClick={onEditarAgenda}
                className="rounded-lg border border-ink/20 bg-paper px-3 py-1.5 font-body text-xs font-semibold text-ink shadow-xs transition hover:bg-mist"
              >
                Editar
              </button>
            </div>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="font-body text-sm font-medium">Tipo de traslado</span>
            <select
              id="tipoRuta"
              name="tipoRuta"
              value={datos.tipoRuta}
              onChange={(e) => actualizar("tipoRuta", e.target.value as TipoRutaTraslado)}
              className="rounded-lg border border-ink/50 bg-mist px-3.5 py-2.5 font-body text-sm"
            >
              <option value="local">Local</option>
              <option value="foraneo">Foráneo</option>
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="font-body text-sm font-medium">Ventana de recolección</span>
            <select
              value={VENTANAS_PREDEFINIDAS.includes(datos.ventanaRecoleccion as never) ? datos.ventanaRecoleccion : datos.ventanaRecoleccion ? "Otra (especificar)" : "Flexible (sin preferencia)"}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "Otra (especificar)") actualizar("ventanaRecoleccion", "Otra: ");
                else actualizar("ventanaRecoleccion", v);
              }}
              className="rounded-lg border border-ink/50 bg-mist px-3.5 py-2.5 font-body text-sm"
            >
              {VENTANAS_PREDEFINIDAS.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
            {(() => {
              const sel = VENTANAS_PREDEFINIDAS.includes(datos.ventanaRecoleccion as never) ? datos.ventanaRecoleccion : datos.ventanaRecoleccion ? "Otra (especificar)" : "Flexible (sin preferencia)";
              if (sel !== "Otra (especificar)") return null;
              const valorCustom = VENTANAS_PREDEFINIDAS.includes(datos.ventanaRecoleccion as never) ? "" : datos.ventanaRecoleccion.replace(/^Otra:\s*/, "");
              return (
                <label htmlFor="ventanaRecoleccionCustom" className="flex flex-col gap-1 mt-2">
                  <span className="font-body text-xs font-medium text-ink">Especifica ventana de recolección</span>
                  <input
                    id="ventanaRecoleccionCustom"
                    placeholder="Ej. 09:00 a 12:00 o indicación específica"
                    value={valorCustom}
                    onChange={(e) => actualizar("ventanaRecoleccion", `Otra: ${e.target.value}`)}
                    onBlur={(e) => actualizar("ventanaRecoleccion", `Otra: ${e.target.value.trim()}`)}
                    aria-describedby={valorCustom.trim() ? undefined : "ventanaRecoleccionCustom-ayuda"}
                    className="rounded-lg border border-ink/50 bg-mist px-3.5 py-2.5 font-body text-sm"
                  />
                  {!valorCustom.trim() && (
                    <span id="ventanaRecoleccionCustom-ayuda" className="font-body text-xs leading-5 text-ink/60">
                      Especifica el horario para que operación pueda programar la recolección.
                    </span>
                  )}
                </label>
              );
            })()}
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="font-body text-sm font-medium">Ventana de entrega</span>
            <select
              value={VENTANAS_PREDEFINIDAS.includes(datos.ventanaEntrega as never) ? datos.ventanaEntrega : datos.ventanaEntrega ? "Otra (especificar)" : "Flexible (sin preferencia)"}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "Otra (especificar)") actualizar("ventanaEntrega", "Otra: ");
                else actualizar("ventanaEntrega", v);
              }}
              className="rounded-lg border border-ink/50 bg-mist px-3.5 py-2.5 font-body text-sm"
            >
              {VENTANAS_PREDEFINIDAS.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
            {(() => {
              const sel = VENTANAS_PREDEFINIDAS.includes(datos.ventanaEntrega as never) ? datos.ventanaEntrega : datos.ventanaEntrega ? "Otra (especificar)" : "Flexible (sin preferencia)";
              if (sel !== "Otra (especificar)") return null;
              const valorCustom = VENTANAS_PREDEFINIDAS.includes(datos.ventanaEntrega as never) ? "" : datos.ventanaEntrega.replace(/^Otra:\s*/, "");
              return (
                <label htmlFor="ventanaEntregaCustom" className="flex flex-col gap-1 mt-2">
                  <span className="font-body text-xs font-medium text-ink">Especifica ventana de entrega</span>
                  <input
                    id="ventanaEntregaCustom"
                    placeholder="Ej. Mismo día por la tarde"
                    value={valorCustom}
                    onChange={(e) => actualizar("ventanaEntrega", `Otra: ${e.target.value}`)}
                    onBlur={(e) => actualizar("ventanaEntrega", `Otra: ${e.target.value.trim()}`)}
                    aria-describedby={valorCustom.trim() ? undefined : "ventanaEntregaCustom-ayuda"}
                    className="rounded-lg border border-ink/50 bg-mist px-3.5 py-2.5 font-body text-sm"
                  />
                  {!valorCustom.trim() && (
                    <span id="ventanaEntregaCustom-ayuda" className="font-body text-xs leading-5 text-ink/60">
                      Especifica el horario para que operación pueda programar la entrega.
                    </span>
                  )}
                </label>
              );
            })()}
          </label>
        </div>
      </PassportCard>

      <section id="desglose-tarifa-traslado" tabIndex={-1} className="app-status-strip px-5 py-5 scroll-mt-28" aria-labelledby="titulo-tarifa-calculada">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p id="titulo-tarifa-calculada" className="font-body text-xs font-semibold uppercase tracking-wide text-ink/45">
              Desglose de la tarifa
            </p>
            {previsualizando && (
              <p className="mt-1 font-body text-sm text-ink/55">Calculando tarifa…</p>
            )}
            {!previsualizando && previsualizacion?.disponible && (
              <>
                <p className="mt-1 font-display text-4xl font-bold leading-tight text-ink">
                  ${Number(previsualizacion.tarifa ?? 0).toLocaleString("es-MX")}
                </p>
                <p className="mt-2 max-w-sm font-body text-sm leading-6 text-ink/65">
                  Este es el monto final calculado para tu traslado, no una estimación.
                </p>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <dt>Clasificación</dt><dd>{categoriaCatalogo} · {gamaCatalogo}</dd>
                  <dt>Distancia</dt><dd>{rutaEstimacion?.distanciaKm !== undefined ? formatearDistancia(rutaEstimacion.distanciaKm) : "Pendiente"}</dd>
                  {previsualizacion.horario && <><dt>Horario tarifario</dt><dd>{previsualizacion.horario.replaceAll("_", " ")}</dd></>}
                  {previsualizacion.dia && <><dt>Día tarifario</dt><dd>{previsualizacion.dia.replaceAll("_", " ")}</dd></>}
                </dl>
              </>
            )}
            {!previsualizando && previsualizacion && !previsualizacion.disponible && (
              <p className="mt-1 max-w-sm font-body text-sm leading-6 text-ink/65">
                {previsualizacion.motivo ? previsualizacion.motivo.replace("Torre de Control", "nuestro equipo") : "Nuestro equipo aplicará la tarifa correspondiente antes de enviarte la cotización."}
              </p>
            )}
            {!previsualizando && !previsualizacion && (
              <p className="mt-1 max-w-sm font-body text-sm leading-6 text-ink/65">
                Completa el origen, el destino y la fecha/hora para calcular tu tarifa.
              </p>
            )}
          </div>
          <div className="rounded-lg border border-ink/10 bg-mist/80 px-4 py-3">
            <p className="font-body text-xs font-semibold uppercase tracking-wide text-ink/45">Momento de pago</p>
            <p className="mt-2 flex items-center gap-2 font-body text-sm font-bold capitalize text-ink">
              <span className="inline-flex size-8 items-center justify-center rounded-full bg-signal text-ink" aria-hidden="true">
                $
              </span>
              Pago electrónico anticipado obligatorio
            </p>
          </div>
        </div>
      </section>

      <PassportCard>
        <dl className="grid grid-cols-2 gap-3 font-body text-sm">
          <dt className="text-ink/45">Vehículo</dt>
          <dd>
            {datos.marca} {datos.modelo} {datos.anio}
          </dd>
          <dt className="text-ink/45">Clasificación</dt>
          <dd>
            {categoriaCatalogo} · {gamaCatalogo} · {datos.condicion ? CONDICIONES_VEHICULO.find((c) => c.valor === datos.condicion)?.etiqueta : "Sin condición"}
          </dd>
          <dt className="text-ink/45">Ruta</dt>
          <dd>
            {datos.origenCiudad} → {datos.destinoCiudad}
          </dd>
          <dt className="text-ink/45">Estimación</dt>
          <dd>
            {rutaEstimacion?.distanciaKm !== undefined && rutaEstimacion.tiempoEstimadoHoras !== undefined
              ? `${formatearDistancia(rutaEstimacion.distanciaKm)} · ${formatearTiempo(rutaEstimacion.tiempoEstimadoHoras)}`
              : "Pendiente"}
          </dd>
          <dt className="text-ink/45">Agenda</dt>
          <dd>{datos.modalidadProgramacion === "programado" ? datos.fechaHoraProgramada : "Lo antes posible"}</dd>
        </dl>
      </PassportCard>

      <Aviso tono="info">
        {MENSAJES_CLAVE_UX.pago} Todo traslado se cobra por medios electrónicos de forma anticipada, antes de operar.
      </Aviso>
      <Aviso tono="atencion">
        {MENSAJES_CLAVE_UX.cancelacion} {politicaCancelacion.mensaje}
      </Aviso>

      <label className="flex items-start gap-2.5 rounded-lg border border-ink/10 bg-mist px-4 py-3 font-body text-sm">
        <input
          type="checkbox"
          checked={aceptaPoliticasPagoCancelacion}
          onChange={(e) => setAceptaPoliticasPagoCancelacion(e.target.checked)}
          className="mt-0.5 size-5 rounded border-ink/50 text-signal focus-visible:outline-route-dark"
        />
        <span>Acepto la política de cancelación y que el pago es solo por medios electrónicos.</span>
      </label>

      {!tarifaPreviaAceptada && (
        <div id="aviso-tarifa-invalida-detalles" role="alert" aria-live="assertive" tabIndex={-1} className="scroll-mt-28 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-route-action rounded-xl">
          <Aviso tono="danger">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-bold">⚠️ Tarifa pendiente de re-confirmación</p>
                <p className="text-xs text-ink/80 mt-0.5">
                  Los datos del traslado cambiaron desde que aceptaste la tarifa previa. Debes revisar y aceptar la nueva cotización antes de confirmar el pago o la solicitud.
                </p>
              </div>
              <Button type="button" variant="secondary" onClick={onRevisarTarifa} className="shrink-0">
                Revisar nueva tarifa
              </Button>
            </div>
          </Aviso>
        </div>
      )}


     </div>
   );
}

function areEqualPasoDetalles(prev: PasoDetallesProps, next: PasoDetallesProps) {
  // Sin `prev.datos === next.datos` (cortaba todo cambio; resto muerto). El
  // resumen renderiza agenda, vehículo y ruta: se comparan esos campos.
  return (
    prev.datos.modalidadProgramacion === next.datos.modalidadProgramacion &&
    prev.datos.fechaHoraProgramada === next.datos.fechaHoraProgramada &&
    prev.datos.marca === next.datos.marca &&
    prev.datos.modelo === next.datos.modelo &&
    prev.datos.anio === next.datos.anio &&
    prev.datos.condicion === next.datos.condicion &&
    prev.datos.origenCiudad === next.datos.origenCiudad &&
    prev.datos.destinoCiudad === next.datos.destinoCiudad &&
    prev.acciones === next.acciones &&
    prev.datos.tipoRuta === next.datos.tipoRuta &&
    prev.datos.ventanaRecoleccion === next.datos.ventanaRecoleccion &&
    prev.datos.ventanaEntrega === next.datos.ventanaEntrega &&
    prev.previsualizacion === next.previsualizacion &&
    prev.previsualizando === next.previsualizando &&
    prev.momentoPago === next.momentoPago &&
    prev.categoriaCatalogo === next.categoriaCatalogo &&
    prev.gamaCatalogo === next.gamaCatalogo &&
    prev.rutaEstimacion === next.rutaEstimacion &&
    prev.politicaCancelacion === next.politicaCancelacion &&
    prev.aceptaPoliticasPagoCancelacion === next.aceptaPoliticasPagoCancelacion &&
    prev.enviando === next.enviando &&
    prev.cargandoSesion === next.cargandoSesion &&
    prev.tarifaPreviaAceptada === next.tarifaPreviaAceptada
  );
}
export const PasoDetalles = memo(PasoDetallesComponent, areEqualPasoDetalles);
