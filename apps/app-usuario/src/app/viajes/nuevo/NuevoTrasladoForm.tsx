"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button, Aviso, MobileShell, useDialogAccesible } from "@ruum/ui";
import { NavegacionUsuario } from "../../NavegacionUsuario";
import { useNuevoTraslado } from "./hooks/useNuevoTraslado";

import { EstadoCreacion } from "./components/EstadoCreacion";
import { CotizadorPortal } from "./components/CotizadorPortal";
import { NuevoTrasladoDesktop } from "./NuevoTrasladoDesktop";
import { SeleccionVehiculoInicial } from "./SeleccionVehiculoInicial";

export function SeleccionUbicacionInicial({ t, lado, consulta }: { t: ReturnType<typeof useNuevoTraslado>; lado: "origen" | "destino"; consulta: string }) {
  const [cerrado, setCerrado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cierre = useRef<HTMLButtonElement>(null);
  const cerrar = useCallback(() => setCerrado(true), []);
  const dialog = useDialogAccesible({ abierto: !cerrado, focoInicial: cierre, alCancelar: cerrar });
  const busqueda = lado === "origen" ? t.origenBusqueda : t.destinoBusqueda;
  const sugerencias = lado === "origen" ? t.origenSugerencias : t.destinoSugerencias;
  const buscando = lado === "origen" ? t.buscandoOrigen : t.buscandoDestino;
  const cambiar = lado === "origen" ? t.setOrigenBusqueda : t.setDestinoBusqueda;
  if (cerrado) return null;
  return <dialog ref={dialog} aria-labelledby="titulo-ubicacion-inicial" className="m-auto w-full max-w-lg rounded-2xl border bg-[var(--ruum-surface,#fff)] p-6 text-[var(--ruum-text)] shadow-xl backdrop:bg-black/50">
    <h2 id="titulo-ubicacion-inicial" className="text-lg font-bold">Confirmar ubicación de {lado}</h2>
    <p className="mt-2 text-sm">Dirección elegida en Mis ubicaciones: {consulta}. Selecciona una coincidencia para completar los datos del traslado.</p>
    <label className="mt-4 block text-sm">Buscar dirección<input autoComplete="off" value={busqueda} onChange={e => cambiar(e.target.value)} className="mt-1 block w-full rounded-xl border bg-transparent p-3" /></label>
    {buscando && <p role="status">Buscando coincidencias…</p>}
    <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto">{sugerencias.map((s, i) => <li key={i}><button type="button" className="w-full rounded-xl border p-3 text-left text-sm" onClick={async () => { try { await t.aplicarSugerenciaDireccion(lado, s); cerrar(); } catch { setError("No pudimos aplicar esta dirección. Reintenta o completa los datos manualmente."); } }}>{s.textoCompleto}</button></li>)}</ul>
    {!buscando && sugerencias.length === 0 && <p className="mt-3 text-sm">Si no aparecen coincidencias, ajusta la búsqueda o completa la dirección manualmente en el cotizador.</p>}
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    <button ref={cierre} type="button" onClick={cerrar} className="mt-4 rounded-xl border p-3 text-sm">Continuar sin aplicar ubicación</button>
  </dialog>;
}

export function NuevoTrasladoForm({ busquedaOrigenInicial = "", busquedaDestinoInicial = "", vehiculoIdInicial = "" }: { busquedaOrigenInicial?: string; busquedaDestinoInicial?: string; vehiculoIdInicial?: string } = {}) {
  const t = useNuevoTraslado();
  const { setOrigenBusqueda, setDestinoBusqueda } = t;
  useEffect(() => {
    if (busquedaOrigenInicial) setOrigenBusqueda(busquedaOrigenInicial);
    if (busquedaDestinoInicial) setDestinoBusqueda(busquedaDestinoInicial);
  }, [busquedaOrigenInicial, busquedaDestinoInicial, setOrigenBusqueda, setDestinoBusqueda]);
  const encabezadoPasoRef = useRef<HTMLHeadingElement>(null);
  const avisoTarifaRef = useRef<HTMLDivElement>(null);
  const { setResultado } = t;
  const cerrarResultado = useCallback(() => setResultado(null), [setResultado]);
  const [esEscritorio, setEsEscritorio] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(min-width: 1024px)");
    setEsEscritorio(mq.matches);
    const handler = (e: MediaQueryListEvent) => setEsEscritorio(e.matches);
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);

  // Announce the new step without opening the mobile keyboard.
  useEffect(() => {
    encabezadoPasoRef.current?.focus();
  }, [t.paso]);

  // C-02: cuando la tarifa se invalida en pasos >0, hacer scroll y foco al aviso para desbloquear al usuario
  useEffect(() => {
    if (!t.tarifaPreviaAceptada && t.tarifaPreviaSnapshot && t.paso > 0) {
      // microtask para esperar render del aviso
      const id = setTimeout(() => {
        const el =
          avisoTarifaRef.current ??
          document.getElementById("aviso-tarifa-desactualizada") ??
          document.getElementById("aviso-tarifa-invalida-detalles");
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
        <NavegacionUsuario variante="claro" mostrarNavegacionInferior={false} />
        <MobileShell variant="compact" navInferiorVisible={false} as="main">
          <div className="mx-auto max-w-xl py-8">
            <p className="font-body text-xs font-semibold uppercase tracking-wide text-[var(--user-color-pending-ink)] dark:text-[var(--user-color-pending-ink)]">
              Verificación requerida
            </p>
            <h1 className="mt-2 font-display text-2xl font-bold text-[var(--user-color-primary)]">
              Antes de solicitar un traslado
            </h1>
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
      {vehiculoIdInicial ? <SeleccionVehiculoInicial key={vehiculoIdInicial} t={t} vehiculoId={vehiculoIdInicial} /> : (busquedaOrigenInicial || busquedaDestinoInicial) ? <SeleccionUbicacionInicial key={busquedaOrigenInicial + "|" + busquedaDestinoInicial} t={t} lado={busquedaOrigenInicial ? "origen" : "destino"} consulta={busquedaOrigenInicial || busquedaDestinoInicial} /> : null}
      <div className="lg:hidden flex flex-col h-full w-full">
        <CotizadorPortal t={t} headingRef={encabezadoPasoRef} />
      </div>
      <div className="hidden lg:flex h-full w-full overflow-hidden">
        {esEscritorio && <NuevoTrasladoDesktop t={t} />}
      </div>
    </>
  );
}
