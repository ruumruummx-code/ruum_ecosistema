import { autorizarCron } from "@/lib/autorizar-cron";
import { NextRequest, NextResponse } from "next/server";
import { clienteMasivoServicio, stripeMasivo } from "@/lib/carga-masiva-server";
import {
  reclamarCheckpointsCheckoutMasivoServidor,
  registrarCheckoutPagoConfirmadoServidor,
  confirmarPagoMasivoServidor,
  marcarCheckpointCheckoutMasivoServidor,
} from "@ruum/api/services";

export const dynamic = "force-dynamic";

/** Endpoint manual para el workflow durable. La programación está en Supabase. */
export async function GET(request: NextRequest) {
  if (!autorizarCron(request, process.env.MASIVOS_RECONCILIADOR_SECRET)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const cliente = clienteMasivoServicio();
  const candidatos = await reclamarCheckpointsCheckoutMasivoServidor(cliente, 25);
  let confirmados = 0;
  let fallidos = 0;
  for (const candidato of candidatos) {
    try {
      const intent = await stripeMasivo(`payment_intents/${encodeURIComponent(candidato.intent_id)}`);
      if (intent.status !== "succeeded") {
        await marcarCheckpointCheckoutMasivoServidor(cliente, candidato.checkout_id, "error_reconciliable", `stripe_status:${intent.status}`, new Date(Date.now() + 120_000).toISOString());
        continue;
      }
      if (intent.currency !== "mxn" || intent.amount_received <= 0) throw new Error("stripe_amount_or_currency_invalid");
      await registrarCheckoutPagoConfirmadoServidor(cliente, candidato.checkout_id, intent.id);
      await confirmarPagoMasivoServidor(cliente, candidato.checkout_id, intent.id, intent.amount_received, intent.currency);
      await marcarCheckpointCheckoutMasivoServidor(cliente, candidato.checkout_id, "completado");
      confirmados += 1;
    } catch (error) {
      fallidos += 1;
      const permanente = error instanceof Error && /amount|currency|identity|idempotency/.test(error.message);
      await marcarCheckpointCheckoutMasivoServidor(
        cliente,
        candidato.checkout_id,
        permanente || candidato.intentos >= 5 ? "error_permanente" : "error_reconciliable",
        error instanceof Error ? error.message : "reconciliation_failed",
        permanente || candidato.intentos >= 5 ? undefined : new Date(Date.now() + Math.min(candidato.intentos * 60_000, 15 * 60_000)).toISOString(),
      );
    }
  }
  return NextResponse.json({ reclamados: candidatos.length, confirmados, fallidos }, { status: fallidos > 0 ? 500 : 200 });
}
