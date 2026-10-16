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
          >
            {v === "direcciones" ? "Direcciones" : "Contactos"}
          </button>
        ))}
      </div>
      <section id="ruta-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {tab === "direcciones" ? (
          <div className="grid gap-2">
            {(["origen", "destino"] as const).map((p) => (
              <React.Fragment key={p}>
                {p === "destino" && (
                  <button
                    type="button"
                    onClick={() => setParadas(true)}
                    className="min-h-11 border-l border-[var(--user-color-border)] pl-4 text-left text-xs font-semibold text-[var(--user-color-action)]"
                  >
                    + Añadir parada
                    {datos.paradas.length ? ` · ${datos.paradas.length}` : ""}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setEditando(p)}
                  aria-haspopup="dialog"
                  className={styles.addressCard}
                >
                  <span className="flex items-center gap-2 text-xs font-semibold">
                    <span
                      aria-hidden="true"
                      className={
                        p === "origen" ? styles.origin : styles.destination
                      }
                    />
                    {p === "origen" ? "Origen" : "Destino"}
                  </span>
                  <span className="mt-1 block truncate text-sm font-bold">
                    {datos[`${p}Ciudad`]
                      ? `${datos[`${p}Ciudad`]}, ${datos[`${p}CodigoPostal`]}`
                      : `Domicilio de ${p}`}
                  </span>
                  <span className="block truncate text-xs text-[var(--user-color-muted)]">
                    {datos[`${p}Calle`]
                      ? `${datos[`${p}Calle`]} #${datos[`${p}Numero`]}`
                      : "Toca para elegir en el mapa"}
                  </span>
                </button>
              </React.Fragment>
            ))}
            {rutaAviso && (
              <div role="status" className="flex items-center gap-2 text-xs">
                <span className="line-clamp-2 flex-1">{rutaAviso}</span>
                <button
                  type="button"
                  className="min-h-11 font-semibold"
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
