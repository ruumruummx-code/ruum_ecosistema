import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: vi.fn(() => undefined),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}));

import { POST, DELETE } from "./route";

const URL = "http://localhost/api/recovery/clear";

function req(origen?: string, ip = "203.0.113.88"): NextRequest {
  const headers: Record<string, string> = { "x-real-ip": ip };
  if (origen !== undefined) headers.origin = origen;
  return new NextRequest(URL, { method: "POST", headers });
}

/** M7: mismo origen + rate limit en endpoint de escritura pública. */
describe("POST /api/recovery/clear", () => {
  it("misma petición sin Origin pasa y limpia", async () => {
    const res = await POST(req(undefined, "203.0.113.81"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ cleared: true });
  });

  it("rechaza Origin cruzado (CSRF)", async () => {
    const res = await POST(req("https://atacante.test", "203.0.113.82"));
    expect(res.status).toBe(403);
  });

  it("acepta Origin propio", async () => {
    const res = await POST(req("http://localhost", "203.0.113.83"));
    expect(res.status).toBe(200);
  });

  it("limita a 20/hora por IP", async () => {
    const ip = "203.0.113.84";
    let ultimo = await POST(req(undefined, ip));
    for (let i = 0; i < 20; i += 1) ultimo = await POST(req(undefined, ip));
    expect(ultimo.status).toBe(429);
  });

  it("DELETE comparte la protección", async () => {
    const res = await DELETE(req("https://atacante.test", "203.0.113.85"));
    expect(res.status).toBe(403);
  });
});
