import * as Sentry from "@sentry/nextjs";
import { REGLAS_ALERTA_SENTRY } from "./sentry-alerts";

/**
 * FIX C3 (ticket arquitectura Fase 4): los error.tsx mostraban el fallback
 * sin reportar. Toda boundary de app-usuario debe llamar aquí dentro de un
 * `useEffect` para que el fallo llegue a Sentry con su segmento etiquetado
 * y active alerta crítica en producción.
 * Nunca lanza: la telemetría no puede romper la UI de fallback.
 */
export function reportarErrorBoundary(
  error: Error & { digest?: string },
  boundary: "global" | "viajes" | "pasaporte" | "mis-viajes"
): void {
  try {
    const regla = REGLAS_ALERTA_SENTRY.react_error_boundary;
    Sentry.captureException(error, {
      level: boundary === "global" ? "fatal" : "error",
      tags: {
        app: "app-usuario",
        boundary,
        alert: "critical",
        alert_severity: "critical",
        alert_rule: regla.id,
        event_type: "react_error_boundary",
      },
      fingerprint: ["app-usuario", "critical", regla.id, boundary],
      extra: {
        digest: error.digest ?? null,
        alert_rule_id: regla.id,
      },
    });
  } catch {
    // Silencioso a propósito.
  }
}
