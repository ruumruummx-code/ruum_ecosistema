import {
  resolverConfigSentryUsuario,
  sanitizarEventoSentry,
} from "./src/lib/sentry-alerts";

/**
 * P1 — Sentry edge para app-usuario (middleware y rutas Edge, activado cuando SENTRY_DSN está definido).
 */
const config = resolverConfigSentryUsuario();
if (config.enabled) {
  import("@sentry/nextjs")
    .then((Sentry) =>
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
            runtime: "edge",
            environment: config.environment,
          },
        },
        beforeSend(event) {
          return sanitizarEventoSentry(event);
        },
      })
    )
    .catch(() => {});
}
