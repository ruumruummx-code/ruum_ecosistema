"use client";

import { Button as BaseButton } from "@ruum/ui/base";
import { useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { recordOperationalEvent } from "@/lib/observability";
import { TripActionDock } from "../TripOperationalFrame";

export default function ErrorEvidencia({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { id } = useParams<{ id: string }>();
  useEffect(() => {
    void recordOperationalEvent("evidence_stuck", { scope: "evidencia", trasladoId: id, digest: error.digest ?? "sin-digest", message: error.message.slice(0, 240) }, "error");
    // A3: window.Sentry no es un global del SDK (siempre no-op). SDK directo.
    try {
      void import("@sentry/nextjs").then((Sentry) => Sentry.captureException(error)).catch(() => {});
    } catch {}
    console.error("[evidencia/error]", { id, digest: error.digest, message: error.message });
  }, [error, id]);

  return (
    <div className="mx-auto flex min-h-[50vh] w-full max-w-md flex-col items-center justify-center px-6 py-12 text-center" role="alert">
      <div className="rounded-lg border border-ui-line/40 bg-ui-card p-6 shadow-sm w-full">
        <h1 className="font-display text-lg font-black text-ui-fg">No pudimos cargar la evidencia</h1>
        <p className="mt-2 font-body text-sm leading-6 text-ui-fg-muted">
          Falla al cargar fotos o checklist. Tus fotos en cola offline están seguras — reintenta cuando tengas señal.
        </p>
        {process.env.NODE_ENV === "development" && (
          <pre className="mt-3 max-h-24 overflow-auto rounded-lg bg-ui-muted p-3 text-left font-mono text-xs text-ui-danger/80 border border-ui-danger/20">{error.message}</pre>
        )}
        <TripActionDock status="Evidencias · Reintenta sin recapturar">
        <div className="flex flex-wrap justify-center gap-2">
          <BaseButton variant="ghost"
            type="button"
            onClick={reset}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-ui-brand px-5 py-2.5 font-display text-sm font-bold text-ui-fg-muted hover:bg-ui-brand/90"
          >
            Reintentar
          </BaseButton>
          <Link href={`/viajes/${id}`} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-ui-line bg-ui-card px-5 py-2.5 font-body text-sm font-medium text-ui-fg">
            Volver al viaje
          </Link>
          <Link href="/viajes" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-ui-line bg-ui-card px-5 py-2.5 font-body text-sm font-medium text-ui-fg">
            Ver traslados
          </Link>
        </div>
        </TripActionDock>
        <p className="mt-4 font-body text-xs text-ui-fg-muted">Si el error persiste, la cola se sincronizará al recuperar conexión. No recaptures.</p>
      </div>
    </div>
  );
}
