import { obtenerCheckoutMasivoServidor, confirmarPagoMasivoServidor } from "@ruum/api/services";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { crearClienteServidor } from "@/lib/supabase-server";
import { clienteMasivoServicio, stripeMasivo } from "@/lib/carga-masiva-server";
import { rateLimitConVentana } from "@/lib/csp-rate-limit";
import { logStructuredError, logStructuredInfo } from "@/lib/logger";
import { registrarMetricaPago } from "@/lib/carga-masiva-telemetria";
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
    // Webhook como fuente de verdad: si ya se concilió por el webhook de Stripe en tiempo real,
    // respondemos de inmediato evitando llamadas redundantes a la API de Stripe.
    if (carga.pagado_en) {
      registrarMetricaPago({
        cargaId: id.data,
        exito: true,
        fuente: "webhook",
        montoCentavos: carga.monto_centavos,
        usuarioId: user.id,
      });
      return NextResponse.json({ pagado: true, fuente: "webhook" });
    }
    if (!carga.stripe_payment_intent_id) return NextResponse.json({ pagado: false });

    // Fallback secundario de polling: si el webhook está demorado, consultamos a Stripe
    logStructuredInfo("api/viajes/masivos/estado", "polling_fallback_stripe", { cargaId: id.data });
    const intent = await stripeMasivo(`payment_intents/${encodeURIComponent(carga.stripe_payment_intent_id)}`);
    if (intent.status !== "succeeded") return NextResponse.json({ pagado: false });
    try {
      await confirmarPagoMasivoServidor(servicio, id.data, intent.id, intent.amount_received, intent.currency);
    } catch (err) {
      logStructuredError("api/viajes/masivos/estado", "pago_cobrado_conciliacion_pendiente", err, { cargaId: id.data, usuarioId: user.id });
      return NextResponse.json({ pagado: false, cobrado: true, codigo: "PAGO_COBRADO_PENDIENTE_CONCILIACION", error: "Stripe confirmó tu pago, pero no pudimos generar los traslados. No vuelvas a pagar. Puedes reintentar la conciliación o contactar a soporte." }, { status: 202 });
    }
    registrarMetricaPago({
      cargaId: id.data,
      exito: true,
      fuente: "fallback_stripe",
      montoCentavos: intent.amount_received,
      usuarioId: user.id,
    });
    return NextResponse.json({ pagado: true, fuente: "fallback_stripe" });
  } catch (err) {
    registrarMetricaPago({
      cargaId: id.data,
      exito: false,
      fuente: "fallback_stripe",
      usuarioId: user.id,
      error: err instanceof Error ? err.message : String(err),
    });
    logStructuredError("api/viajes/masivos/estado", "conciliacion_pago_fallida", err, {
      cargaId: id.data,
      usuarioId: user.id,
    });
    return NextResponse.json({ error: "El pago está pendiente de conciliación. Puedes revisar el historial en unos momentos." }, { status: 503 });
  }
}
