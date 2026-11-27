import { logStructuredWarn } from "./logger";

const VERSION_TERMINOS_VIGENTE = 1;

function detectarCanalDesdeUserAgent(userAgent: string | null): "web" | "android" | "ios" {
  if (!userAgent) return "web";
  if (/android/i.test(userAgent)) return "android";
  if (/iPad|iPhone|iPod/i.test(userAgent)) return "ios";
  return "web";
}

/**
 * PR-07 / P0-2: Registra el consentimiento legal canónico en base de datos
 * (`consentimientos_usuario`, `usuarios` y `registro_auditoria`) inmediatamente
 * después de autenticar la cuenta de usuario. Es idempotente en SQL.
 */
export async function registrarConsentimientoPostAuth(
  supabase: unknown,
  userAgent: string | null
): Promise<void> {
  const cliente = supabase as {
    rpc?: (
      fn: string,
      args: Record<string, unknown>
    ) => Promise<{ error: unknown }>;
  } | null;

  if (!cliente || typeof cliente.rpc !== "function") return;

  try {
    const versionApp = process.env.NEXT_PUBLIC_APP_VERSION?.trim() || "1.0.0";
    const { error } = await cliente.rpc("registrar_consentimiento_usuario", {
      p_version: VERSION_TERMINOS_VIGENTE,
      p_canal: detectarCanalDesdeUserAgent(userAgent),
      p_version_app: versionApp.slice(0, 40),
    });
    if (error) {
      logStructuredWarn("auth/consentimiento", "registrar_consentimiento_usuario_fallido", error);
    }
  } catch (error) {
    logStructuredWarn("auth/consentimiento", "registrar_consentimiento_usuario_excepcion", error);
  }
}
