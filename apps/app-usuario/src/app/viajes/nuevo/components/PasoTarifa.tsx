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
      {/* Ilustración superior: nube celeste, auto azul y ruta con pin */}
      <div className="flex flex-col items-center justify-center py-2" aria-hidden="true">
        <div className="relative flex h-20 w-48 items-center justify-center rounded-3xl bg-gradient-to-b from-[#edf5fd] to-[#f4f9ff] dark:from-[#0a2342]/60 dark:to-[#0f2d52]/40">
          {/* Nube decorativa */}
          <div className="absolute inset-0 flex items-center justify-center opacity-70">
            <svg className="h-16 w-36 text-white dark:text-[#133054]" viewBox="0 0 140 60" fill="currentColor">
              <path d="M25 45h90a18 18 0 0 0 4-35 24 24 0 0 0-45-7 18 18 0 0 0-33 12 16 16 0 0 0-16 16c0 8 7 14 16 14Z" />
            </svg>
          </div>
          {/* Auto azul en miniatura */}
          <div className="relative z-10 flex items-center gap-2">
            <svg className="h-10 w-20 text-[#0066FF] drop-shadow-sm" viewBox="0 0 64 32" fill="none">
              <rect x="6" y="10" width="46" height="15" rx="5" fill="#0066FF" />
              <path d="M12 10l5-6h20l6 6H12z" fill="#0052cc" />
              <rect x="18" y="5" width="8" height="5" rx="1" fill="#cce0ff" />
              <rect x="28" y="5" width="10" height="5" rx="1" fill="#cce0ff" />
              <circle cx="16" cy="25" r="4.5" fill="#0a2342" stroke="#ffffff" strokeWidth="1.5" />
              <circle cx="42" cy="25" r="4.5" fill="#0a2342" stroke="#ffffff" strokeWidth="1.5" />
              <circle cx="50" cy="18" r="1.5" fill="#ffdd00" />
            </svg>
            {/* Ruta punteada hacia el pin */}
            <svg className="h-8 w-12 text-[#0066FF]" viewBox="0 0 48 32" fill="none">
              <path d="M2 20c8-10 18-5 26-10" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" strokeLinecap="round" />
              <circle cx="36" cy="10" r="5" fill="#0052cc" />
              <circle cx="36" cy="10" r="2" fill="#ffffff" />
            </svg>
          </div>
        </div>
      </div>

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
              <div className="min-w-0 flex-1 py-1">
                <label htmlFor={`gate-${campo}`} className={styles.label}>
                  Código Postal de {prefijo}
                </label>
                <div className="flex min-w-0 items-center justify-between gap-2">
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
                  <svg className="size-5 shrink-0 text-[#94a3b8] dark:text-[#64748b]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div
                  id={`gate-${prefijo}-cp-status`}
                  className="min-h-4 text-[12px] font-medium text-[#64748b] dark:text-[#a8b5cc]"
                  role="status"
                >
                  {errores[campo] ? (
                    <span className="text-[#ef4444] font-semibold">{errores[campo]}</span>
                  ) : cpConsultando === prefijo ? (
                    "Buscando…"
                  ) : ciudad ? (
                    `${ciudad}, ${estado}`
                  ) : (
                    ""
                  )}
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
          <div className="relative flex items-center">
            <select
              id="gate-marca"
              name="marca"
              value={datos.marca}
              onChange={(e) => actualizarMarcaCatalogo(e.target.value)}
              onBlur={() => validarCampo("marca")}
              aria-invalid={Boolean(errores.marca)}
              aria-describedby={errores.marca ? "gate-marca-error" : undefined}
              className="appearance-none pr-8"
            >
              <option value="">Selecciona</option>
              {MARCAS_CATALOGO.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
            <svg className="pointer-events-none absolute right-3 size-4 text-[#94a3b8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
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
          <div className="relative flex items-center">
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
                className="appearance-none pr-8"
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
            <svg className="pointer-events-none absolute right-3 size-4 text-[#94a3b8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
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
          <div className="relative flex items-center">
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
              className="appearance-none pr-8"
            >
              <option value="">Selecciona condición</option>
              {CONDICIONES_VEHICULO.map((c) => (
                <option key={c.valor} value={c.valor}>
                  {c.etiqueta}
                </option>
              ))}
            </select>
            <svg className="pointer-events-none absolute right-3 size-4 text-[#94a3b8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
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
          className="mb-2 text-[12.5px] font-bold text-[#0a2342] dark:text-[#f6f8fb]"
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
            className="flex items-center justify-center gap-2"
          >
            <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>Lo antes posible</span>
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
            className="flex items-center justify-center gap-2"
          >
            <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>Programar fecha</span>
          </button>
        </div>
        <p
          className="mt-1 min-h-4 text-xs text-[#64748b] dark:text-[#a8b5cc]"
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

      {/* Descarga de Plantilla Oficial y Carga Masiva */}
      <div className="flex flex-col gap-2 pt-1">
        <a
          href="/docs-legales/plantilla-carga-masiva.xlsx"
          download="plantilla-carga-masiva-ruum.xlsx"
          className="flex min-h-[44px] items-center justify-center gap-2 rounded-2xl border border-[#0066FF] bg-white px-4 text-[13.5px] font-bold text-[#0066FF] transition hover:bg-[#edf5fd] dark:bg-[#0a2342] dark:border-[#0066FF] dark:hover:bg-[#0f2d52]"
        >
          <span className="flex size-5 items-center justify-center rounded bg-[#107c41] text-white text-[10px] font-extrabold" aria-hidden="true">X:</span>
          <span>Descargar Plantilla Oficial (xlsx)</span>
        </a>
      </div>

      {/* Tarjeta de Seguridad y Confianza */}
      <div className="flex items-center gap-3 rounded-2xl border border-[#d6e4f7] bg-[#f0f6fd] p-3 text-left dark:border-[#1a3a5c] dark:bg-[#091f38]">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#0066FF] text-white">
          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        </div>
        <div className="text-[12px] leading-relaxed text-[#4e5f80] dark:text-[#a8b5cc]">
          <strong className="block font-semibold text-[#0a2342] dark:text-[#f6f8fb]">Tus datos están seguros.</strong>
          <span>Solo los usamos para calcular tu tarifa.</span>
        </div>
      </div>

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
