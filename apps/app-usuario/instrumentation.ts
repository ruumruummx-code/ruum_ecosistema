import {
  dispararAlertaCriticaSentry,
  sanitizarEventoSentry,
  verificarSentryDsnProduccion,
} from "./src/lib/sentry-alerts";

/**
 * P1 — Instrumentación Next.js (Sentry-ready) para app-usuario.
 * Se activa automáticamente por Next 15 si existe en la raíz de la app.
 * Si SENTRY_DSN no está configurado, es no-op en dev y emite diagnóstico en prod.
 */
export async function register() {
  const { configurado, config } = verificarSentryDsnProduccion();

  if (!configurado) return;

  try {
    const Sentry = await import("@sentry/nextjs");
    Sentry.init({
      dsn: config.dsn,
      environment: config.environment,
      release: config.release,
      tracesSampleRate: config.tracesSampleRate,
      tracePropagationTargets: config.tracePropagationTargets,
      sendDefaultPii: false,
      initialScope: {
        tags: {
          app: "app-usuario",
          environment: config.environment,
        },
      },
      beforeSend(event) {
        return sanitizarEventoSentry(event);
      },
    });
  } catch {
    // Sentry no instalado — ignorar en entornos sin dep.
  }
}

export function onRequestError(
  err: unknown,
  request: { path: string; method: string; headers: Record<string, string> },
  context: { routerKind: string; routePath: string; routeType: string }
) {
  // Log estructurado sanitizado en servidor
  console.error("[usuario:onRequestError]", {
    err: err instanceof Error ? { name: err.name, message: err.message } : err,
    path: request.path,
    method: request.method,
    context,
  });

  const errorNormalizado =
    err instanceof Error
      ? err
      : new Error(typeof err === "string" ? err : "Unhandled request error");

  dispararAlertaCriticaSentry({
    tipo: "unhandled_request_error",
    error: errorNormalizado,
    severidad: "error",
    detalle: {
      path: request.path,
      method: request.method,
      routerKind: context.routerKind,
      routePath: context.routePath,
      routeType: context.routeType,
    },
    tags: {
      routerKind: context.routerKind,
      routePath: context.routePath,
      routeType: context.routeType,
    },
  });
}
