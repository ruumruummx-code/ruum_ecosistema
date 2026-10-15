import * as Sentry from "@sentry/nextjs";

/**
 * FIX C3 (ticket arquitectura Fase 4): los error.tsx mostraban el fallback
 * sin reportar. Toda boundary de app-usuario debe llamar aquí dentro de un
 * `useEffect` para que el fallo llegue a Sentry con su segmento etiquetado.
 * Nunca lanza: la telemetría no puede romper la UI de fallback.
 */
export function reportarErrorBoundary(
  error: Error & { digest?: string },
  boundary: "global" | "viajes" | "pasaporte" | "mis-viajes"
): void {
  try {
    Sentry.captureException(error, {
      tags: { app: "app-usuario", boundary },
      extra: { digest: error.digest ?? null }
    });
  } catch {
    // Silencioso a propósito.
  }
}
