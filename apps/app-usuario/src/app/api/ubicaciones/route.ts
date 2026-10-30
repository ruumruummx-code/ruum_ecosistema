import { NextRequest, NextResponse } from "next/server";
import { verificarCsrfORechazar } from "../../../lib/csrf";
import { guardarOperacionUbicacion } from "../../ubicaciones/acciones-ubicaciones";
import type { OperacionUbicacion } from "../../ubicaciones/libreta-ubicaciones";
export async function POST(request: NextRequest) {
  const rechazo = verificarCsrfORechazar(request);
  if (rechazo) return rechazo;
  if (Number(request.headers.get("content-length") ?? 0) > 20000)
    return NextResponse.json(
      { ok: false, mensaje: "La solicitud es demasiado grande." },
      { status: 413 },
    );
  let operacion: OperacionUbicacion;
  try {
    const texto = await request.text();
    if (texto.length > 20000)
      return NextResponse.json(
        { ok: false, mensaje: "La solicitud es demasiado grande." },
        { status: 413 },
      );
    operacion = JSON.parse(texto);
  } catch {
    return NextResponse.json(
      { ok: false, mensaje: "La solicitud no es válida." },
      { status: 400 },
    );
  }
  const resultado = await guardarOperacionUbicacion(operacion);
  return NextResponse.json(resultado, {
    status: resultado.ok ? 200 : 400,
    headers: { "Cache-Control": "private, no-store" },
  });
}
