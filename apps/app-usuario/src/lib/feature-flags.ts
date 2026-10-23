import * as Sentry from "@sentry/nextjs";
import { crearFeatureFlags, type FeatureFlagApp } from "@ruum/api/feature-flags";
import { recordOperationalEvent } from "./observability";
import { crearClienteNavegador } from "./supabase-browser";

/**
 * Fachada base: la implementación de caché/retry/dedup vive en `@ruum/api/feature-flags`.
 * Los errores de fetch se reportan a la observabilidad de usuario sin bloquear.
 */
export const { clearFeatureFlagCache, getFeatureFlagData, isFeatureEnabled } =
  crearFeatureFlags({
    crearCliente: crearClienteNavegador,
    reportar: (_tipo, detalle, severidad) =>
      void recordOperationalEvent("supabase_error", detalle, severidad),
  });

export type { FeatureFlagApp };

/**
 * Catálogo tipado de feature flags para despliegues progresivos en app-usuario.
 */
export type FeatureFlagKeyUsuario =
  | "checkout_stripe_v2"
  | "cotizacion_multiparada"
  | "carga_masiva_v2"
  | "verificacion_sms_estricta"
  | "tracking_realtime_v2"
  | (string & {});

/**
 * Anillos (rings) de despliegue progresivo según porcentaje de rollout.
 */
export type EtapaDespliegueProgresivo =
  | "disabled"
  | "canary"
  | "ring_1_early_adopters"
  | "ring_2_gradual"
  | "ring_3_majority"
  | "general_availability";

export type MotivoEvaluacionFlag =
  | "kill_switch_env"
  | "env_rollout"
  | "canary_cohort"
  | "version_mismatch"
  | "disabled"
  | "percentage_rollout"
  | "full_rollout"
  | "missing_subject"
  | "fallback_default";

export interface DefinicionFlagProgresivo {
  key: FeatureFlagKeyUsuario;
  descripcion: string;
  defaultEnabled: boolean;
  defaultRollout: number;
}

export const CATALOGO_FEATURE_FLAGS_USUARIO: Record<string, DefinicionFlagProgresivo> = {
  checkout_stripe_v2: {
    key: "checkout_stripe_v2",
    descripcion: "Despliegue progresivo del flujo de cobro Stripe Elements v2 con conciliación inmediata",
    defaultEnabled: true,
    defaultRollout: 100,
  },
  cotizacion_multiparada: {
    key: "cotizacion_multiparada",
    descripcion: "Despliegue progresivo de cotización con paradas intermedias en mapa",
    defaultEnabled: true,
    defaultRollout: 100,
  },
  carga_masiva_v2: {
    key: "carga_masiva_v2",
    descripcion: "Despliegue progresivo de validación y geocodificación incremental por lotes",
    defaultEnabled: true,
    defaultRollout: 100,
  },
  verificacion_sms_estricta: {
    key: "verificacion_sms_estricta",
    descripcion: "Despliegue progresivo de verificación telefónica por OTP SMS en registro",
    defaultEnabled: true,
    defaultRollout: 100,
  },
  tracking_realtime_v2: {
    key: "tracking_realtime_v2",
    descripcion: "Despliegue progresivo de telemetría en tiempo real durante el traslado",
    defaultEnabled: false,
    defaultRollout: 25,
  },
};

export interface ContextoEvaluacionFlag {
  userId?: string | null;
  sessionId?: string | null;
  versionApp?: string;
  canaryAllowlist?: string[];
  forceRefresh?: boolean;
  defaultValue?: boolean;
}

export interface ResultadoEvaluacionFlag {
  key: string;
  enabled: boolean;
  stage: EtapaDespliegueProgresivo;
  rolloutPercentage: number;
  userBucket: number | null;
  reason: MotivoEvaluacionFlag;
  version: string;
}

/**
 * Clasifica el anillo de despliegue progresivo a partir del porcentaje (0-100).
 */
export function clasificarEtapaRollout(
  habilitada: boolean,
  porcentaje: number
): EtapaDespliegueProgresivo {
  if (!habilitada || porcentaje <= 0) return "disabled";
  if (porcentaje <= 10) return "canary";
  if (porcentaje <= 25) return "ring_1_early_adopters";
  if (porcentaje <= 50) return "ring_2_gradual";
  if (porcentaje < 100) return "ring_3_majority";
  return "general_availability";
}

/**
 * Calcula un bucket determinista (0..99) para el par `key:subjectId`.
 * Garantiza que un usuario permanezca siempre en el mismo anillo durante un rollout gradual.
 */
export function calcularBucketRollout(key: string, subjectId: string): number {
  let hash = 0;
  const input = `${key}:${subjectId}`;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash % 100;
}

function leerOverrideEntorno(key: string): string | undefined {
  const normalizada = key.toUpperCase().replace(/[^A-Z0-9_]/g, "_");
  const valor =
    process.env[`NEXT_PUBLIC_FF_${normalizada}`] ??
    process.env[`FF_${normalizada}`];
  return valor?.trim() || undefined;
}

function registrarTagSentryFlag(resultado: ResultadoEvaluacionFlag): void {
  try {
    if (typeof Sentry.setTag === "function") {
      Sentry.setTag(`ff.${resultado.key}`, String(resultado.enabled));
      Sentry.setTag(`ff_stage.${resultado.key}`, resultado.stage);
    }
  } catch {
    // La telemetría de flags nunca debe interrumpir la ejecución
  }
}

/**
 * Evalúa un feature flag con soporte completo para despliegues progresivos:
 * 1. Kill-switch / override por variable de entorno (`NEXT_PUBLIC_FF_<KEY>` = `true` | `false` | `0..100`).
 * 2. Cohorte Canary (`canaryAllowlist`) para habilitar anticipadamente a usuarios internos/QA.
 * 3. Validación de versión de app (`versiones_permitidas`).
 * 4. Rollout porcentual gradual desde Supabase (`feature_flags_app`) con bucketing determinista.
 * 5. Etiquetado automático en Sentry (`ff.<key>`, `ff_stage.<key>`) para correlacionar errores con rollouts.
 */
export async function evaluarDespliegueProgresivo(
  key: FeatureFlagKeyUsuario,
  contexto: ContextoEvaluacionFlag = {}
): Promise<ResultadoEvaluacionFlag> {
  const version = (
    contexto.versionApp ||
    process.env.NEXT_PUBLIC_APP_VERSION ||
    "1.0.0"
  ).trim();
  const subjectId =
    contexto.userId?.trim() || contexto.sessionId?.trim() || null;

  // 1. Kill-switch o porcentaje forzado por variable de entorno
  const envOverride = leerOverrideEntorno(key);
  if (envOverride !== undefined) {
    const lower = envOverride.toLowerCase();
    if (lower === "false" || lower === "0" || lower === "off") {
      const res: ResultadoEvaluacionFlag = {
        key,
        enabled: false,
        stage: "disabled",
        rolloutPercentage: 0,
        userBucket: null,
        reason: "kill_switch_env",
        version,
      };
      registrarTagSentryFlag(res);
      return res;
    }
    if (lower === "true" || lower === "on") {
      const res: ResultadoEvaluacionFlag = {
        key,
        enabled: true,
        stage: "general_availability",
        rolloutPercentage: 100,
        userBucket: 0,
        reason: "env_rollout",
        version,
      };
      registrarTagSentryFlag(res);
      return res;
    }
    const porcentajeEnv = Number(envOverride);
    if (Number.isFinite(porcentajeEnv) && porcentajeEnv >= 0 && porcentajeEnv <= 100) {
      if (porcentajeEnv >= 100) {
        const res: ResultadoEvaluacionFlag = {
          key,
          enabled: true,
          stage: "general_availability",
          rolloutPercentage: 100,
          userBucket: 0,
          reason: "env_rollout",
          version,
        };
        registrarTagSentryFlag(res);
        return res;
      }
      if (!subjectId) {
        const res: ResultadoEvaluacionFlag = {
          key,
          enabled: false,
          stage: clasificarEtapaRollout(true, porcentajeEnv),
          rolloutPercentage: porcentajeEnv,
          userBucket: null,
          reason: "missing_subject",
          version,
        };
        registrarTagSentryFlag(res);
        return res;
      }
      const bucket = calcularBucketRollout(key, subjectId);
      const res: ResultadoEvaluacionFlag = {
        key,
        enabled: bucket < porcentajeEnv,
        stage: clasificarEtapaRollout(true, porcentajeEnv),
        rolloutPercentage: porcentajeEnv,
        userBucket: bucket,
        reason: "env_rollout",
        version,
      };
      registrarTagSentryFlag(res);
      return res;
    }
  }

  // 2. Cohorte Canary explícita (QA / Beta testers)
  if (
    subjectId &&
    Array.isArray(contexto.canaryAllowlist) &&
    contexto.canaryAllowlist.includes(subjectId)
  ) {
    const res: ResultadoEvaluacionFlag = {
      key,
      enabled: true,
      stage: "canary",
      rolloutPercentage: 10,
      userBucket: 0,
      reason: "canary_cohort",
      version,
    };
    registrarTagSentryFlag(res);
    return res;
  }

  // 3. Consulta remota con caché TTL + deduplicación
  const data = await getFeatureFlagData(key, Boolean(contexto.forceRefresh));
  if (!data) {
    const fallback =
      contexto.defaultValue ??
      CATALOGO_FEATURE_FLAGS_USUARIO[key]?.defaultEnabled ??
      false;
    const res: ResultadoEvaluacionFlag = {
      key,
      enabled: fallback,
      stage: fallback ? "general_availability" : "disabled",
      rolloutPercentage: fallback ? 100 : 0,
      userBucket: null,
      reason: "fallback_default",
      version,
    };
    registrarTagSentryFlag(res);
    return res;
  }

  if (!data.habilitada || data.porcentaje_rollout <= 0) {
    const res: ResultadoEvaluacionFlag = {
      key,
      enabled: false,
      stage: "disabled",
      rolloutPercentage: 0,
      userBucket: null,
      reason: "disabled",
      version,
    };
    registrarTagSentryFlag(res);
    return res;
  }

  // 4. Gate de versiones permitidas
  if (
    Array.isArray(data.versiones_permitidas) &&
    data.versiones_permitidas.length > 0 &&
    !data.versiones_permitidas.includes(version)
  ) {
    const res: ResultadoEvaluacionFlag = {
      key,
      enabled: false,
      stage: clasificarEtapaRollout(true, data.porcentaje_rollout),
      rolloutPercentage: data.porcentaje_rollout,
      userBucket: null,
      reason: "version_mismatch",
      version,
    };
    registrarTagSentryFlag(res);
    return res;
  }

  // 5. Rollout al 100% (General Availability)
  if (data.porcentaje_rollout >= 100) {
    const res: ResultadoEvaluacionFlag = {
      key,
      enabled: true,
      stage: "general_availability",
      rolloutPercentage: 100,
      userBucket: 0,
      reason: "full_rollout",
      version,
    };
    registrarTagSentryFlag(res);
    return res;
  }

  // 6. Rollout porcentual gradual con bucketing determinista
  if (!subjectId) {
    const res: ResultadoEvaluacionFlag = {
      key,
      enabled: false,
      stage: clasificarEtapaRollout(true, data.porcentaje_rollout),
      rolloutPercentage: data.porcentaje_rollout,
      userBucket: null,
      reason: "missing_subject",
      version,
    };
    registrarTagSentryFlag(res);
    return res;
  }

  const bucket = calcularBucketRollout(key, subjectId);
  const res: ResultadoEvaluacionFlag = {
    key,
    enabled: bucket < data.porcentaje_rollout,
    stage: clasificarEtapaRollout(true, data.porcentaje_rollout),
    rolloutPercentage: data.porcentaje_rollout,
    userBucket: bucket,
    reason: "percentage_rollout",
    version,
  };
  registrarTagSentryFlag(res);
  return res;
}
