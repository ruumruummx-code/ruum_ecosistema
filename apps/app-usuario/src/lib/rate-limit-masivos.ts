import { obtenerIp, rateLimitConVentana } from "./csp-rate-limit";
import { hashIdentificador } from "./login-policy";

/** Extensión autorizada del contrato F3: usuario + IP + dispositivo, en Redis. */
export async function rateLimitMasivo(
  request: { headers: Headers },
  usuarioId: string,
  clave: string,
  limiteUsuario: number,
  ventanaMs = 60_000,
) {
  const dispositivo = request.headers.get("x-device-id")?.trim().slice(0, 128) || null;
  const dimensiones = await Promise.all([
    rateLimitConVentana(`uid:${usuarioId}`, `${clave}-usuario`, limiteUsuario, ventanaMs),
    rateLimitConVentana(obtenerIp(request), `${clave}-ip`, limiteUsuario * 2, ventanaMs),
    rateLimitConVentana(dispositivo ? hashIdentificador(dispositivo) : null, `${clave}-dispositivo`, limiteUsuario, ventanaMs),
  ]);
  const bloqueada = dimensiones.find((dimension) => !dimension.allowed);
  return bloqueada ? { allowed: false, retryAfterSec: bloqueada.retryAfterSec ?? 60 } : { allowed: true };
}
