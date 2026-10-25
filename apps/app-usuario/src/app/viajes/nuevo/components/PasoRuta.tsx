"use client";
import React, { lazy, memo, Suspense, useEffect, useState } from "react";
import type { DatosCodigoPostal } from "@/lib/codigos-postales";
import type { sugerirDireccionesAutocomplete } from "@/lib/mapbox";
import { MobileBottomSheet as BottomSheet } from "@/components/MobileBottomSheet";
import { EscalasAcordeon } from "./EscalasAcordeon";
import type { DireccionElegida } from "./DireccionMapa";
import type { PrefijoDomicilio } from "../constants";
import type { DatosFormulario, ErroresFormulario, ParadaForm } from "../types";
import styles from "./cotizador.module.css";
const DireccionMapa = lazy(() =>
  import("./DireccionMapa").then((m) => ({ default: m.DireccionMapa })),
);

export interface AccionesPasoRuta {
  claseControl: (campo: keyof DatosFormulario) => string;
  actualizar: <K extends keyof DatosFormulario>(
    campo: K,
    valor: DatosFormulario[K],
  ) => void;
  actualizarTelefono: (
    campo: "entregaTelefono" | "recepcionTelefono",
    valor: string,
  ) => void;
  actualizarCodigoPostal: (prefijo: PrefijoDomicilio, valor: string) => void;
  consultarCodigoPostal: (
    prefijo: PrefijoDomicilio,
    codigoPostal: string,
  ) => Promise<void>;
  validarCampo: (campo: keyof DatosFormulario) => void;
  aplicarSugerenciaCp: (
    prefijo: PrefijoDomicilio,
    ciudad: string,
    colonia: string,
  ) => void;
  aplicarSugerenciaDireccion: (
    prefijo: PrefijoDomicilio,
    s: Awaited<ReturnType<typeof sugerirDireccionesAutocomplete>>[number],
  ) => void;
  setOrigenBusqueda: (v: string) => void;
  setDestinoBusqueda: (v: string) => void;
  onReintentarRuta: () => void;
  onParadasChange: (next: ParadaForm[]) => void;
  onConfirmarUbicacion?: () => void;
}

export interface PasoRutaProps {
  datos: DatosFormulario;
  errores: ErroresFormulario;
  acciones: AccionesPasoRuta;
  cpConsultando: PrefijoDomicilio | null;
  cpAviso: Record<PrefijoDomicilio, string | null>;
  cpOpciones: Record<PrefijoDomicilio, DatosCodigoPostal | null>;
  placesOpciones: Record<PrefijoDomicilio, string[]>;
  origenBusqueda: string;
  destinoBusqueda: string;
  origenSugerencias: Awaited<ReturnType<typeof sugerirDireccionesAutocomplete>>;
  destinoSugerencias: Awaited<
    ReturnType<typeof sugerirDireccionesAutocomplete>
  >;
  buscandoOrigen: boolean;
  buscandoDestino: boolean;
  rutaEstimacion: {
    origenLat?: number;
    origenLng?: number;
    destinoLat?: number;
    destinoLng?: number;
    paradasCoords?: Array<{ lat?: number; lng?: number }>;
    distanciaKm?: number;
    tiempoEstimadoHoras?: number;
    incompletas: boolean;
  } | null;
  rutaCalculando: boolean;
  rutaAviso: string | null;
  erroresParadas?: Array<Partial<Record<keyof ParadaForm, string>>>;
}

function PasoRutaComponent({
  datos,
  errores,
  acciones,
  rutaAviso,
  rutaCalculando,
  erroresParadas,
}: PasoRutaProps) {
  const [tab, setTab] = useState<"direcciones" | "contactos">("direcciones");
  const [editando, setEditando] = useState<PrefijoDomicilio | null>(null);
  const [paradas, setParadas] = useState(false);
  const [instrucciones, setInstrucciones] = useState(false);
  const { actualizar, actualizarTelefono, validarCampo } = acciones;
  useEffect(() => {
    const campos = Object.keys(errores);
    if (campos.some((c) => c.startsWith("origen"))) {
      setTab("direcciones");
      setEditando("origen");
    } else if (campos.some((c) => c.startsWith("destino"))) {
      setTab("direcciones");
      setEditando("destino");
    } else if (
      campos.some((c) => c.startsWith("entrega") || c.startsWith("recepcion"))
    )
      setTab("contactos");
    else if (campos.includes("paradas")) setParadas(true);
  }, [errores]);
  const inicial = (p: PrefijoDomicilio): DireccionElegida => ({
    textoCompleto: [
      datos[`${p}Calle`],
      datos[`${p}Numero`],
      datos[`${p}Colonia`],
      datos[`${p}Ciudad`],
    ]
      .filter(Boolean)
      .join(", "),
    direccion: datos[`${p}Calle`],
    numero: datos[`${p}Numero`],
    colonia: datos[`${p}Colonia`],
    ciudad: datos[`${p}Ciudad`],
    estado: datos[`${p}Estado`],
    codigoPostal: datos[`${p}CodigoPostal`],
    referencias: datos[`${p}Referencias`],
    lat: p === "origen" ? datos.origenLat : datos.destinoLat,
    lng: p === "origen" ? datos.origenLng : datos.destinoLng,
  });
  const confirmar = (p: PrefijoDomicilio, d: DireccionElegida) => {
    acciones.onConfirmarUbicacion?.();
    acciones.aplicarSugerenciaDireccion(p, d);
    actualizar(`${p}Calle`, d.direccion);
    actualizar(`${p}Numero`, d.numero ?? "");
    actualizar(`${p}Colonia`, d.colonia ?? "");
    actualizar(`${p}Ciudad`, d.ciudad ?? "");
    actualizar(`${p}Estado`, d.estado ?? "");
    actualizar(`${p}CodigoPostal`, d.codigoPostal ?? "");
    actualizar(`${p}Referencias`, d.referencias);
    actualizar(p === "origen" ? "origenLat" : "destinoLat", d.lat);
    actualizar(p === "origen" ? "origenLng" : "destinoLng", d.lng);
    setEditando(null);
  };
  return (
    <div className={styles.fields}>
      <div
        className={styles.segmented}
        role="tablist"
        aria-label="Datos de ruta"
      >
        {(["direcciones", "contactos"] as const).map((v) => (
          <button
            type="button"
            id={`tab-${v}`}
            key={v}
            role="tab"
            aria-selected={tab === v}
            aria-controls="ruta-panel"
            onClick={() => setTab(v)}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                e.preventDefault();
                const next = v === "direcciones" ? "contactos" : "direcciones";
                setTab(next);
                document.getElementById(`tab-${next}`)?.focus();
              }
            }}
            tabIndex={tab === v ? 0 : -1}
            className="flex items-center justify-center gap-2"
          >
            {v === "direcciones" ? (
              <>
                <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>Direcciones</span>
              </>
            ) : (
              <>
                <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span>Contactos</span>
              </>
            )}
          </button>
        ))}
      </div>
      <section id="ruta-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {tab === "direcciones" ? (
          <div className="grid gap-3">
            {/* Tarjeta de Origen */}
            <button
              type="button"
              onClick={() => setEditando("origen")}
              aria-haspopup="dialog"
              aria-label={`Domicilio de origen: ${datos.origenCiudad ? `${datos.origenCiudad}, ${datos.origenCodigoPostal}` : "Elegir ubicación"}`}
              className="flex w-full items-center justify-between rounded-2xl border border-[#e2e8f0] bg-white p-3.5 text-left shadow-2xs transition hover:border-[#0066FF] dark:border-[#1a3a5c] dark:bg-[#0a2342] sm:p-4"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#eaf8f0] text-[#10b981] dark:bg-[#064e3b]/30">
                  <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" fill="currentColor" />
                  </svg>
                </span>
                <div className="min-w-0 flex-1">
                  <span className="text-[11.5px] font-bold uppercase tracking-wider text-[#64748b] dark:text-[#a8b5cc]">
                    Origen
                  </span>
                  <span className="block truncate text-[15px] font-extrabold text-[#0a2342] dark:text-[#f6f8fb]">
                    {datos.origenCiudad
                      ? `${datos.origenCiudad}, ${datos.origenCodigoPostal}`
                      : "Domicilio de origen"}
                  </span>
                  <span className="block truncate text-[12px] text-[#64748b] dark:text-[#94a3b8]">
                    {datos.origenCalle
                      ? `${datos.origenCalle} #${datos.origenNumero || "S/N"}`
                      : "Toca para elegir en el mapa"}
                  </span>
                </div>
              </div>
              <span className="ml-2 inline-flex items-center gap-1 text-[13px] font-bold text-[#0066FF] hover:underline dark:text-[#4d94ff]">
                <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                </svg>
                Cambiar
              </span>
            </button>

            {/* Tarjeta de Destino */}
            <button
              type="button"
              onClick={() => setEditando("destino")}
              aria-haspopup="dialog"
              aria-label={`Domicilio de destino: ${datos.destinoCiudad ? `${datos.destinoCiudad}, ${datos.destinoCodigoPostal}` : "Elegir ubicación"}`}
              className="flex w-full items-center justify-between rounded-2xl border border-[#e2e8f0] bg-white p-3.5 text-left shadow-2xs transition hover:border-[#0066FF] dark:border-[#1a3a5c] dark:bg-[#0a2342] sm:p-4"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#fdf0f0] text-[#ef4444] dark:bg-[#7f1d1d]/30">
                  <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" fill="currentColor" />
                  </svg>
                </span>
                <div className="min-w-0 flex-1">
                  <span className="text-[11.5px] font-bold uppercase tracking-wider text-[#64748b] dark:text-[#a8b5cc]">
                    Destino
                  </span>
                  <span className="block truncate text-[15px] font-extrabold text-[#0a2342] dark:text-[#f6f8fb]">
                    {datos.destinoCiudad
                      ? `${datos.destinoCiudad}, ${datos.destinoCodigoPostal}`
                      : "Domicilio de destino"}
                  </span>
                  <span className="block truncate text-[12px] text-[#64748b] dark:text-[#94a3b8]">
                    {datos.destinoCalle
                      ? `${datos.destinoCalle} #${datos.destinoNumero || "S/N"}`
                      : "Toca para elegir en el mapa"}
                  </span>
                </div>
              </div>
              <span className="ml-2 inline-flex items-center gap-1 text-[13px] font-bold text-[#0066FF] hover:underline dark:text-[#4d94ff]">
                <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                </svg>
                Cambiar
              </span>
            </button>

            {/* Añadir parada (opcional) */}
            <button
              type="button"
              onClick={() => setParadas(true)}
              className="flex items-center justify-between rounded-2xl border border-[#d6e4f7] bg-[#f0f6fd] p-3.5 transition hover:bg-[#e4effb] dark:border-[#1a3a5c] dark:bg-[#091f38]"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-7 items-center justify-center rounded-full bg-[#0066FF] text-white">
                  <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
                <span className="text-[14px] font-bold text-[#0a2342] dark:text-[#f6f8fb]">
                  Añadir parada (opcional)
                  {datos.paradas.length ? ` · ${datos.paradas.length}` : ""}
                </span>
              </div>
              <svg className="size-4 text-[#0066FF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>

            {/* Callout de paradas */}
            <div className="flex items-center gap-3 rounded-2xl border border-[#e2e8f0] bg-white p-3 text-left dark:border-[#1a3a5c] dark:bg-[#0a2342]">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#f1f5fa] text-[#0066FF] dark:bg-[#0f2d52]">
                <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 2a8 8 0 0 0-8 8c0 5.4 7 11.4 7.6 11.9a.7.7 0 0 0 .8 0c.6-.5 7.6-6.5 7.6-11.9A8 8 0 0 0 12 2Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <p className="text-[12.5px] font-medium text-[#64748b] dark:text-[#a8b5cc]">
                Puedes agregar hasta 5 paradas intermedias.
              </p>
            </div>

            {rutaAviso && (
              <div role="status" className="flex items-center gap-2 rounded-xl bg-amber-50 p-2.5 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                <span className="line-clamp-2 flex-1">{rutaAviso}</span>
                <button
                  type="button"
                  className="min-h-11 font-bold underline"
                  disabled={rutaCalculando}
                  onClick={acciones.onReintentarRuta}
                >
                  Reintentar cálculo
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.contacts}>
            {(["entrega", "recepcion"] as const).map((p) => (
              <fieldset key={p} className="min-w-0">
                <legend className="mb-2 text-xs font-bold">
                  {p === "entrega"
                    ? "Quien entrega el vehículo"
                    : "Quien recibe el vehículo"}
                </legend>
                <div className={styles.vehicle}>
                  {(["Nombre", "Apellido", "Telefono"] as const).map(
                    (suffix) => {
                      const campo = `${p}${suffix}` as
                        | "entregaNombre"
                        | "entregaApellido"
                        | "entregaTelefono"
                        | "recepcionNombre"
                        | "recepcionApellido"
                        | "recepcionTelefono";
                      return (
                        <div
                          key={campo}
                          className={`${styles.field} ${suffix === "Telefono" ? styles.condition : ""}`}
                        >
                          <label htmlFor={campo} className={styles.label}>
                            {suffix === "Telefono" ? "Teléfono · +52" : suffix}
                          </label>
                          <input
                            id={campo}
                            name={campo}
                            type={suffix === "Telefono" ? "tel" : "text"}
                            autoComplete={
                              suffix === "Telefono"
                                ? "tel-national"
                                : suffix === "Nombre"
                                  ? "given-name"
                                  : "family-name"
                            }
                            inputMode={
                              suffix === "Telefono" ? "numeric" : undefined
                            }
                            maxLength={suffix === "Telefono" ? 10 : 100}
                            value={datos[campo]}
                            onChange={(e) =>
                              suffix === "Telefono"
                                ? actualizarTelefono(
                                    campo as
                                      | "entregaTelefono"
                                      | "recepcionTelefono",
                                    e.target.value,
                                  )
                                : actualizar(campo, e.target.value)
                            }
                            onBlur={() => validarCampo(campo)}
                            className={acciones.claseControl(campo)}
                            aria-label={
                              suffix === "Telefono"
                                ? `Teléfono de ${p === "entrega" ? "entrega" : "recepción"}, 10 dígitos sin incluir +52`
                                : undefined
                            }
                            aria-invalid={Boolean(errores[campo])}
                            aria-describedby={
                              errores[campo] ? `${campo}-error` : undefined
                            }
                          />
                          {errores[campo] && (
                            <p id={`${campo}-error`} className={styles.error}>
                              {errores[campo]}
                            </p>
                          )}
                        </div>
                      );
                    },
                  )}
                </div>
              </fieldset>
            ))}
          </div>
        )}
      </section>
      {tab === "direcciones" && (
        <button
          type="button"
          onClick={() => setInstrucciones(true)}
          className="min-h-11 text-left text-xs font-semibold text-[var(--user-color-muted)]"
        >
          Instrucciones especiales (opcional)
        </button>
      )}
      <BottomSheet
        open={Boolean(editando)}
        onClose={() => setEditando(null)}
        fullScreen
        title={`Domicilio de ${editando ?? "origen"}`}
      >
        {editando && (
          <Suspense
            fallback={
              <p role="status" className="p-5">
                Cargando mapa…
              </p>
            }
          >
            <DireccionMapa
              key={editando}
              prefijo={editando}
              inicial={inicial(editando)}
              onConfirmar={(d) => confirmar(editando, d)}
            />
          </Suspense>
        )}
      </BottomSheet>
      <BottomSheet
        open={paradas}
        onClose={() => setParadas(false)}
        title="Paradas del traslado"
      >
        <EscalasAcordeon
          paradas={datos.paradas}
          onChange={acciones.onParadasChange}
          erroresParadas={erroresParadas}
        />
        <button
          type="button"
          className="mt-4 min-h-12 w-full rounded-xl bg-[var(--user-color-action)] text-[var(--user-color-on-action)]"
          onClick={() => setParadas(false)}
        >
          Guardar paradas
        </button>
      </BottomSheet>
      <BottomSheet
        open={instrucciones}
        onClose={() => setInstrucciones(false)}
        title="Instrucciones especiales"
      >
        <label htmlFor="instruccionesEspeciales" className="text-sm">
          Instrucciones especiales para el traslado
        </label>
        <textarea
          id="instruccionesEspeciales"
          className="mt-2 min-h-32 w-full rounded-xl border border-[var(--user-color-border)] p-3"
          value={datos.instruccionesEspeciales}
          maxLength={1000}
          onChange={(e) =>
            actualizar("instruccionesEspeciales", e.target.value)
          }
        />
        <button
          type="button"
          className="mt-4 min-h-12 w-full"
          onClick={() => setInstrucciones(false)}
        >
          Guardar instrucciones
        </button>
      </BottomSheet>
    </div>
  );
}

function areEqualPasoRuta(prev: PasoRutaProps, next: PasoRutaProps) {
  // Sin `prev.datos === next.datos` (cortaba todo cambio; resto muerto). Se
  // comparan todos los campos que el paso renderiza: contactos, domicilios
  // completos, referencias, latitud capturada, paradas e instrucciones.
  return (
    prev.datos.entregaNombre === next.datos.entregaNombre &&
    prev.datos.entregaApellido === next.datos.entregaApellido &&
    prev.datos.entregaTelefono === next.datos.entregaTelefono &&
    prev.datos.recepcionNombre === next.datos.recepcionNombre &&
    prev.datos.recepcionApellido === next.datos.recepcionApellido &&
    prev.datos.recepcionTelefono === next.datos.recepcionTelefono &&
    prev.datos.origenCodigoPostal === next.datos.origenCodigoPostal &&
    prev.datos.origenEstado === next.datos.origenEstado &&
    prev.datos.origenCiudad === next.datos.origenCiudad &&
    prev.datos.origenColonia === next.datos.origenColonia &&
    prev.datos.origenCalle === next.datos.origenCalle &&
    prev.datos.origenNumero === next.datos.origenNumero &&
    prev.datos.origenReferencias === next.datos.origenReferencias &&
    prev.datos.origenLat === next.datos.origenLat &&
    prev.datos.origenLng === next.datos.origenLng &&
    prev.datos.destinoCodigoPostal === next.datos.destinoCodigoPostal &&
    prev.datos.destinoEstado === next.datos.destinoEstado &&
    prev.datos.destinoCiudad === next.datos.destinoCiudad &&
    prev.datos.destinoColonia === next.datos.destinoColonia &&
    prev.datos.destinoCalle === next.datos.destinoCalle &&
    prev.datos.destinoNumero === next.datos.destinoNumero &&
    prev.datos.destinoReferencias === next.datos.destinoReferencias &&
    prev.datos.destinoLat === next.datos.destinoLat &&
    prev.datos.destinoLng === next.datos.destinoLng &&
    prev.datos.instruccionesEspeciales === next.datos.instruccionesEspeciales &&
    prev.acciones === next.acciones &&
    prev.origenBusqueda === next.origenBusqueda &&
    prev.destinoBusqueda === next.destinoBusqueda &&
    prev.origenSugerencias === next.origenSugerencias &&
    prev.destinoSugerencias === next.destinoSugerencias &&
    prev.buscandoOrigen === next.buscandoOrigen &&
    prev.buscandoDestino === next.buscandoDestino &&
    prev.cpConsultando === next.cpConsultando &&
    prev.cpAviso === next.cpAviso &&
    prev.cpOpciones === next.cpOpciones &&
    prev.placesOpciones === next.placesOpciones &&
    prev.datos.paradas === next.datos.paradas &&
    prev.rutaEstimacion === next.rutaEstimacion &&
    prev.rutaCalculando === next.rutaCalculando &&
    prev.rutaAviso === next.rutaAviso &&
    prev.errores === next.errores &&
    prev.erroresParadas === next.erroresParadas
  );
}
export const PasoRuta = memo(PasoRutaComponent, areEqualPasoRuta);
