/**
 * Comparación de cadenas en tiempo constante (constant-time comparison)
 * para evitar ataques de temporización (timing attacks) sobre secretos,
 * tokens Bearer y firmas criptográficas.
 *
 * Retorna true únicamente si ambas cadenas están definidas, no vacías
 * y son estrictamente idénticas en longitud y contenido.
 */
export function timingSafeEqual(
  a: string | null | undefined,
  b: string | null | undefined
): boolean {
  if (!a || !b) return false;
  const encoder = new TextEncoder();
  const aBuf = encoder.encode(a);
  const bBuf = encoder.encode(b);
  if (aBuf.byteLength !== bBuf.byteLength) return false;
  let diff = 0;
  for (let i = 0; i < aBuf.byteLength; i++) {
    diff |= aBuf[i] ^ bBuf[i];
  }
  return diff === 0;
}
