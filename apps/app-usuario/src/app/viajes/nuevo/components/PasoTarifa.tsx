"use client";
import React, { memo, useState } from "react";
import Link from "next/link";
import { CarFront, ChevronDown, Gauge, Globe, MapPin, ShieldCheck, Tag } from "lucide-react";
import { Button, ChipGroup, Input, InputConIcono, Label, NativeSelect } from "@ruum/ui/base";
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

const preguntaHorario = "¿Cuándo necesitas el traslado?";
const opcionesHorario = [
  { id: "lo_antes_posible", etiqueta: "Lo antes posible" },
  { id: "programado", etiqueta: "Programar fecha" },
] satisfies { id: DatosFormulario["modalidadProgramacion"]; etiqueta: string }[];

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
    actualizar,
    actualizarCodigoPostal,
    actualizarMarcaCatalogo,
    actualizarModeloCatalogo,
    validarCampo,
  } = acciones;

  function cambiarProgramacion(modalidad: DatosFormulario["modalidadProgramacion"]) {
    actualizar("modalidadProgramacion", modalidad);
    if (modalidad === "lo_antes_posible") {
      actualizar("fechaHoraProgramada", "");
    } else {
      if (!datos.fechaHoraProgramada) {
        const manana = new Date(Date.now() + 86400000);
        const fecha = new Date(manana.getTime() - manana.getTimezoneOffset() * 60000)
          .toISOString().split("T")[0];
        actualizar("fechaHoraProgramada", `${fecha}T09:00`);
      }
      setProgramando(true);
    }
    validarCampo("modalidadProgramacion");
  }

  return (
    <div className={styles.camposCotizacion}>
      <section aria-label="Ruta del traslado" className={styles.trayecto}>
        {(["origen", "destino"] as const).map((prefijo) => {
          const campo = prefijo === "origen" ? "origenCodigoPostal" : "destinoCodigoPostal";
          const ciudad = prefijo === "origen" ? datos.origenCiudad : datos.destinoCiudad;
          const estado = prefijo === "origen" ? datos.origenEstado : datos.destinoEstado;
          const estadoId = `gate-${prefijo}-cp-status`;
          return (
            <div key={prefijo} className={styles.puntoRuta}>
              <div className="grid min-w-0 gap-1.5">
                <Label htmlFor={`gate-${campo}`} className="text-xs font-semibold">
                  Código Postal de {prefijo}
                </Label>
                <InputConIcono
                  id={`gate-${campo}`}
                  name={campo}
                  icono={<MapPin strokeWidth={1.5} />}
                  inputMode="numeric"
                  pattern="[0-9]{5}"
                  autoComplete="postal-code"
                  maxLength={5}
                  placeholder={prefijo === "origen" ? "Ej. 03100" : "Ej. 06600"}
                  value={datos[campo]}
                  onChange={(e) => actualizarCodigoPostal(prefijo, e.target.value)}
                  onBlur={() => validarCampo(campo)}
                  className={styles.controlCotizacion}
                  aria-invalid={Boolean(errores[campo])}
                  aria-describedby={estadoId}
                />
                <div id={estadoId} className="text-xs text-ui-fg-muted" role="status">
                  {errores[campo] ? (
                    <span className="font-semibold text-ui-danger">{errores[campo]}</span>
                  ) : cpConsultando === prefijo ? "Buscando…" : ciudad ? `${ciudad}, ${estado}` : null}
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <section aria-label="Datos del vehículo" className={styles.vehiculoCotizacion}>
        <div className="grid min-w-0 gap-1.5">
          <Label htmlFor="gate-marca" className="text-xs font-semibold">Marca</Label>
          <div className={styles.selectorCotizacion}>
            <CarFront strokeWidth={1.5} aria-hidden="true" />
            <NativeSelect
              id="gate-marca"
              name="marca"
              value={datos.marca}
              onChange={(e) => actualizarMarcaCatalogo(e.target.value)}
              onBlur={() => validarCampo("marca")}
              aria-invalid={Boolean(errores.marca)}
              aria-describedby={errores.marca ? "gate-marca-error" : undefined}
              className={styles.controlCotizacion}
            >
              <option value="">Selecciona</option>
              {MARCAS_CATALOGO.map((marca) => <option key={marca}>{marca}</option>)}
            </NativeSelect>
            <ChevronDown strokeWidth={1.5} aria-hidden="true" />
          </div>
          {errores.marca && <p id="gate-marca-error" className="text-xs text-ui-danger">{errores.marca}</p>}
        </div>

        <div className="grid min-w-0 gap-1.5">
          <Label htmlFor="gate-modelo" className="text-xs font-semibold">Modelo</Label>
          {modelosDisponibles.length ? (
            <div className={styles.selectorCotizacion}>
              <Tag strokeWidth={1.5} aria-hidden="true" />
              <NativeSelect
                id="gate-modelo"
                name="modelo"
                value={datos.modelo}
                onChange={(e) => actualizarModeloCatalogo(e.target.value)}
                onBlur={() => validarCampo("modelo")}
                aria-invalid={Boolean(errores.modelo)}
                aria-describedby={errores.modelo ? "gate-modelo-error" : undefined}
                className={styles.controlCotizacion}
              >
                <option value="">Selecciona</option>
                {modelosDisponibles.map((modelo) => <option key={modelo}>{modelo}</option>)}
              </NativeSelect>
              <ChevronDown strokeWidth={1.5} aria-hidden="true" />
            </div>
          ) : (
            <InputConIcono
              id="gate-modelo"
              name="modelo"
              icono={<Tag strokeWidth={1.5} />}
              placeholder="Ej. Versa"
              value={datos.modelo}
              onChange={(e) => actualizarModeloCatalogo(e.target.value)}
              onBlur={() => validarCampo("modelo")}
              aria-invalid={Boolean(errores.modelo)}
              aria-describedby={errores.modelo ? "gate-modelo-error" : undefined}
              className={styles.controlCotizacion}
            />
          )}
          {errores.modelo && <p id="gate-modelo-error" className="text-xs text-ui-danger">{errores.modelo}</p>}
        </div>

        <div className={styles.condicionCotizacion}>
          <Label htmlFor="gate-condicion" className="text-xs font-semibold">Condición</Label>
          <div className={styles.selectorCotizacion}>
            <Gauge strokeWidth={1.5} aria-hidden="true" />
            <NativeSelect
              id="gate-condicion"
              name="condicion"
              value={datos.condicion}
              onChange={(e) => actualizar("condicion", e.target.value as CondicionVehiculo)}
              onBlur={() => validarCampo("condicion")}
              aria-invalid={Boolean(errores.condicion)}
              aria-describedby={errores.condicion ? "gate-condicion-error" : undefined}
              className={styles.controlCotizacion}
            >
              <option value="">Selecciona condición</option>
              {CONDICIONES_VEHICULO.map(({ valor, etiqueta }) => (
                <option key={valor} value={valor}>{etiqueta}</option>
              ))}
            </NativeSelect>
            <ChevronDown strokeWidth={1.5} aria-hidden="true" />
          </div>
          {errores.condicion && <p id="gate-condicion-error" className="text-xs text-ui-danger">{errores.condicion}</p>}
        </div>
      </section>

      <section className="grid gap-2">
        <p className="text-sm font-semibold text-ui-fg">{preguntaHorario}</p>
        <ChipGroup
          etiqueta={preguntaHorario}
          opciones={opcionesHorario}
          valor={datos.modalidadProgramacion}
          onCambio={cambiarProgramacion}
          className={styles.modalidadCotizacion}
        />
        {datos.modalidadProgramacion === "programado" && datos.fechaHoraProgramada && (
          <p className="text-xs text-ui-fg-muted" aria-live="polite">
            {new Date(datos.fechaHoraProgramada).toLocaleString("es-MX", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        )}
      </section>

      <p className="flex items-center gap-2 text-xs text-ui-fg-muted">
        <ShieldCheck className="size-4 shrink-0 text-ui-brand" strokeWidth={1.5} aria-hidden="true" />
        Solo usamos estos datos para calcular tu tarifa.
      </p>

      {!previsualizando && previsualizacion && !previsualizacion.disponible && (
        <Button type="button" variant="link" className="h-auto min-w-0 justify-start whitespace-normal text-left" onClick={() => setVerAviso(true)}>
          Este traslado requiere cotización especial · Ver opciones
        </Button>
      )}
      <BottomSheet
        open={programando}
        onClose={() => setProgramando(false)}
        title="Programar traslado"
      >
        <div className="grid gap-3 rounded-lg border border-ui-line bg-ui-card p-4">
          <p className="font-body text-xs font-semibold uppercase tracking-wide text-ui-fg-muted">
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
              <Input
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
                className={styles.controlCotizacion}
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
                    <Button
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
                        "h-auto flex-col items-start gap-0 whitespace-normal rounded-lg border px-2.5 py-2 text-left text-xs font-semibold",
                        seleccionado
                          ? "border-ui-brand bg-ui-brand-soft text-ui-brand-soft-fg"
                          : "border-ui-line bg-ui-card text-ui-fg-muted hover:border-ui-line-strong hover:text-ui-fg",
                      ].join(" ")}
                    >
                      {s.etiqueta.split("·")[0]}
                      <span className="block text-xs font-normal">
                        {s.etiqueta.includes("·")
                          ? s.etiqueta.split("·")[1]
                          : "Hora exacta"}
                      </span>
                    </Button>
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
                <Input
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
                  className={styles.controlCotizacion}
                />
              </label>
            );
          })()}

          <div className="flex items-center gap-2 rounded-lg border border-ui-line bg-ui-muted p-2.5 text-xs text-ui-fg-muted">
            <Globe className="size-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
            <span>
              Zona horaria:{" "}
              <strong className="text-ui-fg">
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
            <p id="gate-fecha-error" className="font-body text-xs text-ui-danger">
              {errores.fechaHoraProgramada}
            </p>
          )}
        </div>
        <Button
          type="button"
          className="mt-4 w-full" size="lg"
          onClick={() => {
            validarCampo("fechaHoraProgramada");
            setProgramando(false);
          }}
        >
          Confirmar horario
        </Button>
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
        <Button asChild size="lg" className="mt-4 w-full">
          <Link href="/soporte">Solicitar cotización especial</Link>
        </Button>
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
