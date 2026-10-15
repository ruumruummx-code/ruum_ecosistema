import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { crearClienteServidor } from "@/lib/supabase-server";
import { getRedis, obtenerIp, rateLimitConVentana } from "@/lib/csp-rate-limit";
import { obtenerRutaDirectionsMapboxConParadas } from "@ruum/shared/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MAX_POR_MINUTO = 20;
const VENTANA_MS = 60_000;
const CACHE_TTL_SEG = 86_400; // 24 horas

interface Coordenada {
  lat: number;
  lng: number;
}

interface RutaBody {
  origen?: Coordenada;
  destino?: Coordenada;
  paradas?: Coordenada[];
}

function esCoordenadaValida(c: unknown): c is Coordenada {
  if (!c || typeof c !== "object") return false;
  const { lat, lng } = c as Record<string, unknown>;
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

export async function POST(request: NextRequest) {
  try {
    // 1. Identificar al solicitante: uid de sesión autenticada o IP
    let identificador: string | null = null;
    try {
      const cliente = await crearClienteServidor();
      const {
        data: { user }
      } = await cliente.auth.getUser();
      if (user?.id) {
        identificador = `uid:${user.id}`;
      }
    } catch {
      // Sin sesión activa o error leyendo cookies
    }

    if (!identificador) {
      identificador = obtenerIp(request);
    }

    // 2. Aplicar rate limit (20 req / 60s)
    const limit = await rateLimitConVentana(identificador, "ruta", MAX_POR_MINUTO, VENTANA_MS);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes de ruta. Intenta más tarde." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSec ?? 60) } }
      );
    }

    // 3. Validar payload de coordenadas
    const body = (await request.json().catch(() => null)) as RutaBody | null;
    if (!body || !esCoordenadaValida(body.origen) || !esCoordenadaValida(body.destino)) {
      return NextResponse.json(
        { error: "Se requieren coordenadas válidas de origen y destino." },
        { status: 400 }
      );
    }

    const { origen, destino, paradas = [] } = body;
    const paradasValidas = Array.isArray(paradas) ? paradas.filter(esCoordenadaValida) : [];

    // 4. Hash de coordenadas para caché en Redis (~1.1m de precisión con 5 decimales)
    const coordsStr = [
      `${origen.lat.toFixed(5)},${origen.lng.toFixed(5)}`,
      ...paradasValidas.map((p) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`),
      `${destino.lat.toFixed(5)},${destino.lng.toFixed(5)}`
    ].join(";");
    const hash = createHash("sha256").update(coordsStr).digest("hex").slice(0, 32);
    const cacheKey = `cache:ruta:${hash}`;

    const redis = getRedis();
    if (redis) {
      try {
        const cached = await redis.get<{ distanciaKm: number; tiempoEstimadoHoras: number }>(cacheKey);
        if (
          cached &&
          typeof cached.distanciaKm === "number" &&
          typeof cached.tiempoEstimadoHoras === "number"
        ) {
          return NextResponse.json(cached, {
            headers: { "x-cache": "HIT" }
          });
        }
      } catch (err) {
        console.warn("[api/ruta] error al consultar cache redis:", err);
      }
    }

    // 5. Llamada a Mapbox Directions en el servidor
    const token = process.env.MAPBOX_SECRET_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!token) {
      return NextResponse.json({ error: "Servicio de mapas no disponible." }, { status: 503 });
    }

    const puntosParadas: Array<[number, number]> = paradasValidas.map((p) => [p.lng, p.lat]);

    const ruta = await obtenerRutaDirectionsMapboxConParadas(
      [origen.lng, origen.lat],
      [destino.lng, destino.lat],
      puntosParadas,
      token,
      {
        lanzarErrores: true,
        maxIntentos: 3,
        timeoutMs: 8000,
        demoraReintentoMs: 300
      }
    );

    if (!ruta || ruta.distanciaKm == null || ruta.tiempoHoras == null) {
      return NextResponse.json(
        { error: "No se pudo calcular la ruta entre los puntos especificados." },
        { status: 422 }
      );
    }

    const resultado = {
      distanciaKm: ruta.distanciaKm,
      tiempoEstimadoHoras: ruta.tiempoHoras
    };

    // 6. Almacenar en caché de Redis
    if (redis) {
      try {
        await redis.set(cacheKey, JSON.stringify(resultado), { ex: CACHE_TTL_SEG });
      } catch (err) {
        console.warn("[api/ruta] error guardando cache en redis:", err);
      }
    }

    return NextResponse.json(resultado, {
      headers: { "x-cache": "MISS" }
    });
  } catch (err: unknown) {
    console.warn("[api/ruta] error inesperado:", err);
    const status =
      typeof err === "object" && err !== null && "status" in err && typeof (err as { status: unknown }).status === "number"
        ? (err as { status: number }).status
        : 500;
    return NextResponse.json(
      { error: "Error al calcular la ruta en el servicio de mapas." },
      { status: status >= 400 && status < 600 ? status : 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: "Método no permitido" },
    { status: 405, headers: { Allow: "POST" } }
  );
}
