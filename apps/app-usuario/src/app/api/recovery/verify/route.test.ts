import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

function cookiesVacio() {
  return { get: vi.fn(() => undefined) };
}

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => cookiesVacio()),
}));

vi.mock("@/lib/supabase-server", () => ({
  crearClienteServidor: vi.fn(async () => ({
    auth: { getUser: vi.fn(async () => ({ data: { user: null }, error: { message: "sin sesion" } })) },
  })),
}));

import { GET } from "./route";
import { cookies } from "next/headers";
import { crearClienteServidor } from "@/lib/supabase-server";

/** A5+M8: respuesta mínima + rate limit. Sin fuga de motivos ni de errores. */
describe("GET /api/recovery/verify", () => {
  it("sin cookie responde authorized:false sin reason ni error", async () => {
    const res = await GET(new NextRequest("http://localhost/api/recovery/verify"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ authorized: false });
  });

  it("sin sesión responde authorized:false genérico", async () => {
    vi.mocked(cookies).mockResolvedValueOnce({
      get: vi.fn(() => ({ value: "11111111-1111-4111-8111-111111111111" })),
    } as unknown as Awaited<ReturnType<typeof cookies>>);
    const res = await GET(new NextRequest("http://localhost/api/recovery/verify"));
    expect(await res.json()).toEqual({ authorized: false });
  });

  it("autoriza cuando cookie y sesión coinciden, sin exponer userId", async () => {
    const uuid = "11111111-1111-4111-8111-111111111111";
    vi.mocked(cookies).mockResolvedValueOnce({
      get: vi.fn(() => ({ value: uuid })),
    } as unknown as Awaited<ReturnType<typeof cookies>>);
    vi.mocked(crearClienteServidor).mockResolvedValueOnce({
      auth: { getUser: vi.fn(async () => ({ data: { user: { id: uuid } }, error: null })) },
    } as unknown as Awaited<ReturnType<typeof crearClienteServidor>>);
    const res = await GET(new NextRequest("http://localhost/api/recovery/verify"));
    expect(await res.json()).toEqual({ authorized: true });
  });

  it("limita por IP tras 30 lecturas en la hora", async () => {
    const ip = "203.0.113.77";
    const req = () =>
      new NextRequest("http://localhost/api/recovery/verify", {
        headers: { "x-real-ip": ip },
      });
    let ultimo = await GET(req());
    for (let i = 0; i < 30; i += 1) ultimo = await GET(req());
    expect(ultimo.status).toBe(429);
    expect(await ultimo.json()).toEqual({ authorized: false });
  });
});
