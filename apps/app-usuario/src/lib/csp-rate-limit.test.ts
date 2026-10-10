import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import {
  __clearCspRateLimitForTest,
  obtenerIp,
  rateLimitConVentana,
} from "./csp-rate-limit";

function req(headers: Record<string, string> = {}): { headers: Headers } {
  return new NextRequest("http://localhost/api/x", { headers });
}

describe("A1 obtenerIp — no confia en el primer token de XFF", () => {
  it("prefiere x-vercel-forwarded-for sobre XFF inyectado", () => {
    const ip = obtenerIp(
      req({ "x-forwarded-for": "1.1.1.1, 2.2.2.2", "x-vercel-forwarded-for": "203.0.113.7" })
    );
    expect(ip).toBe("203.0.113.7");
  });

  it("prefiere x-real-ip sobre XFF", () => {
    const ip = obtenerIp(
      req({ "x-forwarded-for": "6.6.6.6", "x-real-ip": "198.51.100.9" })
    );
    expect(ip).toBe("198.51.100.9");
  });

  it("de XFF usa el ULTIMO token (proxy cercano), no el primero (cliente)", () => {
    const ip = obtenerIp(req({ "x-forwarded-for": "atacante-inyectado, 203.0.113.5" }));
    expect(ip).toBe("203.0.113.5");
  });

  it("ignora tokens no-IP y cae al ultimo valido", () => {
    const ip = obtenerIp(req({ "x-forwarded-for": "rotar-por-request-abc, 198.51.100.3" }));
    expect(ip).toBe("198.51.100.3");
  });

  it("devuelve null sin cabeceras confiables (no bucket compartido)", () => {
    expect(obtenerIp(req())).toBeNull();
    expect(obtenerIp(req({ "x-forwarded-for": "basura" }))).toBeNull();
  });

  it("acepta IPv4 con puerto y valida octetos", () => {
    expect(obtenerIp(req({ "x-real-ip": "203.0.113.8:5678" }))).toBe("203.0.113.8");
    expect(obtenerIp(req({ "x-real-ip": "999.1.1.1" }))).toBeNull();
  });
});

describe("A2 rateLimitConVentana sin identificador — fail-open por dimension", () => {
  it("null no bloquea ni comparte bucket", async () => {
    __clearCspRateLimitForTest();
    for (let i = 0; i < 20; i += 1) {
      const r = await rateLimitConVentana(null, "prueba-nula", 2, 60_000);
      expect(r.allowed).toBe(true);
    }
  });
});
