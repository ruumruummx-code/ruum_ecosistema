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
      <div className={styles.vehicle}>
        {(["marca", "modelo"] as const).map((campo) => (
          <div key={campo} className={styles.field}>
            <div className="relative">
              <label htmlFor={campo} className={styles.label}>
                {campo === "marca" ? "Marca" : "Modelo"}
              </label>
              {campo === "modelo" && (
                <button
                  type="button"
                  aria-label="Información del modelo"
                  onClick={() => setInformacion(true)}
                  className="absolute right-0 top-0 flex min-h-11 min-w-11 items-center justify-center text-sm"
                >
                  ⓘ
                </button>
              )}
            </div>
            <input
              id={campo}
              name={campo}
              list={`catalogo-${campo}`}
              autoComplete="off"
              value={datos[campo]}
              onChange={(e) =>
                campo === "marca"
                  ? actualizarMarcaCatalogo(e.target.value)
                  : actualizarModeloCatalogo(e.target.value)
              }
              onBlur={() => validarCampo(campo)}
              disabled={campo === "modelo" && !datos.marca.trim()}
              className={claseControl(campo)}
              aria-invalid={Boolean(errores[campo])}
              aria-describedby={errores[campo] ? `${campo}-error` : undefined}
            />
            <datalist id={`catalogo-${campo}`}>
              {(campo === "marca" ? MARCAS_CATALOGO : modelosMemo).map((v) => (
                <option key={v} value={v} />
              ))}
            </datalist>
            {errores[campo] && (
              <p id={`${campo}-error`} className={styles.error}>
                {errores[campo]}
              </p>
            )}
          </div>
        ))}
        <div className={styles.field}>
          <label htmlFor="transmision" className={styles.label}>
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
          >
            <option value="automatica">Automática</option>
            <option value="manual">Manual</option>
            <option value="electrica">Eléctrica</option>
          </select>
          {errores.transmision && (
            <p className={styles.error}>{errores.transmision}</p>
          )}
        </div>
        <div className={styles.field}>
          <label htmlFor="anio" className={styles.label}>
            Año
          </label>
          <input
            id="anio"
            name="anio"
            inputMode="numeric"
            pattern="[0-9]{4}"
            maxLength={4}
            value={datos.anio}
            onChange={(e) =>
              actualizar("anio", e.target.value.replace(/\D/g, "").slice(0, 4))
            }
            onBlur={() => validarCampo("anio")}
            aria-invalid={Boolean(errores.anio)}
          />
          {errores.anio && <p className={styles.error}>{errores.anio}</p>}
        </div>
        <div className={`${styles.field} ${styles.condition}`}>
          <label htmlFor="condicion" className={styles.label}>
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
          >
            <option value="">Selecciona condición</option>
            {CONDICIONES_VEHICULO.map((c) => (
              <option key={c.valor} value={c.valor}>
                {c.etiqueta}
              </option>
            ))}
          </select>
          {errores.condicion && (
            <p className={styles.error}>{errores.condicion}</p>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={() => setDetallesVehiculoExpandido(true)}
        aria-haspopup="dialog"
        className="min-h-11 text-left text-sm font-semibold text-[var(--user-color-action)]"
      >
        Detalles del vehículo · Color, placas y VIN
      </button>
      {vehiculosGuardados.length > 0 && (
        <button
          type="button"
          onClick={() => setGuardados(true)}
          className="min-h-11 text-left text-sm"
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
