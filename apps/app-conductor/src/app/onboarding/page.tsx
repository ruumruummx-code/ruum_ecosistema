"use client";

import { useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button, LogoMarca } from "@ruum/ui";
import { marcarOnboardingVisto } from "../../lib/onboarding-visto";

export default function PaginaOnboarding() {
  const router = useRouter();

  const finalizar = useCallback(
    async (destino: "/registro" | "/login") => {
      await marcarOnboardingVisto();
      router.replace(destino);
    },
    [router]
  );

  return (
    <div
      className="flex h-dvh flex-col overflow-hidden pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] text-text-primary conductor-onboarding-shell"
    >
      {/* encabezado — Brand Book p.9-11 */}
      <header className="flex items-center justify-between shrink-0 px-5 py-2">
        <div className="flex items-center gap-2.5">
          <LogoMarca tamano={30} color="signal" mostrarDescriptor={false} />
        </div>
        <button
          type="button"
          onClick={() => void finalizar("/login")}
          className="inline-flex size-12 items-center justify-center rounded-lg text-text-primary focus-visible:outline-2 focus-visible:outline-route-action"
          aria-label="Ir a iniciar sesión"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2" /></svg>
        </button>
      </header>

      {/* hero */}
      <div className="flex min-h-0 flex-1 items-center justify-center px-6 py-2">
        <div className="relative flex h-full max-h-[40vh] w-full max-w-sm items-center justify-center">
          <Image
            src="/imagenes/onboarding-paso2.webp"
            alt="Vista nocturna desde el volante con navegación sobre la carretera"
            fill
            priority
            sizes="(max-width: 640px) 90vw, 384px"
            className="object-contain"
          />
        </div>
      </div>

      {/* M6 — Social proof + beneficio económico siempre visible — R4 SVG */}
      <div className="mx-auto flex w-full max-w-md shrink-0 items-center justify-center flex-wrap gap-2 px-6 py-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 font-body text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          1,200 activos hoy · 4.8★
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-signal/30 bg-signal/10 px-3 py-1.5 font-body text-[11px] font-black text-amber-800 dark:text-signal">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          Hasta $1,200/traslado
        </span>
      </div>

      {/* contenido */}
      <section
        aria-label="Bienvenida del conductor"
        className="mx-auto flex w-full max-w-md shrink-0 flex-col items-center px-6 py-2 text-center"
      >
        <h1 className="max-w-[320px] font-display text-[23px] font-bold leading-tight">
          Conduce con Ruum Ruum
        </h1>
        <p className="mt-1 font-body text-sm font-semibold text-text-secondary">Tu traslado, en orden</p>
        <p className="mt-1 max-w-[300px] font-body text-sm leading-5 text-text-secondary">
          Realiza traslados vehiculares con seguimiento, evidencia fotográfica y pago protegido.
        </p>
      </section>

      <div className="mx-auto mt-auto flex w-full max-w-md shrink-0 flex-col gap-1 px-6 pb-3 pt-2">
        <Button variant="primary" className="min-h-12 w-full" onClick={() => void finalizar("/registro")}>
          Crear mi cuenta
        </Button>
        <button
          type="button"
          onClick={() => void finalizar("/login")}
          className="min-h-12 w-full rounded-xl px-5 py-3 font-display text-sm font-semibold text-text-secondary transition hover:bg-surface-elevated hover:text-text-primary focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-route-action"
        >
          Ya tengo una cuenta
        </button>
      </div>
    </div>
  );
}
