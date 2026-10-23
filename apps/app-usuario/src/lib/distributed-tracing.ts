import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";

export const HEADER_SENTRY_TRACE = "sentry-trace";
export const HEADER_BAGGAGE = "baggage";
export const HEADER_TRACEPARENT = "traceparent";
export const HEADER_TRACE_ID = "x-trace-id";
export const HEADER_SPAN_ID = "x-span-id";

const REGEX_SENTRY_TRACE = /^([0-9a-f]{32})-([0-9a-f]{16})(?:-([01]))?$/i;
const REGEX_TRACEPARENT = /^00-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/i;

export interface ContextoTrazaDistribuida {
  traceId: string;
  spanId: string;
  parentSpanId: string | null;
  sampled: boolean;
  sentryTrace: string;
  traceparent: string;
  baggage: string;
}

/**
 * Genera una cadena hexadecimal criptográficamente aleatoria de `bytes` bytes.
 */
export function generarHexAleatorio(bytes: number): string {
  const buffer = new Uint8Array(bytes);
  globalThis.crypto.getRandomValues(buffer);
  return Array.from(buffer, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function generarTraceId(): string {
  return generarHexAleatorio(16); // 32 chars hex (128-bit)
}

export function generarSpanId(): string {
  return generarHexAleatorio(8); // 16 chars hex (64-bit)
}

/**
 * Parsea la cabecera `sentry-trace` (`<trace_id>-<span_id>-<sampled>`).
 */
export function parsearSentryTrace(valor: string | null | undefined): {
  traceId: string;
  parentSpanId: string;
  sampled: boolean;
} | null {
  if (!valor || typeof valor !== "string") return null;
  const match = REGEX_SENTRY_TRACE.exec(valor.trim());
  if (!match) return null;
  return {
    traceId: match[1].toLowerCase(),
    parentSpanId: match[2].toLowerCase(),
    sampled: match[3] !== "0",
  };
}

/**
 * Parsea la cabecera estándar W3C `traceparent` (`00-<trace_id>-<span_id>-<flags>`).
 */
export function parsearTraceparent(valor: string | null | undefined): {
  traceId: string;
  parentSpanId: string;
  sampled: boolean;
} | null {
  if (!valor || typeof valor !== "string") return null;
  const match = REGEX_TRACEPARENT.exec(valor.trim());
  if (!match) return null;
  const flags = parseInt(match[3], 16);
  return {
    traceId: match[1].toLowerCase(),
    parentSpanId: match[2].toLowerCase(),
    sampled: (flags & 0x01) === 0x01,
  };
}

/**
 * Construye o enriquece la cabecera `baggage` con metadatos de Sentry para trazado distribuido.
 */
export function construirBaggageSentry(
  traceId: string,
  baggageExistente?: string | null
): string {
  const env = (
    process.env.SENTRY_ENVIRONMENT ||
    process.env.NEXT_PUBLIC_RUUM_AMBIENTE ||
    process.env.NODE_ENV ||
    "development"
  ).trim();
  const release = `ruum-usuario@${(process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0").trim()}`;
  const sampleRate = (process.env.SENTRY_TRACES_SAMPLE_RATE || "0.1").trim();

  const entradas = new Map<string, string>();
  if (baggageExistente && typeof baggageExistente === "string") {
    for (const item of baggageExistente.split(",")) {
      const [k, ...rest] = item.trim().split("=");
      if (k && rest.length > 0) {
        entradas.set(k.trim(), rest.join("=").trim());
      }
    }
  }

  entradas.set("sentry-trace_id", traceId);
  entradas.set("sentry-environment", env);
  entradas.set("sentry-release", release);
  if (!entradas.has("sentry-sample_rate")) {
    entradas.set("sentry-sample_rate", sampleRate);
  }

  return Array.from(entradas.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join(",");
}

/**
 * Extrae el contexto de traza entrante desde `sentry-trace` o `traceparent`,
 * o inicia una nueva traza distribuida si la petición no trae cabeceras.
 */
export function extraerOIniciarTraza(
  headers?: Headers | Record<string, string | undefined> | null
): ContextoTrazaDistribuida {
  const leerHeader = (nombre: string): string | null => {
    if (!headers) return null;
    if (typeof (headers as Headers).get === "function") {
      return (headers as Headers).get(nombre);
    }
    const rec = headers as Record<string, string | undefined>;
    return rec[nombre] ?? rec[nombre.toLowerCase()] ?? null;
  };

  const rawSentryTrace = leerHeader(HEADER_SENTRY_TRACE);
  const rawTraceparent = leerHeader(HEADER_TRACEPARENT);
  const rawBaggage = leerHeader(HEADER_BAGGAGE);

  const parsed =
    parsearSentryTrace(rawSentryTrace) ?? parsearTraceparent(rawTraceparent);

  const traceId = parsed?.traceId ?? generarTraceId();
  const parentSpanId = parsed?.parentSpanId ?? null;
  const sampled = parsed?.sampled ?? true;
  const spanId = generarSpanId();

  const flagSampled = sampled ? "1" : "0";
  const flagW3c = sampled ? "01" : "00";
  const sentryTrace = `${traceId}-${spanId}-${flagSampled}`;
  const traceparent = `00-${traceId}-${spanId}-${flagW3c}`;
  const baggage = construirBaggageSentry(traceId, rawBaggage);

  return {
    traceId,
    spanId,
    parentSpanId,
    sampled,
    sentryTrace,
    traceparent,
    baggage,
  };
}

/**
 * Construye las cabeceras HTTP para propagar la traza distribuida hacia servicios
 * externos (Supabase Edge Functions, Mapbox, Stripe, microservicios) o rutas internas.
 */
export function construirHeadersTrazaSaliente(
  contexto?: ContextoTrazaDistribuida,
  headersBase: Record<string, string> = {}
): Record<string, string> {
  const ctx = contexto ?? extraerOIniciarTraza();
  return {
    ...headersBase,
    [HEADER_SENTRY_TRACE]: ctx.sentryTrace,
    [HEADER_BAGGAGE]: ctx.baggage,
    [HEADER_TRACEPARENT]: ctx.traceparent,
    [HEADER_TRACE_ID]: ctx.traceId,
    [HEADER_SPAN_ID]: ctx.spanId,
  };
}

/**
 * Adjunta las cabeceras de correlación de traza distribuida a un `NextResponse`.
 */
export function adjuntarHeadersTrazaRespuesta(
  response: NextResponse,
  contexto: ContextoTrazaDistribuida
): NextResponse {
  response.headers.set(HEADER_TRACE_ID, contexto.traceId);
  response.headers.set(HEADER_SPAN_ID, contexto.spanId);
  response.headers.set(HEADER_SENTRY_TRACE, contexto.sentryTrace);
  response.headers.set(HEADER_TRACEPARENT, contexto.traceparent);
  return response;
}

export interface OpcionesSpanDistribuido {
  name: string;
  op: string;
  headers?: Headers | Record<string, string | undefined> | null;
  attributes?: Record<string, string | number | boolean>;
}

/**
 * Ejecuta una operación asíncrona dentro de un span distribuido de Sentry,
 * continuando la traza entrante (`sentry-trace` + `baggage`) cuando está presente.
 */
export async function ejecutarConSpanDistribuido<T>(
  opciones: OpcionesSpanDistribuido,
  fn: (contexto: ContextoTrazaDistribuida) => Promise<T>
): Promise<T> {
  const contexto = extraerOIniciarTraza(opciones.headers);
  const atributosSpan: Record<string, string | number | boolean> = {
    "sentry.origin": "manual.distributed.app-usuario",
    "trace.id": contexto.traceId,
    "span.id": contexto.spanId,
    ...(contexto.parentSpanId ? { "parent.span.id": contexto.parentSpanId } : {}),
    ...opciones.attributes,
  };

  const ejecutarSpan = async (): Promise<T> => {
    if (typeof Sentry.startSpan === "function") {
      return await Sentry.startSpan(
        {
          name: opciones.name,
          op: opciones.op,
          attributes: atributosSpan,
        },
        async () => await fn(contexto)
      );
    }
    return await fn(contexto);
  };

  try {
    if (typeof Sentry.continueTrace === "function") {
      return await Sentry.continueTrace(
        {
          sentryTrace: contexto.sentryTrace,
          baggage: contexto.baggage,
        },
        ejecutarSpan
      );
    }
    return await ejecutarSpan();
  } catch (err) {
    throw err;
  }
}

/**
 * Envuelve un Route Handler de Next.js con trazado distribuido de Sentry:
 * - Continúa la traza entrante del cliente/middleware (`sentry-trace` / `traceparent`).
 * - Registra el span `http.server` con método, ruta y código de estado HTTP.
 * - Adjunta `x-trace-id`, `x-span-id`, `sentry-trace` y `traceparent` en la respuesta.
 */
export async function trazarRutaApi(
  request: NextRequest,
  meta: { name: string; op?: string; attributes?: Record<string, string | number | boolean> },
  handler: (contexto: ContextoTrazaDistribuida) => Promise<NextResponse>
): Promise<NextResponse> {
  const pathname = request.nextUrl?.pathname ?? meta.name;
  return await ejecutarConSpanDistribuido(
    {
      name: meta.name,
      op: meta.op ?? "http.server",
      headers: request.headers,
      attributes: {
        "http.request.method": request.method,
        "http.route": pathname,
        ...meta.attributes,
      },
    },
    async (contexto) => {
      const response = await handler(contexto);
      return adjuntarHeadersTrazaRespuesta(response, contexto);
    }
  );
}
