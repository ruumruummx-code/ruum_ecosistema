/**
 * Gobernanza de claims públicos de la landing.
 *
 * Cada claim publicado debe tener versión, fuente verificable y responsable.
 * El cambio de cualquiera de estos campos requiere revisión de producto y
 * seguridad, además de actualizar CLAIMS_VERSION y la evidencia asociada.
 */
export const PUBLIC_CLAIMS_VERSION = "2026-11-04.1";
export const PUBLIC_CLAIMS_OWNER = "Producto y Operaciones Ruum Ruum";
export const PUBLIC_CLAIMS_SOURCE = "Configuración operativa aprobada y catálogo CONCER";

export const PUBLIC_CLAIMS = {
  conductorCertificado: "Traslado vehicular con conductores certificados",
  cobertura: "Cobertura Local y Foránea",
  hero: "Sabes quién lleva tu auto y qué evidencia queda de cada etapa: conductores certificados, evidencia documentada y seguimiento durante el trayecto.",
} as const;

export const PUBLIC_CLAIMS_GOVERNANCE = {
  version: PUBLIC_CLAIMS_VERSION,
  owner: PUBLIC_CLAIMS_OWNER,
  source: PUBLIC_CLAIMS_SOURCE,
  reviewedAt: "2026-11-04",
} as const;
