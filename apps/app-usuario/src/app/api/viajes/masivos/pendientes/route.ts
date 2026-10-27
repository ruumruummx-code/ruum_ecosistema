import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { crearClienteServidor } from "@/lib/supabase-server";
import { clienteMasivoServicio, stripeMasivo } from "@/lib/carga-masiva-server";
import {
  listarCheckoutsMasivosPendientesUsuario,
  obtenerCheckoutMasivoServidor,
  descartarCheckoutMasivoServidor,
  confirmarPagoMasivoServidor,
} from "@ruum/api/services";
import { rateLimitConVentana } from "@/lib/csp-rate-limit";
import { logStructuredError, logStructuredWarn } from "@/lib/logger";
import { verificarCsrfORechazar } from "@/lib/csrf";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const cliente = await crearClienteServidor();
  const { data: { user } } = await cliente.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const limite = await rateLimitConVentana(`uid:${user.id}`, "masivos-pendientes-get", 60, 60000);
  if (!limite.allowed) return NextResponse.json({ error: "Demasiadas consultas. Espera un momento." }, { status: 429 });

  const idParam = request.nextUrl.searchParams.get("id");
  const servicio = clienteMasivoServicio();

  if (idParam) {
    const idValidado = z.string().uuid().safeParse(idParam);
    if (!idValidado.success) return NextResponse.json({ error: "Identificador de carga inválido" }, { status: 400 });

    try {
      const carga = await obtenerCheckoutMasivoServidor(servicio, idValidado.data, user.id);
      if (!carga) return NextResponse.json({ error: "Carga no encontrada" }, { status: 404 });

      if (carga.pagado_en) {
        return NextResponse.json({ id: carga.id, pagado: true, fuente: "webhook" });
      }
      if (carga.expirado_en) {
        return NextResponse.json({ id: carga.id, expirado: true, error: "Esta carga masiva ya expiró o fue descartada." });
      }

      if (!carga.stripe_payment_intent_id) {
        return NextResponse.json({ error: "La carga no tiene intención de pago asociada." }, { status: 400 });
      }

      const intent = await stripeMasivo(`payment_intents/${encodeURIComponent(carga.stripe_payment_intent_id)}`);
      if (intent.status === "succeeded") {
        await confirmarPagoMasivoServidor(servicio, carga.id, intent.id, intent.amount_received, intent.currency);
        return NextResponse.json({ id: carga.id, pagado: true, fuente: "fallback_stripe" });
      }
      if (intent.status === "canceled") {
        await descartarCheckoutMasivoServidor(servicio, carga.id, user.id);
        return NextResponse.json({ id: carga.id, expirado: true, error: "La intención de pago fue cancelada." });
      }

      return NextResponse.json({
        id: carga.id,
        clientSecret: intent.client_secret,
        totalMXN: carga.monto_centavos / 100,
        cotizaciones: carga.cotizaciones,
        filas: carga.filas,
        creado_en: carga.creado_en,
      });
    } catch (err) {
      logStructuredError("api/viajes/masivos/pendientes", "consulta_carga_pendiente_fallida", err, {
        cargaId: idValidado.data,
        usuarioId: user.id,
      });
      return NextResponse.json({ error: err instanceof Error ? err.message : "Error al consultar la carga pendiente." }, { status: 500 });
    }
  }

  try {
    const cargas = await listarCheckoutsMasivosPendientesUsuario(servicio, user.id);
    const lista = cargas.map((c) => ({
      id: c.id,
      creado_en: c.creado_en,
      totalMXN: c.monto_centavos / 100,
      cantidad_traslados: Array.isArray(c.cotizaciones)
        ? c.cotizaciones.length
        : Array.isArray(c.filas)
          ? c.filas.length
          : 0,
      archivo: (c as { archivo?: string }).archivo || `lote_${c.id.slice(0, 8)}.xlsx`,
      estado: c.pagado_en ? "Completado" : c.expirado_en ? "Con errores" : "En proceso",
    }));
    return NextResponse.json({ pendientes: lista });
  } catch (err) {
    logStructuredError("api/viajes/masivos/pendientes", "listar_cargas_pendientes_fallido", err, {
      usuarioId: user.id,
    });
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error al listar cargas pendientes." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const rechazoCsrf = verificarCsrfORechazar(request);
  if (rechazoCsrf) return rechazoCsrf;
  const cliente = await crearClienteServidor();
  const { data: { user } } = await cliente.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const idParam = request.nextUrl.searchParams.get("id");
  const idValidado = z.string().uuid().safeParse(idParam);
  if (!idValidado.success) return NextResponse.json({ error: "Identificador de carga inválido" }, { status: 400 });

  const servicio = clienteMasivoServicio();
  try {
    const carga = await obtenerCheckoutMasivoServidor(servicio, idValidado.data, user.id);
    if (!carga) return NextResponse.json({ error: "Carga no encontrada" }, { status: 404 });
    if (carga.pagado_en) {
      return NextResponse.json({ error: "No se puede descartar una carga ya pagada." }, { status: 400 });
    }

    if (carga.stripe_payment_intent_id) {
      const endpoint = `payment_intents/${encodeURIComponent(carga.stripe_payment_intent_id)}`;
      let intent;
      try {
        intent = await stripeMasivo(`${endpoint}/cancel`, new URLSearchParams());
      } catch (errCancel) {
        // Un timeout puede ocurrir después de cancelar. Consultar el estado real
        // también permite recuperar cancelaciones previas o un pago concurrente.
        logStructuredWarn("api/viajes/masivos/pendientes", "cancelacion_payment_intent_por_verificar", errCancel, {
          cargaId: idValidado.data,
          usuarioId: user.id,
        });
        intent = await stripeMasivo(endpoint);
      }
      if (intent.id !== carga.stripe_payment_intent_id) {
        throw new Error("No pudimos verificar el cobro asociado a esta carga. La carga se conserva para reintentar.");
      }
      if (intent.status === "succeeded") {
        await confirmarPagoMasivoServidor(servicio, carga.id, intent.id, intent.amount_received, intent.currency);
        return NextResponse.json({ error: "El pago ya fue confirmado. No se puede descartar esta carga; consulta Mis traslados.", pagado: true }, { status: 409 });
      }
      if (intent.status !== "canceled") {
        return NextResponse.json({ error: "No se confirmó la cancelación del cobro. La carga se conserva; verifica su estado antes de reintentar." }, { status: 409 });
      }
    }

    await descartarCheckoutMasivoServidor(servicio, idValidado.data, user.id);
    return NextResponse.json({ ok: true, descartado: idValidado.data });
  } catch (err) {
    logStructuredError("api/viajes/masivos/pendientes", "descartar_carga_pendiente_fallido", err, {
      cargaId: idValidado.data,
      usuarioId: user.id,
    });
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error al descartar la carga." }, { status: 500 });
  }
}
