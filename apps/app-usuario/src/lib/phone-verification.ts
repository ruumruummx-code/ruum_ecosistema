import crypto from "crypto";
import { soloDigitos, telefonoMx } from "./registro-usuario";
import { logStructuredWarn } from "./logger";

const EXPIRACION_TOKEN_MS = 15 * 60 * 1000; // 15 minutos de vigencia para el token de registro
const CODIGO_MOCK_DEV = "123456";

/**
 * Obtiene la clave secreta para firmar tokens de verificación de teléfono.
 * Fail-closed: exige PHONE_VERIFY_SECRET con al menos 32 caracteres.
 */
function obtenerSecretoFirma(): string {
  const s = process.env.PHONE_VERIFY_SECRET;
  if (!s || s.trim().length < 32) {
    throw new Error("PHONE_VERIFY_SECRET no configurado (mín 32 chars).");
  }
  return s;
}

/**
 * Genera un token HMAC criptográficamente firmado que certifica que el número
 * de teléfono de 10 dígitos fue validado exitosamente contra Twilio Verify.
 */
export function generarTokenTelefono(telefonoDiezDigitos: string): string {
  const tel = soloDigitos(telefonoDiezDigitos, 10);
  const timestamp = Date.now().toString();
  const secreto = obtenerSecretoFirma();

  const hmac = crypto
    .createHmac("sha256", secreto)
    .update(`${tel}:${timestamp}`)
    .digest("hex");

  return `${tel}:${timestamp}:${hmac}`;
}

/**
 * Valida un token HMAC de teléfono firmado por este servidor:
 * 1. Verifica formato `${telefono}:${timestamp}:${hmac}`.
 * 2. Compara que coincida con el teléfono esperado.
 * 3. Valida que no haya expirado (máximo 15 minutos).
 * 4. Valida la firma HMAC en tiempo constante con crypto.timingSafeEqual.
 */
export function validarTokenTelefono(
  telefonoDiezDigitos: string,
  token: string | null | undefined,
  maxEdadMs = EXPIRACION_TOKEN_MS
): { valido: boolean; error?: string } {
  if (!token || typeof token !== "string") {
    return { valido: false, error: "Falta el token de verificación de teléfono." };
  }

  const partes = token.split(":");
  if (partes.length !== 3) {
    return { valido: false, error: "Token de verificación con formato inválido." };
  }

  const [telToken, timestampStr, firmaRecibida] = partes;
  const telEsperado = soloDigitos(telefonoDiezDigitos, 10);

  if (telToken !== telEsperado) {
    return { valido: false, error: "El token no corresponde al teléfono proporcionado." };
  }

  const timestamp = parseInt(timestampStr, 10);
  if (Number.isNaN(timestamp)) {
    return { valido: false, error: "Timestamp inválido en el token de verificación." };
  }

  const ahora = Date.now();
  if (ahora - timestamp > maxEdadMs || timestamp > ahora + 60_000) {
    return { valido: false, error: "El token de verificación ha expirado. Verifica tu teléfono de nuevo." };
  }

  const secreto = obtenerSecretoFirma();
  const firmaEsperada = crypto
    .createHmac("sha256", secreto)
    .update(`${telEsperado}:${timestampStr}`)
    .digest("hex");

  try {
    const bufEsperado = Buffer.from(firmaEsperada, "utf8");
    const bufRecibido = Buffer.from(firmaRecibida, "utf8");

    if (bufEsperado.length !== bufRecibido.length || !crypto.timingSafeEqual(bufEsperado, bufRecibido)) {
      return { valido: false, error: "Firma inválida en el token de verificación." };
    }
  } catch (err) {
    logStructuredWarn("auth/phone-verification", "comparacion_hmac_fallida", err);
    return { valido: false, error: "Error al validar la firma de seguridad." };
  }

  return { valido: true };
}

/**
 * Determina si las credenciales de Twilio Verify están presentes en el entorno.
 */
export function tieneTwilioVerifyConfigurado(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID?.trim() &&
    process.env.TWILIO_AUTH_TOKEN?.trim() &&
    process.env.TWILIO_VERIFY_SERVICE_SID?.trim()
  );
}

/**
 * El código mock (123456) solo existe para desarrollo y pruebas. En
 * producción siempre se exige Twilio Verify real: aceptar el mock ahí
 * permitiría altas con teléfonos no verificados.
 */
function mockPermitido(): boolean {
  return process.env.NODE_ENV !== "production";
}

/** Suspensión explícita y reversible (activa por defecto temporalmente; usar "false" para reactivar). */
export function bypassVerificacionTelefonoPermitido(): boolean {
  if (process.env.PHONE_VERIFICATION_SUSPENDED === "false") {
    return process.env.PHONE_VERIFY_BYPASS === "true" && process.env.NODE_ENV !== "production";
  }
  return true;
}

/**
 * Envía un código OTP por SMS usando Twilio Verify API v2.
 * Si Twilio no está configurado (ej. desarrollo local o pruebas), actúa en modo mock dev (123456).
 */
export async function enviarCodigoTwilioVerify(
  telefonoDiezDigitos: string
): Promise<{ ok: boolean; status: string; mock?: boolean; error?: string }> {
  const telLimpio = soloDigitos(telefonoDiezDigitos, 10);
  if (telLimpio.length !== 10) {
    return { ok: false, status: "error", error: "El teléfono debe tener 10 dígitos." };
  }

  const e164 = telefonoMx(telLimpio);

  if (!tieneTwilioVerifyConfigurado()) {
    if (!mockPermitido()) {
      return { ok: false, status: "error", error: "Servicio de verificación no disponible. Intenta más tarde." };
    }
    if (process.env.NODE_ENV !== "test") {
      console.info(
        `[Twilio Verify Dev Mock] Código para ${e164}: ${CODIGO_MOCK_DEV} (Twilio no configurado en entorno actual)`
      );
    }
    return { ok: true, status: "pending", mock: true };
  }

  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const token = process.env.TWILIO_AUTH_TOKEN!;
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID!;

  const url = `https://verify.twilio.com/v2/Services/${serviceSid}/Verifications`;
  const credenciales = Buffer.from(`${sid}:${token}`).toString("base64");

  const cuerpo = new URLSearchParams();
  cuerpo.set("To", e164);
  cuerpo.set("Channel", "sms");

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credenciales}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: cuerpo.toString(),
    });

    const datos = (await res.json().catch(() => null)) as {
      status?: string;
      message?: string;
      code?: number;
    } | null;

    if (!res.ok) {
      console.warn("[Twilio Verify] Error enviando verificación SMS:", datos);
      if (datos?.code === 60203) {
        return {
          ok: false,
          status: "rate_limited",
          error: "Demasiados intentos hacia este número. Espera unos minutos antes de solicitar otro código.",
        };
      }
      return {
        ok: false,
        status: "error",
        error: datos?.message || "No pudimos enviar el mensaje SMS. Revisa tu número e intenta de nuevo.",
      };
    }

    return { ok: true, status: datos?.status ?? "pending" };
  } catch (error) {
    console.error("[Twilio Verify] Excepción en llamada HTTP:", error);
    return { ok: false, status: "error", error: "Error de conexión al enviar el código SMS." };
  }
}

/**
 * Comprueba el código OTP ingresado por el usuario usando Twilio Verify API v2.
 * Si Twilio no está configurado (ej. desarrollo o pruebas), valida contra el código mock dev (123456).
 */
export async function verificarCodigoTwilioVerify(
  telefonoDiezDigitos: string,
  codigo: string
): Promise<{ ok: boolean; status: "approved" | "pending" | "canceled" | "failed"; mock?: boolean; error?: string }> {
  const telLimpio = soloDigitos(telefonoDiezDigitos, 10);
  const codigoLimpio = soloDigitos(codigo, 6);

  if (telLimpio.length !== 10) {
    return { ok: false, status: "failed", error: "El teléfono debe tener 10 dígitos." };
  }
  if (codigoLimpio.length !== 6) {
    return { ok: false, status: "failed", error: "El código de verificación debe tener 6 dígitos." };
  }

  const e164 = telefonoMx(telLimpio);

  if (!tieneTwilioVerifyConfigurado()) {
    if (!mockPermitido()) {
      return { ok: false, status: "failed", error: "Servicio de verificación no disponible. Intenta más tarde." };
    }
    if (codigoLimpio === CODIGO_MOCK_DEV) {
      return { ok: true, status: "approved", mock: true };
    }
    return {
      ok: false,
      status: "failed",
      mock: true,
      error: "El código ingresado es incorrecto. Para pruebas en desarrollo usa 123456.",
    };
  }

  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const token = process.env.TWILIO_AUTH_TOKEN!;
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID!;

  // Twilio usa VerificationCheck en singular; el plural responde 20404 incluso con un OTP vigente.
  const url = `https://verify.twilio.com/v2/Services/${serviceSid}/VerificationCheck`;
  const credenciales = Buffer.from(`${sid}:${token}`).toString("base64");

  const cuerpo = new URLSearchParams();
  cuerpo.set("To", e164);
  cuerpo.set("Code", codigoLimpio);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credenciales}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: cuerpo.toString(),
    });

    const datos = (await res.json().catch(() => null)) as {
      status?: "approved" | "pending" | "canceled" | "failed";
      message?: string;
      code?: number;
    } | null;

    if (!res.ok) {
      console.warn("[Twilio Verify] Error verificando código SMS:", datos);
      if (datos?.code === 20404) {
        return {
          ok: false,
          status: "failed",
          error: "El código ha expirado o no se encontró solicitud activa. Solicita un nuevo código.",
        };
      }
      if (datos?.code === 60202) {
        return {
          ok: false,
          status: "failed",
          error: "Demasiados intentos con este código. Solicita uno nuevo.",
        };
      }
      return {
        ok: false,
        status: "failed",
        error: datos?.message || "No pudimos validar el código ingresado.",
      };
    }

    if (datos?.status === "approved") {
      return { ok: true, status: "approved" };
    }

    // 200 con status pending/canceled/failed = el código no coincide con el
    // vigente (intento consumido en Twilio). No mezclar con "expirado": eso
    // solo aplica al 20404 de arriba.
    return {
      ok: false,
      status: datos?.status ?? "failed",
      error: "El código ingresado es incorrecto. Revisa el último SMS recibido e intenta de nuevo.",
    };
  } catch (error) {
    console.error("[Twilio Verify] Excepción en llamada HTTP:", error);
    return { ok: false, status: "failed", error: "Error de conexión al validar el código SMS." };
  }
}
