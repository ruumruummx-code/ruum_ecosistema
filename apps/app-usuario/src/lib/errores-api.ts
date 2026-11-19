import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { logStructuredError } from "./logger";

/**
 * Respuesta para errores internos de API: mensaje genérico para el cliente y
 * detalle (mensaje de PostgREST, stack, etc.) solo en el log, correlacionado
 * por un id de traza que el usuario puede citar a Soporte.
 */
export function respuestaErrorInterno(
  ruta: string,
  error: unknown,
  mensaje = "No pudimos completar la solicitud. Intenta de nuevo.",
  status = 500,
  headers?: Record<string, string>
) {
  const traza = randomUUID();
  logStructuredError(ruta, "error_interno_api", error, { traza });
  return NextResponse.json({ error: mensaje, traza }, { status, headers });
}
