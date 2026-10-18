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
      className="flex min-h-dvh flex-col text-text-primary conductor-onboarding-shell"
    >
      {/* encabezado — Brand Book p.9-11 */}
      <header className="flex items-center justify-between px-5 pb-2 pt-5">
        <div className="flex items-center gap-2.5">
          <LogoMarca tamano={30} color="signal" mostrarDescriptor mostrarRespaldo={false} subtitulo="Conductor" />
        </div>
        <button
          type="button"
          onClick={() => void finalizar("/login")}
          className="inline-flex min-h-11 items-center rounded-lg px-3 py-2 font-display text-xs font-semibold text-text-secondary transition hover:text-text-primary"
          aria-label="Ir a iniciar sesión"
        >
          Iniciar sesión
        </button>
      </header>

      {/* hero */}
      <div className="flex min-h-0 flex-1 items-center justify-center px-6 py-2">
        <div className="relative flex h-full max-h-[46dvh] w-full max-w-sm items-center justify-center">
          <Image
            src="/imagenes/onboarding-paso2.webp"
            alt="Vista nocturna desde el volante con navegación sobre la carretera"
            width={1200}
            height={675}
            priority
            sizes="(max-width: 640px) 90vw, 384px"
            className="max-h-[46dvh] w-full rounded-3xl object-contain"
          />
        </div>
      </div>

      {/* M6 — Social proof + beneficio económico siempre visible — R4 SVG */}
      <div className="mx-auto flex w-full max-w-md items-center justify-center flex-wrap gap-2 px-6 py-2">
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
        className="mx-auto flex w-full max-w-md flex-col items-center px-6 pb-7 pt-4 text-center"
      >
        <p className="font-body text-sm font-semibold text-text-tertiary">Seguridad · Evidencia · Pago protegido</p>
        <h1 className="mt-2 max-w-[320px] font-display text-[23px] font-bold leading-tight">
          Conduce con <span className="text-signal">Ruum Ruum.</span>
        </h1>
        <p className="mt-3 max-w-[300px] font-body text-[13px] leading-6 text-text-secondary">
          Realiza traslados vehiculares como conductor certificado, con seguimiento y evidencia fotográfica de principio a fin. Tu pago se libera con evidencia validada.
        </p>

        <div className="mt-7 flex w-full flex-col gap-2.5">
          <Button variant="primary" className="w-full" onClick={() => void finalizar("/registro")}>
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
      </section>
    </div>
  );
}
