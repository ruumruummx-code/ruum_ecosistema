"use client";
import React, { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCargaMasiva } from "../../hooks/useCargaMasiva";
import { TablaCorreccionMasiva } from "./TablaCorreccionMasiva";
import { CheckoutMasivo } from "./CheckoutMasivo";

// ── Plantilla template fields ──────────────────────────────────────────────
const PLANTILLA_URL = "/docs-legales/plantilla-carga-masiva.xlsx";

interface Props {
  onCerrar: () => void;
}

export function BottomSheetCargaMasiva({ onCerrar }: Props) {
  const router = useRouter();
  const [pago, setPago] = useState({ listo: false, procesando: false });
  const [conciliando, setConciliando] = useState(false);
  const [errorPago, setErrorPago] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    estado,
    error,
    filasVisibles,
    filasConError,
    filasCorrectas,
    totalMXN,
    todasListas,
    progreso,
    pagoConfirmado,
    cargaId,
    stripeClientSecret,
    cargarArchivo,
    corregirCampo,
    eliminarFila,
    geocodificarYCotizar,
    confirmarPago,
    cancelar,
    cargaPendienteStorage,
    reanudarCarga,
    descartarCargaPendiente,
  } = useCargaMasiva();
  const verificarPago = useCallback(async () => {
    if (!cargaId) return;
    setConciliando(true); setErrorPago(null);
    try {
      const res = await fetch(`/api/viajes/masivos/estado?id=${cargaId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (!data.pagado) throw new Error("Tu pago sigue en proceso. Consulta su estado nuevamente.");
      confirmarPago(); router.push("/mis-viajes"); router.refresh();
    } catch (err) {
      setErrorPago(err instanceof Error ? err.message : "No se pudo consultar el pago.");
    } finally { setConciliando(false); }
  }, [cargaId, confirmarPago, router]);

  const manejarArchivo = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const archivo = e.target.files?.[0];
      if (!archivo) return;
      void cargarArchivo(archivo);
      e.target.value = ""; // permite re-seleccionar el mismo archivo
    },
    [cargarArchivo],
  );

  // ── Cierre destructivo ───────────────────────────────────────────────────
  const handleCancelarCarga = useCallback(() => {
    cancelar();
    onCerrar();
  }, [cancelar, onCerrar]);

  // ── Formateo del total ───────────────────────────────────────────────────
  const totalFormateado = totalMXN.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // ── Pago completado ──────────────────────────────────────────────────────
  if (pagoConfirmado) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <span
          aria-hidden="true"
          className="flex size-14 items-center justify-center rounded-full bg-green-100 text-3xl text-green-600"
        >
          ✓
        </span>
        <h2 className="text-xl font-extrabold">¡Carga masiva procesada!</h2>
        <p className="max-w-xs text-sm text-[var(--user-color-muted)]">
          Tu pago fue confirmado. Se han generado {filasCorrectas.length} traslado
          {filasCorrectas.length !== 1 ? "s" : ""} vinculados a tu Pasaporte Digital.
          Te notificaremos al asignar conductores.
        </p>
        <button
          type="button"
          onClick={handleCancelarCarga}
          className="mt-2 min-h-12 w-full max-w-xs rounded-2xl bg-[var(--user-color-action)] text-sm font-bold text-[var(--user-color-on-action)]"
        >
          Ver mis traslados
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* ── Barra de progreso de proceso ──────────────────────────── */}
      {(estado === "geocodificando" || estado === "cotizando") && (
        <div
          role="progressbar"
          aria-label={estado === "geocodificando" ? "Calculando rutas…" : "Cotizando traslados…"}
          aria-valuenow={progreso}
          aria-valuemin={0}
          aria-valuemax={100}
          className="mx-5 mb-3 h-1.5 overflow-hidden rounded-full bg-[var(--user-color-border)]"
        >
          <div
            className="h-full rounded-full bg-[var(--user-color-action)] transition-all duration-300"
            style={{ width: `${progreso}%` }}
          />
        </div>
      )}

      {/* ── Cuerpo principal ──────────────────────────────────────── */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-2">
        {(error || errorPago) && estado !== "idle" && <p role="alert" className="my-2 text-sm text-red-600">{error || errorPago}</p>}
        {errorPago && <button type="button" onClick={() => void verificarPago()} disabled={conciliando} className="min-h-11 text-sm underline">Consultar estado del pago</button>}
        {/* Estado: idle — zona de carga de archivo */}
        {(estado === "idle" || estado === "parseando") && (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <span aria-hidden="true" className="text-5xl">📋</span>
            <div>
              <h3 className="text-lg font-extrabold">Carga masiva de traslados</h3>
              <p className="mt-1 text-sm text-[var(--user-color-muted)]">
                Descarga la plantilla, llénala y súbela para cotizar todos tus traslados de una vez.
              </p>
            </div>

            {error && (
              <p role="alert" className="w-full rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                {error}
              </p>
            )}

            {cargaPendienteStorage && (
              <div className="w-full rounded-2xl border-2 border-[var(--user-color-action)] bg-[var(--user-color-brand-soft)] p-4 text-left shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="text-base" aria-hidden="true">⏱️</span>
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--user-color-action)]">
                    Carga masiva pendiente
                  </p>
                </div>
                <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Tienes una carga masiva cotizada pendiente de pago.
                </p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => void reanudarCarga(cargaPendienteStorage)}
                    className="flex-1 rounded-xl bg-[var(--user-color-action)] py-2.5 text-xs font-bold text-[var(--user-color-on-action)] transition-opacity hover:opacity-95"
                  >
                    Reanudar carga pendiente
                  </button>
                  <button
                    type="button"
                    onClick={() => void descartarCargaPendiente(cargaPendienteStorage)}
                    className="rounded-xl border border-[var(--user-color-border)] px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                  >
                    Descartar y nueva carga
                  </button>
                </div>
              </div>
            )}

            {/* Zona drag & drop / tap para cargar */}
            <label
              htmlFor="masivo-file-input"
              className={[
                "flex w-full cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed py-8 transition-colors",
                estado === "parseando"
                  ? "border-[var(--user-color-action)] bg-[var(--user-color-brand-soft)]"
                  : "border-[var(--user-color-border)] hover:border-[var(--user-color-action)]",
              ].join(" ")}
            >
              <span aria-hidden="true" className="text-3xl">
                {estado === "parseando" ? "⏳" : "⬆️"}
              </span>
              <span className="text-sm font-semibold">
                {estado === "parseando" ? "Procesando archivo…" : "Seleccionar archivo .xlsx"}
              </span>
              <span className="text-xs text-[var(--user-color-muted)]">Máximo 100 traslados · 5 MB</span>
              <input
                id="masivo-file-input"
                ref={inputRef}
                type="file"
                accept=".xlsx"
                className="sr-only"
                disabled={estado === "parseando"}
                onChange={manejarArchivo}
              />
            </label>
          </div>
        )}

        {/* Estado: resultados — tabla de corrección */}
        {estado === "resultados" && (
          <TablaCorreccionMasiva
            filas={filasVisibles}
            onCorregir={corregirCampo}
            onEliminar={eliminarFila}
          />
        )}

        {/* Estado: geocodificando / cotizando */}
        {(estado === "geocodificando" || estado === "cotizando") && (
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <span aria-hidden="true" className="text-4xl">
              {estado === "geocodificando" ? "🗺️" : "🧮"}
            </span>
            <p role="status" aria-live="polite" className="text-sm font-semibold">
              {estado === "geocodificando"
                ? `Calculando rutas para ${filasCorrectas.length} traslado${filasCorrectas.length !== 1 ? "s" : ""}…`
                : "Calculando tarifas en tiempo real…"}
            </p>
            <p className="text-xs text-[var(--user-color-muted)]">Esto puede tardar unos segundos.</p>
          </div>
        )}

        {/* Estado: checkout */}
        {estado === "checkout" && (
          <CheckoutMasivo
            filas={filasVisibles}
            totalMXN={totalMXN}
            cargaId={cargaId ?? undefined}
            clientSecret={stripeClientSecret ?? undefined}
            onEstadoPago={setPago}
            onPagado={() => void verificarPago()}
          />
        )}
      </div>

      {/* ── Acciones inferiores (sticky) ──────────────────────────── */}
      {estado !== "checkout" && (
        <div className="shrink-0 border-t border-[var(--user-color-border)] px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-3">
          {/* Botón principal según estado */}
          {estado === "idle" && (
            <a
              href={PLANTILLA_URL}
              download="plantilla-carga-masiva-ruum.xlsx"
              className="mb-3 flex min-h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold text-[var(--user-color-action)]"
            >
              ⬇️ Descargar plantilla oficial (.xlsx)
            </a>
          )}

          {estado === "resultados" && (
            <>
              {filasConError.length > 0 && (
                <button type="button" disabled={!filasCorrectas.length} onClick={() => { filasConError.forEach(f => eliminarFila(f.indice)); }} className="mb-2 min-h-11 w-full text-sm underline">Continuar parcial: omitir filas con errores</button>
              )}
              {filasConError.length > 0 && (
                <p className="mb-2 text-center text-[11px] text-[var(--user-color-muted)]">
                  {filasConError.length} fila{filasConError.length !== 1 ? "s" : ""} con error.
                  Corrígelas o elimínalas para continuar.
                </p>
              )}
              <button
                type="button"
                disabled={!todasListas}
                onClick={() => void geocodificarYCotizar()}
                className={[
                  "min-h-13 w-full rounded-2xl text-sm font-bold transition-colors",
                  todasListas
                    ? "bg-[var(--user-color-action)] text-[var(--user-color-on-action)]"
                    : "cursor-not-allowed bg-[var(--user-color-border)] text-[var(--user-color-muted)]",
                ].join(" ")}
              >
                {todasListas
                  ? `Cotizar ${filasCorrectas.length} traslado${filasCorrectas.length !== 1 ? "s" : ""}`
                  : "Corrige los errores para cotizar"}
              </button>
            </>
          )}

          {/* Botón cancelar siempre disponible */}
          <button
            type="button"
            onClick={handleCancelarCarga}
            className="mt-2 min-h-11 w-full text-sm font-semibold text-red-600 dark:text-red-400"
          >
            Cancelar carga
          </button>
        </div>
      )}

      {/* ── Super Sticky Footer de pago (Checkout) ──────────────── */}
      {estado === "checkout" && (
        <div className="shrink-0 bg-[#ffc400] px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-3">
          <button
            type="submit"
            form={`pago-masivo-${cargaId ?? "pendiente"}`}
            disabled={!pago.listo || pago.procesando || conciliando}
            className="min-h-13 w-full rounded-2xl bg-[#0b111b] text-base font-black text-[#ffc400]"
          >
            {pago.procesando || conciliando ? "Procesando pago…" : `Pagar $${totalFormateado} MXN`}
          </button>
          <p className="mt-1 text-center text-[10px] font-semibold text-[#4a3800]">
            Pago único consolidado para {filasCorrectas.length} traslado{filasCorrectas.length !== 1 ? "s" : ""}
          </p>
          <button type="button" disabled={pago.procesando || conciliando} onClick={handleCancelarCarga} className="min-h-11 w-full text-sm font-semibold text-red-800">Cancelar carga</button>
        </div>
      )}
    </div>
  );
}
