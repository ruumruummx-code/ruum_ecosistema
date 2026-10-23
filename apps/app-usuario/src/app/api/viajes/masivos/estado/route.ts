import { obtenerCheckoutMasivoServidor, confirmarPagoMasivoServidor } from "@ruum/api/services";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { crearClienteServidor } from "@/lib/supabase-server";
import { clienteMasivoServicio, stripeMasivo } from "@/lib/carga-masiva-server";
import { rateLimitConVentana } from "@/lib/csp-rate-limit";
import { logStructuredError } from "@/lib/logger";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const cliente = await crearClienteServidor();
  const { data: { user } } = await cliente.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const limite = await rateLimitConVentana(`uid:${user.id}`, "masivo-estado", 60, 60000);
  if (!limite.allowed) return NextResponse.json({ error: "Espera antes de consultar de nuevo." }, { status: 429 });
  const id = z.string().uuid().safeParse(request.nextUrl.searchParams.get("id"));
  if (!id.success) return NextResponse.json({ error: "Carga inválida" }, { status: 400 });
  try {
    const servicio = clienteMasivoServicio();
    const carga = await obtenerCheckoutMasivoServidor(servicio, id.data, user.id);
    if (!carga) return NextResponse.json({ error: "Carga no encontrada" }, { status: 404 });
    if (carga.pagado_en) return NextResponse.json({ pagado: true });
    if (!carga.stripe_payment_intent_id) return NextResponse.json({ pagado: false });
    const intent = await stripeMasivo(`payment_intents/${encodeURIComponent(carga.stripe_payment_intent_id)}`);
    if (intent.status !== "succeeded") return NextResponse.json({ pagado: false });
    await confirmarPagoMasivoServidor(servicio, id.data, intent.id, intent.amount_received, intent.currency);
    return NextResponse.json({ pagado: true });
  } catch (err) {
    logStructuredError("api/viajes/masivos/estado", "conciliacion_pago_fallida", err, {
      cargaId: id.data,
      usuarioId: user.id,
    });
    return NextResponse.json({ error: "El pago está pendiente de conciliación. Puedes revisar el historial en unos momentos." }, { status: 503 });
  }
}
