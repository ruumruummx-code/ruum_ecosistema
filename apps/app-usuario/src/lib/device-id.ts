const STORAGE_KEY = "ruum:login-device";

export function normalizarDispositivo(valor: string | null): string | null {
  const id = valor?.trim();
  return id && /^[a-z0-9_-]{16,128}$/i.test(id) ? id.toLowerCase() : null;
}

export function obtenerDispositivo(): string | null {
  try {
    const guardado = normalizarDispositivo(window.localStorage.getItem(STORAGE_KEY));
    if (guardado) return guardado;
    const id = window.crypto.randomUUID();
    window.localStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    return null;
  }
}
