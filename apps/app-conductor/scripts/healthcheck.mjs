#!/usr/bin/env node

const defaultUrl = "https://concer.ruumruum-moviliax.online/api/health";
const target = new URL(process.env.CONDUCTOR_HEALTHCHECK_URL || defaultUrl);
const timeoutMs = 10_000;
const attempts = 2;

if (target.protocol !== "https:") {
  console.error("[healthcheck] La URL debe usar HTTPS.");
  process.exit(2);
}

if (target.pathname.replace(/\/$/, "") !== "/api/health" || target.username || target.password) {
  console.error("[healthcheck] La URL debe apuntar a /api/health y no incluir credenciales.");
  process.exit(2);
}

function pause(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function probe() {
  const startedAt = Date.now();
  const response = await fetch(target, {
    headers: {
      accept: "application/json",
      "user-agent": "ruum-app-conductor-healthcheck/1.0",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    throw new Error(`HTTP_${response.status}`);
  }

  if (!response.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    throw new Error("NON_JSON_RESPONSE");
  }

  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error("INVALID_JSON");
  }

  if (body?.status !== "ok") {
    throw new Error(`HEALTH_STATUS_${String(body?.status ?? "MISSING").toUpperCase()}`);
  }
  if (body?.checks?.supabase?.status !== "ok") {
    throw new Error(`SUPABASE_STATUS_${String(body?.checks?.supabase?.status ?? "MISSING").toUpperCase()}`);
  }

  return {
    host: target.host,
    status: "ok",
    version: typeof body.version === "string" ? body.version : "unknown",
    responseTimeMs: Date.now() - startedAt,
    supabaseLatencyMs: body.checks.supabase.latencyMs ?? null,
  };
}

for (let attempt = 1; attempt <= attempts; attempt += 1) {
  try {
    console.log(JSON.stringify({ event: "conductor_healthcheck_passed", attempt, ...(await probe()) }));
    process.exit(0);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    if (attempt === attempts) {
      console.error(JSON.stringify({
        event: "conductor_healthcheck_failed",
        attempts,
        host: target.host,
        reason,
      }));
      process.exit(1);
    }
    console.warn(JSON.stringify({ event: "conductor_healthcheck_retry", attempt, host: target.host, reason }));
    await pause(2_000);
  }
}
