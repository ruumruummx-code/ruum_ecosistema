import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { crearClienteServidor } from "@/lib/supabase-server";
import { rateLimitConVentana } from "@/lib/csp-rate-limit";
import { listarResumenTrasladosDeUsuario, obtenerUsuarioActual } from "@ruum/api/services";

const querySchema = z.object({
  limite: z.coerce.number().int().min(1).max(20).default(6),
  desplazamiento: z.coerce.number().int().min(0).max(10000).default(0),
});

/** Contrato paginado del resumen del dashboard. La lista completa vive en /mis-viajes. */
export async function GET(request: NextRequest) {
  const cliente = await crearClienteServidor();
  const { data: { user } } = await cliente.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const limiteRate = await rateLimitConVentana(`uid:${user.id}`, "traslados-resumen", 60, 60000);
  if (!limiteRate.allowed) return NextResponse.json({ error: "Espera antes de consultar de nuevo." }, { status: 429 });

  const query = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams.entries()));
  if (!query.success) return NextResponse.json({ error: "Paginación inválida." }, { status: 400 });

  const usuario = await obtenerUsuarioActual(cliente);
  if (!usuario) return NextResponse.json({ error: "Perfil no disponible" }, { status: 409 });

  const items = await listarResumenTrasladosDeUsuario(cliente, usuario.id, query.data);
  return NextResponse.json({
    items,
    paginacion: {
      limite: query.data.limite,
      desplazamiento: query.data.desplazamiento,
      siguienteDesplazamiento: items.length === query.data.limite ? query.data.desplazamiento + items.length : null,
      hayMas: items.length === query.data.limite,
    },
  }, { headers: { "Cache-Control": "private, no-store" } });
}
