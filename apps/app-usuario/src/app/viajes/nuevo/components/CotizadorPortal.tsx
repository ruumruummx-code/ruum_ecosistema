"use client";
import { useFormatoDistancia } from "@/lib/use-formato-distancia";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import Link from "next/link";
import type { useNuevoTraslado } from "../hooks/useNuevoTraslado";
import { codigoPostalCompleto } from "../tarifa-gate";
import { MobileBottomSheet as BottomSheet } from "@/components/MobileBottomSheet";
import { PasoDetalles } from "./PasoDetalles";
import { PasoPago } from "./PasoPago";
import { PasoVehiculo } from "./PasoVehiculo";
import { PasoRuta } from "./PasoRuta";
import { formatearTiempo } from "../constants";
import { PasoTarifa } from "./PasoTarifa";
import { BottomSheetCargaMasiva } from "./carga-masiva";
import styles from "./cotizador.module.css";

export function CotizadorPortal({
  t,
  headingRef,
  escritorio = false,
}: {
  t: ReturnType<typeof useNuevoTraslado>;
  headingRef: RefObject<HTMLHeadingElement | null>;
  escritorio?: boolean;
}) {
  const formatearDistancia = useFormatoDistancia();
  const root = useRef<HTMLElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const [borradorAbierto, setBorradorAbierto] = useState(false);
  const [cargaMasivaAbierta, setCargaMasivaAbierta] = useState(false);
  const [estadoPago, setEstadoPago] = useState({
    listo: false,
    procesando: false,
  });
  const onEstadoPago = useCallback(
    (estado: { listo: boolean; procesando: boolean }) =>
      setEstadoPago((prev) =>
        prev.listo === estado.listo && prev.procesando === estado.procesando
          ? prev
          : estado,
      ),
    [],
  );
  useEffect(() => {
    if (escritorio) return;
    const viewport = window.visualViewport;
    if (!viewport) return;
    const update = () => {
      root.current?.style.setProperty("--quote-height", `${viewport.height}px`);
      root.current?.style.setProperty("--quote-top", `${viewport.offsetTop}px`);
      const active = document.activeElement;
      const editing =
        active instanceof HTMLInputElement ||
        active instanceof HTMLSelectElement;
      const keyboard =
        window.innerHeight - viewport.height > 120 ||
        (editing && viewport.height < 500);
      root.current?.toggleAttribute("data-keyboard", keyboard);
      if (
        keyboard &&
        active instanceof HTMLElement &&
        content.current?.contains(active)
      ) {
        const container = content.current;
        const field = active.getBoundingClientRect();
        const bounds = container.getBoundingClientRect();
        if (field.bottom > bounds.bottom)
          container.scrollTop += field.bottom - bounds.bottom + 8;
        if (field.top < bounds.top)
          container.scrollTop -= bounds.top - field.top + 8;
      }
    };
    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    let frame = 0;
    const focusChanged = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    document.addEventListener("focusin", focusChanged);
    document.addEventListener("focusout", focusChanged);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
      document.removeEventListener("focusin", focusChanged);
      document.removeEventListener("focusout", focusChanged);
      cancelAnimationFrame(frame);
    };
  }, [escritorio]);
  useEffect(() => { headingRef.current?.focus(); }, [t.paso, headingRef]);

  const completos =
    codigoPostalCompleto(t.datos.origenCodigoPostal) &&
    codigoPostalCompleto(t.datos.destinoCodigoPostal) &&
    Boolean(
      t.datos.marca.trim() && t.datos.modelo.trim() && t.datos.condicion,
    ) &&
    (t.datos.modalidadProgramacion !== "programado" ||
      Boolean(t.datos.fechaHoraProgramada));
  const listo =
    completos && !t.previsualizando && Boolean(t.previsualizacion?.disponible && Number.isFinite(t.previsualizacion.tarifa) && Number(t.previsualizacion.tarifa) > 0);
  const etiqueta = !completos
    ? "Llena los datos para cotizar"
    : t.previsualizando
      ? "Calculando tarifa…"
      : !t.previsualizacion
        ? "Tarifa pendiente"
      : !t.previsualizacion.disponible
        ? "Cotización especial requerida"
        : `Continuar · Tarifa est. $${Number(t.previsualizacion.tarifa).toLocaleString("es-MX", { maximumFractionDigits: 2 })} MXN`;
  const montoTarifa = t.trasladoCreado?.precioCotizado ?? (t.previsualizacion?.disponible ? Number(t.previsualizacion.tarifa) : null);
  const tarifa = montoTarifa != null
    ? `$${montoTarifa.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`
    : "pendiente";
  const requiereTarifa = t.paso > 0 && !t.tarifaPreviaAceptada;
  const pagoFormId = `pago-traslado-${t.trasladoCreado?.id ?? "pendiente"}`;
  const montoPago = Number(
    t.trasladoCreado?.precioCotizado ?? 0,
  ).toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const etiquetaPaso =
    t.paso === 0
      ? etiqueta
      : t.paso === 4
        ? estadoPago.procesando
          ? "Procesando pago…"
          : t.verificandoPago
            ? "Verificando pago…"
            : `Pagar $${montoPago} MXN`
        : requiereTarifa
          ? "Revisar tarifa"
          : t.paso === 3
            ? t.enviando
              ? "Preparando pago…"
              : `Continuar al pago · ${tarifa}`
            : t.paso === 1
              ? `Continuar · Tarifa: ${tarifa}`
              : t.rutaCalculando
                ? "Calculando ruta…"
                : t.rutaEstimacion?.distanciaKm !== undefined &&
                    t.rutaEstimacion?.tiempoEstimadoHoras !== undefined
                  ? `Continuar · ${formatearDistancia(t.rutaEstimacion.distanciaKm)} (${formatearTiempo(t.rutaEstimacion.tiempoEstimadoHoras)})`
                  : "Continuar";
  const continuar =
    t.paso === 0
      ? t.accionesTarifa.onContinuar
      : requiereTarifa
        ? () => t.setPaso(0)
        : t.paso === 3
          ? t.accionesDetalles.enviarSolicitud
          : t.avanzarPaso;
  const ocupado = Boolean(
    t.enviando ||
      estadoPago.procesando ||
      t.verificandoPago ||
      (t.paso === 3 && t.cargandoSesion),
  );
  const deshabilitado =
    ocupado ||
    (t.paso === 0
      ? !listo
      : t.paso === 4
        ? !estadoPago.listo ||
          !t.cotizacionAceptada ||
          Boolean(t.errorAceptacion)
        : t.paso === 3 && !requiereTarifa
          ? !t.trasladoCreado &&
            (!t.previsualizacion?.disponible || t.previsualizando)
          : t.paso === 2 && t.rutaCalculando);
  const guardado =
    t.estadoGuardado === "guardando"
      ? "Guardando cambios"
      : t.estadoGuardado === "guardado"
        ? "Cambios guardados"
        : "Guardado automático disponible";

  const Contenedor = escritorio ? "section" : "main";
  return (
    <Contenedor ref={root} aria-label="Crear un traslado" className={`user-v2-scope ${styles.portal} ${escritorio ? styles.desktop : ""}`}>
      <header className={styles.appBar}>
        {t.paso === 0 ? (
          <Link
            href="/"
            aria-label="Volver al inicio"
            className="flex size-10 items-center justify-center rounded-full text-[#0a2342] transition hover:bg-[#f1f5fa] dark:text-white dark:hover:bg-[#0f2d52]"
          >
            <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
        ) : (
          <button
            type="button"
            onClick={t.retrocederPaso}
            disabled={ocupado || t.pagoConfirmado}
            aria-label="Paso anterior"
            className="flex size-10 items-center justify-center rounded-full text-[#0a2342] transition hover:bg-[#f1f5fa] dark:text-white dark:hover:bg-[#0f2d52]"
          >
            <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {t.paso === 0 ? (
          <div className="flex items-center gap-1.5">
            <span className="sr-only">Paso 1 de 5</span>
            <svg className="size-7" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <rect width="32" height="32" rx="8" fill="#eaf2fe" />
              <circle cx="11" cy="16" r="4.5" fill="#0066FF" />
              <circle cx="21" cy="16" r="4.5" fill="#00D1D1" />
              <path d="M11 16h10" stroke="#0066FF" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <span className="font-display text-[17px] font-extrabold tracking-tight text-[#0a2342] dark:text-[#f6f8fb]">
              Ruum Ruum
            </span>
          </div>
        ) : (
          <div className={styles.progressBarContainer}>
            <p className="text-center text-[12px] font-semibold text-[#64748b] dark:text-[#a8b5cc]">
              {`Paso ${t.paso + 1} de 5`}
            </p>
            <div className={styles.progressBarSegments} aria-hidden="true">
              {[0, 1, 2, 3, 4].map((idx) => (
                <div
                  key={idx}
                  className={`${styles.progressSegment} ${idx <= t.paso ? styles.progressSegmentActive : ""}`}
                />
              ))}
            </div>
          </div>
        )}

        {t.paso === 0 ? (
          <div className="flex items-center">
            <span
              role="status"
              aria-label={guardado}
              className="sr-only"
            >
              {guardado}
            </span>
            <Link
              href="/soporte"
              aria-label="Ayuda y soporte"
              className="flex size-10 items-center justify-center rounded-full text-[#64748b] transition hover:bg-[#f1f5fa] dark:text-[#a8b5cc] dark:hover:bg-[#0f2d52]"
            >
              <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" x2="12.01" y1="17" y2="17" />
              </svg>
            </Link>
          </div>
        ) : (
          <span
            role="status"
            aria-label={guardado}
            title={guardado}
            className="flex size-10 items-center justify-center text-[#94a3b8]"
          >
            <svg
              className="size-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <path d="M7 18a5 5 0 0 1-1-10 6 6 0 0 1 11-1 5 5 0 0 1 1 10" />
              <path
                d={
                  t.estadoGuardado === "guardando"
                    ? "M12 12v8m-3-5 3-3 3 3"
                    : "m9 17 3 3 5-6"
                }
              />
            </svg>
          </span>
        )}
      </header>
      {t.paso === 1 && (
        <div className={styles.tariffBanner} aria-live="polite">
          <span>
            {requiereTarifa
              ? "Confirma de nuevo tu tarifa"
              : `Tarifa aceptada · ${tarifa}`}
          </span>
          <button
            type="button"
            onClick={() => t.setPaso(0)}
            aria-label="Editar tarifa"
            className="min-h-11 min-w-11"
          >
            ✎
          </button>
        </div>
      )}
      <div
        ref={content}
        className={`${styles.content} ${t.paso === 4 ? styles.paymentContent : ""}`}
      >
        <h1
          ref={headingRef}
          tabIndex={-1}
          className={t.paso === 4 ? "sr-only" : styles.title}
        >
          {t.paso === 0
            ? "Conoce tu tarifa"
            : t.paso === 1
              ? "Datos del vehículo"
              : t.paso === 2
                ? "Origen y destino"
                : t.paso === 3
                  ? "Detalles del servicio"
                  : "Pago seguro"}
        </h1>
        {t.paso === 0 && (
          <p className={styles.subtitle}>
            Ingresa los datos de tu viaje y obtén el costo estimado en segundos.
          </p>
        )}
        {t.paso === 1 && (
          <p className={styles.subtitle}>
            Ingresa la información del vehículo que realizará el traslado.
          </p>
        )}
        {t.paso === 2 && (
          <p className={styles.subtitle}>
            Selecciona los puntos de partida y llegada de tu traslado.
          </p>
        )}
        {t.paso === 3 && (
          <p className={styles.subtitle}>
            Confirma los últimos detalles de tu traslado.
          </p>
        )}
        {t.paso === 0 && !t.previsualizando && t.previsualizacion && !t.previsualizacion.disponible && <div className="mb-4 space-y-2 rounded-xl border border-amber-300 p-3 text-sm" role="alert"><p>{t.previsualizacion.motivo || "La cotización no está disponible en este momento."}</p><button type="button" onClick={t.reintentarCotizacion} className="text-blue-700 underline dark:text-blue-300">Reintentar cotización</button><Link href="/soporte" className="ml-4 text-blue-700 underline dark:text-blue-300">Contactar soporte</Link></div>}
        <fieldset
          disabled={Boolean(t.trasladoCreado)}
          className="min-w-0 border-0 p-0 m-0"
        >
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
          {/* Paso 0 ofrece la carga masiva dentro del wizard. */}
          {t.paso === 0 && (
            <div className="mt-2.5 rounded-2xl border border-[#d8e2ee] bg-[#f8fafc] px-3.5 py-2.5 text-center dark:border-[#1a3a5c] dark:bg-[#07192f]">
              <p className="text-[12px] font-medium text-[#566889] dark:text-[#a8b5cc]">
                ¿Requieres cotizar o trasladar un lote de vehículos?{" "}
                <button
                  type="button"
                  onClick={() => setCargaMasivaAbierta(true)}
                  aria-label="Abrir módulo de carga masiva de traslados"
                  className="font-bold text-[#0066FF] hover:underline dark:text-[#4d94ff]"
                >
                  Abrir módulo de carga masiva de traslados →
                </button>
              </p>
            </div>
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
          )}
        </fieldset>
        {t.trasladoCreado && t.paso < 4 && (
          <p
            role="status"
            className="mt-2 text-xs text-[var(--user-color-muted)]"
          >
            Solicitud preparada. Los datos se muestran en modo de consulta.
          </p>
        )}
        {t.paso === 3 && (
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
            soloLectura={Boolean(t.trasladoCreado)}
          />
        )}
        {t.paso === 4 && t.trasladoCreado && (
          <PasoPago
            trasladoCreado={t.trasladoCreado}
            pagoConfirmado={t.pagoConfirmado}
            pagoEnProcesoConfirmacion={t.pagoEnProcesoConfirmacion}
            verificandoPago={t.verificandoPago}
            errorVerificacionPago={t.errorVerificacionPago}
            onPagoStripeConfirmado={t.manejarPagoStripeConfirmado}
            onReintentarVerificacion={t.reintentarVerificacion ?? t.manejarPagoStripeConfirmado}
            errorAceptacion={t.errorAceptacion}
            onReintentarAceptacion={t.reintentarAceptacion}
            aceptandoCotizacion={t.aceptandoCotizacion}
            cotizacionAceptada={t.cotizacionAceptada}
            datos={t.datos}
            rutaEstimacion={t.rutaEstimacion}
            formId={pagoFormId}
            onEstadoPago={onEstadoPago}
          />
        )}
      </div>
      {!(t.paso === 4 && (t.pagoConfirmado || t.pagoEnProcesoConfirmacion || t.verificandoPago)) && (
        <footer className={styles.footer}>
          {t.errorPaso && (
            <p role="alert" className="text-xs text-red-700 dark:text-red-300">
              {t.errorPaso}
            </p>
          )}
          {t.paso < 3 && t.borradorDisponible && (
            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => setBorradorAbierto(true)}
                className="min-h-11 text-xs font-semibold"
              >
                Recuperar borrador
              </button>
            </div>
          )}
          {t.paso === 3 && (
            <p className="mb-2 text-center text-[11px] leading-4 text-[var(--user-color-muted)]">
              Al continuar, aceptas que el pago es electrónico anticipado y la
              política de cancelación.
            </p>
          )}
          {t.paso === 4 && (
            <p className="mb-2 text-center text-[10px] leading-4 text-[var(--user-color-muted)]">
              <span className="inline-flex items-center justify-center gap-1">
                <span>🔒 Cifrado Stripe · No guardamos tu tarjeta</span>
                <svg width="22" height="14" viewBox="0 0 22 14" role="img" aria-label="Visa"><rect width="22" height="14" rx="2" fill="white"/><text x="2" y="10" fill="#1434cb" fontSize="8" fontWeight="bold" fontStyle="italic">VISA</text></svg>
                <svg width="22" height="14" viewBox="0 0 22 14" role="img" aria-label="Mastercard"><circle cx="8" cy="7" r="5" fill="#eb001b"/><circle cx="14" cy="7" r="5" fill="#f79e1b" fillOpacity=".9"/></svg>
                <svg width="22" height="14" viewBox="0 0 22 14" role="img" aria-label="American Express"><rect width="22" height="14" rx="2" fill="#1671bb"/><text x="2" y="9" fill="white" fontSize="6.5" fontWeight="bold">AMEX</text></svg>
              </span>
            </p>
          )}
          <button
            type={t.paso === 4 ? "submit" : "button"}
            form={t.paso === 4 ? pagoFormId : undefined}
            onClick={t.paso === 4 ? undefined : continuar}
            disabled={deshabilitado}
            className={`${styles.primary} ${t.paso === 4 ? styles.paymentButton : ""}`}
            aria-live="polite"
            aria-busy={ocupado || (completos && t.previsualizando)}
          >
            <span className="inline-flex w-full items-center justify-center gap-2">
              <span>{etiquetaPaso}</span>
              {!etiquetaPaso.includes("→") && (
                <svg className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              )}
            </span>
          </button>
        </footer>
      )}
      <BottomSheet
        open={borradorAbierto}
        onClose={() => setBorradorAbierto(false)}
        title="Solicitud sin terminar"
      >
        <p className="text-sm">
          Tu borrador tiene vigencia de 24 horas. Recalcularemos la tarifa al
          recuperarlo.
        </p>
        <div className="mt-3 rounded-lg border border-[var(--user-color-border)] bg-[var(--user-color-card)] p-3 text-xs text-[var(--user-color-muted)]">
          <p className="font-semibold text-[var(--user-color-primary)]">Por tu seguridad no guardamos direcciones exactas ni teléfonos.</p>
          <p className="mt-1">Se recuperaron códigos postales y datos del vehículo; únicamente deberás reingresar calles y teléfonos de contacto.</p>
        </div>
        <button
          type="button"
          className="mt-4 min-h-12 w-full rounded-xl bg-[var(--user-color-action)] text-[var(--user-color-on-action)]"
          onClick={() => {
            t.restaurarBorrador();
            setBorradorAbierto(false);
          }}
        >
          Continuar donde iba
        </button>
        <button
          type="button"
          className="mt-2 min-h-11 w-full"
          onClick={() => {
            t.descartarBorrador();
            setBorradorAbierto(false);
          }}
        >
          Empezar de cero
        </button>
      </BottomSheet>
      <BottomSheet
        open={cargaMasivaAbierta}
        onClose={() => setCargaMasivaAbierta(false)}
        title="Carga masiva de traslados"
        fullScreen
      >
        <BottomSheetCargaMasiva onCerrar={() => setCargaMasivaAbierta(false)} />
      </BottomSheet>
    </Contenedor>
  );
}
