import { NextRequest, NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase-server";
import { obtenerIp, rateLimitConVentana } from "@/lib/csp-rate-limit";
import { verificarCsrfORechazar } from "@/lib/csrf";
import { logStructuredInfo, logStructuredWarn } from "@/lib/logger";
import {
  DIDIT_INICIAR_LIMITES,
  DIDIT_VENTANA_MS,
  hashIdentificador,
} from "@/lib/didit-policy";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * RUUM-USR-F5-001 (CB-3): Endpoint de aplicación para iniciar verificación Didit.
 *
 * Aplica rate limit con clave compuesta durable sobre Upstash Redis (IP + cuenta + dispositivo),
 * protección CSRF de origen y telemetría estructurada sin PII.
 */
export async function POST(request: NextRequest) {
  // 1. Verificación Anti-CSRF
  const rechazoCsrf = verificarCsrfORechazar(request);
  if (rechazoCsrf) return rechazoCsrf;

  // 2. Verificación de sesión de usuario
  const cliente = await crearClienteServidor();
  const {
    data: { user },
    error: errorAuth,
  } = await cliente.auth.getUser();

  if (errorAuth || !user) {
    return NextResponse.json(
      { error: "Inicia sesión para continuar con la verificación." },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  const ip = obtenerIp(request);
  const userIdHash = hashIdentificador(user.id);
  const dispositivo =
    request.headers.get("x-device-id")?.trim().slice(0, 128) || null;

  // 3. Rate Limit Compuesto (CB-3)
  const dimensiones = await Promise.all([
    rateLimitConVentana(
      ip,
      "didit-iniciar-ip",
      DIDIT_INICIAR_LIMITES.ip,
      DIDIT_VENTANA_MS
    ),
    rateLimitConVentana(
      userIdHash,
      "didit-iniciar-cuenta",
      DIDIT_INICIAR_LIMITES.cuenta,
      DIDIT_VENTANA_MS
    ),
    rateLimitConVentana(
      dispositivo ? hashIdentificador(dispositivo) : null,
      "didit-iniciar-device",
      DIDIT_INICIAR_LIMITES.dispositivo,
      DIDIT_VENTANA_MS
    ),
  ]);

  const [porIp, porCuenta, porDispositivo] = dimensiones;
  const retryAfter = Math.max(
    porIp.retryAfterSec ?? 0,
    porCuenta.retryAfterSec ?? 0,
    porDispositivo.retryAfterSec ?? 0
  );

  if (dimensiones.some((dimension) => !dimension.allowed)) {
    logStructuredWarn(
      "verificacion/didit/iniciar",
      "didit_iniciar_rate_limited",
      undefined,
      {
        userIdHash,
        dimensiones: ["ip", "cuenta", "dispositivo"],
      }
    );
    return NextResponse.json(
      {
        error:
          "Has alcanzado el límite de intentos para iniciar verificación. Espera unos minutos antes de volver a intentar.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter || 60),
          "Cache-Control": "no-store",
        },
      }
    );
  }

  // 4. Invocar Edge Function iniciar-verificacion-didit
  try {
    const { data, error } = await cliente.functions.invoke<{
      url?: string;
      sessionId?: string;
    }>("iniciar-verificacion-didit", {
      body: { tipo: "usuario" },
    });

    if (error || !data?.url) {
      logStructuredWarn(
        "verificacion/didit/iniciar",
        "iniciar_didit_edge_error",
        error,
        { userIdHash }
      );
      return NextResponse.json(
        {
          error:
            error?.message ??
            "No fue posible generar la sesión de verificación. Intenta nuevamente.",
        },
        { status: 502, headers: { "Cache-Control": "no-store" } }
      );
    }

    logStructuredInfo(
      "verificacion/didit/iniciar",
      "didit_sesion_iniciada_exitosa",
      {
        userIdHash,
      }
    );

    return NextResponse.json(
      {
        url: data.url,
        sessionId: data.sessionId ?? null,
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    logStructuredWarn(
      "verificacion/didit/iniciar",
      "iniciar_didit_fallo_inesperado",
      err,
      { userIdHash }
    );
    return NextResponse.json(
      {
        error:
          "El servicio de verificación no está disponible temporalmente. Intenta más tarde o utiliza la carga manual.",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
