export const ONBOARDING_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 días

export function leerItemConTtl(clave: string): string | null {
  try {
    if (typeof window === "undefined") return null;
    const expStr = window.localStorage.getItem(`${clave}:exp`);
    if (expStr) {
      const exp = Number.parseInt(expStr, 10);
      if (Number.isFinite(exp) && Date.now() > exp) {
        window.localStorage.removeItem(clave);
        window.localStorage.removeItem(`${clave}:exp`);
        return null;
      }
    }
    const raw = window.localStorage.getItem(clave);
    if (!raw) return null;
    // Compatibilidad adicional con formato JSON si ya se escribió previamente
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && "expiraEn" in parsed) {
        if (typeof parsed.expiraEn === "number" && Date.now() > parsed.expiraEn) {
          window.localStorage.removeItem(clave);
          return null;
        }
        return parsed.valor !== undefined && parsed.valor !== null ? String(parsed.valor) : null;
      }
    } catch {
      // Valor primitivo estándar
    }
    return raw;
  } catch {
    return null;
  }
}

export function guardarItemConTtl(clave: string, valor: string) {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(clave, valor);
    window.localStorage.setItem(`${clave}:exp`, String(Date.now() + ONBOARDING_TTL_MS));
  } catch {
    // ignore
  }
}
