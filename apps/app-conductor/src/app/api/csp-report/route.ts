import { NextRequest, NextResponse } from "next/server";
import { rateLimit, ipDeRequest } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MAX_POR_VENTANA = 60;
const VENTANA_MS = 60 * 60 * 1000; // 1 hora
const MAX_PAYLOAD_BYTES = 16 * 1024; // 16 KB límite para reportes CSP

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_PAYLOAD_BYTES) {
    return new NextResponse("Payload Too Large", { status: 413 });
  }

  const ip = ipDeRequest(request);
  const { allowed, remaining, resetAt } = await rateLimit(
    `csp-report:${ip ?? "anon"}`,
    { max: MAX_POR_VENTANA, ventanaMs: VENTANA_MS }
  );

  if (!allowed) {
    return new NextResponse(null, {
      status: 429,
      headers: {
        "Cache-Control": "no-store",
        "Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)),
        "X-RateLimit-Limit": String(MAX_POR_VENTANA),
        "X-RateLimit-Remaining": String(remaining),
        "X-RateLimit-Reset": String(resetAt)
      }
    });
  }

  try {
    const body = await request.text();
    if (body.length > MAX_PAYLOAD_BYTES) {
      return new NextResponse("Payload Too Large", { status: 413 });
    }
    // P2 CSP Report-Only — log sanitizado para staging
    console.warn("[csp-report]", body.slice(0, 1000));
  } catch {
    // ignore
  }
  return new NextResponse(null, {
    status: 204,
    headers: {
      "X-RateLimit-Limit": String(MAX_POR_VENTANA),
      "X-RateLimit-Remaining": String(remaining),
      "X-RateLimit-Reset": String(resetAt)
    }
  });
}

// Algunos navegadores envían report con GET
export async function GET(request: NextRequest) {
  const ip = ipDeRequest(request);
  const { allowed, remaining, resetAt } = await rateLimit(
    `csp-report:${ip ?? "anon"}`,
    { max: MAX_POR_VENTANA, ventanaMs: VENTANA_MS }
  );

  if (!allowed) {
    return new NextResponse(null, {
      status: 429,
      headers: {
        "Cache-Control": "no-store",
        "Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)),
        "X-RateLimit-Limit": String(MAX_POR_VENTANA),
        "X-RateLimit-Remaining": String(remaining),
        "X-RateLimit-Reset": String(resetAt)
      }
    });
  }

  return new NextResponse(null, {
    status: 204,
    headers: {
      "X-RateLimit-Limit": String(MAX_POR_VENTANA),
      "X-RateLimit-Remaining": String(remaining),
      "X-RateLimit-Reset": String(resetAt)
    }
  });
}
