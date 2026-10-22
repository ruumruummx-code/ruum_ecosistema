import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  rateLimit,
  ipDeRequest,
  RedisRateLimitStore,
  MemoryRateLimitStore,
  __resetRateLimitStateForTest
} from "../src/lib/rate-limit";
import type { Redis } from "@upstash/redis";

describe("Rate limit distribuido y degradación defensiva", () => {
  beforeEach(() => {
    __resetRateLimitStateForTest();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    __resetRateLimitStateForTest();
  });

  it("garantiza límite distribuido entre múltiples instancias compartiendo almacén", async () => {
    // Simula almacenamiento Redis centralizado compartido
    const sharedRedisStorage = new Map<string, { value: string; ttl: number }>();

    const redisMock: Partial<Redis> = {
      set: vi.fn(async (key: string, value: unknown) => {
        if (!sharedRedisStorage.has(key)) {
          sharedRedisStorage.set(key, { value: String(value), ttl: 60 });
        }
        return "OK";
      }),
      incr: vi.fn(async (key: string) => {
        const item = sharedRedisStorage.get(key) ?? { value: "0", ttl: 60 };
        const next = Number(item.value) + 1;
        sharedRedisStorage.set(key, { value: String(next), ttl: item.ttl });
        return next;
      }),
      ttl: vi.fn(async (key: string) => {
        return sharedRedisStorage.get(key)?.ttl ?? 60;
      })
    };

    // Dos instancias de aplicación independientes apuntando al mismo Redis
    const instancia1 = new RedisRateLimitStore(redisMock as Redis);
    const instancia2 = new RedisRateLimitStore(redisMock as Redis);

    // Instancia 1 recibe 2 peticiones (límite = 2)
    const r1 = await rateLimit("ip-100", { max: 2, ventanaMs: 60_000, clave: "test", store: instancia1 });
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(1);

    const r2 = await rateLimit("ip-100", { max: 2, ventanaMs: 60_000, clave: "test", store: instancia1 });
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(0);

    // Instancia 2 recibe una tercera petición para la misma IP -> bloqueada distribuídamente
    const r3 = await rateLimit("ip-100", { max: 2, ventanaMs: 60_000, clave: "test", store: instancia2 });
    expect(r3.allowed).toBe(false);
    expect(r3.remaining).toBe(0);
    expect(r3.retryAfterSec).toBeGreaterThan(0);
  });

  it("emite alerta crítica en producción cuando cae al respaldo en memoria", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    // Sin Redis configurado en producción:
    // Con failClosed=true (recuperación de contraseña), debe bloquear y alertar
    const resRecovery = await rateLimit("ip-200", {
      max: 5,
      ventanaMs: 60_000,
      clave: "recovery-verify",
      failClosed: true
    });

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("ALERTA PRODUCCIÓN: Redis no configurado o no disponible"),
      expect.objectContaining({ clave: "recovery-verify:ip-200", failClosed: true })
    );
    expect(resRecovery.allowed).toBe(false);
    expect(resRecovery.degraded).toBe(true);

    // Con failClosed=false (csp-report), debe permitir y alertar
    const resCsp = await rateLimit("ip-300", {
      max: 5,
      ventanaMs: 60_000,
      clave: "csp-report",
      failClosed: false
    });

    expect(resCsp.allowed).toBe(true);
    expect(resCsp.degraded).toBe(true);
  });

  it("ipDeRequest prioriza cabeceras de borde confiables y sanitiza", () => {
    const fakeRequest = {
      headers: new Headers({
        "x-forwarded-for": "10.0.0.1, 198.51.100.12",
        "x-vercel-forwarded-for": "203.0.113.88"
      })
    };

    const ip = ipDeRequest(fakeRequest);
    expect(ip).toBe("203.0.113.88");
  });
});
