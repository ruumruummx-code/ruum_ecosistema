"use client";
import { useFormatoDistancia } from "@/lib/use-formato-distancia";
import React, { memo, useState } from "react";
import { MobileBottomSheet as BottomSheet } from "@/components/MobileBottomSheet";
import styles from "./cotizador.module.css";
import type { PrevisualizacionTarifa } from "@ruum/api/services";
import {
  CONDICIONES_VEHICULO,
  VENTANAS_PREDEFINIDAS,
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
  const formatearDistancia = useFormatoDistancia();
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
  const nombreVehiculo = [datos.marca, datos.modelo, datos.anio].filter(Boolean).join(" ") || "Vehículo";
  const rutaTexto = `${datos.origenCiudad || "Origen"} → ${datos.destinoCiudad || "Destino"}`;
  const distanciaTexto = rutaEstimacion?.distanciaKm !== undefined && rutaEstimacion?.tiempoEstimadoHoras !== undefined
    ? `${formatearDistancia(rutaEstimacion.distanciaKm)} · ${formatearTiempo(rutaEstimacion.tiempoEstimadoHoras)}`
    : "Distancia estimada calculada";

  return (
    <div className={styles.fields}>
      {/* Tarjeta Resumen del Vehículo y Ruta */}
      <div className="flex items-center gap-3.5 rounded-2xl border border-[#e2e8f0] bg-white p-3.5 shadow-2xs dark:border-[#1a3a5c] dark:bg-[#0a2342] sm:p-4">
        <div className="relative flex size-16 shrink-0 items-center justify-center rounded-xl bg-[#f1f5fa] dark:bg-[#0f2d52]" aria-hidden="true">
          <svg className="h-10 w-14 text-[#0a2342] dark:text-white" viewBox="0 0 64 36" fill="none">
            <rect x="6" y="12" width="46" height="16" rx="4" fill="#cbd5e1" />
            <path d="M14 12l5-7h18l6 7H14z" fill="#94a3b8" />
            <rect x="20" y="7" width="7" height="5" rx="1" fill="#ffffff" />
            <rect x="29" y="7" width="9" height="5" rx="1" fill="#ffffff" />
            <circle cx="16" cy="27" r="4.5" fill="#0f172a" stroke="#ffffff" strokeWidth="1.5" />
            <circle cx="42" cy="27" r="4.5" fill="#0f172a" stroke="#ffffff" strokeWidth="1.5" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[15px] font-extrabold text-[#0a2342] dark:text-[#f6f8fb]">
            {nombreVehiculo}
          </h2>
          <p className="truncate text-[12.5px] font-medium text-[#64748b] dark:text-[#a8b5cc]">
            {rutaTexto}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-[11.5px] font-semibold text-[#64748b] dark:text-[#94a3b8]">
            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>{distanciaTexto}</span>
          </div>
        </div>
      </div>

      {/* Tipo de traslado */}
      <div>
        <div className="mb-2 flex items-center gap-1.5 text-[12.5px] font-bold text-[#0a2342] dark:text-[#f6f8fb]">
          <svg className="size-4 text-[#0066FF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span id="tipo-traslado-label">Tipo de traslado</span>
        </div>
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
              className="flex items-center justify-center gap-2"
            >
              {tipo === "local" ? (
                <>
                  <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                  <span>Local</span>
                </>
              ) : (
                <>
                  <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
                  </svg>
                  <span>Foráneo</span>
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Ventanas de Recolección y Entrega */}
      <div className={styles.vehicle}>
        {(["ventanaRecoleccion", "ventanaEntrega"] as const).map((campo) => (
          <button
            key={campo}
            type="button"
            disabled={soloLectura}
            className="flex min-h-[64px] flex-col justify-center rounded-2xl border border-[#e2e8f0] bg-white px-3.5 py-2.5 text-left shadow-2xs transition hover:border-[#0066FF] dark:border-[#1a3a5c] dark:bg-[#0a2342]"
            aria-haspopup="dialog"
            onClick={() => abrirVentana(campo)}
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[11.5px] font-semibold text-[#64748b] dark:text-[#a8b5cc]">
                <svg className="size-3.5 text-[#94a3b8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                {campo === "ventanaRecoleccion" ? "Recolección" : "Entrega"} ▾
              </span>
              <svg className="size-3 text-[#94a3b8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
            <span className="mt-1 block truncate text-[14px] font-bold text-[#0a2342] dark:text-[#f6f8fb]">
              {datos[campo] || "Flexible"}
            </span>
          </button>
        ))}
      </div>

      {/* Callout de disponibilidad / asignación */}
      <div className="flex items-start gap-3 rounded-2xl border border-[#d6e4f7] bg-[#f0f6fd] p-3.5 text-left dark:border-[#1a3a5c] dark:bg-[#091f38]">
        <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#0066FF]/10 text-[#0066FF] dark:bg-[#4d94ff]/20 dark:text-[#4d94ff]">
          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        </div>
        <div className="text-[12.5px] leading-relaxed text-[#4e5f80] dark:text-[#a8b5cc]">
          <strong className="block font-bold text-[#0a2342] dark:text-[#f6f8fb]">
            {datos.modalidadProgramacion === "lo_antes_posible"
              ? "Lo antes posible"
              : `Programado para ${datos.fechaHoraProgramada.replace("T", " ")}`}
          </strong>
          <span>Te asignaremos un conductor cercano en cuanto confirmes tu traslado.</span>
        </div>
      </div>

      {/* Ver desglose completo de la tarifa */}
      <button
        type="button"
        className="flex w-full items-center justify-between rounded-2xl border border-[#e2e8f0] bg-white p-3.5 text-left shadow-2xs transition hover:border-[#0066FF] dark:border-[#1a3a5c] dark:bg-[#0a2342]"
        onClick={() => setDesglose(true)}
      >
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-lg bg-[#edf5fd] text-[#0066FF] dark:bg-[#0f2d52] dark:text-[#4d94ff]">
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </span>
          <span className="text-[13.5px] font-bold text-[#0066FF] dark:text-[#4d94ff]">
            Ver desglose completo de la tarifa
          </span>
        </div>
        <svg className="size-4 text-[#94a3b8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m9 18 6-6-6-6" />
        </svg>
      </button>

      {/* Sello de protección */}
      <div className="flex items-center justify-center gap-1.5 py-1 text-[12px] font-medium text-[#64748b] dark:text-[#94a3b8]">
        <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <span>Tus datos están protegidos</span>
      </div>

      {!tarifaPreviaAceptada && (
        <button
          type="button"
          className="min-h-11 rounded-xl bg-amber-50 p-2.5 text-left text-xs font-bold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
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
