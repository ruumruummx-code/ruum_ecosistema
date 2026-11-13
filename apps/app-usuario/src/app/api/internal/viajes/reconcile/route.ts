import { NextRequest, NextResponse } from "next/server";
import { crearClienteServicio } from "@/lib/supabase-servicio";
import { autorizarCron } from "@/lib/autorizar-cron";
import { logStructuredError } from "@/lib/logger";
import { reconciliarSagaTrasladosIndividualesServidor } from "@ruum/api/services";

export const dynamic = "force-dynamic";

/**
 * RUUM-USR-F6-001 (CB-2 / Bloque B): Consumidor periódico del reconciliador/compensador de la saga de traslados individuales.
 * Endpoint manual. La ejecución periódica está en Supabase.
 */
export async function GET(request: NextRequest) {
  const secreto = process.env.VIAJES_RECONCILIADOR_SECRET ?? process.env.MASIVOS_RECONCILIADOR_SECRET;
  if (!autorizarCron(request, secreto)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const cliente = crearClienteServicio();
    const resultado = await reconciliarSagaTrasladosIndividualesServidor(cliente, 50);
    return NextResponse.json({
      ok: resultado.errores === 0,
      timestamp: new Date().toISOString(),
      ...resultado,
    }, { status: resultado.errores > 0 ? 500 : 200 });
  } catch (error) {
    logStructuredError("api/internal/viajes/reconcile", "reconciliacion_fallida", error);
    return NextResponse.json({ ok: false, error: "Error de reconciliación" }, { status: 500 });
  }
}
