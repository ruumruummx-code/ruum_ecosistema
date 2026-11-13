import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as Sentry from "@sentry/nextjs";
import {
  REGLAS_ALERTA_SENTRY,
  dispararAlertaCriticaSentry,
  esErrorCriticoAlerta,
  resolverConfigSentryUsuario,
  sanitizarEventoSentry,
  verificarSentryDsnProduccion,
} from "./sentry-alerts";
import { reportarErrorBoundary } from "./reportar-error-boundary";
import { register, onRequestError } from "../../instrumentation";

vi.mock("@sentry/nextjs", () => ({
  init: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

describe("Configuración Sentry DSN y Alertas en Producción (sentry-alerts.ts)", () => {
  const envOriginal = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...envOriginal };
  });

  afterEach(() => {
    process.env = { ...envOriginal };
  });

  describe("1. Resolución de DSN y verificación en producción", () => {
    it("resuelve correctamente SENTRY_DSN, NEXT_PUBLIC_SENTRY_DSN, environment y release", () => {
      process.env.SENTRY_DSN = "https://mock-key@o0.ingest.sentry.io/123";
      process.env.SENTRY_ENVIRONMENT = "production";
      process.env.NEXT_PUBLIC_APP_VERSION = "2.4.0";
      process.env.SENTRY_TRACES_SAMPLE_RATE = "0.25";

      const config = resolverConfigSentryUsuario();
      expect(config.enabled).toBe(true);
      expect(config.dsn).toBe("https://mock-key@o0.ingest.sentry.io/123");
      expect(config.environment).toBe("production");
      expect(config.release).toBe("ruum-usuario@2.4.0");
      expect(config.tracesSampleRate).toBe(0.25);
      expect(config.isProduction).toBe(true);
      expect(config.alertsEnabled).toBe(true);
    });

    it("emite diagnóstico de error estructurado si falta SENTRY_DSN en producción", () => {
      const spyError = vi.spyOn(console, "error").mockImplementation(() => {});
      (process.env as Record<string, string | undefined>).NODE_ENV = "production";
      delete process.env.SENTRY_DSN;
      delete process.env.NEXT_PUBLIC_SENTRY_DSN;

      const verif = verificarSentryDsnProduccion();
      expect(verif.configurado).toBe(false);
      expect(spyError).toHaveBeenCalledWith(
        "[app-usuario:sentry] sentry_dsn_ausente_en_produccion",
        expect.objectContaining({
          scope: "sentry",
          event: "sentry_dsn_ausente_en_produccion",
        })
      );
      spyError.mockRestore();
    });

    it("register() inicializa Sentry cuando DSN está configurado", async () => {
      process.env.SENTRY_DSN = "https://mock-key@o0.ingest.sentry.io/456";
      (process.env as Record<string, string | undefined>).NODE_ENV = "production";

      await register();
      expect(Sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          dsn: "https://mock-key@o0.ingest.sentry.io/456",
          sendDefaultPii: false,
        })
      );
    });
  });

  describe("2. Sanitización beforeSend anti-secretos y anti-PII", () => {
    it("elimina authorization, cookie, x-supabase-auth y x-csrf-token y filtra breadcrumbs sensibles", () => {
      const evento = sanitizarEventoSentry({
        request: {
          headers: {
            authorization: "Bearer mock-token",
            cookie: "ruum_csrf_token=abc",
            "x-supabase-auth": "mock-supa",
            "x-csrf-token": "mock-csrf",
            "user-agent": "Mozilla/5.0",
          },
        },
        breadcrumbs: [
          { message: "Click en continuar" },
          { message: "Token de usuario: password=123" },
          { data: { curp: "ABCD123456" } },
        ],
        tags: {} as Record<string, unknown>,
      });

      expect(evento.request?.headers).toEqual({ "user-agent": "Mozilla/5.0" });
      expect(evento.breadcrumbs).toHaveLength(1);
      expect(evento.tags?.app).toBe("app-usuario");
    });
  });

  describe("3. Generación de alertas en Sentry para errores críticos", () => {
    it("clasifica eventos críticos de producción y excluye eventos informativos", () => {
      expect(esErrorCriticoAlerta("stripe_payment_failure", "error")).toBe(true);
      expect(esErrorCriticoAlerta("trip_creation_failure", "error")).toBe(true);
      expect(esErrorCriticoAlerta("auth_callback_error", "error")).toBe(true);
      expect(esErrorCriticoAlerta("supabase_error", "error")).toBe(true);
      expect(esErrorCriticoAlerta("startup_failure", "warning")).toBe(true);
      expect(esErrorCriticoAlerta("login_success", "info")).toBe(false);
      expect(esErrorCriticoAlerta("login_failure", "warning")).toBe(false);
    });

    it("dispara alerta crítica con captureMessage para fallos operativos críticos y sanitiza PII", () => {
      const enviado = dispararAlertaCriticaSentry({
        tipo: "stripe_payment_failure",
        severidad: "error",
        detalle: {
          decline_code: "insufficient_funds",
          numero_tarjeta: "4111222233334444",
          cvv: "999",
        },
      });

      expect(enviado).toBe(true);
      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        "[usuario:alerta_critica:stripe_payment_failure]",
        expect.objectContaining({
          level: "error",
          tags: expect.objectContaining({
            app: "app-usuario",
            alert: "critical",
            alert_severity: "critical",
            alert_rule: REGLAS_ALERTA_SENTRY.stripe_payment_failure.id,
            event_type: "stripe_payment_failure",
          }),
          fingerprint: [
            "app-usuario",
            "critical",
            REGLAS_ALERTA_SENTRY.stripe_payment_failure.id,
            "stripe_payment_failure",
          ],
          extra: expect.objectContaining({
            decline_code: "insufficient_funds",
            alert_rule_id: REGLAS_ALERTA_SENTRY.stripe_payment_failure.id,
          }),
        })
      );

      const extraEnviado = (
        vi.mocked(Sentry.captureMessage).mock.calls[0]?.[1] as {
          extra?: Record<string, unknown>;
        }
      )?.extra;
      expect(extraEnviado).not.toHaveProperty("numero_tarjeta");
      expect(extraEnviado).not.toHaveProperty("cvv");
    });

    it("onRequestError dispara alerta crítica en Sentry con captureException", () => {
      const spyConsole = vi.spyOn(console, "error").mockImplementation(() => {});
      const err = new Error("Fallo crítico en /api/viajes");

      onRequestError(
        err,
        { path: "/api/viajes", method: "POST", headers: {} },
        { routerKind: "App Router", routePath: "/api/viajes", routeType: "route" }
      );

      expect(Sentry.captureException).toHaveBeenCalledWith(
        err,
        expect.objectContaining({
          level: "error",
          tags: expect.objectContaining({
            app: "app-usuario",
            alert: "critical",
            alert_rule: REGLAS_ALERTA_SENTRY.unhandled_request_error.id,
            routePath: "/api/viajes",
          }),
        })
      );
      spyConsole.mockRestore();
    });

    it("reportarErrorBoundary envía alerta crítica a Sentry con nivel fatal en global boundary", () => {
      const err = Object.assign(new Error("Crash global"), { digest: "dig-123" });
      reportarErrorBoundary(err, "global");

      expect(Sentry.captureException).toHaveBeenCalledWith(
        err,
        expect.objectContaining({
          level: "fatal",
          tags: expect.objectContaining({
            app: "app-usuario",
            boundary: "global",
            alert: "critical",
            alert_rule: REGLAS_ALERTA_SENTRY.react_error_boundary.id,
          }),
        })
      );
    });
  });
});
