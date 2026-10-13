"use client";
import React, { lazy, Suspense, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { Button, Aviso } from "@ruum/ui";
import { NavegacionUsuario } from "../../NavegacionUsuario";
import { PASOS, SUBTITULOS_PASO, DESCRIPCIONES_PASO } from "./constants";
import { formatearTiempoRelativoBorrador } from "@/lib/borrador-traslado";
import { useNuevoTraslado } from "./hooks/useNuevoTraslado";

import { EstadoCreacion } from "./components/EstadoCreacion";
import { Icono } from "@ruum/ui";
import { PasoTarifa } from "./components/PasoTarifa";
import { PasoVehiculo } from "./components/PasoVehiculo";
import { PasoPago } from "./components/PasoPago";

// 1.3 Lazy load — PasoRuta es ~350 líneas, se carga solo cuando paso 2/3 lo necesita
const PasoRuta = lazy(() => import("./components/PasoRuta").then((m) => ({ default: m.PasoRuta })));
const PasoDetalles = lazy(() => import("./components/PasoDetalles").then((m) => ({ default: m.PasoDetalles })));

function SkeletonPaso() {
  return <div role="status" aria-live="polite" aria-busy="true" aria-label="Cargando paso" className="animate-pulse rounded-xl border border-ink/10 bg-mist p-6 h-64" />;
}

export function NuevoTrasladoForm() {
  const t = useNuevoTraslado();
  const encabezadoPasoRef = useRef<HTMLHeadingElement>(null);
  const avisoTarifaRef = useRef<HTMLDivElement>(null);
  const primerCampoRef = useRef<HTMLElement | null>(null);
  const { setPaso, setResultado } = t;
  const volverPasoInicial = useCallback(() => setPaso(0), [setPaso]);
  const cerrarResultado = useCallback(() => setResultado(null), [setResultado]);

  // A-01 + C-02: focus visible al primer campo del paso, no al h2 sr-only. Anuncia paso via live region separada.
  useEffect(() => {
    // Intenta enfocar primer input/select/textarea del paso actual para mover viewport y anunciar
    const container = document.querySelector("[data-paso-actual]");
    const primerCampo = container?.querySelector<HTMLElement>("input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])");
    if (primerCampo) {
      primerCampo.focus({ preventScroll: false });
      primerCampoRef.current = primerCampo;
    } else {
      encabezadoPasoRef.current?.focus();
    }
  }, [t.paso]);

  // C-02: cuando la tarifa se invalida en pasos >0, hacer scroll y foco al aviso para desbloquear al usuario
  useEffect(() => {
    if (!t.tarifaPreviaAceptada && t.tarifaPreviaSnapshot && t.paso > 0) {
      // microtask para esperar render del aviso
      const id = setTimeout(() => {
        const el = avisoTarifaRef.current ?? document.getElementById("aviso-tarifa-desactualizada") ?? document.getElementById("aviso-tarifa-invalida-detalles");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          // enfocar el botón dentro del aviso
          const btn = el.querySelector<HTMLButtonElement>("button");
          if (btn) btn.focus();
          else (el as HTMLElement).focus();
        }
      }, 100);
      return () => clearTimeout(id);
    }
  }, [t.tarifaPreviaAceptada, t.tarifaPreviaSnapshot, t.paso]);

  if (t.resultado) {
    return <EstadoCreacion resultado={t.resultado} volver={cerrarResultado} />;
  }

  if (t.bloqueoVerificacion) {
    return (
      <>
      <NavegacionUsuario variante="claro" />
      <main className="user-v2-scope user-v2-page user-v2-secondary-screen"><div className="mx-auto max-w-xl px-6 py-12">
          <p className="font-body text-xs font-semibold uppercase tracking-wide text-ink/45">Verificación requerida</p>
          <h1 className="mt-2 font-display text-2xl font-semibold">Antes de solicitar un traslado</h1>
          <div className="mt-5">
            <Aviso tono="atencion">{t.bloqueoVerificacion}</Aviso>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/verificacion?next=/viajes/nuevo"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-signal px-5 py-3 font-display text-sm font-bold text-ink shadow-sm transition hover:-translate-y-0.5 hover:bg-signal/90 focus-visible:outline-route-dark"
            >
              Ir a verificación
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-ink/20 bg-mist px-5 py-3 font-body text-sm font-medium text-ink transition hover:border-ink/40 focus-visible:outline-route-dark"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </main>
    </>
    );
  }

  return (
    <>
      <NavegacionUsuario variante="claro" mostrarNavegacionInferior={false} />
      <main className="user-v2-scope user-v2-page user-v2-secondary-screen"><div className="mx-auto w-full max-w-[480px] px-4 py-6 sm:py-8">
        {/* Encabezado del flujo */}
        <div className="flex items-center gap-3.5">
          {t.paso > 0 ? (
            <button
              type="button"
              onClick={t.retrocederPaso}
              aria-label="Volver al paso anterior"
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#edf4fe] text-[#0a2342] transition-transform active:scale-95 dark:bg-[#0f2d52] dark:text-[#6ba8ff]"
            >
              <Icono nombre="atras" className="size-[18px]" strokeWidth={2} />
            </button>
          ) : (
            <Link
              href="/"
              aria-label="Volver al inicio"
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#edf4fe] text-[#0a2342] transition-transform active:scale-95 dark:bg-[#0f2d52] dark:text-[#6ba8ff]"
            >
              <Icono nombre="atras" className="size-[18px]" strokeWidth={2} />
            </Link>
          )}
          <div className="min-w-0">
            <p className="truncate text-[17px] font-bold tracking-tight text-[#0a2342] dark:text-[#f6f8fb]">Solicitar traslado</p>
            <p className="mt-[1px] text-[11.5px] font-medium text-[#4e5f80] dark:text-[#a8b5cc]">
              Paso {t.paso + 1} de {PASOS.length}
              {SUBTITULOS_PASO[t.paso] ? ` · ${SUBTITULOS_PASO[t.paso]}` : ""}
            </p>
          </div>
          <span className="ml-auto shrink-0 rounded-full bg-[#edf4fe] px-3 py-1.5 text-[12px] font-bold text-[#104ca0] dark:bg-[#0f2d52] dark:text-[#6ba8ff]">
            {t.paso + 1}/{PASOS.length}
          </span>
        </div>

        {/* Segmentos de progreso */}
        <div className="mt-3.5 flex gap-1" aria-hidden="true">
          {PASOS.map((etiqueta, i) => (
            <span
              key={etiqueta}
              className="h-1 flex-1 rounded-[10px]"
              style={
                i < t.paso
                  ? { background: "#0a2342" }
                  : i === t.paso
                    ? { background: "linear-gradient(90deg, #0a2342 50%, #e8eef6 50%)" }
                    : { background: "#e8eef6" }
              }
            />
          ))}
        </div>

        {/* Título del paso */}
        <h1 className="mb-1.5 mt-[22px] text-[22px] font-extrabold leading-snug tracking-tight text-[#0a2342] dark:text-[#f6f8fb]">
          {PASOS[t.paso]}
        </h1>
        <p className="mb-6 text-[13.5px] font-medium leading-relaxed text-[#4e5f80] dark:text-[#a8b5cc]">
          {DESCRIPCIONES_PASO[t.paso]}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2 font-body text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-signal/15 px-3 py-1 font-semibold text-ink border border-signal/30">
            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Te tomará ~3 min
          </span>
          {t.estadoGuardado === "guardando" ? (
            <span
              className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-amber-900 font-medium animate-pulse"
              role="status"
              aria-live="polite"
            >
              <span className="inline-block size-1.5 rounded-full bg-amber-500 animate-ping" aria-hidden="true" />
              <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              Guardando cambios…
            </span>
          ) : t.estadoGuardado === "guardado" ? (
            <span
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-emerald-800 font-medium transition-all"
              role="status"
              aria-live="polite"
            >
              <span className="font-bold text-emerald-600" aria-hidden="true">✓</span> Guardado {t.tiempoUltimoGuardado ? formatearTiempoRelativoBorrador(t.tiempoUltimoGuardado) : "automático"}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface border border-border px-3 py-1 text-text-secondary">
              <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              Guardado automático
            </span>
          )}
        </div>

        <aside aria-label="Acceso a carga masiva para múltiples traslados" className="mt-4 p-3.5 rounded-2xl border border-border bg-surface-elevated flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs">
            <svg className="size-5 text-[#104ca0] dark:text-[#6ba8ff]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>
            <div>
              <p className="font-bold text-text-primary">¿Tienes varios vehículos?</p>
              <p className="text-text-secondary text-xs">Crea hasta 100 traslados a la vez con un archivo CSV</p>
            </div>
          </div>
          <Link
            href="/viajes/masivo"
            aria-label="Ir a carga masiva CSV, hasta 100 traslados"
            className="text-xs font-bold text-route-action hover:underline whitespace-nowrap transition focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-route-action"
          >
            Carga masiva CSV →
          </Link>
        </aside>

        {/* Slim sticky progress visible en móvil al hacer scroll: reemplazado por segmentos del encabezado */}

        {t.borradorDisponible && (
          <div className="mt-4 rounded-xl border border-route-action/30 bg-route-action/10 p-4" role="region" aria-label="Borrador pendiente">
            <p className="font-body text-sm font-semibold text-text-primary">Encontramos una solicitud sin terminar</p>
            <p className="mt-1 font-body text-xs leading-5 text-text-secondary">
              Guardada <strong>{formatearTiempoRelativoBorrador(t.borradorDisponible.guardadoEn)}</strong> ({new Date(t.borradorDisponible.guardadoEn).toLocaleString("es-MX")}).
              Vigencia de 24 horas. Ten en cuenta que los precios y la disponibilidad de conductores pueden haber cambiado.
            </p>
            <p className="mt-1 font-body text-xs text-text-secondary/70">
              Por seguridad no guardamos domicilio exacto, teléfonos de contacto, VIN, placas ni instrucciones especiales.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" onClick={t.restaurarBorrador}>Continuar donde iba</Button>
              <Button type="button" variant="quiet" onClick={t.descartarBorrador}>Empezar de cero</Button>
            </div>
          </div>
        )}



        {/* Aviso de tarifa desactualizada si se editó algún campo relevante — C-02: scroll+foco automático */}
        {!t.tarifaPreviaAceptada && t.tarifaPreviaSnapshot && t.paso > 0 && (
          <div
            id="aviso-tarifa-desactualizada"
            ref={avisoTarifaRef as unknown as React.RefObject<HTMLDivElement>}
            tabIndex={-1}
            className="mt-4 scroll-mt-28 rounded-xl focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-route-action"
            role="alert"
            aria-live="assertive"
          >
            <Aviso tono="atencion">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span>Tu tarifa puede haber cambiado. Confírmala antes de continuar.</span>
                <Button type="button" variant="secondary" onClick={volverPasoInicial} aria-describedby="aviso-tarifa-ayuda">
                  Confirmar tarifa
                </Button>
              </div>
              <p id="aviso-tarifa-ayuda" className="mt-2 font-body text-xs text-ink/70">
                Te llevamos al paso 1 para recalcular la tarifa con los datos actualizados. No perderás el resto del formulario.
              </p>
            </Aviso>
          </div>
        )}

        {/* Anuncio de paso actual para lectores de pantalla (una sola live region) */}
        <h2 ref={encabezadoPasoRef} tabIndex={-1} className="sr-only">
          Paso {t.paso + 1} de {PASOS.length}: {PASOS[t.paso]}
        </h2>
        <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {`Paso ${t.paso + 1} de ${PASOS.length}: ${PASOS[t.paso]}`}
        </p>

        {/* Pasos */}
        <div className="mt-6" data-paso-actual={t.paso}>
          {t.paso === 0 && (
            <PasoTarifa
              datos={t.datos}
              errores={t.errores}
              acciones={t.accionesTarifa}
              cpConsultando={t.cpConsultando}
              modelosDisponibles={t.modelosDisponibles}
              previsualizacion={t.previsualizacion}
              previsualizando={t.previsualizando}
            />
          )}

          {t.paso === 1 && (
            <PasoVehiculo
              datos={t.datos}
              errores={t.errores}
              acciones={t.accionesVehiculo}
              vehiculosGuardados={t.vehiculosGuardados}
              vehiculoSeleccionadoId={t.vehiculoSeleccionadoId}
              categoriaCatalogo={t.categoriaCatalogo}
              gamaCatalogo={t.gamaCatalogo}
              modelosDisponibles={t.modelosDisponibles}
              clasificacionCatalogo={t.clasificacionCatalogo}
              previsualizacion={t.previsualizacion}
              detallesVehiculoExpandido={t.detallesVehiculoExpandido}
              tarifaPreviaAceptada={t.tarifaPreviaAceptada}
            />
          )}


          {t.paso === 2 && (
            <Suspense fallback={<SkeletonPaso />}>
              <PasoRuta
                datos={t.datos}
                errores={t.errores}
                acciones={t.accionesRuta}
                cpConsultando={t.cpConsultando}
                cpAviso={t.cpAviso}
                cpOpciones={t.cpOpciones}
                placesOpciones={t.placesOpciones}
                origenBusqueda={t.origenBusqueda}
                destinoBusqueda={t.destinoBusqueda}
                origenSugerencias={t.origenSugerencias}
                destinoSugerencias={t.destinoSugerencias}
                buscandoOrigen={t.buscandoOrigen}
                buscandoDestino={t.buscandoDestino}
                rutaEstimacion={t.rutaEstimacion}
                rutaCalculando={t.rutaCalculando}
                rutaAviso={t.rutaAviso}
                erroresParadas={t.erroresParadas}
              />
            </Suspense>
          )}

          {t.paso === 3 && (
            <Suspense fallback={<SkeletonPaso />}>
              <PasoDetalles
              datos={t.datos}
              acciones={t.accionesDetalles}
              previsualizacion={t.previsualizacion}
              previsualizando={t.previsualizando}
              momentoPago={t.momentoPago}
              categoriaCatalogo={t.categoriaCatalogo}
              gamaCatalogo={t.gamaCatalogo}
              rutaEstimacion={t.rutaEstimacion}
              politicaCancelacion={t.politicaCancelacion}
              aceptaPoliticasPagoCancelacion={t.aceptaPoliticasPagoCancelacion}
              enviando={t.enviando}
              cargandoSesion={t.cargandoSesion}
              tarifaPreviaAceptada={t.tarifaPreviaAceptada}
            />
            </Suspense>
          )}


          {t.paso === 4 && t.trasladoCreado && (
            <PasoPago
              trasladoCreado={t.trasladoCreado}
              pagoConfirmado={t.pagoConfirmado}
              verificandoPago={t.verificandoPago}
              errorVerificacionPago={t.errorVerificacionPago}
              onPagoStripeConfirmado={t.manejarPagoStripeConfirmado}
              onReintentarVerificacion={t.manejarPagoStripeConfirmado}
              errorAceptacion={t.errorAceptacion}
              onReintentarAceptacion={t.reintentarAceptacion}
              aceptandoCotizacion={t.aceptandoCotizacion}
              cotizacionAceptada={t.cotizacionAceptada}
              datos={t.datos}
              rutaEstimacion={t.rutaEstimacion}
            />
          )}
        </div>

        {t.errorPaso && (
          <div className="mt-6" role="status" aria-live="polite">
            <Aviso tono="danger">{t.errorPaso}</Aviso>
          </div>
        )}

        {t.paso > 0 && t.paso < 4 && (
          <div className="mt-8 flex justify-between">
            <Button variant="secondary" onClick={t.retrocederPaso}>
              ← Atrás
            </Button>
            {t.paso < 3 ? (
              <Button onClick={t.avanzarPaso}>
                Continuar
              </Button>
            ) : null}
          </div>
        )}
      </div>
    </main>
    </>
  );
}
