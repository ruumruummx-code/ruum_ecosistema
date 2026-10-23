import { sanitizeDetails } from "@ruum/api/observability";

export type LogLevel = "info" | "warn" | "error";

export interface StructuredLogPayload {
  scope: string;
  event: string;
  level: LogLevel;
  message?: string;
  errorName?: string;
  code?: string | number;
  status?: number;
  timestamp: string;
  [key: string]: unknown;
}

function extraerMetadatosError(err: unknown): Record<string, unknown> {
  if (err === undefined || err === null) return {};

  if (err instanceof Error) {
    const extra: Record<string, unknown> = {
      errorName: err.name || "Error",
      message: err.message,
    };
    const errConCampos = err as Error & {
      code?: unknown;
      status?: unknown;
    };
    if (
      typeof errConCampos.code === "string" ||
      typeof errConCampos.code === "number"
    ) {
      extra.code = errConCampos.code;
    }
    if (typeof errConCampos.status === "number") {
      extra.status = errConCampos.status;
    }
    return sanitizeDetails(extra);
  }

  if (typeof err === "object") {
    const registro = err as Record<string, unknown>;
    const extra: Record<string, unknown> = {};
    if (typeof registro.name === "string") extra.errorName = registro.name;
    if (typeof registro.message === "string") extra.message = registro.message;
    if (
      typeof registro.code === "string" ||
      typeof registro.code === "number"
    ) {
      extra.code = registro.code;
    }
    if (typeof registro.status === "number") extra.status = registro.status;
    if (Object.keys(extra).length === 0) {
      extra.message = String(err);
    }
    return sanitizeDetails(extra);
  }

  return sanitizeDetails({ message: String(err) });
}

export function construirPayloadLog(
  scope: string,
  event: string,
  level: LogLevel,
  err?: unknown,
  contexto: Record<string, unknown> = {},
): StructuredLogPayload {
  const contextoLimpio = sanitizeDetails(contexto);
  const errorMeta = extraerMetadatosError(err);

  return {
    scope,
    event,
    level,
    ...errorMeta,
    ...contextoLimpio,
    timestamp: new Date().toISOString(),
  };
}

export function logStructuredInfo(
  scope: string,
  event: string,
  contexto: Record<string, unknown> = {},
): StructuredLogPayload {
  const payload = construirPayloadLog(scope, event, "info", undefined, contexto);
  try {
    console.info(`[app-usuario:${scope}] ${event}`, payload);
  } catch {
    // Nunca interrumpir la ejecución por fallos de consola
  }
  return payload;
}

export function logStructuredWarn(
  scope: string,
  event: string,
  err?: unknown,
  contexto: Record<string, unknown> = {},
): StructuredLogPayload {
  const payload = construirPayloadLog(scope, event, "warn", err, contexto);
  try {
    console.warn(`[app-usuario:${scope}] ${event}`, payload);
  } catch {
    // Nunca interrumpir la ejecución por fallos de consola
  }
  return payload;
}

export function logStructuredError(
  scope: string,
  event: string,
  err?: unknown,
  contexto: Record<string, unknown> = {},
): StructuredLogPayload {
  const payload = construirPayloadLog(scope, event, "error", err, contexto);
  try {
    console.error(`[app-usuario:${scope}] ${event}`, payload);
  } catch {
    // Nunca interrumpir la ejecución por fallos de consola
  }
  return payload;
}
