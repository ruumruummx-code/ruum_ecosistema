"use client";
import React, { lazy, Suspense, useCallback, useEffect, useRef } from"react";
import Link from"next/link";
import { Button, Aviso, MobileShell } from"@ruum/ui";
import { NavegacionUsuario } from"../../NavegacionUsuario";
import { PASOS, SUBTITULOS_PASO, DESCRIPCIONES_PASO } from"./constants";
import { formatearTiempoRelativoBorrador } from"@/lib/borrador-traslado";
import { useNuevoTraslado } from"./hooks/useNuevoTraslado";

import { EstadoCreacion } from"./components/EstadoCreacion";
import { BarraAccionesTraslado } from"./components/BarraAccionesTraslado";
import { useRouter } from"next/navigation";
import { PasoTarifa } from"./components/PasoTarifa";
import { PasoVehiculo } from"./components/PasoVehiculo";
import { PasoPago } from"./components/PasoPago";

// 1.3 Lazy load — PasoRuta es ~350 líneas, se carga solo cuando paso 2/3 lo necesita
const PasoRuta = lazy(() => import("./components/PasoRuta").then((m) => ({ default: m.PasoRuta })));
const PasoDetalles = lazy(() => import("./components/PasoDetalles").then((m) => ({ default: m.PasoDetalles })));

function SkeletonPaso() {
  return <div role="status" aria-live="polite" aria-busy="true" aria-label="Cargando paso" className="animate-pulse rounded-xl border border-ink/10 bg-mist p-6 h-64" />;
}

export function NuevoTrasladoForm() {
  const t = useNuevoTraslado();
  const router = useRouter();
  const encabezadoPasoRef = useRef<HTMLHeadingElement>(null);
  const avisoTarifaRef = useRef<HTMLDivElement>(null);
  const { setPaso, setResultado } = t;
  const volverPasoInicial = useCallback(() => setPaso(0), [setPaso]);
  const cerrarResultado = useCallback(() => setResultado(null), [setResultado]);

  // Announce the new step without opening the mobile keyboard.
  useEffect(() => {
    encabezadoPasoRef.current?.focus();
  }, [t.paso]);

  // C-02: cuando la tarifa se invalida en pasos >0, hacer scroll y foco al aviso para desbloquear al usuario
  useEffect(() => {
    if (!t.tarifaPreviaAceptada && t.tarifaPreviaSnapshot && t.paso > 0) {
      // microtask para esperar render del aviso
      const id = setTimeout(() => {
        const el = avisoTarifaRef.current ?? document.getElementById("aviso-tarifa-desactualizada") ?? document.getElementById("aviso-tarifa-invalida-detalles");
        if (el) {
          el.scrollIntoView({ behavior:"smooth", block:"center" });
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
        <NavegacionUsuario variante="claro" mostrarNavegacionInferior={false} />
        <MobileShell variant="compact" navInferiorVisible={false} as="main">
          <div className="mx-auto max-w-xl py-8">
            <p className="font-body text-xs font-semibold uppercase tracking-wide text-[var(--user-color-pending-ink)] dark:text-[var(--user-color-pending-ink)]">Verificación requerida</p>
            <h1 className="mt-2 font-display text-2xl font-bold text-[var(--user-color-primary)]">Antes de solicitar un traslado</h1>
            <div className="mt-5">
              <Aviso tono="atencion">{t.bloqueoVerificacion}</Aviso>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/verificacion?next=/viajes/nuevo"
                className="inline-flex min-h-[52px] items-center justify-center rounded-2xl bg-[var(--user-color-primary)] px-6 py-3 font-display text-sm font-bold text-white shadow-xs transition hover:bg-[var(--user-color-action-hover)] active:scale-[0.98] dark:bg-[var(--user-color-action)] dark:text-[var(--user-color-on-action)]"
              >
                Ir a verificación
              </Link>
              <Link
                href="/"
                className="inline-flex min-h-[52px] items-center justify-center rounded-2xl border border-[var(--user-color-border)] bg-[var(--user-color-surface)] px-6 py-3 font-body text-sm font-semibold text-[var(--user-color-primary)] transition hover:bg-[var(--user-color-background)] active:scale-[0.98] dark:border-[var(--user-color-border)]"
              >
                Volver al inicio
              </Link>
            </div>
          </div>
        </MobileShell>
      </>
    );
  }

  return (
    <>
      <MobileShell variant="compact" navInferiorVisible={false} as="main" className={t.paso < 4 ?"user-wizard-page" :""}>
        {/* Encabezado del flujo */}
        <div className="flex items-center gap-3.5">
          <div className="min-w-0">
            <p className="truncate text-[17px] font-bold tracking-tight text-[var(--user-color-primary)]">Solicitar traslado</p>
            <p className="mt-[1px] text-[11.5px] font-medium text-[var(--user-color-muted)]">
              Paso {t.paso + 1} de {PASOS.length}
              {SUBTITULOS_PASO[t.paso] ?` · ${SUBTITULOS_PASO[t.paso]}` :""}
            </p>
          </div>
          <span className="ml-auto shrink-0 rounded-full bg-[var(--user-color-brand-soft)] px-3 py-1.5 text-[12px] font-bold text-[var(--user-color-action)]">
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
                  ? { background:"var(--user-color-action)" }
                  : i === t.paso
                    ? { background:"linear-gradient(90deg, var(--user-color-action) 50%, var(--user-color-border) 50%)" }
                    : { background:"var(--user-color-border)" }
              }
            />
          ))}
        </div>

        {/* Título del paso */}
        <h1 ref={encabezadoPasoRef} tabIndex={-1} className="mb-1.5 mt-[22px] text-[22px] font-extrabold leading-snug tracking-tight text-[var(--user-color-primary)]">
          {PASOS[t.paso]}
        </h1>
        <p className="mb-6 text-[13.5px] font-medium leading-relaxed text-[var(--user-color-muted)]">
          {DESCRIPCIONES_PASO[t.paso]}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2 font-body text-xs">
          {t.estadoGuardado ==="guardando" ? (
            <span
              className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-amber-900 font-medium animate-pulse dark:text-amber-200"
              role="status"
              aria-live="polite"
            >
              <span className="inline-block size-1.5 rounded-full bg-amber-500 animate-ping" aria-hidden="true" />
              <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              Guardando cambios…
            </span>
          ) : t.estadoGuardado ==="guardado" ? (
            <span
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-emerald-800 font-medium transition-all dark:text-emerald-200"
              role="status"
              aria-live="polite"
            >
              <span className="font-bold text-emerald-600 dark:text-emerald-400" aria-hidden="true">✓</span> Guardado {t.tiempoUltimoGuardado ? formatearTiempoRelativoBorrador(t.tiempoUltimoGuardado) :"automático"}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--user-color-surface-soft)] border border-[var(--user-color-border)] px-3 py-1 text-[var(--user-color-muted)]">
              <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              Guardado automático
            </span>
          )}
        </div>

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

        <Link href="/viajes/masivo" className="mt-6 inline-flex min-h-11 items-center text-sm text-[var(--user-color-action)] underline">¿Varios vehículos? Carga masiva CSV</Link>

        {t.errorPaso && (
          <div className="mt-6" role="status" aria-live="polite">
            <Aviso tono="danger">{t.errorPaso}</Aviso>
          </div>
        )}

        {t.paso < 4 && (
          <BarraAccionesTraslado
            onAtras={t.paso === 0 ? () => router.push("/") : t.retrocederPaso}
            onContinuar={t.paso === 0 ? t.accionesTarifa.onContinuar : t.paso === 3 ? (t.tarifaPreviaAceptada ? t.accionesDetalles.enviarSolicitud : volverPasoInicial) : t.avanzarPaso}
            etiqueta={t.paso === 3 ? (!t.tarifaPreviaAceptada ?"Revisar tarifa" : t.enviando ?"Enviando…" : t.cargandoSesion ?"Validando sesión…" :"Continuar al pago") :"Continuar"}
            ocupado={t.enviando || (t.paso === 3 && t.cargandoSesion)}
            deshabilitado={t.paso === 0 ? (!t.previsualizacion?.disponible || t.previsualizando) : t.paso === 3 && t.tarifaPreviaAceptada ? (!t.aceptaPoliticasPagoCancelacion || t.previsualizando) : false}
            precio={t.paso === 3 ? (t.previsualizando ?"Calculando tarifa…" : t.previsualizacion?.disponible ? new Intl.NumberFormat("es-MX", { style:"currency", currency:"MXN" }).format(Number(t.previsualizacion.tarifa)) +" MXN" :"Tarifa pendiente") : undefined}
            desgloseId={t.paso === 3 ?"desglose-tarifa-traslado" : undefined}
            ayuda={t.paso === 3 ? (!t.tarifaPreviaAceptada ?"Tu tarifa cambió. Revísala antes de continuar." : !t.aceptaPoliticasPagoCancelacion ?"Acepta la política de cancelación para continuar." : undefined) : t.paso === 0 && !t.previsualizacion?.disponible ?"Completa los datos para obtener una tarifa automática." : undefined}
          />
        )}
      </MobileShell>
    </>
  );
}
