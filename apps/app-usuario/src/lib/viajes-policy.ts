import { createHash } from "node:crypto";

/**
 * RUUM-USR-F6-001 (CB-1 / CA-9): Política de rate limit para creación de traslados
 * individuales (Flujo 6). Consume el contrato transversal de F3 sobre Redis de F2.
 *
 * Estructura de clave compuesta:
 * - IP: viajes-crear-ip:{ip} (20 req / 15 min) — soporta usuarios legítimos en CGNAT.
 * - Cuenta: viajes-crear-cuenta:{userIdHash} (5 req / 15 min) — protege contra creación masiva de solicitudes individuales.
 * - Dispositivo: viajes-crear-device:{deviceIdHash} (10 req / 15 min) — mitiga rotación de IP en cliente malicioso.
 */
export const VIAJES_CREAR_VENTANA_MS = 15 * 60 * 1000; // 15 minutos

export const VIAJES_CREAR_LIMITES = {
  ip: 20,
  cuenta: 5,
  dispositivo: 10,
} as const;

/**
 * Genera el hash de pseudonimización operacional (SHA-256 truncado a 32 hex).
 *
 * NOTA DE RIGOR CRIPTOGRÁFICO:
 * 1. Propósito exclusivo: Pseudonimización operacional (RFC 4949 / Considerando 26 RGPD)
 *    para correlacionar eventos de riesgo y telemetría sin almacenar PII en texto plano.
 * 2. No es anonimización matemática fuerte ni secreto de seguridad.
 * 3. Se erradica por completo el uso de MD5 o algoritmos rotos en toda la plataforma.
 */
export function hashPseudonimoViajes(valor: string): string {
  if (!valor) return "anonimo";
  return createHash("sha256").update(valor.trim().toLowerCase()).digest("hex").slice(0, 32);
}
