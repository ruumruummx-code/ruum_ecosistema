import { NextRequest, NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase-server";
import { obtenerIp, rateLimitConVentana } from "@/lib/csp-rate-limit";
import { logStructuredError, logStructuredWarn } from "@/lib/logger";
import { obtenerRutaDirectionsMapboxConParadas } from "@ruum/shared/utils";
import {
  MAX_BYTES_GEOCODE,
  esquemaGeocodeMasivo,
  esquemaTamanioRequest,
} from "./schema";

export const dynamic = "force-dynamic";

const MAX_POR_MINUTO = 15;
const VENTANA_MS = 60_000;

async function geocodificarCP(cp: string, token: string): Promise<{ lat: number; lng: number } | null> {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${cp}.json?country=mx&types=postcode&access_token=${token}&limit=1`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const data = await res.json() as { features?: Array<{ center?: [number, number] }> };
    const [lng, lat] = data.features?.[0]?.center ?? [];
    if (lat == null || lng == null) return null;
    return { lat, lng };
  } catch (err) {
    logStructuredWarn("api/viajes/masivos/geocode", "geocodificar_cp_fallido", err, { cp });
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Validar límite de tamaño del request por Content-Length si está presente
    const lenHeader = request.headers.get("content-length");
    if (lenHeader) {
      const numLen = Number(lenHeader);
      if (!Number.isNaN(numLen) && numLen > MAX_BYTES_GEOCODE) {
        return NextResponse.json({ error: "Payload demasiado grande." }, { status: 413 });
      }
    }

    const cliente = await crearClienteServidor();
    const { data: { user } } = await cliente.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const porUsuario = await rateLimitConVentana(`uid:${user.id}`, "api-masivos-geocode", MAX_POR_MINUTO, VENTANA_MS);
    if (!porUsuario.allowed) {
      return NextResponse.json({ error: "Límite alcanzado." }, { status: 429, headers: { "Retry-After": String(porUsuario.retryAfterSec ?? 60) } });
    }
    const ip = obtenerIp(request);
    if (ip) {
      const porIp = await rateLimitConVentana(ip, "api-masivos-geocode-ip", MAX_POR_MINUTO, VENTANA_MS);
      if (!porIp.allowed) {
        return NextResponse.json({ error: "Límite alcanzado." }, { status: 429, headers: { "Retry-After": String(porIp.retryAfterSec ?? 60) } });
      }
    }

    // 2. Leer texto del cuerpo y validar tamaño
    let raw: string;
    try {
      raw = await request.text();
    } catch (err) {
      logStructuredWarn("api/viajes/masivos/geocode", "lectura_body_fallida", err, { usuarioId: user.id });
      return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
    }

    if (new TextEncoder().encode(raw).length > MAX_BYTES_GEOCODE || !esquemaTamanioRequest.safeParse(raw).success) {
      return NextResponse.json({ error: "Payload demasiado grande." }, { status: 413 });
    }

    // 3. Parsear JSON
    let bodyJson: unknown;
    try {
      bodyJson = JSON.parse(raw);
    } catch (err) {
      logStructuredWarn("api/viajes/masivos/geocode", "json_invalido", err, { usuarioId: user.id });
      return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
    }

    // 4. Validar estructura con esquema Zod (cantidad máxima, CP, índices)
    const parsed = esquemaGeocodeMasivo.safeParse(bodyJson);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Payload inválido.",
          detalles: parsed.error.issues.map((i) => i.message),
        },
        { status: 400 }
      );
    }

    // 5. Llamadas a Mapbox únicamente tras pasar validación completa
    const token = process.env.MAPBOX_SECRET_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!token) return NextResponse.json({ error: "Servicio de mapas no disponible." }, { status: 503 });

    const BATCH = 5;
    const rutas: Array<{ indice: number; distanciaKm: number | null; tiempoEstimadoHoras: number | null }> = [];

    for (let i = 0; i < parsed.data.pares.length; i += BATCH) {
      const lote = parsed.data.pares.slice(i, i + BATCH);
      const resultados = await Promise.all(
        lote.map(async (par) => {
          try {
            const [origen, destino] = await Promise.all([
              geocodificarCP(par.origenCP, token),
              geocodificarCP(par.destinoCP, token),
            ]);
            if (!origen || !destino) return { indice: par.indice, distanciaKm: null, tiempoEstimadoHoras: null };
            const ruta = await obtenerRutaDirectionsMapboxConParadas(
              [origen.lng, origen.lat],
              [destino.lng, destino.lat],
              [],
              token,
              { lanzarErrores: false, maxIntentos: 2, timeoutMs: 6000, demoraReintentoMs: 300 },
            );
            return {
              indice: par.indice,
              distanciaKm: ruta?.distanciaKm ?? null,
              tiempoEstimadoHoras: ruta?.tiempoHoras ?? null,
            };
          } catch (err) {
            logStructuredWarn("api/viajes/masivos/geocode", "calculo_ruta_par_fallido", err, {
              indice: par.indice,
              origenCP: par.origenCP,
              destinoCP: par.destinoCP,
            });
            return { indice: par.indice, distanciaKm: null, tiempoEstimadoHoras: null };
          }
        }),
      );
      rutas.push(...resultados);
    }

    return NextResponse.json({ rutas }, { status: 200 });
  } catch (err) {
    logStructuredError("api/viajes/masivos/geocode", "error_interno", err);
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Método no permitido" }, { status: 405, headers: { Allow: "POST" } });
}
