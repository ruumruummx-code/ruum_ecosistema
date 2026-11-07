/** RUUM-UX-006 · Opción B: solo se ofrece el idioma que tiene traducción real. */
export const IDIOMA_DISPONIBLE = 'es' as const;
export const IDIOMA_DOCUMENTO = 'es-MX';
export const AVISO_IDIOMA = 'La interfaz está disponible únicamente en español. El inglés aún no está disponible.';

/** Normaliza únicamente el campo de idioma; mantiene intactos los demás cambios. */
export function normalizarIdiomaPreferencias(pref: Record<string, unknown>): Record<string, unknown> {
  return Object.prototype.hasOwnProperty.call(pref, 'idioma')
    ? { ...pref, idioma: IDIOMA_DISPONIBLE }
    : pref;
}

/** Corrige metadatos heredados, sin simular una traducción o elección de idioma. */
export function aplicarIdiomaDisponible() {
  if (typeof document !== 'undefined' && document.documentElement.lang !== IDIOMA_DOCUMENTO) {
    document.documentElement.lang = IDIOMA_DOCUMENTO;
  }
}

/** Sanea solo claves del usuario actual y la preferencia histórica global. */
export function normalizarIdiomaLocal(usuarioId?: string | null) {
  if (typeof window === 'undefined') return;
  const sufijo = usuarioId ? ':' + usuarioId : '';
  const claves = [
    { key: 'ruum:pref:idioma' + sufijo, atomica: true },
    { key: 'ruum:pref:idioma', atomica: true },
    { key: 'ruum:pref:usuario:' + (usuarioId || 'anonimo'), atomica: false },
    { key: 'ruum-usuario-preferencias', atomica: false },
  ];
  for (const { key, atomica } of claves) {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) continue;
      const value = JSON.parse(raw);
      if (atomica) {
        if (value !== IDIOMA_DISPONIBLE) window.localStorage.setItem(key, JSON.stringify(IDIOMA_DISPONIBLE));
      } else if (value && typeof value === 'object' && !Array.isArray(value) && 'idioma' in value && value.idioma !== IDIOMA_DISPONIBLE) {
        window.localStorage.setItem(key, JSON.stringify(normalizarIdiomaPreferencias(value)));
      }
    } catch { /* El idioma efectivo continúa siendo español si el almacenamiento no está disponible. */ }
  }
}
