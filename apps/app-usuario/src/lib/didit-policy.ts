import crypto from "node:crypto";

export const DIDIT_VENTANA_MS = 15 * 60 * 1000; // 15 minutos

/**
 * RUUM-USR-F5-001 (CB-3): Umbrales diferenciados para inicio de verificación Didit (KYC).
 *
 * Extensión autorizada del contrato transversal de rate limit (Flujos 2, 3 y 4):
 * - Consume exclusivamente la infraestructura Upstash Redis de F2 (csp-rate-limit.ts).
 * - Clave compuesta: IP + cuenta (hash de userId) + dispositivo/señal.
 * - Mitiga falsos positivos en CGNAT (múltiples usuarios en la misma IP de carrier).
 * - Neutraliza la evasión por rotación de IP (un atacante rotando IPs agota el bucket de cuenta).
 * - Umbral de cuenta estricto (3 solicitudes / 15 min) para proteger costos por sesión en la API de Didit.
 */
export const DIDIT_INICIAR_LIMITES = {
  ip: 15, // 15 solicitudes por 15 min por IP (tolerante a NAT corporativo o carrier móvil)
  cuenta: 3, // 3 sesiones por 15 min por usuario (protección de cuota y costos Didit)
  dispositivo: 5, // 5 solicitudes por 15 min por huella de dispositivo
} as const;

/**
 * Nota de rigor criptográfico:
 * El hash truncado de 32 hex (SHA-256) generado aquí se emplea para claves de Redis
 * y correlación en telemetría operacional (userIdHash, deviceHash).
 * Constituye un mecanismo de pseudonimización operacional (RFC 4949 / Considerando 26 RGPD)
 * para evitar almacenar identificadores o PII en texto plano.
 * NO representa anonimización fuerte irreversible ni un control de seguridad o secreto.
 */
export function hashIdentificador(valor: string): string {
  return crypto.createHash("sha256").update(valor).digest("hex").slice(0, 32);
}
