import { NextRequest, NextResponse } from "next/server";
import {
  COOKIE_CSRF_USUARIO,
  HEADER_CSRF_TOKEN,
  esFormatoTokenCsrfValido,
  generarTokenCsrf,
} from "@/lib/csrf";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Endpoint para emitir o recuperar el token CSRF activo (Double-Submit Cookie).
 */
export async function GET(request: NextRequest) {
  const existente = request.cookies?.get?.(COOKIE_CSRF_USUARIO)?.value?.trim();
  const csrfToken = esFormatoTokenCsrfValido(existente)
    ? existente
    : generarTokenCsrf();

  const response = NextResponse.json(
    { ok: true, csrfToken },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        [HEADER_CSRF_TOKEN]: csrfToken,
      },
    }
  );

  if (!esFormatoTokenCsrfValido(existente)) {
    response.cookies.set(COOKIE_CSRF_USUARIO, csrfToken, {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 12,
    });
  }

  return response;
}
