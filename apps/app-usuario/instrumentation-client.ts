type CapturarTransicion = typeof import("@sentry/nextjs").captureRouterTransitionStart;

let capturarTransicion: CapturarTransicion | undefined;

if (process.env.NEXT_PUBLIC_SENTRY_DSN?.trim()) {
  void Promise.all([import("@sentry/nextjs"), import("./src/lib/sentry-alerts")])
    .then(([Sentry, { resolverConfigSentryUsuario, sanitizarEventoSentry }]) => {
      const config = resolverConfigSentryUsuario();
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
      });
      capturarTransicion = Sentry.captureRouterTransitionStart;
    })
    .catch(() => {
      // @sentry/nextjs no instalado o no-op — ignorar
    });
}

export function onRouterTransitionStart(...args: Parameters<CapturarTransicion>) {
  capturarTransicion?.(...args);
}
