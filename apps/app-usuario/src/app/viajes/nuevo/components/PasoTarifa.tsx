"use client";
import React, { memo, useState } from "react";
import Link from "next/link";
import { MobileBottomSheet as BottomSheet } from "@/components/MobileBottomSheet";
import styles from "./cotizador.module.css";
import type { PrevisualizacionTarifa } from "@ruum/api/services";
import { MARCAS_CATALOGO } from "@/lib/catalogo-vehiculos";
import {
  CONDICIONES_VEHICULO,
  SLOTS_HORARIOS,
  type PrefijoDomicilio,
} from "../constants";
import type {
  CondicionVehiculo,
  DatosFormulario,
  ErroresFormulario,
} from "../types";

export interface AccionesPasoTarifa {
  claseControl: (campo: keyof DatosFormulario) => string;
  actualizar: <K extends keyof DatosFormulario>(
    campo: K,
    valor: DatosFormulario[K],
  ) => void;
  actualizarCodigoPostal: (prefijo: PrefijoDomicilio, valor: string) => void;
  actualizarMarcaCatalogo: (marca: string) => void;
  actualizarModeloCatalogo: (modelo: string) => void;
  validarCampo: (campo: keyof DatosFormulario) => void;
  onContinuar: () => void;
}

export interface PasoTarifaProps {
  datos: DatosFormulario;
  errores: ErroresFormulario;
  acciones: AccionesPasoTarifa;
  cpConsultando: PrefijoDomicilio | null;
  modelosDisponibles: string[];
  previsualizacion: PrevisualizacionTarifa | null;
  previsualizando: boolean;
}

function PasoTarifaComponent({
  datos,
  errores,
  acciones,
  cpConsultando,
  modelosDisponibles,
  previsualizacion,
  previsualizando,
}: PasoTarifaProps) {
  const [programando, setProgramando] = useState(false);
  const [verAviso, setVerAviso] = useState(false);
  const {
    claseControl,
    actualizar,
    actualizarCodigoPostal,
    actualizarMarcaCatalogo,
    actualizarModeloCatalogo,
    validarCampo,
  } = acciones;
  return (
    <div className={styles.fields}>
      <section aria-label="Ruta del traslado" className={styles.route}>
        {(["origen", "destino"] as const).map((prefijo) => {
          const campo =
            prefijo === "origen" ? "origenCodigoPostal" : "destinoCodigoPostal";
          const ciudad =
            prefijo === "origen" ? datos.origenCiudad : datos.destinoCiudad;
          const estado =
            prefijo === "origen" ? datos.origenEstado : datos.destinoEstado;
          return (
            <div key={prefijo} className={styles.routeRow}>
              <span
                className={
                  prefijo === "origen" ? styles.origin : styles.destination
                }
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <label htmlFor={`gate-${campo}`} className={styles.label}>
                  Código Postal de {prefijo}
                </label>
                <div className="flex min-w-0 items-center gap-2">
                  <input
                    id={`gate-${campo}`}
                    name={campo}
                    inputMode="numeric"
                    pattern="[0-9]{5}"
                    autoComplete="postal-code"
                    maxLength={5}
                    placeholder={
                      prefijo === "origen" ? "Ej. 03100" : "Ej. 06600"
                    }
                    value={datos[campo]}
                    onChange={(e) =>
                      actualizarCodigoPostal(prefijo, e.target.value)
                    }
                    onBlur={() => validarCampo(campo)}
                    className={styles.postal}
                    aria-invalid={Boolean(errores[campo])}
                    aria-describedby={`gate-${prefijo}-cp-status`}
                  />
                  <span
                    id={`gate-${prefijo}-cp-status`}
                    className="min-w-0 flex-1 text-xs text-[var(--user-color-muted)]"
                    role="status"
                  >
                    {errores[campo] ||
                      (cpConsultando === prefijo
                        ? "Buscando…"
                        : ciudad
                          ? `${ciudad}, ${estado}`
                          : "")}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </section>
      <section aria-label="Datos del vehículo" className={styles.vehicle}>
        <div className={styles.field}>
          <label htmlFor="gate-marca" className={styles.label}>
            Marca
          </label>
          <select
            id="gate-marca"
            name="marca"
            value={datos.marca}
            onChange={(e) => actualizarMarcaCatalogo(e.target.value)}
            onBlur={() => validarCampo("marca")}
            aria-invalid={Boolean(errores.marca)}
            aria-describedby={errores.marca ? "gate-marca-error" : undefined}
          >
            <option value="">Selecciona</option>
            {MARCAS_CATALOGO.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
          {errores.marca && (
            <p id="gate-marca-error" className={styles.error}>
              {errores.marca}
            </p>
          )}
        </div>
        <div className={styles.field}>
          <label htmlFor="gate-modelo" className={styles.label}>
            Modelo
          </label>
          {modelosDisponibles.length ? (
            <select
              id="gate-modelo"
              name="modelo"
              value={datos.modelo}
              onChange={(e) => actualizarModeloCatalogo(e.target.value)}
              onBlur={() => validarCampo("modelo")}
              aria-invalid={Boolean(errores.modelo)}
              aria-describedby={
                errores.modelo ? "gate-modelo-error" : undefined
              }
            >
              <option value="">Selecciona</option>
              {modelosDisponibles.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          ) : (
            <input
              id="gate-modelo"
              name="modelo"
              placeholder="Escribe el modelo"
              value={datos.modelo}
              onChange={(e) => actualizarModeloCatalogo(e.target.value)}
              onBlur={() => validarCampo("modelo")}
              aria-invalid={Boolean(errores.modelo)}
              aria-describedby={
                errores.modelo ? "gate-modelo-error" : undefined
              }
            />
          )}
          {errores.modelo && (
            <p id="gate-modelo-error" className={styles.error}>
              {errores.modelo}
            </p>
          )}
        </div>
        <div className={`${styles.field} ${styles.condition}`}>
          <label htmlFor="gate-condicion" className={styles.label}>
            Condición
          </label>
          <select
            id="gate-condicion"
            name="condicion"
            value={datos.condicion}
            onChange={(e) =>
              actualizar("condicion", e.target.value as CondicionVehiculo)
            }
            onBlur={() => validarCampo("condicion")}
            aria-invalid={Boolean(errores.condicion)}
            aria-describedby={
              errores.condicion ? "gate-condicion-error" : undefined
            }
          >
            <option value="">Selecciona condición</option>
            {CONDICIONES_VEHICULO.map((c) => (
              <option key={c.valor} value={c.valor}>
                {c.etiqueta}
              </option>
            ))}
          </select>
          {errores.condicion && (
            <p id="gate-condicion-error" className={styles.error}>
              {errores.condicion}
            </p>
          )}
        </div>
      </section>
      <section>
        <p
          id="label-gate-modalidad-programacion"
          className="mb-2 text-xs font-semibold"
        >
          ¿Cuándo necesitas el traslado?
        </p>
        <div
          className={styles.segmented}
          role="radiogroup"
          aria-labelledby="label-gate-modalidad-programacion"
        >
          <button
            type="button"
            role="radio"
            aria-checked={datos.modalidadProgramacion === "lo_antes_posible"}
            onClick={() => {
              actualizar("modalidadProgramacion", "lo_antes_posible");
              actualizar("fechaHoraProgramada", "");
              validarCampo("modalidadProgramacion");
            }}
          >
            Lo antes posible
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={datos.modalidadProgramacion === "programado"}
            onClick={() => {
              actualizar("modalidadProgramacion", "programado");
              if (!datos.fechaHoraProgramada) {
                const manana = new Date(Date.now() + 86400000);
                const fecha = new Date(
                  manana.getTime() - manana.getTimezoneOffset() * 60000,
                )
                  .toISOString()
                  .split("T")[0];
                actualizar("fechaHoraProgramada", `${fecha}T09:00`);
              }
              validarCampo("modalidadProgramacion");
              setProgramando(true);
            }}
          >
            Programar fecha
          </button>
        </div>
        <p
          className="mt-1 min-h-4 text-xs text-[var(--user-color-muted)]"
          aria-live="polite"
        >
          {datos.modalidadProgramacion === "programado" &&
          datos.fechaHoraProgramada
            ? new Date(datos.fechaHoraProgramada).toLocaleString("es-MX", {
                dateStyle: "medium",
                timeStyle: "short",
              })
            : ""}
        </p>
      </section>
      {!previsualizando && previsualizacion && !previsualizacion.disponible && (
        <button
          type="button"
          className="min-h-11 text-left text-xs font-semibold text-[var(--user-color-action)]"
          onClick={() => setVerAviso(true)}
        >
          Este traslado requiere cotización especial · Ver opciones
        </button>
      )}
      <BottomSheet
        open={programando}
        onClose={() => setProgramando(false)}
        title="Programar traslado"
      >
        <div className="grid gap-3 rounded-lg border border-ink/10 bg-mist p-4">
          <p className="font-body text-xs font-semibold uppercase tracking-wide text-ink/45">
            Fecha y horario del servicio
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label
              htmlFor="gate-fechaHoraProgramada"
              className="flex flex-col gap-1.5"
            >
              <span className="font-body text-sm font-medium">
                Fecha de recolección
              </span>
              <input
                id="gate-fechaHoraProgramada"
                name="fechaHoraProgramada"
                type="date"
                value={
                  datos.fechaHoraProgramada
                    ? datos.fechaHoraProgramada.split("T")[0]
                    : ""
                }
                min={
                  new Date(Date.now() + 2 * 60 * 60 * 1000)
                    .toISOString()
                    .split("T")[0]
                }
                onChange={(e) => {
                  const fecha = e.target.value;
                  const horaActual = datos.fechaHoraProgramada
                    ? (datos.fechaHoraProgramada.split("T")[1]?.slice(0, 5) ??
                      "09:00")
                    : "09:00";
                  if (!fecha) actualizar("fechaHoraProgramada", "");
                  else
                    actualizar("fechaHoraProgramada", `${fecha}T${horaActual}`);
                }}
                onBlur={() => validarCampo("fechaHoraProgramada")}
                className={`rounded-lg border bg-mist px-3.5 py-2.5 font-body text-sm ${claseControl("fechaHoraProgramada")}`}
                aria-invalid={Boolean(errores.fechaHoraProgramada)}
                aria-describedby={
                  errores.fechaHoraProgramada
                    ? "gate-fecha-error"
                    : "gate-fecha-ayuda"
                }
              />
            </label>

            <div className="flex flex-col gap-1.5">
              <span
                id="label-gate-slots-horario"
                className="font-body text-sm font-medium"
              >
                Horario sugerido
              </span>
              <div
                className="grid grid-cols-2 gap-1.5"
                role="radiogroup"
                aria-labelledby="label-gate-slots-horario"
              >
                {SLOTS_HORARIOS.map((s) => {
                  const t = datos.fechaHoraProgramada
                    ? (datos.fechaHoraProgramada.split("T")[1]?.slice(0, 5) ??
                      "")
                    : "";
                  const seleccionado =
                    s.id === "personalizado"
                      ? Boolean(
                          t &&
                            !SLOTS_HORARIOS.some(
                              (slot) =>
                                slot.id !== "personalizado" && slot.hora === t,
                            ),
                        )
                      : s.hora === t;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      role="radio"
                      aria-checked={seleccionado}
                      aria-label={s.etiqueta}
                      onClick={() => {
                        const fecha = datos.fechaHoraProgramada
                          ? datos.fechaHoraProgramada.split("T")[0]
                          : new Date(Date.now() + 24 * 60 * 60 * 1000)
                              .toISOString()
                              .split("T")[0];
                        if (s.hora)
                          actualizar(
                            "fechaHoraProgramada",
                            `${fecha}T${s.hora}`,
                          );
                        else {
                          const h = t || "10:00";
                          actualizar("fechaHoraProgramada", `${fecha}T${h}`);
                        }
                        validarCampo("fechaHoraProgramada");
                      }}
                      className={[
                        "rounded-lg border px-2.5 py-2 text-left font-body text-xs font-semibold transition-all focus-visible:outline-route-dark",
                        seleccionado
                          ? "border-route bg-route-soft text-route-dark shadow-xs"
                          : "border-ink/20 bg-mist text-ink/75 hover:border-ink/40 hover:text-ink",
                      ].join(" ")}
                    >
                      {s.etiqueta.split("·")[0]}
                      <span className="block text-[10px] font-normal opacity-70">
                        {s.etiqueta.includes("·")
                          ? s.etiqueta.split("·")[1]
                          : "Hora exacta"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {(() => {
            const t = datos.fechaHoraProgramada
              ? (datos.fechaHoraProgramada.split("T")[1]?.slice(0, 5) ?? "")
              : "";
            const esPersonalizado =
              t &&
              !SLOTS_HORARIOS.some(
                (s) => s.id !== "personalizado" && s.hora === t,
              );
            if (!esPersonalizado) return null;
            return (
              <label
                htmlFor="gate-horaExactaProgramada"
                className="flex flex-col gap-1.5 mt-2"
              >
                <span className="font-body text-sm font-medium">
                  Especificar hora exacta
                </span>
                <input
                  id="gate-horaExactaProgramada"
                  type="time"
                  value={t}
                  onChange={(e) => {
                    const fecha = datos.fechaHoraProgramada
                      ? datos.fechaHoraProgramada.split("T")[0]
                      : new Date().toISOString().split("T")[0];
                    actualizar(
                      "fechaHoraProgramada",
                      `${fecha}T${e.target.value}`,
                    );
                  }}
                  onBlur={() => validarCampo("fechaHoraProgramada")}
                  className="rounded-lg border border-ink/50 bg-mist px-3.5 py-2.5 font-body text-sm focus-visible:outline-route-dark"
                />
              </label>
            );
          })()}

          <div className="flex items-center gap-2 rounded-lg border border-route/15 bg-route-soft/50 p-2.5 font-body text-xs text-ink/70">
            <span aria-hidden="true">🌐</span>
            <span>
              Zona horaria:{" "}
              <strong className="text-ink">
                {typeof Intl !== "undefined"
                  ? Intl.DateTimeFormat().resolvedOptions().timeZone
                  : "America/Mexico_City"}{" "}
                (hora local del dispositivo)
              </strong>{" "}
              · Anticipación mínima de 2 horas.
            </span>
          </div>
          <p id="gate-fecha-ayuda" className="sr-only">
            Fecha mínima con 2 horas de anticipación respecto a ahora en tu zona
            horaria.
          </p>
          {errores.fechaHoraProgramada && (
            <p id="gate-fecha-error" className="font-body text-xs text-danger">
              {errores.fechaHoraProgramada}
            </p>
          )}
        </div>
        <button
          type="button"
          className="mt-4 min-h-12 w-full rounded-xl bg-[var(--user-color-action)] font-semibold text-[var(--user-color-on-action)]"
          onClick={() => {
            validarCampo("fechaHoraProgramada");
            setProgramando(false);
          }}
        >
          Confirmar horario
        </button>
      </BottomSheet>
      <BottomSheet
        open={verAviso}
        onClose={() => setVerAviso(false)}
        title="Cotización especial"
      >
        <p className="text-sm">
          {previsualizacion?.motivo?.replace(
            "Torre de Control",
            "nuestro equipo",
          ) || "Nuestro equipo debe calcular tu tarifa manualmente."}
        </p>
        <Link
          className="mt-4 flex min-h-12 items-center justify-center rounded-xl bg-[var(--user-color-action)] text-sm font-semibold text-[var(--user-color-on-action)]"
          href="/soporte"
        >
          Solicitar cotización especial
        </Link>
      </BottomSheet>
    </div>
  );
}

function areEqualPasoTarifa(prev: PasoTarifaProps, next: PasoTarifaProps) {
  // Sin `prev.datos === next.datos`: esa identidad ya cortaba cualquier cambio
  // del formulario y volvía muertas las comparaciones de abajo. Se comparan
  // los campos que el paso renderiza (incl. ciudad/estado derivados del CP,
  // que llegan por lookup sin cambiar el CP).
  return (
    prev.datos.origenCodigoPostal === next.datos.origenCodigoPostal &&
    prev.datos.origenCiudad === next.datos.origenCiudad &&
    prev.datos.origenEstado === next.datos.origenEstado &&
    prev.datos.destinoCodigoPostal === next.datos.destinoCodigoPostal &&
    prev.datos.destinoCiudad === next.datos.destinoCiudad &&
    prev.datos.destinoEstado === next.datos.destinoEstado &&
    prev.datos.marca === next.datos.marca &&
    prev.datos.modelo === next.datos.modelo &&
    prev.datos.condicion === next.datos.condicion &&
    prev.datos.modalidadProgramacion === next.datos.modalidadProgramacion &&
    prev.datos.fechaHoraProgramada === next.datos.fechaHoraProgramada &&
    prev.modelosDisponibles === next.modelosDisponibles &&
    prev.acciones === next.acciones &&
    prev.previsualizacion === next.previsualizacion &&
    prev.previsualizando === next.previsualizando &&
    prev.cpConsultando === next.cpConsultando &&
    prev.errores === next.errores
  );
}
export const PasoTarifa = memo(PasoTarifaComponent, areEqualPasoTarifa);
