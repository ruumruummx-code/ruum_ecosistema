import {
  consultarTrasladoEstadoPago,
  consultarPagoCompletadoTraslado,
} from "@ruum/api/transfers";
import { NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase-server";
import { obtenerUsuarioIdPorAuth } from "@ruum/api/identity";
import { rateLimitConVentana } from "@/lib/csp-rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Endpoint de resolución de estado de pago en tiempo real para Flujo 10 (CB-1 / CA-1, CA-2, CA-3).
 * Sustituye el temporizador ciego de la UI por verificación del sistema y consulta el estado persistido por webhook o cron.
 * Protegido con rate limit de 30 req/min por usuario/traslado contra abusos de polling.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: "Traslado no encontrado." }, { status: 404 });
  }

  const cliente = await crearClienteServidor();
  const {
    data: { user },
  } = await cliente.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Inicia sesión para consultar." }, { status: 401 });
  }

  // Rate limit para proteger contra flood o loops infinitos de polling en cliente
  const rate = await rateLimitConVentana(user.id, `estado-pago:${id}`, 30, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Demasiadas consultas de estado de pago. Espera un momento." },
      {
        status: 429,
        headers: {
          "Retry-After": String(rate.retryAfterSec ?? 60),
          "Cache-Control": "no-store",
        },
      }
    );
  }

  try {
    const perfilId = await obtenerUsuarioIdPorAuth(cliente, user.id);

    // CB-3 / T9 / CA-7: Ownership estricto (Anti-IDOR)
    const { data: traslado, error: errTraslado } = await consultarTrasladoEstadoPago(cliente, id);

    if (errTraslado || !traslado || !perfilId || traslado.usuario_id !== perfilId) {
      return NextResponse.json({ error: "Traslado no encontrado." }, { status: 404 });
    }

    // 1. Verificación en tabla de pagos completados
    const { data: pagos, error: errPagos } = await consultarPagoCompletadoTraslado(cliente, id);

    if (!errPagos && pagos && pagos.length > 0) {
      return NextResponse.json({
        pagado: true,
        estadoTraslado: traslado.estado,
        fuente: "base_datos",
        monto: pagos[0].monto,
      });
    }

    // 2. Verificación si el traslado ya transicionó a confirmado o posterior
    const estadosConfirmados = [
      "servicio_confirmado",
      "pendiente_de_conductor",
      "conductor_asignado",
      "conductor_en_camino_al_origen",
      "conductor_en_punto_de_recoleccion",
      "verificacion_vehiculo_en_proceso",
      "vehiculo_recibido",
      "traslado_en_curso",
      "llegada_a_destino",
      "entrega_confirmada",
      "pago_completado",
      "servicio_cerrado",
    ];

    const estadoConfirmaPago = traslado.tipo_pago === "al_cierre"
      ? traslado.estado === "pago_completado"
      : estadosConfirmados.includes(traslado.estado);
    if (estadoConfirmaPago) {
      return NextResponse.json({
        pagado: true,
        estadoTraslado: traslado.estado,
        fuente: "traslado_confirmado",
      });
    }

    // El webhook y el cron actualizan el estado fuera de esta consulta.
    return NextResponse.json({
      pagado: false,
      enProceso: traslado.estado !== "servicio_cancelado",
      estadoTraslado: traslado.estado,
      mensaje: traslado.estado === "servicio_cancelado"
        ? "El traslado fue cancelado."
        : "El pago se encuentra en proceso de validación bancaria.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al consultar estado de pago." },
      { status: 500 }
    );
  }
}
