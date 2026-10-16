"use client";
import React, { memo, useState } from "react";
import { MobileBottomSheet as BottomSheet } from "@/components/MobileBottomSheet";
import styles from "./cotizador.module.css";
import type { PrevisualizacionTarifa } from "@ruum/api/services";
import {
  CONDICIONES_VEHICULO,
  VENTANAS_PREDEFINIDAS,
  formatearDistancia,
  formatearTiempo,
} from "../constants";
import type { DatosFormulario, TipoRutaTraslado } from "../types";

export interface AccionesPasoDetalles {
  actualizar: <K extends keyof DatosFormulario>(
    campo: K,
    valor: DatosFormulario[K],
  ) => void;
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
  soloLectura?: boolean;
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
  tarifaPreviaAceptada,
  soloLectura,
}: PasoDetallesProps) {
  const [desglose, setDesglose] = useState(false);
  const [ventana, setVentana] = useState<
    "ventanaRecoleccion" | "ventanaEntrega" | null
  >(null);
  const [personalizada, setPersonalizada] = useState("");
  const { actualizar, onEditarAgenda, onRevisarTarifa } = acciones;
  const abrirVentana = (campo: "ventanaRecoleccion" | "ventanaEntrega") => {
    setPersonalizada(datos[campo].replace(/^Otra:\s*/, ""));
    setVentana(campo);
  };
  return (
    <div className={styles.fields}>
      <div className="flex items-center justify-between gap-3 text-sm">
        <p>
          <span className="block text-xs text-[var(--user-color-muted)]">
            Recolección
          </span>
          <strong>
            {datos.modalidadProgramacion === "lo_antes_posible"
              ? "Lo antes posible"
              : datos.fechaHoraProgramada.replace("T", " ")}
          </strong>
        </p>
        <button
          type="button"
          disabled={soloLectura}
          onClick={onEditarAgenda}
          aria-label="Editar agenda"
          className="min-h-11 min-w-11"
        >
          ✎
        </button>
      </div>
      <div>
        <p id="tipo-traslado-label" className="mb-2 text-xs font-semibold">
          Tipo de traslado
        </p>
        <div
          className={styles.segmented}
          role="radiogroup"
          aria-labelledby="tipo-traslado-label"
        >
          {(["local", "foraneo"] as const).map((tipo) => (
            <button
              key={tipo}
              type="button"
              role="radio"
              disabled={soloLectura}
              aria-checked={datos.tipoRuta === tipo}
              onClick={() => actualizar("tipoRuta", tipo as TipoRutaTraslado)}
            >
              {tipo === "local" ? "Local" : "Foráneo"}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.vehicle}>
        {(["ventanaRecoleccion", "ventanaEntrega"] as const).map((campo) => (
          <button
            key={campo}
            type="button"
            disabled={soloLectura}
            className={styles.windowButton}
            aria-haspopup="dialog"
            onClick={() => abrirVentana(campo)}
          >
            <span className={styles.label}>
              {campo === "ventanaRecoleccion" ? "Recolección" : "Entrega"} ▾
            </span>
            <span className="block truncate text-sm font-semibold">
              {datos[campo] || "Flexible"}
            </span>
          </button>
        ))}
      </div>
      <p className="truncate text-sm font-semibold">
        {datos.marca} {datos.modelo} {datos.anio}
        <span className="block truncate text-xs font-normal text-[var(--user-color-muted)]">
          {datos.origenCiudad || "Origen"} → {datos.destinoCiudad || "Destino"}
        </span>
      </p>
      <button
        type="button"
        className="min-h-11 text-left text-sm font-semibold text-[var(--user-color-action)]"
        onClick={() => setDesglose(true)}
      >
        ⓘ Ver desglose completo de la tarifa
      </button>
      {!tarifaPreviaAceptada && (
        <button
          type="button"
          className="min-h-11 text-left text-sm font-semibold text-amber-800"
          onClick={onRevisarTarifa}
        >
          Revisar nueva tarifa
        </button>
      )}
      <BottomSheet
        open={Boolean(ventana)}
        onClose={() => setVentana(null)}
        title={
          ventana === "ventanaEntrega"
            ? "Ventana de entrega"
            : "Ventana de recolección"
        }
      >
        <div className="grid gap-2">
          {VENTANAS_PREDEFINIDAS.filter((v) => v !== "Otra (especificar)").map(
            (v) => (
              <button
                type="button"
                key={v}
                className="min-h-11 rounded-xl border border-[var(--user-color-border)] p-3 text-left text-sm"
                onClick={() => {
                  if (ventana) actualizar(ventana, v);
                  setVentana(null);
                }}
              >
                {v}
              </button>
            ),
          )}
        </div>
        <label
          className="mt-4 block text-xs font-semibold"
          htmlFor={ventana ? `${ventana}Custom` : "ventanaCustom"}
        >
          Especifica ventana de{" "}
          {ventana === "ventanaEntrega" ? "entrega" : "recolección"}
        </label>
        <input
          id={ventana ? `${ventana}Custom` : "ventanaCustom"}
          className="mt-2 min-h-12 w-full rounded-xl border border-[var(--user-color-border)] p-3"
          value={personalizada}
          maxLength={200}
          onChange={(e) => setPersonalizada(e.target.value)}
          placeholder="Ej. 09:00 a 12:00"
        />
        <button
          type="button"
          disabled={!personalizada.trim()}
          className="mt-3 min-h-12 w-full rounded-xl bg-[var(--user-color-action)] text-[var(--user-color-on-action)] disabled:opacity-50"
          onClick={() => {
            if (ventana) actualizar(ventana, `Otra: ${personalizada.trim()}`);
            setVentana(null);
          }}
        >
          Guardar ventana
        </button>
      </BottomSheet>
      <BottomSheet
        open={desglose}
        onClose={() => setDesglose(false)}
        title="Desglose de la tarifa"
      >
        <p className="text-xl font-bold">
          {previsualizando
            ? "Calculando tarifa…"
            : previsualizacion?.disponible
              ? `$${Number(previsualizacion.tarifa).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`
              : "Tarifa pendiente"}
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <dt>Clasificación</dt>
          <dd>
            {categoriaCatalogo} · {gamaCatalogo}
          </dd>
          <dt>Condición</dt>
          <dd>
            {CONDICIONES_VEHICULO.find((c) => c.valor === datos.condicion)
              ?.etiqueta || "Pendiente"}
          </dd>
          <dt>Distancia</dt>
          <dd>
            {rutaEstimacion?.distanciaKm !== undefined
              ? formatearDistancia(rutaEstimacion.distanciaKm)
              : "Pendiente"}
          </dd>
          <dt>Tiempo estimado</dt>
          <dd>
            {rutaEstimacion?.tiempoEstimadoHoras !== undefined
              ? formatearTiempo(rutaEstimacion.tiempoEstimadoHoras)
              : "Pendiente"}
          </dd>
          <dt>Horario tarifario</dt>
          <dd>
            {previsualizacion?.horario?.replaceAll("_", " ") || "Estándar"}
          </dd>
          <dt>Día tarifario</dt>
          <dd>{previsualizacion?.dia?.replaceAll("_", " ") || "Estándar"}</dd>
        </dl>
        <p className="mt-4 text-sm">Pago electrónico anticipado obligatorio.</p>
        <p className="mt-2 text-sm">{politicaCancelacion.mensaje}</p>
      </BottomSheet>
    </div>
  );
}

function areEqualPasoDetalles(
  prev: PasoDetallesProps,
  next: PasoDetallesProps,
) {
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
    prev.aceptaPoliticasPagoCancelacion ===
      next.aceptaPoliticasPagoCancelacion &&
    prev.enviando === next.enviando &&
    prev.cargandoSesion === next.cargandoSesion &&
    prev.soloLectura === next.soloLectura &&
    prev.tarifaPreviaAceptada === next.tarifaPreviaAceptada
  );
}
export const PasoDetalles = memo(PasoDetallesComponent, areEqualPasoDetalles);
