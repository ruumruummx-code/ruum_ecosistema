import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

describe("panel-admin /api/csp-report", () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    const { __resetRateLimitStateForTest } = await import("@ruum/api/rate-limit");
    __resetRateLimitStateForTest();
  });

  it("responde 204 a peticiones POST con reporte CSP válido", async () => {
    const { POST } = await import("./route");
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const payload = JSON.stringify({
      "csp-report": {
        "document-uri": "https://admin.ruum.mx/dashboard",
        "violated-directive": "script-src",
        "effective-directive": "script-src",
        "blocked-uri": "https://evil.com/malware.js",
      },
    });

    const req = new NextRequest("http://localhost:3002/api/csp-report", {
      method: "POST",
      headers: {
        "content-type": "application/csp-report",
        "x-forwarded-for": "192.168.1.100",
      },
      body: payload,
    });

    const res = await POST(req);
    expect(res.status).toBe(204);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(warnSpy).toHaveBeenCalled();
  });

  it("responde 204 a peticiones POST con cuerpo vacío", async () => {
    const { POST } = await import("./route");
    const req = new NextRequest("http://localhost:3002/api/csp-report", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": "192.168.1.101",
      },
      body: "{}",
    });

    const res = await POST(req);
    expect(res.status).toBe(204);
  });

  it("responde 413 si Content-Length supera los 16 KB", async () => {
    const { POST } = await import("./route");
    const req = new NextRequest("http://localhost:3002/api/csp-report", {
      method: "POST",
      headers: {
        "content-length": "20000",
        "x-forwarded-for": "192.168.1.102",
      },
      body: "a",
    });

    const res = await POST(req);
    expect(res.status).toBe(413);
  });

  it("responde 413 si el cuerpo del payload supera los 16 KB", async () => {
    const { POST } = await import("./route");
    const largeBody = "x".repeat(17 * 1024);
    const req = new NextRequest("http://localhost:3002/api/csp-report", {
      method: "POST",
      headers: {
        "x-forwarded-for": "192.168.1.103",
      },
      body: largeBody,
    });

    const res = await POST(req);
    expect(res.status).toBe(413);
  });

  it("redacta tokens JWT en los logs", async () => {
    const { POST } = await import("./route");
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const fakeJwt = [
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
      "eyJzdWIiOiIxMjM0NTY3ODkwIn0",
      "doNotLeakThisSignature123456789"
    ].join(".");
    const body = JSON.stringify({ token: fakeJwt, violatedDirective: "img-src" });

    const req = new NextRequest("http://localhost:3002/api/csp-report", {
      method: "POST",
      headers: {
        "x-forwarded-for": "192.168.1.104",
      },
      body,
    });

    await POST(req);
    expect(warnSpy).toHaveBeenCalled();
    const loggedMessage = warnSpy.mock.calls[0]?.[1] as string;
    expect(loggedMessage).toContain("[REDACTED_JWT]");
    expect(loggedMessage).not.toContain("doNotLeakThisSignature");
  });

  it("responde 204 a métodos GET y HEAD", async () => {
    const { GET, HEAD } = await import("./route");
    const resGet = await GET();
    expect(resGet.status).toBe(204);

    const resHead = await HEAD();
    expect(resHead.status).toBe(204);
  });

  it("devuelve 429 al exceder la cuota de rate limit", async () => {
    const { POST } = await import("./route");
    vi.spyOn(console, "warn").mockImplementation(() => {});

    const ip = "10.0.0.99";
    for (let i = 0; i < 60; i++) {
      const req = new NextRequest("http://localhost:3002/api/csp-report", {
        method: "POST",
        headers: { "x-forwarded-for": ip },
        body: "{}",
      });
      const res = await POST(req);
      expect(res.status).toBe(204);
    }

    const blockedReq = new NextRequest("http://localhost:3002/api/csp-report", {
      method: "POST",
      headers: { "x-forwarded-for": ip },
      body: "{}",
    });
    const blockedRes = await POST(blockedReq);
    expect(blockedRes.status).toBe(429);
    expect(blockedRes.headers.get("retry-after")).toBeDefined();
  });
});
