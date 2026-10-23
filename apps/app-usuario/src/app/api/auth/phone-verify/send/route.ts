import { NextRequest, NextResponse } from "next/server";
import { obtenerIp, rateLimitConVentana } from "@/lib/csp-rate-limit";
import { soloDigitos } from "@/lib/registro-usuario";
import { enviarCodigoTwilioVerify } from "@/lib/phone-verification";
import { verificarCsrfORechazar } from "@/lib/csrf";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MAX_POR_TEL_VENTANA = 3;
const MAX_POR_IP_VENTANA = 10;
const VENTANA_MS = 15 * 60 * 1000; // 15 minutos

export async function POST(request: NextRequest) {
  try {
    const rechazoCsrf = verificarCsrfORechazar(request);
    if (rechazoCsrf) return rechazoCsrf;

    const body = (await request.json().catch(() => null)) as {
      telefono?: unknown;
    } | null;

    const telefonoDigitos = typeof body?.telefono === "string" ? soloDigitos(body.telefono, 10) : "";

    if (telefonoDigitos.length !== 10) {
      return NextResponse.json(
        { error: "El número de teléfono celular debe tener 10 dígitos." },
        { status: 400 }
      );
    }

    // Techo global en Redis/memoria para mitigar ataques masivos distribuidos
    const globalLimit = await rateLimitConVentana("global", "auth-phone-send-global", 200, VENTANA_MS);
    if (!globalLimit.allowed) {
      return NextResponse.json(
        { error: "El servicio de verificación está experimentando alta demanda. Intenta más tarde." },
        { status: 429, headers: { "Retry-After": String(globalLimit.retryAfterSec ?? 900) } }
      );
    }

    const ip = obtenerIp(request);

    // Rate limit por IP para prevenir abuso masivo
    const porIp = await rateLimitConVentana(ip, "auth-phone-send-ip", MAX_POR_IP_VENTANA, VENTANA_MS);
    if (!porIp.allowed) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes de verificación desde esta red. Intenta más tarde." },
        { status: 429, headers: { "Retry-After": String(porIp.retryAfterSec ?? 900) } }
      );
    }

    // Rate limit por número de teléfono para prevenir spam de SMS
    const porTel = await rateLimitConVentana(
      telefonoDigitos,
      "auth-phone-send-tel",
      MAX_POR_TEL_VENTANA,
      VENTANA_MS
    );
    if (!porTel.allowed) {
      return NextResponse.json(
        { error: "Has alcanzado el límite de intentos para este número. Espera unos minutos." },
        { status: 429, headers: { "Retry-After": String(porTel.retryAfterSec ?? 900) } }
      );
    }

    const resultado = await enviarCodigoTwilioVerify(telefonoDigitos);

    if (!resultado.ok) {
      return NextResponse.json(
        { error: resultado.error || "No se pudo enviar el código de verificación." },
        { status: resultado.status === "rate_limited" ? 429 : 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      status: resultado.status,
      mock: resultado.mock ?? false,
      expiraEnSegundos: 600,
    });
  } catch (err) {
    console.warn("[auth/phone-verify/send] Error inesperado:", err);
    return NextResponse.json(
      { error: "Ocurrió un error al procesar la solicitud de verificación." },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Método no permitido" }, { status: 405, headers: { Allow: "POST" } });
}
