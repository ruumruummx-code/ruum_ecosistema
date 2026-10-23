import {
  resolverConfigSentryUsuario,
  sanitizarEventoSentry,
} from "./src/lib/sentry-alerts";

/**
 * P1 — Sentry server para app-usuario (activado solo si SENTRY_DSN está definido).
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
