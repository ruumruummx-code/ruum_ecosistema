import { NextRequest, NextResponse } from "next/server";
import { crearTicketSoporte } from "@ruum/api/services";
import { crearClienteServidor } from "@/lib/supabase-server";
import { verificarCsrfORechazar } from "@/lib/csrf";
import { rateLimitConVentana } from "@/lib/csp-rate-limit";
import { z } from "zod";
const esquema = z.object({ id: z.string().uuid(), trasladoId: z.string().uuid().nullable(), motivo: z.string().trim().min(3).max(120), descripcion: z.string().trim().min(10).max(1000) }).strict();
export async function POST(request: NextRequest) {
  const rechazo = verificarCsrfORechazar(request);
  if (rechazo) return rechazo;
  try {
    const cliente = await crearClienteServidor();
    const { data: { user }, error } = await cliente.auth.getUser();
    if (error || !user) return NextResponse.json({ error: "Inicia sesión para enviar tu consulta." }, { status: 401 });
    const limite = await rateLimitConVentana(`uid:${user.id}`, "tickets-soporte", 10, 60000);
    if (!limite.allowed) return NextResponse.json({ error: "Espera antes de enviar otra consulta." }, { status: 429 });
    const entrada = esquema.safeParse(await request.json().catch(() => null));
    if (!entrada.success) return NextResponse.json({ error: "Revisa los datos de tu consulta." }, { status: 400 });
    return NextResponse.json(await crearTicketSoporte(cliente, entrada.data), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "No pudimos confirmar el ticket. Conservamos tu descripción para reintentar." }, { status: 503 });
  }
}
