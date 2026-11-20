"use client";

import { Button as BaseButton } from "@ruum/ui/base";
import { useEffect } from "react";
import Link from "next/link";
import { recordOperationalEvent } from "@/lib/observability";
import { TripActionDock } from "./TripOperationalFrame";

export default function ErrorDetalleViaje({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    void recordOperationalEvent("native_crash", { scope: "viaje-detalle", digest: error.digest ?? "sin-digest", message: error.message.slice(0, 240) }, "error");
    // A3: window.Sentry no es un global del SDK (siempre no-op). SDK directo.
    try {
      void import("@sentry/nextjs").then((Sentry) => Sentry.captureException(error)).catch(() => {});
    } catch {}
    console.error("[viaje-detalle/error]", error);
  }, [error]);

  return (
    <div className="conductor-content flex min-h-[50vh] flex-col items-center justify-center text-center" role="alert">
      <h1 className="font-display text-xl font-semibold">Error al cargar este viaje</h1>
      <p className="mt-2 font-body text-sm leading-6 text-ui-fg-muted">
        No pudimos obtener los datos del traslado. Puede ser una falla temporal de conexión.
      </p>
      {process.env.NODE_ENV === "development" && (
        <pre className="mt-3 max-h-24 overflow-auto rounded-lg bg-ui-muted p-3 text-left font-mono text-xs text-ui-danger/80 border border-ui-danger/20">{error.message}</pre>
      )}
      <TripActionDock status="No se pudo cargar el traslado">
      <div className="flex flex-wrap justify-center gap-2">
        <BaseButton variant="ghost" type="submit" onClick={reset} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-ui-line bg-ui-card px-5 py-2.5 font-body text-sm font-medium text-ui-fg transition hover:border-ui-field">
          Reintentar
        </BaseButton>
        <Link href="/viajes" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-ui-brand px-5 py-2.5 font-display text-sm font-bold text-ui-fg transition hover:bg-ui-brand/90">
          Ver mis Traslados
        </Link>
        <Link href="/panel" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-ui-line bg-ui-card px-5 py-2.5 font-body text-sm font-medium text-ui-fg">
          Ir al panel
        </Link>
      </div>
      </TripActionDock>
    </div>
  );
}
