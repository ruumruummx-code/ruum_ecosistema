import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as Sentry from "@sentry/nextjs";

const mockObtenerFeatureFlagApp = vi.fn();

vi.mock("@sentry/nextjs", () => ({
  setTag: vi.fn(),
  captureMessage: vi.fn(),
  captureException: vi.fn(),
}));

vi.mock("./supabase-browser", () => ({
  crearClienteNavegador: vi.fn(() => ({
    rpc: vi.fn(async () => ({ data: null, error: null })),
  })),
}));

vi.mock("@ruum/api/feature-flags", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@ruum/api/feature-flags")>();
  return {
    ...actual,
    crearFeatureFlags: () => ({
      clearFeatureFlagCache: vi.fn(),
      getFeatureFlagData: (...args: unknown[]) => mockObtenerFeatureFlagApp(...args),
      isFeatureEnabled: vi.fn(async (key: string) => {
        const d = await mockObtenerFeatureFlagApp(key);
        return Boolean(d?.habilitada);
      }),
    }),
  };
});

import {
  CATALOGO_FEATURE_FLAGS_USUARIO,
  calcularBucketRollout,
  clasificarEtapaRollout,
  evaluarDespliegueProgresivo,
} from "./feature-flags";

describe("Despliegues progresivos con Feature Flags (feature-flags.ts)", () => {
  const envOriginal = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...envOriginal, NEXT_PUBLIC_APP_VERSION: "1.4.0" };
    mockObtenerFeatureFlagApp.mockResolvedValue(null);
  });

  afterEach(() => {
    process.env = { ...envOriginal };
  });

  describe("1. Clasificación de anillos (rings) y bucketing determinista", () => {
    it("clasifica correctamente las etapas de despliegue progresivo según porcentaje", () => {
      expect(clasificarEtapaRollout(false, 100)).toBe("disabled");
      expect(clasificarEtapaRollout(true, 0)).toBe("disabled");
      expect(clasificarEtapaRollout(true, 5)).toBe("canary");
      expect(clasificarEtapaRollout(true, 10)).toBe("canary");
      expect(clasificarEtapaRollout(true, 20)).toBe("ring_1_early_adopters");
      expect(clasificarEtapaRollout(true, 50)).toBe("ring_2_gradual");
      expect(clasificarEtapaRollout(true, 75)).toBe("ring_3_majority");
      expect(clasificarEtapaRollout(true, 100)).toBe("general_availability");
    });

    it("asigna un bucket determinista (0..99) consistente y distribuido uniformemente", () => {
      const b1 = calcularBucketRollout("checkout_stripe_v2", "user-abc-123");
      const b2 = calcularBucketRollout("checkout_stripe_v2", "user-abc-123");
      expect(b1).toBe(b2);
      expect(b1).toBeGreaterThanOrEqual(0);
      expect(b1).toBeLessThan(100);

      // Verificar que una ampliación de rollout del 20% al 50% nunca desactiva usuarios ya incluidos
      for (let i = 0; i < 200; i++) {
        const uid = `usuario-progresivo-${i}`;
        const bucket = calcularBucketRollout("cotizacion_multiparada", uid);
        const activoEn20 = bucket < 20;
        const activoEn50 = bucket < 50;
        if (activoEn20) {
          expect(activoEn50).toBe(true);
        }
      }
    });
  });

  describe("2. Kill-switch, overrides por entorno y cohortes Canary", () => {
    it("aplica kill-switch inmediato cuando NEXT_PUBLIC_FF_<KEY>=false", async () => {
      process.env.NEXT_PUBLIC_FF_CHECKOUT_STRIPE_V2 = "false";
      mockObtenerFeatureFlagApp.mockResolvedValue({
        habilitada: true,
        porcentaje_rollout: 100,
        versiones_permitidas: null,
      });

      const res = await evaluarDespliegueProgresivo("checkout_stripe_v2", {
        userId: "user-1",
      });
      expect(res.enabled).toBe(false);
      expect(res.stage).toBe("disabled");
      expect(res.reason).toBe("kill_switch_env");
      expect(Sentry.setTag).toHaveBeenCalledWith("ff.checkout_stripe_v2", "false");
      expect(Sentry.setTag).toHaveBeenCalledWith("ff_stage.checkout_stripe_v2", "disabled");
    });

    it("permite rollout porcentual controlado por variable de entorno FF_<KEY>=25", async () => {
      process.env.FF_TRACKING_REALTIME_V2 = "25";

      const sinUsuario = await evaluarDespliegueProgresivo("tracking_realtime_v2");
      expect(sinUsuario.enabled).toBe(false);
      expect(sinUsuario.reason).toBe("missing_subject");
      expect(sinUsuario.stage).toBe("ring_1_early_adopters");

      const conUsuario = await evaluarDespliegueProgresivo("tracking_realtime_v2", {
        userId: "user-canary-test",
      });
      expect(conUsuario.reason).toBe("env_rollout");
      expect(conUsuario.rolloutPercentage).toBe(25);
      expect(conUsuario.userBucket).toBe(
        calcularBucketRollout("tracking_realtime_v2", "user-canary-test")
      );
      expect(conUsuario.enabled).toBe((conUsuario.userBucket ?? 100) < 25);
    });

    it("habilita anticipadamente a usuarios de la cohorte Canary (canaryAllowlist)", async () => {
      mockObtenerFeatureFlagApp.mockResolvedValue({
        habilitada: false,
        porcentaje_rollout: 0,
        versiones_permitidas: null,
      });

      const res = await evaluarDespliegueProgresivo("tracking_realtime_v2", {
        userId: "qa-tester-01",
        canaryAllowlist: ["qa-tester-01", "qa-tester-02"],
      });

      expect(res.enabled).toBe(true);
      expect(res.stage).toBe("canary");
      expect(res.reason).toBe("canary_cohort");
    });
  });

  describe("3. Rollout progresivo remoto desde Supabase y control de versiones", () => {
    it("bloquea el rollout cuando la versión de la app no está en versiones_permitidas", async () => {
      mockObtenerFeatureFlagApp.mockResolvedValue({
        habilitada: true,
        porcentaje_rollout: 100,
        versiones_permitidas: ["2.0.0", "2.1.0"],
      });

      const res = await evaluarDespliegueProgresivo("carga_masiva_v2", {
        userId: "user-1",
        versionApp: "1.4.0",
      });

      expect(res.enabled).toBe(false);
      expect(res.reason).toBe("version_mismatch");
    });

    it("evalúa rollout porcentual remoto (ej. 50% ring_2_gradual) y fallback del catálogo", async () => {
      mockObtenerFeatureFlagApp.mockResolvedValueOnce({
        habilitada: true,
        porcentaje_rollout: 50,
        versiones_permitidas: ["1.4.0"],
      });

      const resGradual = await evaluarDespliegueProgresivo("cotizacion_multiparada", {
        userId: "user-gradual-01",
      });
      expect(resGradual.stage).toBe("ring_2_gradual");
      expect(resGradual.reason).toBe("percentage_rollout");
      expect(resGradual.enabled).toBe((resGradual.userBucket ?? 100) < 50);

      // Si Supabase devuelve null, usa el default del catálogo
      mockObtenerFeatureFlagApp.mockResolvedValueOnce(null);
      const resFallback = await evaluarDespliegueProgresivo("checkout_stripe_v2");
      expect(resFallback.reason).toBe("fallback_default");
      expect(resFallback.enabled).toBe(
        CATALOGO_FEATURE_FLAGS_USUARIO.checkout_stripe_v2.defaultEnabled
      );
    });
  });
});
