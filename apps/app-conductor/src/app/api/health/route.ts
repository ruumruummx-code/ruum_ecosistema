import { NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type HealthStatus = "ok" | "degraded" | "down";

const DB_TIMEOUT_MS = 3000;
const GENERIC_UNAVAILABLE_MESSAGE = "Servicio no disponible";

export async function GET() {
  const iniciado = Date.now();
  const version = process.env.NEXT_PUBLIC_APP_VERSION ?? "unknown";
  const ambiente = process.env.NEXT_PUBLIC_RUUM_AMBIENTE ?? process.env.NODE_ENV ?? "unknown";

  let supabase: HealthStatus = "ok";
  let supabaseLatencyMs: number | null = null;
  let supabaseError: string | null = null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    supabase = "down";
    supabaseError = GENERIC_UNAVAILABLE_MESSAGE;
  } else {
    const controller = new AbortController();
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutHandle = setTimeout(() => {
        controller.abort();
        reject(new Error("DB_TIMEOUT"));
      }, DB_TIMEOUT_MS);
      if (typeof timeoutHandle === "object" && "unref" in timeoutHandle) {
        timeoutHandle.unref();
      }
    });

    try {
      const t0 = Date.now();
      const dbCheckPromise = (async () => {
        const cliente = await crearClienteServidor();
        const query = cliente.from("conductores").select("id").limit(1).maybeSingle();
        const cancelableQuery = query as unknown as { abortSignal?: (signal: AbortSignal) => unknown };
        if (typeof cancelableQuery.abortSignal === "function") {
          cancelableQuery.abortSignal(controller.signal);
        }
        return await query;
      })();

      const { error } = await Promise.race([dbCheckPromise, timeoutPromise]);
      supabaseLatencyMs = Date.now() - t0;

      if (error) {
        console.error("[Health] Fallo en respuesta de base de datos:", error.message || error);
        supabase = "down";
        supabaseError = GENERIC_UNAVAILABLE_MESSAGE;
      }
    } catch (e) {
      console.error("[Health] Error o timeout en consulta a base de datos:", e instanceof Error ? e.message : e);
      supabase = "down";
      supabaseError = GENERIC_UNAVAILABLE_MESSAGE;
    } finally {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
    }
  }

  const isHealthy = supabase === "ok";
  const overall: HealthStatus = isHealthy ? "ok" : "down";
  const latencyMs = Date.now() - iniciado;

  const body = {
    status: overall,
    version,
    timestamp: new Date().toISOString(),
    latencyMs,
    ...(supabaseError ? { message: GENERIC_UNAVAILABLE_MESSAGE } : {}),
    checks: {
      supabase: {
        status: supabase,
        latencyMs: supabaseLatencyMs,
        error: supabaseError,
      },
      csp: {
        status: "ok" as HealthStatus,
        note: "nonce+strict-dynamic vía middleware; ver /api/csp-report",
      },
    },
  };

  return NextResponse.json(body, {
    status: isHealthy ? 200 : 503,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Content-Type": "application/json",
    },
  });
}
