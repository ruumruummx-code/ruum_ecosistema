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
