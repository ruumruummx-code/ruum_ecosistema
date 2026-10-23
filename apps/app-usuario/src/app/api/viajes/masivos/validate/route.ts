import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { crearClienteServidor } from "@/lib/supabase-server";
import { rateLimitConVentana } from "@/lib/csp-rate-limit";
import { validarFilasServidor } from "@/lib/carga-masiva-server";
import { logStructuredError } from "@/lib/logger";
export const dynamic = "force-dynamic";
export type { FilaValidada, FilaMasivaEntrada } from "@/lib/carga-masiva";
const esquemaCarga = z.object({ filas: z.array(z.record(z.string().max(2000))).min(1).max(100) });
export async function POST(request: NextRequest) {
  const cliente = await crearClienteServidor();
  const { data: { user } } = await cliente.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const limite = await rateLimitConVentana(`uid:${user.id}`, "masivos-validar", 20, 60000);
  if (!limite.allowed) return NextResponse.json({ error: "Espera un momento antes de validar otra carga." }, { status: 429 });
  const body = esquemaCarga.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Carga entre 1 y 100 filas válidas." }, { status: 400 });
  try {
    const filas = await validarFilasServidor(body.data.filas);
    return NextResponse.json({ filas });
  } catch (err) {
    logStructuredError("api/viajes/masivos/validate", "validacion_filas_fallida", err, {
      usuarioId: user.id,
      totalFilas: body.data.filas.length,
    });
    return NextResponse.json({ error: "No se pudo consultar la validación. Intenta de nuevo." }, { status: 503 });
  }
}
