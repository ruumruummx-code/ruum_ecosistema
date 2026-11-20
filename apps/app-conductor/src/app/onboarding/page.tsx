"use client";

import { Button as BaseButton } from "@ruum/ui/base";
import { useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
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
      className="flex h-[var(--conductor-visible-height,100dvh)] flex-col overflow-hidden pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] text-ui-fg conductor-onboarding-shell"
    >
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
        <span className="inline-flex items-center gap-1.5 rounded-full border border-ui-success/20 bg-ui-success/10 px-3 py-1.5 font-body text-xs font-bold text-ui-success ">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          1,200 activos hoy · 4.8★
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-ui-brand/30 bg-ui-brand/10 px-3 py-1.5 font-body text-xs font-black text-ui-warning ">
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
        <h1 className="max-w-[320px] font-display text-2xl font-bold leading-tight">
          Conduce con Ruum Ruum
        </h1>
        <p className="mt-1 font-body text-sm font-semibold text-ui-fg-muted">Tu traslado, en orden</p>
        <p className="mt-1 max-w-[300px] font-body text-sm leading-5 text-ui-fg-muted">
          Realiza traslados vehiculares con seguimiento, evidencia fotográfica y pago protegido.
        </p>
      </section>

      <div className="mx-auto mt-auto flex w-full max-w-md shrink-0 flex-col gap-1 px-6 pb-3 pt-2">
        <BaseButton variant="primary" className="min-h-12 w-full" onClick={() => void finalizar("/registro")}>
          Crear mi cuenta
        </BaseButton>
        <BaseButton variant="ghost"
          type="button"
          onClick={() => void finalizar("/login")}
          className="min-h-12 w-full rounded-xl px-5 py-3 font-display text-sm font-semibold text-ui-fg-muted transition hover:bg-ui-muted hover:text-ui-fg focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-ui-brand"
        >
          Ya tengo una cuenta
        </BaseButton>
      </div>
    </div>
  );
}
