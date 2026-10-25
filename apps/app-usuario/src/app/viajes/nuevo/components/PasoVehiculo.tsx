"use client";
import React, { memo, useState } from "react";
import { Field } from "@ruum/ui";
import { MobileBottomSheet as BottomSheet } from "@/components/MobileBottomSheet";
import styles from "./cotizador.module.css";
import { ETIQUETA_TIPO_VEHICULO } from "@ruum/shared/constants";
import type { PrevisualizacionTarifa } from "@ruum/api/services";
import { MARCAS_CATALOGO } from "@/lib/catalogo-vehiculos";
import { CONDICIONES_VEHICULO, ESTADOS_GENERALES_VEHICULO } from "../constants";
import type {
  CondicionVehiculo,
  DatosFormulario,
  ErroresFormulario,
  TransmisionVehiculo,
  VehiculoGuardado,
} from "../types";

export interface AccionesPasoVehiculo {
  claseControl: (campo: keyof DatosFormulario) => string;
  actualizar: <K extends keyof DatosFormulario>(
    campo: K,
    valor: DatosFormulario[K],
  ) => void;
  actualizarMarcaCatalogo: (marca: string) => void;
  actualizarModeloCatalogo: (modelo: string) => void;
  validarCampo: (campo: keyof DatosFormulario) => void;
  aplicarVehiculoGuardado: (vehiculo: VehiculoGuardado) => void;
  limpiarVehiculoGuardado: () => void;
  setDetallesVehiculoExpandido: (valor: React.SetStateAction<boolean>) => void;
  onEditarTarifa: () => void;
}

export interface PasoVehiculoProps {
  datos: DatosFormulario;
  errores: ErroresFormulario;
  acciones: AccionesPasoVehiculo;
  vehiculosGuardados: VehiculoGuardado[];
  vehiculoSeleccionadoId: string;
  categoriaCatalogo: string;
  gamaCatalogo: string;
  modelosDisponibles: string[];
  clasificacionCatalogo: string | null;
  previsualizacion: PrevisualizacionTarifa | null;
  detallesVehiculoExpandido: boolean;
  tarifaPreviaAceptada?: boolean;
}

function PasoVehiculoComponent({
  datos,
  errores,
  acciones,
  vehiculosGuardados,
  vehiculoSeleccionadoId,
  categoriaCatalogo,
  gamaCatalogo,
  modelosDisponibles,
  clasificacionCatalogo,
  detallesVehiculoExpandido,
}: PasoVehiculoProps) {
  const [informacion, setInformacion] = useState(false);
  const [guardados, setGuardados] = useState(false);
  const {
    claseControl,
    actualizar,
    actualizarMarcaCatalogo,
    actualizarModeloCatalogo,
    validarCampo,
    aplicarVehiculoGuardado,
    limpiarVehiculoGuardado,
    setDetallesVehiculoExpandido,
  } = acciones;
  const modelosMemo = modelosDisponibles;
  return (
    <div className={styles.fields}>
      <div className="flex flex-col gap-3">
        {/* Marca */}
        <div className="relative flex items-center rounded-2xl border border-[#e2e8f0] bg-white p-3 shadow-2xs transition focus-within:border-[#0066FF] dark:border-[#1a3a5c] dark:bg-[#0a2342]">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#f1f5fa] text-[#64748b] dark:bg-[#0f2d52] dark:text-[#a8b5cc]" aria-hidden="true">
            <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
              <circle cx="7" cy="17" r="2" />
              <path d="M9 17h6" />
              <circle cx="17" cy="17" r="2" />
            </svg>
          </span>
          <div className="ml-3 min-w-0 flex-1">
            <label htmlFor="marca" className="block text-[11.5px] font-semibold text-[#64748b] dark:text-[#a8b5cc]">
              Marca
            </label>
            <input
              id="marca"
              name="marca"
              list="catalogo-marca"
              autoComplete="off"
              value={datos.marca}
              onChange={(e) => actualizarMarcaCatalogo(e.target.value)}
              onBlur={() => validarCampo("marca")}
              className="w-full border-0 bg-transparent p-0 text-[15px] font-bold text-[#0a2342] outline-none placeholder:text-[#94a3b8] dark:text-[#f6f8fb]"
              placeholder="Selecciona o escribe marca"
              aria-invalid={Boolean(errores.marca)}
              aria-describedby={errores.marca ? "marca-error" : undefined}
            />
            <datalist id="catalogo-marca">
              {MARCAS_CATALOGO.map((v) => (
                <option key={v} value={v} />
              ))}
            </datalist>
          </div>
          <svg className="pointer-events-none size-4 shrink-0 text-[#94a3b8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m6 9 6 6 6-6" />
          </svg>
          {errores.marca && (
            <p id="marca-error" className="absolute bottom-1 left-16 text-[10px] text-[#ef4444]">
              {errores.marca}
            </p>
          )}
        </div>

        {/* Modelo */}
        <div className="relative flex items-center rounded-2xl border border-[#e2e8f0] bg-white p-3 shadow-2xs transition focus-within:border-[#0066FF] dark:border-[#1a3a5c] dark:bg-[#0a2342]">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#f1f5fa] text-[#64748b] dark:bg-[#0f2d52] dark:text-[#a8b5cc]" aria-hidden="true">
            <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
              <circle cx="7" cy="17" r="2" />
              <path d="M9 17h6" />
              <circle cx="17" cy="17" r="2" />
            </svg>
          </span>
          <div className="ml-3 min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <label htmlFor="modelo" className="block text-[11.5px] font-semibold text-[#64748b] dark:text-[#a8b5cc]">
                Modelo
              </label>
              <button
                type="button"
                aria-label="Información del modelo"
                onClick={() => setInformacion(true)}
                className="inline-flex size-5 items-center justify-center rounded-full text-[11px] font-bold text-[#0066FF] hover:bg-[#edf5fd]"
              >
                ⓘ
              </button>
            </div>
            <input
              id="modelo"
              name="modelo"
              list="catalogo-modelo"
              autoComplete="off"
              value={datos.modelo}
              onChange={(e) => actualizarModeloCatalogo(e.target.value)}
              onBlur={() => validarCampo("modelo")}
              disabled={!datos.marca.trim()}
              className="w-full border-0 bg-transparent p-0 text-[15px] font-bold text-[#0a2342] outline-none placeholder:text-[#94a3b8] dark:text-[#f6f8fb]"
              placeholder="Selecciona o escribe modelo"
              aria-invalid={Boolean(errores.modelo)}
              aria-describedby={errores.modelo ? "modelo-error" : undefined}
            />
            <datalist id="catalogo-modelo">
              {modelosMemo.map((v) => (
                <option key={v} value={v} />
              ))}
            </datalist>
          </div>
          <svg className="pointer-events-none size-4 shrink-0 text-[#94a3b8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m6 9 6 6 6-6" />
          </svg>
          {errores.modelo && (
            <p id="modelo-error" className="absolute bottom-1 left-16 text-[10px] text-[#ef4444]">
              {errores.modelo}
            </p>
          )}
        </div>

        {/* Transmisión */}
        <div className="relative flex items-center rounded-2xl border border-[#e2e8f0] bg-white p-3 shadow-2xs transition focus-within:border-[#0066FF] dark:border-[#1a3a5c] dark:bg-[#0a2342]">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#f1f5fa] text-[#64748b] dark:bg-[#0f2d52] dark:text-[#a8b5cc]" aria-hidden="true">
            <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </span>
          <div className="ml-3 min-w-0 flex-1">
            <label htmlFor="transmision" className="block text-[11.5px] font-semibold text-[#64748b] dark:text-[#a8b5cc]">
              Transmisión
            </label>
            <select
              id="transmision"
              name="transmision"
              value={datos.transmision}
              onChange={(e) =>
                actualizar("transmision", e.target.value as TransmisionVehiculo)
              }
              onBlur={() => validarCampo("transmision")}
              aria-invalid={Boolean(errores.transmision)}
              className="w-full border-0 bg-transparent p-0 text-[15px] font-bold text-[#0a2342] outline-none appearance-none dark:text-[#f6f8fb]"
            >
              <option value="automatica">Automática</option>
              <option value="manual">Manual</option>
              <option value="electrica">Eléctrica</option>
            </select>
          </div>
          <svg className="pointer-events-none size-4 shrink-0 text-[#94a3b8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m6 9 6 6 6-6" />
          </svg>
          {errores.transmision && (
            <p className="absolute bottom-1 left-16 text-[10px] text-[#ef4444]">{errores.transmision}</p>
          )}
        </div>

        {/* Año */}
        <div className="relative flex items-center rounded-2xl border border-[#e2e8f0] bg-white p-3 shadow-2xs transition focus-within:border-[#0066FF] dark:border-[#1a3a5c] dark:bg-[#0a2342]">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#f1f5fa] text-[#64748b] dark:bg-[#0f2d52] dark:text-[#a8b5cc]" aria-hidden="true">
            <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </span>
          <div className="ml-3 min-w-0 flex-1">
            <label htmlFor="anio" className="block text-[11.5px] font-semibold text-[#64748b] dark:text-[#a8b5cc]">
              Año
            </label>
            <input
              id="anio"
              name="anio"
              inputMode="numeric"
              pattern="[0-9]{4}"
              maxLength={4}
              placeholder="Ej. 2026"
              value={datos.anio}
              onChange={(e) =>
                actualizar("anio", e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              onBlur={() => validarCampo("anio")}
              aria-invalid={Boolean(errores.anio)}
              className="w-full border-0 bg-transparent p-0 text-[15px] font-bold text-[#0a2342] outline-none placeholder:text-[#94a3b8] dark:text-[#f6f8fb]"
            />
          </div>
          <svg className="pointer-events-none size-4 shrink-0 text-[#94a3b8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m6 9 6 6 6-6" />
          </svg>
          {errores.anio && <p className="absolute bottom-1 left-16 text-[10px] text-[#ef4444]">{errores.anio}</p>}
        </div>

        {/* Condición */}
        <div className="relative flex items-center rounded-2xl border border-[#e2e8f0] bg-white p-3 shadow-2xs transition focus-within:border-[#0066FF] dark:border-[#1a3a5c] dark:bg-[#0a2342]">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#f1f5fa] text-[#64748b] dark:bg-[#0f2d52] dark:text-[#a8b5cc]" aria-hidden="true">
            <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </span>
          <div className="ml-3 min-w-0 flex-1">
            <label htmlFor="condicion" className="block text-[11.5px] font-semibold text-[#64748b] dark:text-[#a8b5cc]">
              Condición
            </label>
            <select
              id="condicion"
              name="condicion"
              value={datos.condicion}
              onChange={(e) =>
                actualizar("condicion", e.target.value as CondicionVehiculo)
              }
              onBlur={() => validarCampo("condicion")}
              aria-invalid={Boolean(errores.condicion)}
              className="w-full border-0 bg-transparent p-0 text-[15px] font-bold text-[#0a2342] outline-none appearance-none dark:text-[#f6f8fb]"
            >
              <option value="">Selecciona condición</option>
              {CONDICIONES_VEHICULO.map((c) => (
                <option key={c.valor} value={c.valor}>
                  {c.etiqueta}
                </option>
              ))}
            </select>
          </div>
          <svg className="pointer-events-none size-4 shrink-0 text-[#94a3b8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m6 9 6 6 6-6" />
          </svg>
          {errores.condicion && (
            <p className="absolute bottom-1 left-16 text-[10px] text-[#ef4444]">{errores.condicion}</p>
          )}
        </div>
      </div>

      {/* Tarjeta destacada: Detalles del vehículo (Color, placas y VIN) */}
      <button
        type="button"
        onClick={() => setDetallesVehiculoExpandido(true)}
        aria-haspopup="dialog"
        className="mt-2 flex w-full items-center justify-between rounded-2xl border border-dashed border-[#0066FF]/40 bg-[#f0f7ff] p-4 text-left transition hover:bg-[#e4effb] dark:border-[#0066FF]/30 dark:bg-[#091f38]"
      >
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#0066FF] shadow-2xs dark:bg-[#0a2342]" aria-hidden="true">
            <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h6v6" />
              <path d="M10 14 21 3" />
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            </svg>
          </span>
          <div>
            <span className="block text-[14px] font-bold text-[#0066FF] dark:text-[#4d94ff]">
              Detalles del vehículo
            </span>
            <span className="block text-[12px] text-[#64748b] dark:text-[#a8b5cc]">
              Color, placas y VIN
            </span>
          </div>
        </div>
        <svg className="size-4 text-[#0066FF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m9 18 6-6-6-6" />
        </svg>
      </button>

      {vehiculosGuardados.length > 0 && (
        <button
          type="button"
          onClick={() => setGuardados(true)}
          className="min-h-11 text-left text-sm font-semibold text-[#0066FF] hover:underline"
        >
          Usar vehículo guardado
        </button>
      )}
      <BottomSheet
        open={detallesVehiculoExpandido}
        onClose={() => setDetallesVehiculoExpandido(false)}
        title="Detalles del vehículo"
      >
        <div
          id="vehiculo-detalles-expandibles"
          className="grid gap-4 animate-fade-in"
        >
          <Field
            etiqueta="Color"
            name="color"
            id="color"
            value={datos.color}
            onChange={(e) => actualizar("color", e.target.value)}
            onBlur={() => validarCampo("color")}
            error={errores.color}
            required
          />
          <Field
            etiqueta="Placas"
            name="placas"
            id="placas"
            value={datos.placas}
            onChange={(e) => actualizar("placas", e.target.value)}
            onBlur={() => validarCampo("placas")}
            error={errores.placas}
            autoCapitalize="characters"
            autoCorrect="off"
            required
          />
          <Field
            etiqueta="Número de serie / VIN"
            name="vin"
            id="vin"
            value={datos.vin}
            onChange={(e) => actualizar("vin", e.target.value)}
            onBlur={() => validarCampo("vin")}
            error={errores.vin}
            autoCapitalize="characters"
            autoCorrect="off"
            ayuda="17 caracteres. Obligatorio para confirmar traslado."
            required
          />
          <label htmlFor="estadoGeneral" className="flex flex-col gap-1.5">
            <span className="font-body text-sm font-medium">
              Estado general declarado
            </span>
            <select
              id="estadoGeneral"
              name="estadoGeneral"
              value={datos.estadoGeneral}
              onChange={(e) => actualizar("estadoGeneral", e.target.value)}
              onBlur={() => validarCampo("estadoGeneral")}
              className={`rounded-lg border bg-mist px-3.5 py-2.5 font-body text-sm text-ink focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-1 focus-visible:outline-route-dark ${claseControl("estadoGeneral")}`}
              aria-invalid={Boolean(errores.estadoGeneral)}
              aria-describedby={
                errores.estadoGeneral ? "estadoGeneral-error" : undefined
              }
            >
              <option value="">Selecciona estado</option>
              {ESTADOS_GENERALES_VEHICULO.map((estado) => (
                <option key={estado} value={estado}>
                  {estado}
                </option>
              ))}
            </select>
            {errores.estadoGeneral && (
              <p
                id="estadoGeneral-error"
                className="font-body text-xs text-danger"
              >
                {errores.estadoGeneral}
              </p>
            )}
          </label>

          <div className="grid gap-3 rounded-lg border border-ink/10 p-4">
            <div>
              <p className="font-body text-sm font-semibold">
                Documentación mínima requerida
              </p>
              <p className="mt-1 font-body text-xs text-ink/65">
                {datos.condicion === "rescate_mecanico"
                  ? "Para rescate mecánico el vehículo puede no circular rodando — se asignará grúa o plataforma. Sigue requiriendo tarjeta, verificación y placas vigentes."
                  : "Por el momento, el servicio está disponible únicamente para vehículos que encienden, cuentan con documentación vigente y pueden circular rodando."}
              </p>
            </div>
            {(
              [
                ["tieneTarjeta", "Tarjeta de circulación vigente"],
                ["tieneVerificacion", "Verificación vehicular vigente"],
                ["tienePlacas", "Ambas placas instaladas"],
                [
                  "puedeCircular",
                  "El vehículo enciende y puede circular rodando",
                ],
              ] as const
            ).map(([campo, etiqueta]) => (
              <div key={campo} className="grid gap-1">
                <label className="flex items-center gap-2.5 font-body text-sm">
                  <input
                    id={campo}
                    name={campo}
                    type="checkbox"
                    checked={datos[campo]}
                    onChange={(e) => actualizar(campo, e.target.checked)}
                    onBlur={() => validarCampo(campo)}
                    className={`size-5 rounded text-signal focus-visible:outline-route-dark ${errores[campo] ? "border-danger" : "border-ink/50"}`}
                    aria-invalid={Boolean(errores[campo])}
                    aria-describedby={
                      errores[campo] ? `${campo}-error` : undefined
                    }
                  />
                  {etiqueta}
                </label>
                {errores[campo] && (
                  <p
                    id={`${campo}-error`}
                    className="pl-7 font-body text-xs text-danger"
                  >
                    {errores[campo]}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
        <button
          type="button"
          className="mt-4 min-h-12 w-full rounded-xl bg-[var(--user-color-action)] text-[var(--user-color-on-action)]"
          onClick={() => {
            (
              [
                "color",
                "placas",
                "vin",
                "estadoGeneral",
                "tieneTarjeta",
                "tieneVerificacion",
                "tienePlacas",
                "puedeCircular",
              ] as const
            ).forEach(validarCampo);
            setDetallesVehiculoExpandido(false);
          }}
        >
          Guardar detalles
        </button>
      </BottomSheet>
      <BottomSheet
        open={informacion}
        onClose={() => setInformacion(false)}
        title="Información del modelo"
      >
        <dl className="grid grid-cols-2 gap-3">
          <dt>Categoría</dt>
          <dd>{categoriaCatalogo}</dd>
          <dt>Gama</dt>
          <dd>{gamaCatalogo}</dd>
          <dt>Tipo de vehículo</dt>
          <dd>{ETIQUETA_TIPO_VEHICULO[datos.tipo]}</dd>
        </dl>
        <p className="mt-4 text-sm">
          {clasificacionCatalogo
            ? `Clasificación del catálogo: ${clasificacionCatalogo}. El tipo de vehículo se prellenó automáticamente.`
            : datos.marca.trim()
              ? `${modelosMemo.length} modelos disponibles. Al elegir uno sugeriremos el tipo de vehículo.`
              : "Primero captura o selecciona la marca."}
        </p>
      </BottomSheet>
      <BottomSheet
        open={guardados}
        onClose={() => setGuardados(false)}
        title="Vehículos guardados"
      >
        {vehiculosGuardados.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => {
              aplicarVehiculoGuardado(v);
              setGuardados(false);
            }}
            className="mb-2 min-h-12 w-full rounded-xl border border-[var(--user-color-border)] p-3 text-left"
            aria-pressed={vehiculoSeleccionadoId === v.id}
          >
            {v.marca} {v.modelo} {v.anio} · {v.placas || "Sin placas"}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            limpiarVehiculoGuardado();
            setGuardados(false);
          }}
          className="min-h-11 w-full"
        >
          Capturar como vehículo nuevo
        </button>
      </BottomSheet>
    </div>
  );
}

function areEqualPasoVehiculo(
  prev: PasoVehiculoProps,
  next: PasoVehiculoProps,
) {
  // Sin `prev.datos === next.datos` (cortaba todo cambio; resto muerto).
  return (
    prev.datos.tipo === next.datos.tipo &&
    prev.datos.marca === next.datos.marca &&
    prev.datos.modelo === next.datos.modelo &&
    prev.datos.anio === next.datos.anio &&
    prev.datos.condicion === next.datos.condicion &&
    prev.datos.transmision === next.datos.transmision &&
    prev.datos.color === next.datos.color &&
    prev.datos.placas === next.datos.placas &&
    prev.datos.vin === next.datos.vin &&
    prev.datos.estadoGeneral === next.datos.estadoGeneral &&
    prev.datos.tieneTarjeta === next.datos.tieneTarjeta &&
    prev.datos.tieneVerificacion === next.datos.tieneVerificacion &&
    prev.datos.tienePlacas === next.datos.tienePlacas &&
    prev.datos.puedeCircular === next.datos.puedeCircular &&
    prev.acciones === next.acciones &&
    prev.previsualizacion === next.previsualizacion &&
    prev.vehiculoSeleccionadoId === next.vehiculoSeleccionadoId &&
    prev.errores === next.errores &&
    prev.modelosDisponibles === next.modelosDisponibles &&
    prev.vehiculosGuardados === next.vehiculosGuardados &&
    prev.categoriaCatalogo === next.categoriaCatalogo &&
    prev.gamaCatalogo === next.gamaCatalogo &&
    prev.clasificacionCatalogo === next.clasificacionCatalogo &&
    prev.detallesVehiculoExpandido === next.detallesVehiculoExpandido &&
    prev.tarifaPreviaAceptada === next.tarifaPreviaAceptada
  );
}
export const PasoVehiculo = memo(PasoVehiculoComponent, areEqualPasoVehiculo);
