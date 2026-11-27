import { Preferences } from "@capacitor/preferences";

/**
 * Bandera de primer arranque para el recorrido de bienvenida.
 * Usa @capacitor/preferences (WebView Android + navegador), respaldada por
 * cookie ligera (para evitar cascada de redirects en SSR) y estado en memoria
 * (para evitar bucles /onboarding <-> /login si falla el almacenamiento).
 */
export const COOKIE_ONBOARDING_CONDUCTOR = "ruum_conductor_onboarding_visto";
const CLAVE_ONBOARDING = COOKIE_ONBOARDING_CONDUCTOR;
let vistoEnMemoria = false;

function leerCookieOnboarding(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split(";").some((item) => item.trim() === `${COOKIE_ONBOARDING_CONDUCTOR}=1`);
}

function escribirCookieOnboarding(): void {
  if (typeof document === "undefined") return;
  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE_ONBOARDING_CONDUCTOR}=1; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
}

export async function onboardingVisto(): Promise<boolean> {
  if (vistoEnMemoria || leerCookieOnboarding()) return true;
  try {
    const { value } = await Preferences.get({ key: CLAVE_ONBOARDING });
    if (value === "1") {
      vistoEnMemoria = true;
      escribirCookieOnboarding();
      return true;
    }
    return false;
  } catch {
    return true; // ante cualquier fallo de storage, no bloquear el login
  }
}

export async function marcarOnboardingVisto(): Promise<void> {
  vistoEnMemoria = true;
  escribirCookieOnboarding();
  try {
    await Preferences.set({ key: CLAVE_ONBOARDING, value: "1" });
  } catch {
    // sin storage disponible conservamos la bandera en memoria y cookie
  }
}
