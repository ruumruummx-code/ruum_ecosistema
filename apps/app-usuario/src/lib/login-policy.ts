import crypto from "node:crypto";
import { logStructuredWarn } from "./logger";

export const LOGIN_VENTANA_MS = 15 * 60 * 1000;
export const LOGIN_LIMITES = { ip: 20, email: 8, dispositivo: 15 } as const;

export function hashIdentificador(valor: string): string {
  return crypto.createHash("sha256").update(valor).digest("hex").slice(0, 32);
}

export function captchaConfigurado(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY?.trim());
}

export function requiereCaptcha(riesgo: { ip?: number; email?: number; dispositivo?: number }): boolean {
  return Object.values(riesgo).some((restantes) => typeof restantes === "number" && restantes <= 2);
}

export async function verificarCaptchaAdaptativo(
  token: string | null | undefined,
  ip: string | null
): Promise<{ aprobado: boolean; configurado: boolean; proveedorCaido: boolean }> {
  if (!captchaConfigurado()) return { aprobado: false, configurado: false, proveedorCaido: false };
  if (!token) return { aprobado: false, configurado: true, proveedorCaido: false };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3_000);
  try {
    const respuesta = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: process.env.TURNSTILE_SECRET_KEY, response: token, remoteip: ip ?? undefined }),
      signal: controller.signal,
    });
    if (!respuesta.ok) return { aprobado: false, configurado: true, proveedorCaido: true };
    const datos = (await respuesta.json().catch(() => null)) as { success?: boolean } | null;
    return { aprobado: datos?.success === true, configurado: true, proveedorCaido: false };
  } catch (error) {
    logStructuredWarn("auth/login", "captcha_proveedor_no_disponible", error);
    return { aprobado: false, configurado: true, proveedorCaido: true };
  } finally {
    clearTimeout(timer);
  }
}
