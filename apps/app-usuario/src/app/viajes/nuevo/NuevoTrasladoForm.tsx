"use client";
import React, { useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { Button, Aviso, MobileShell } from "@ruum/ui";
import { NavegacionUsuario } from "../../NavegacionUsuario";
import { useNuevoTraslado } from "./hooks/useNuevoTraslado";

import { EstadoCreacion } from "./components/EstadoCreacion";
import { CotizadorPortal } from "./components/CotizadorPortal";
import { NuevoTrasladoDesktop } from "./NuevoTrasladoDesktop";

export function NuevoTrasladoForm() {
  const t = useNuevoTraslado();
  const encabezadoPasoRef = useRef<HTMLHeadingElement>(null);
  const avisoTarifaRef = useRef<HTMLDivElement>(null);
  const { setResultado } = t;
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
      <div className="lg:hidden flex flex-col h-full w-full">
        <CotizadorPortal t={t} headingRef={encabezadoPasoRef} />
      </div>
      <div className="hidden lg:flex h-full w-full overflow-hidden">
        <NuevoTrasladoDesktop t={t} />
      </div>
    </>
  );
}
