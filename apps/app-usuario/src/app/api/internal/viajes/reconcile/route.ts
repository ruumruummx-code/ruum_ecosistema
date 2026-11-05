import { NextRequest, NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase-server";
import { reconciliarSagaTrasladosIndividualesServidor } from "@ruum/api/services";

export const dynamic = "force-dynamic";

/**
 * RUUM-USR-F6-001 (CB-2 / Bloque B): Consumidor periódico del reconciliador/compensador de la saga de traslados individuales.
 * Invocado periódicamente (cada 5 minutos) por pg_cron o scheduler con VIAJES_RECONCILIADOR_SECRET.
 */
export async function GET(request: NextRequest) {
  const secreto = process.env.VIAJES_RECONCILIADOR_SECRET ?? process.env.MASIVOS_RECONCILIADOR_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!secreto || authHeader !== `Bearer ${secreto}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const cliente = await crearClienteServidor();
    const resultado = await reconciliarSagaTrasladosIndividualesServidor(cliente as any, 50);
    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      ...resultado,
    });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "Error desconocido en reconciliación F6";
    return NextResponse.json({ ok: false, error: mensaje }, { status: 500 });
  }
}
