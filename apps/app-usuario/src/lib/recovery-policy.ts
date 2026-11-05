import crypto from "node:crypto";
import { logStructuredWarn } from "./logger";

export const RECOVERY_VENTANA_MS = 15 * 60 * 1000; // 15 minutos

/**
 * RUUM-USR-F4-001 (CB-1): Umbrales diferenciados para recuperación de acceso.
 *
 * Extensión autorizada del contrato transversal de rate limit de F3 (registro-flujo3.md):
 * - Consume exclusivamente la infraestructura Upstash Redis de F2 (csp-rate-limit.ts).
 * - No introduce almacenes adicionales ni divergencias de diseño.
 * - Emplea clave compuesta (IP + hashIdentificador + Device ID) y ventana de 15 min.
 * - Umbrales autorizados más estrictos para resetPasswordForEmail (3/15 min por email)
 *   debido al costo económico y riesgo de spam sobre el transporte SMTP de GoTrue.
 */
export const RECOVERY_SOLICITUD_LIMITES = {
  ip: 15, // 15 solicitudes por 15 min por IP (tolerante a CGNAT corporativo/móvil)
  email: 3, // 3 solicitudes por 15 min por correo (protege buzón y cuota SMTP)
  dispositivo: 5, // 5 solicitudes por 15 min por huella de dispositivo
} as const;

export const RECOVERY_VERIFY_LIMITES = {
  ip: 60, // 60 por hora por IP (suficiente para redes NAT compartidas)
  cuenta: 15, // 15 por 15 min por UUID de usuario
  dispositivo: 25, // 25 por hora por dispositivo
} as const;

export const RECOVERY_CLEAR_LIMITES = {
  ip: 40, // 40 por hora por IP
  cuenta: 10, // 10 por 15 min por UUID de usuario
  dispositivo: 20, // 20 por hora por dispositivo
} as const;

/**
 * Nota de rigor criptográfico:
 * El hash truncado de 32 hex (SHA-256) generado aquí se emplea para claves de Redis
 * y como correlador en eventos de telemetría (emailHash). Constituye un mecanismo
 * de pseudonimización operacional (RFC 4949 / Considerando 26 RGPD) para no registrar
 * PII en claro. NO representa anonimización fuerte irreversible ni un control de
 * seguridad o secreto criptográfico.
 */
export function hashIdentificador(valor: string): string {
  return crypto.createHash("sha256").update(valor).digest("hex").slice(0, 32);
}

export function captchaConfigurado(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY?.trim());
}

/**
 * Determina si se requiere verificación humana adaptativa basada en el riesgo.
 * Si a cualquiera de las dimensiones le quedan <= 1 peticiones restantes, se exige CAPTCHA.
 */
export function requiereCaptchaRecovery(riesgo: {
  ip?: number;
  email?: number;
  dispositivo?: number;
}): boolean {
  return Object.values(riesgo).some(
    (restantes) => typeof restantes === "number" && restantes <= 1
  );
}

/**
 * Verificación adaptativa con Cloudflare Turnstile para el endpoint de recuperación.
 * Sigue el contrato de RUUM-USR-F3-001 (CB-2 y CB-3).
 */
export async function verificarCaptchaRecovery(
  token: string | null | undefined,
  ip: string | null
): Promise<{ aprobado: boolean; configurado: boolean; proveedorCaido: boolean }> {
  if (!captchaConfigurado()) {
    return { aprobado: false, configurado: false, proveedorCaido: false };
  }
  if (!token) {
    return { aprobado: false, configurado: true, proveedorCaido: false };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3_000);
  try {
    const respuesta = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: process.env.TURNSTILE_SECRET_KEY,
          response: token,
          remoteip: ip ?? undefined,
        }),
        signal: controller.signal,
      }
    );

    if (!respuesta.ok) {
      return { aprobado: false, configurado: true, proveedorCaido: true };
    }

    const datos = (await respuesta.json().catch(() => null)) as {
      success?: boolean;
    } | null;
    return {
      aprobado: datos?.success === true,
      configurado: true,
      proveedorCaido: false,
    };
  } catch (error) {
    logStructuredWarn(
      "recovery/policy",
      "captcha_recovery_proveedor_no_disponible",
      error
    );
    return { aprobado: false, configurado: true, proveedorCaido: true };
  } finally {
    clearTimeout(timer);
  }
}
