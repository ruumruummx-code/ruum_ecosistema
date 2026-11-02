import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { crearClienteServidor } from "@/lib/supabase-server";
import { verificarCsrfORechazar } from "@/lib/csrf";
import { rateLimitConVentana } from "@/lib/csp-rate-limit";
import { iniciarAltaTarjeta, listarTarjetasBilletera, modificarTarjetaBilletera, sesionBilleteraCheckout } from "@/lib/billetera-server";
export const dynamic = "force-dynamic";
const esquema = z.discriminatedUnion("accion", [
  z.object({ accion: z.literal("agregar"), clave: z.string().uuid() }).strict(),
  z.object({ accion: z.enum(["eliminar", "predeterminar"]), id: z.string().regex(/^pm_[A-Za-z0-9]+$/) }).strict(),
  z.object({ accion: z.literal("sesion"), intentId: z.string().regex(/^pi_[A-Za-z0-9]+$/) }).strict(),
]);
function json(datos: unknown, status = 200) {
  return NextResponse.json(datos, { status, headers: { "Cache-Control": "no-store" } });
}
async function manejar(request: NextRequest, mutacion: boolean) {
  if (mutacion) {
    const rechazo = verificarCsrfORechazar(request);
    if (rechazo) return rechazo;
  }
  try {
    const cliente = await crearClienteServidor();
    const { data: { user }, error } = await cliente.auth.getUser();
    if (error || !user) return json({ error: "Inicia sesión para gestionar tus tarjetas." }, 401);
    const limite = await rateLimitConVentana(`uid:${user.id}`, "billetera", 30, 60000);
    if (!limite.allowed) return json({ error: "Espera antes de volver a intentarlo." }, 429);
    if (!mutacion) return json(await listarTarjetasBilletera(user.id));
    const entrada = esquema.safeParse(await request.json().catch(() => null));
    if (!entrada.success) return json({ error: "Solicitud inválida." }, 400);
    const datos = entrada.data;
    if (datos.accion === "agregar") return json(await iniciarAltaTarjeta(user.id, request.nextUrl.origin, datos.clave));
    if (datos.accion === "sesion") return json(await sesionBilleteraCheckout(user.id, datos.intentId));
    await modificarTarjetaBilletera(user.id, datos.id, datos.accion);
    return json({ ok: true });
  } catch {
    // Nunca devolver errores de Stripe: pueden incluir identificadores y datos del cliente.
    return json({ error: "No pudimos completar la operación. Actualiza la lista antes de reintentar." }, 503);
  }
}
export async function GET(request: NextRequest) { return manejar(request, false); }
export async function POST(request: NextRequest) { return manejar(request, true); }
