import {
  resolverConfigSentryUsuario,
  sanitizarEventoSentry,
} from "./src/lib/sentry-alerts";

/**
 * P1 — Sentry client para app-usuario (activado solo si NEXT_PUBLIC_SENTRY_DSN está definido).
 * Carga perezosa para no romper build cuando @sentry/nextjs aún no está instalado o en dev.
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
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: 0,
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
    .catch(() => {
      // @sentry/nextjs no instalado o no-op — ignorar
    });
}
