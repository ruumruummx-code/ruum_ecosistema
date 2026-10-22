/**
 * Cookie firmada (httpOnly) con el rol de la app.
 *
 * Motivo: el gate de rol del middleware consultaba `clasificarRolApp` en cada
 * petición protegida (2 SELECT a PostgREST). La cookie cachea el resultado
 * durante un TTL corto (5 minutos) y está firmada con HMAC-SHA256, de modo que
 * el cliente no puede alterar el rol que el servidor ya validó.
 *
 * Formato del valor: `<payload base64url>.<firma hmac-sha256 base64url>`
 * Payload: `{ r: rol, u: auth_user_id, e: expira_en_segundos }`
 *
 * Compatible con el runtime Edge (WebCrypto, sin `node:crypto`).
 */

export const COOKIE_ROL_APP = "ruum_rol_app";

/** TTL corto: 5 minutos. Suficiente para evitar el query por petición sin dejar roles obsoletos por mucho tiempo. */
export const TTL_ROL_APP_SEGUNDOS = 300;

/** Evento de métrica/alerta emitido cuando falla la verificación del rol. */
export const EVENTO_FALLO_VERIFICACION_ROL = "conductor_role_verification_failed";

export type RolAppFirmable = "usuario" | "conductor" | "ninguno";

export interface RolAppFirmado {
  rol: RolAppFirmable;
  authUserId: string;
  /** Epoch en segundos. */
  expiraEn: number;
}

const ROLES_VALIDOS: readonly RolAppFirmable[] = ["usuario", "conductor", "ninguno"];

function bytesABase64Url(bytes: Uint8Array): string {
  let binario = "";
  for (let i = 0; i < bytes.length; i += 1) binario += String.fromCharCode(bytes[i]);
  return btoa(binario).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlABytes(valor: string): Uint8Array | null {
  try {
    const normalizado = valor.replace(/-/g, "+").replace(/_/g, "/");
    const resto = normalizado.length % 4;
    const conPadding = resto === 0 ? normalizado : normalizado + "=".repeat(4 - resto);
    const binario = atob(conPadding);
    const bytes = new Uint8Array(binario.length);
    for (let i = 0; i < binario.length; i += 1) bytes[i] = binario.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

async function hmacSha256Base64Url(secreto: string, mensaje: string): Promise<string> {
  const clave = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secreto),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const firma = await crypto.subtle.sign("HMAC", clave, new TextEncoder().encode(mensaje));
  return bytesABase64Url(new Uint8Array(firma));
}

/** Comparación en tiempo constante (evita filtrar bytes de la firma por timing). */
export function compararEnTiempoConstante(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diferencia = 0;
  for (let i = 0; i < a.length; i += 1) {
    diferencia |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diferencia === 0;
}

/**
 * Firma el rol y devuelve el valor de la cookie.
 * `secreto` debe tener al menos 32 caracteres (mismo criterio que PHONE_VERIFY_SECRET).
 */
export async function firmarRolApp(
  rol: RolAppFirmable,
  authUserId: string,
  secreto: string,
  ttlSegundos: number = TTL_ROL_APP_SEGUNDOS,
  ahoraMs: number = Date.now()
): Promise<string> {
  if (!secreto || secreto.trim().length < 32) {
    throw new Error("El secreto de la cookie de rol debe tener al menos 32 caracteres.");
  }
  const payload = {
    r: rol,
    u: authUserId,
    e: Math.floor(ahoraMs / 1000) + ttlSegundos
  };
  const payloadBase64 = bytesABase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const firma = await hmacSha256Base64Url(secreto, payloadBase64);
  return `${payloadBase64}.${firma}`;
}

/**
 * Verifica la firma y la vigencia del rol cacheado.
 * Devuelve `null` si la cookie no existe, está manipulada, expiró o el rol no es válido.
 */
export async function verificarRolAppFirmado(
  valor: string | null | undefined,
  secreto: string,
  ahoraMs: number = Date.now()
): Promise<RolAppFirmado | null> {
  if (!valor || !secreto || secreto.trim().length < 32) return null;
  const partes = valor.split(".");
  if (partes.length !== 2) return null;
  const [payloadBase64, firmaRecibida] = partes;
  if (!payloadBase64 || !firmaRecibida) return null;

  let firmaEsperada: string;
  try {
    firmaEsperada = await hmacSha256Base64Url(secreto, payloadBase64);
  } catch {
    return null;
  }
  if (!compararEnTiempoConstante(firmaEsperada, firmaRecibida)) return null;

  const bytes = base64UrlABytes(payloadBase64);
  if (!bytes) return null;
  let payload: { r?: string; u?: string; e?: number };
  try {
    payload = JSON.parse(new TextDecoder().decode(bytes)) as typeof payload;
  } catch {
    return null;
  }
  if (!payload || typeof payload.r !== "string" || typeof payload.u !== "string" || typeof payload.e !== "number") {
    return null;
  }
  if (!ROLES_VALIDOS.includes(payload.r as RolAppFirmable)) return null;
  if (payload.e <= Math.floor(ahoraMs / 1000)) return null;
  return { rol: payload.r as RolAppFirmable, authUserId: payload.u, expiraEn: payload.e };
}

/** Opciones de la cookie (httpOnly, sameSite lax y `secure` fuera de desarrollo). */
export function opcionesCookieRolApp(maxAgeSegundos: number = TTL_ROL_APP_SEGUNDOS) {
  return {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: maxAgeSegundos,
    path: "/"
  };
}
