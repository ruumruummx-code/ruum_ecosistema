import { NextRequest, NextResponse } from "next/server";
import { rateLimitDistribuido, obtenerIpConfiable } from "@ruum/api/rate-limit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MAX_PAYLOAD_BYTES = 16 * 1024; // 16 KB límite para reportes CSP
const MAX_POR_VENTANA = 60;
const VENTANA_MS = 60 * 60 * 1000; // 1 hora

function sanitizarCspBody(raw: string): string {
  const truncado = raw.slice(0, MAX_PAYLOAD_BYTES);
  return truncado.replace(
    /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}[a-zA-Z0-9._-]*/g,
    "[REDACTED_JWT]"
  );
}

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_PAYLOAD_BYTES) {
    return new NextResponse("Payload Too Large", { status: 413 });
  }

  const ip = obtenerIpConfiable(request);
  const rl = await rateLimitDistribuido(ip, {
    max: MAX_POR_VENTANA,
    ventanaMs: VENTANA_MS,
    clave: "csp-report-panel-admin",
    failClosed: false,
  });

  if (!rl.allowed) {
    const espera = rl.retryAfterSec ?? 60;
    return new NextResponse(null, {
      status: 429,
      headers: {
        "Cache-Control": "no-store",
        "Retry-After": String(espera),
        "X-RateLimit-Limit": String(MAX_POR_VENTANA),
        "X-RateLimit-Remaining": String(rl.remaining ?? 0),
        "X-RateLimit-Reset": String(rl.resetAt ?? 0),
      },
    });
  }

  try {
    const raw = await request.text();
    if (raw.length > MAX_PAYLOAD_BYTES) {
      return new NextResponse("Payload Too Large", { status: 413 });
    }
    const body = sanitizarCspBody(raw);
    console.warn("[csp-report-panel-admin]", body.slice(0, 2000));

    // Forward opcional a Sentry si está configurado en el entorno
    void (async () => {
      try {
        let directiva: string | undefined;
        try {
          const parsed = JSON.parse(raw) as Record<string, unknown>;
          const report = (parsed["csp-report"] as Record<string, unknown> | undefined) ?? parsed;
          directiva = (report?.["violated-directive"] ?? report?.["effective-directive"]) as string | undefined;
        } catch {}

        try {
          const Sentry = await import("@sentry/nextjs");
          if (typeof (Sentry as unknown as { captureMessage?: unknown }).captureMessage === "function") {
            (Sentry as unknown as { captureMessage: (m: string, o: unknown) => void }).captureMessage(
              "[csp-report-panel-admin]",
              {
                level: "warning",
                extra: { ip, directiva: directiva?.slice(0, 120), body: body.slice(0, 500) },
              }
            );
          }
        } catch {}
      } catch {}
    })();
  } catch {
    // ignore — el endpoint de reporte nunca debe fallar
  }

  return new NextResponse(null, {
    status: 204,
    headers: {
      "Cache-Control": "no-store",
      "X-RateLimit-Limit": String(MAX_POR_VENTANA),
      "X-RateLimit-Remaining": String(rl.remaining ?? 0),
      "X-RateLimit-Reset": String(rl.resetAt ?? 0),
    },
  });
}

export async function GET() {
  return new NextResponse(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function HEAD() {
  return new NextResponse(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  });
}
