import * as Sentry from "@sentry/nextjs";
import { sanitizeDetails, type OperationalSeverity } from "@ruum/api/observability";
import { logStructuredError, logStructuredWarn } from "./logger";

export interface ReglaAlertaSentry {
  id: string;
  evento: string;
  severidadAlerta: "critical" | "high";
  nivelSentry: "fatal" | "error";
  descripcion: string;
}

/**
 * Catálogo de reglas de alerta en producción para errores críticos de app-usuario.
 */
export const REGLAS_ALERTA_SENTRY: Record<string, ReglaAlertaSentry> = {
  stripe_payment_failure: {
    id: "USR-CRIT-STRIPE-001",
    evento: "stripe_payment_failure",
    severidadAlerta: "critical",
    nivelSentry: "error",
    descripcion: "Fallo crítico en procesamiento o confirmación de pago Stripe",
  },
  trip_creation_failure: {
    id: "USR-CRIT-TRIP-002",
    evento: "trip_creation_failure",
    severidadAlerta: "critical",
    nivelSentry: "error",
    descripcion: "Fallo crítico al crear o registrar solicitud de traslado",
  },
  auth_callback_error: {
    id: "USR-CRIT-AUTH-003",
    evento: "auth_callback_error",
    severidadAlerta: "critical",
    nivelSentry: "error",
    descripcion: "Fallo en intercambio de sesión o callback de autenticación",
  },
  supabase_error: {
    id: "USR-CRIT-DB-004",
    evento: "supabase_error",
    severidadAlerta: "critical",
    nivelSentry: "error",
    descripcion: "Error crítico de comunicación o RPC con Supabase",
  },
  startup_failure: {
    id: "USR-CRIT-BOOT-005",
    evento: "startup_failure",
    severidadAlerta: "critical",
    nivelSentry: "fatal",
    descripcion: "Fallo crítico de inicialización o variables de entorno en producción",
  },
  quote_calculation_failure: {
    id: "USR-CRIT-QUOTE-006",
    evento: "quote_calculation_failure",
    severidadAlerta: "high",
    nivelSentry: "error",
    descripcion: "Error en cálculo de cotización o motor tarifario",
  },
  unhandled_request_error: {
    id: "USR-CRIT-REQ-007",
    evento: "unhandled_request_error",
    severidadAlerta: "critical",
    nivelSentry: "error",
    descripcion: "Excepción no controlada en petición de servidor (onRequestError)",
  },
  react_error_boundary: {
    id: "USR-CRIT-UI-008",
    evento: "react_error_boundary",
    severidadAlerta: "critical",
    nivelSentry: "error",
    descripcion: "Fallo crítico de renderizado capturado por Error Boundary",
  },
};

export const EVENTOS_CRITICOS_USUARIO = new Set<string>(
  Object.keys(REGLAS_ALERTA_SENTRY)
);

const PATRON_CLAVES_PROHIBIDAS_SENTRY =
  /password|token|jwt|service_role|secret|curp|clabe|cuenta|tarjeta|cvv|documento|foto|url_firmada/i;

export interface ConfiguracionSentryUsuario {
  dsn: string;
  environment: string;
  release: string;
  tracesSampleRate: number;
  tracePropagationTargets: Array<string | RegExp>;
  enabled: boolean;
  alertsEnabled: boolean;
  isProduction: boolean;
}

/**
 * Resuelve los destinos permitidos para propagación de cabeceras de traza distribuida
 * (`sentry-trace` y `baggage`) entre cliente, middleware, API routes y servicios internos.
 */
export function resolverTracePropagationTargets(): Array<string | RegExp> {
  const targets: Array<string | RegExp> = [
    /^\//,
    /^https:\/\/[^/]*\.ruum\.mx(\/|$)/i,
    /^http:\/\/localhost(:\d+)?(\/|$)/i,
    /^http:\/\/127\.0\.0\.1(:\d+)?(\/|$)/i,
  ];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (appUrl) {
    targets.push(appUrl);
  }
  return targets;
}

/**
 * Resuelve la configuración unificada de Sentry DSN y alertas para cliente, servidor y edge.
 */
export function resolverConfigSentryUsuario(): ConfiguracionSentryUsuario {
  const dsn = (
    process.env.SENTRY_DSN ||
    process.env.NEXT_PUBLIC_SENTRY_DSN ||
    ""
  ).trim();
  const environment = (
    process.env.SENTRY_ENVIRONMENT ||
    process.env.NEXT_PUBLIC_RUUM_AMBIENTE ||
    process.env.NODE_ENV ||
    "development"
  ).trim();
  const version = (process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0").trim();
  const rawSampleRate = Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0.1");
  const tracesSampleRate =
    Number.isFinite(rawSampleRate) && rawSampleRate >= 0 && rawSampleRate <= 1
      ? rawSampleRate
      : 0.1;
  const isProduction =
    environment === "production" || process.env.NODE_ENV === "production";
  const enabled = Boolean(dsn);
  const alertsEnabled =
    process.env.SENTRY_ALERTS_ENABLED !== "false" &&
    (isProduction || environment === "staging" || enabled);

  return {
    dsn,
    environment,
    release: process.env.SENTRY_RELEASE || `ruum-usuario@${version}`,
    tracesSampleRate,
    tracePropagationTargets: resolverTracePropagationTargets(),
    enabled,
    alertsEnabled,
    isProduction,
  };
}

/**
 * Sanitiza un evento de Sentry antes de enviarlo (beforeSend) para garantizar
 * cero filtración de cabeceras de sesión, CSRF, tokens o PII en breadcrumbs.
 */
export function sanitizarEventoSentry<
  T extends {
    request?: { headers?: Record<string, string> };
    breadcrumbs?: Array<unknown>;
    tags?: Record<string, unknown>;
  }
>(event: T): T {
  if (event.request?.headers) {
    delete event.request.headers.authorization;
    delete event.request.headers.cookie;
    delete event.request.headers["x-supabase-auth"];
    delete event.request.headers["x-csrf-token"];
  }
  if (Array.isArray(event.breadcrumbs)) {
    event.breadcrumbs = event.breadcrumbs.filter(
      (b) => !PATRON_CLAVES_PROHIBIDAS_SENTRY.test(JSON.stringify(b))
    );
  }
  event.tags = {
    app: "app-usuario",
    ...event.tags,
  };
  return event;
}

/**
 * Determina si un evento operativo debe disparar una alerta crítica en Sentry.
 */
export function esErrorCriticoAlerta(
  tipo: string,
  severidad: OperationalSeverity = "error"
): boolean {
  if (tipo === "startup_failure") return true;
  if (severidad !== "error") return false;
  return EVENTOS_CRITICOS_USUARIO.has(tipo);
}

export interface OpcionesAlertaCriticaSentry {
  tipo: string;
  detalle?: Record<string, unknown>;
  error?: unknown;
  severidad?: OperationalSeverity;
  tags?: Record<string, string>;
}

/**
 * Emite una alerta crítica en Sentry etiquetada con `alert: "critical"` y
 * `alert_rule` para activar las reglas de notificación en producción.
 * Nunca lanza excepciones para no interrumpir el flujo de la aplicación.
 */
export function dispararAlertaCriticaSentry({
  tipo,
  detalle = {},
  error,
  severidad = "error",
  tags = {},
}: OpcionesAlertaCriticaSentry): boolean {
  if (!esErrorCriticoAlerta(tipo, severidad)) {
    return false;
  }

  const config = resolverConfigSentryUsuario();
  const regla = REGLAS_ALERTA_SENTRY[tipo] ?? {
    id: "USR-CRIT-GENERIC-000",
    evento: tipo,
    severidadAlerta: "critical" as const,
    nivelSentry: "error" as const,
    descripcion: `Error crítico en app-usuario: ${tipo}`,
  };

  const detalleSanitizado = sanitizeDetails({
    ...detalle,
    alert_rule_id: regla.id,
    alert_description: regla.descripcion,
    environment: config.environment,
    release: config.release,
  });

  const tagsAlerta: Record<string, string> = {
    app: "app-usuario",
    alert: "critical",
    alert_severity: regla.severidadAlerta,
    alert_rule: regla.id,
    event_type: tipo,
    environment: config.environment,
    ...tags,
  };

  const fingerprint = ["app-usuario", "critical", regla.id, tipo];

  try {
    if (error instanceof Error) {
      Sentry.captureException(error, {
        level: regla.nivelSentry,
        tags: tagsAlerta,
        fingerprint,
        extra: detalleSanitizado,
      });
    } else {
      Sentry.captureMessage(`[usuario:alerta_critica:${tipo}]`, {
        level: regla.nivelSentry,
        tags: tagsAlerta,
        fingerprint,
        extra: detalleSanitizado,
      });
    }
    return true;
  } catch (err) {
    logStructuredWarn("sentry", "fallo_envio_alerta_critica", err, {
      tipo,
      reglaId: regla.id,
    });
    return false;
  }
}

/**
 * Verifica que el DSN de Sentry esté configurado cuando la app corre en producción.
 * Si falta en producción, registra un error estructurado para diagnóstico inmediato.
 */
export function verificarSentryDsnProduccion(): {
  configurado: boolean;
  config: ConfiguracionSentryUsuario;
} {
  const config = resolverConfigSentryUsuario();
  if (config.isProduction && !config.enabled) {
    logStructuredError(
      "sentry",
      "sentry_dsn_ausente_en_produccion",
      new Error("SENTRY_DSN / NEXT_PUBLIC_SENTRY_DSN no configurado en producción"),
      {
        environment: config.environment,
        release: config.release,
      }
    );
    return { configurado: false, config };
  }
  return { configurado: config.enabled, config };
}
