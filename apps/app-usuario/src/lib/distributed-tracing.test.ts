import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import {
  HEADER_BAGGAGE,
  HEADER_SENTRY_TRACE,
  HEADER_SPAN_ID,
  HEADER_TRACEPARENT,
  HEADER_TRACE_ID,
  construirBaggageSentry,
  construirHeadersTrazaSaliente,
  ejecutarConSpanDistribuido,
  extraerOIniciarTraza,
  generarSpanId,
  generarTraceId,
  parsearSentryTrace,
  parsearTraceparent,
  trazarRutaApi,
} from "./distributed-tracing";
import { middleware } from "../middleware";

vi.mock("@sentry/nextjs", () => ({
  continueTrace: vi.fn((_opts: unknown, cb: () => unknown) => cb()),
  startSpan: vi.fn((_opts: unknown, cb: (span: unknown) => unknown) => cb({ spanId: "mock" })),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

describe("Distributed Tracing con Sentry (distributed-tracing.ts + middleware)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Generación y parseo de cabeceras W3C traceparent, sentry-trace y baggage", () => {
    it("genera traceId de 32 chars hex y spanId de 16 chars hex", () => {
      const traceId = generarTraceId();
      const spanId = generarSpanId();
      expect(traceId).toMatch(/^[0-9a-f]{32}$/);
      expect(spanId).toMatch(/^[0-9a-f]{16}$/);
    });

    it("parsea correctamente cabeceras sentry-trace y W3C traceparent", () => {
      const traceId = "4bf92f3577b34da6a3ce929d0e0e4736";
      const parentSpanId = "00f067aa0ba902b7";

      const st = parsearSentryTrace(`${traceId}-${parentSpanId}-1`);
      expect(st).toEqual({
        traceId,
        parentSpanId,
        sampled: true,
      });

      const stNoSampled = parsearSentryTrace(`${traceId}-${parentSpanId}-0`);
      expect(stNoSampled?.sampled).toBe(false);
      expect(parsearSentryTrace("invalido")).toBeNull();

      const tp = parsearTraceparent(`00-${traceId}-${parentSpanId}-01`);
      expect(tp).toEqual({
        traceId,
        parentSpanId,
        sampled: true,
      });
      expect(parsearTraceparent("00-invalido")).toBeNull();
    });

    it("construye y preserva entradas existentes en baggage de Sentry", () => {
      const traceId = generarTraceId();
      const baggage = construirBaggageSentry(
        traceId,
        "custom-key=valor1,sentry-sample_rate=0.5"
      );
      expect(baggage).toContain(`sentry-trace_id=${traceId}`);
      expect(baggage).toContain("custom-key=valor1");
      expect(baggage).toContain("sentry-sample_rate=0.5");
      expect(baggage).toContain("sentry-release=ruum-usuario@");
    });
  });

  describe("2. Continuación de traza entrante y propagación saliente", () => {
    it("extraerOIniciarTraza continúa el traceId y parentSpanId cuando recibe sentry-trace o traceparent", () => {
      const traceIdEntrante = "abcdef0123456789abcdef0123456789";
      const spanPadre = "1122334455667788";

      const ctx = extraerOIniciarTraza({
        [HEADER_SENTRY_TRACE]: `${traceIdEntrante}-${spanPadre}-1`,
      });

      expect(ctx.traceId).toBe(traceIdEntrante);
      expect(ctx.parentSpanId).toBe(spanPadre);
      expect(ctx.spanId).not.toBe(spanPadre);
      expect(ctx.sentryTrace).toBe(`${traceIdEntrante}-${ctx.spanId}-1`);
      expect(ctx.traceparent).toBe(`00-${traceIdEntrante}-${ctx.spanId}-01`);

      const headersSalientes = construirHeadersTrazaSaliente(ctx, {
        Authorization: "Bearer mock",
      });
      expect(headersSalientes[HEADER_TRACE_ID]).toBe(traceIdEntrante);
      expect(headersSalientes[HEADER_SENTRY_TRACE]).toBe(ctx.sentryTrace);
      expect(headersSalientes[HEADER_TRACEPARENT]).toBe(ctx.traceparent);
      expect(headersSalientes[HEADER_BAGGAGE]).toContain(traceIdEntrante);
    });
  });

  describe("3. Spans distribuidos en Sentry (continueTrace + startSpan) y Middleware", () => {
    it("ejecutarConSpanDistribuido y trazarRutaApi continúan la traza en Sentry y adjuntan headers de correlación", async () => {
      const traceIdCliente = "99887766554433221100ffeeddccbbaa";
      const spanCliente = "aabbccddeeff0011";

      const req = new NextRequest("http://localhost:3000/api/ruta", {
        method: "POST",
        headers: {
          [HEADER_TRACEPARENT]: `00-${traceIdCliente}-${spanCliente}-01`,
        },
      });

      const response = await trazarRutaApi(
        req,
        { name: "POST /api/ruta", op: "http.server.quote" },
        async (ctx) => {
          expect(ctx.traceId).toBe(traceIdCliente);
          expect(ctx.parentSpanId).toBe(spanCliente);
          return NextResponse.json({ ok: true, traceId: ctx.traceId });
        }
      );

      expect(Sentry.continueTrace).toHaveBeenCalledTimes(1);
      expect(Sentry.startSpan).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "POST /api/ruta",
          op: "http.server.quote",
          attributes: expect.objectContaining({
            "trace.id": traceIdCliente,
            "parent.span.id": spanCliente,
            "http.request.method": "POST",
            "http.route": "/api/ruta",
          }),
        }),
        expect.any(Function)
      );

      expect(response.headers.get(HEADER_TRACE_ID)).toBe(traceIdCliente);
      expect(response.headers.get(HEADER_SENTRY_TRACE)).toContain(traceIdCliente);
      expect(response.headers.get(HEADER_TRACEPARENT)).toContain(traceIdCliente);
    });

    it("el middleware propaga el traceId entrante en la respuesta para correlación extremo a extremo", async () => {
      const traceIdNavegador = "1234567890abcdef1234567890abcdef";
      const spanNavegador = "fedcba0987654321";

      const req = new NextRequest("http://localhost:3000/login", {
        method: "GET",
        headers: {
          [HEADER_SENTRY_TRACE]: `${traceIdNavegador}-${spanNavegador}-1`,
        },
      });

      const res = await middleware(req);
      expect(res.headers.get(HEADER_TRACE_ID)).toBe(traceIdNavegador);
      expect(res.headers.get(HEADER_SENTRY_TRACE)).toMatch(
        new RegExp(`^${traceIdNavegador}-[0-9a-f]{16}-1$`)
      );
      expect(res.headers.get(HEADER_TRACEPARENT)).toMatch(
        new RegExp(`^00-${traceIdNavegador}-[0-9a-f]{16}-01$`)
      );
    });

    it("ejecutarConSpanDistribuido propaga errores sin perder el contexto del span", async () => {
      await expect(
        ejecutarConSpanDistribuido(
          { name: "db.query", op: "db.supabase" },
          async () => {
            throw new Error("Timeout en consulta distribuida");
          }
        )
      ).rejects.toThrow("Timeout en consulta distribuida");
    });
  });
});
