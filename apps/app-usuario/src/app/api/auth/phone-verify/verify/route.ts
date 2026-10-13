import { NextRequest, NextResponse } from "next/server";
import { rateLimitConVentana } from "@/lib/csp-rate-limit";
import { soloDigitos } from "@/lib/registro-usuario";
import { generarTokenTelefono, verificarCodigoTwilioVerify } from "@/lib/phone-verification";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MAX_INTENTOS_POR_TEL = 5;
const VENTANA_MS = 15 * 60 * 1000; // 15 minutos

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as {
      telefono?: unknown;
      codigo?: unknown;
    } | null;

    const telefonoDigitos = typeof body?.telefono === "string" ? soloDigitos(body.telefono, 10) : "";
    const codigoDigitos = typeof body?.codigo === "string" ? soloDigitos(body.codigo, 6) : "";

    if (telefonoDigitos.length !== 10) {
      return NextResponse.json(
        { error: "El número de teléfono celular debe tener 10 dígitos." },
        { status: 400 }
      );
    }

    if (codigoDigitos.length !== 6) {
      return NextResponse.json(
        { error: "El código de verificación debe tener 6 dígitos." },
        { status: 400 }
      );
    }

    // Rate limit para mitigar ataques de fuerza bruta al OTP
    const intentos = await rateLimitConVentana(
      telefonoDigitos,
      "auth-phone-verify-tel",
      MAX_INTENTOS_POR_TEL,
      VENTANA_MS
    );
    if (!intentos.allowed) {
      return NextResponse.json(
        { error: "Demasiados intentos fallidos. Solicita un nuevo código tras esperar unos minutos." },
        { status: 429, headers: { "Retry-After": String(intentos.retryAfterSec ?? 900) } }
      );
    }

    const resultado = await verificarCodigoTwilioVerify(telefonoDigitos, codigoDigitos);

    if (!resultado.ok || resultado.status !== "approved") {
      return NextResponse.json(
        { error: resultado.error || "El código ingresado es incorrecto o ya expiró." },
        { status: 400 }
      );
    }

    // Generar token criptográfico firmado para certificar la validación en el signup
    const token = generarTokenTelefono(telefonoDigitos);

    return NextResponse.json({
      ok: true,
      status: "approved",
      token,
      telefono: telefonoDigitos,
    });
  } catch (err) {
    console.warn("[auth/phone-verify/verify] Error inesperado:", err);
    return NextResponse.json(
      { error: "Ocurrió un error al validar el código de verificación." },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Método no permitido" }, { status: 405, headers: { Allow: "POST" } });
}
