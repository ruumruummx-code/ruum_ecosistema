import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockSignUp = vi.fn();

vi.mock("@ruum/api/supabase", () => ({
  // Síncrono como el real: la ruta no lo espera con await.
  crearClienteServidor: vi.fn(() => ({ auth: { signUp: mockSignUp } })),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ getAll: () => [], set: vi.fn() })),
}));

import { POST } from "./route";

process.env.NEXT_PUBLIC_SUPABASE_URL ??= "http://localhost:54321";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "anon-test";

function req(correo: string): NextRequest {
  return new NextRequest("http://localhost/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({
      nombre: "Ana",
      apellido: "López",
      telefono: "5512345678",
      email: correo,
      password: "Segura123",
      tipoCuenta: "personal",
      aceptaTerminos: true,
    }),
    headers: { "content-type": "application/json" },
  });
}

/**
 * Anti-enumeración sin falsos positivos: el "uso" a secas clasificaba como
 * duplicado cualquier mensaje con esa subcadena.
 */
describe("POST /api/auth/signup — clasificación de duplicados", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("422 User already registered → mensaje neutro de duplicado", async () => {
    mockSignUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { status: 422, message: "User already registered" },
    });
    const res = await POST(req("duplicada@ejemplo.com"));
    expect(res.status).toBe(400);
    const json = (await res.json()) as { error: string };
    expect(json.error).toMatch(/Si el correo corresponde/);
  });

  it("error con subcadena 'uso' NO se clasifica como duplicado", async () => {
    mockSignUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { status: 500, message: "Error en el uso del servicio" },
    });
    const res = await POST(req("otra@ejemplo.com"));
    expect(res.status).toBe(400);
    const json = (await res.json()) as { error: string };
    expect(json.error).toBe("No pudimos crear la cuenta. Intenta de nuevo.");
  });

  it("error genérico sin 422 ni frase de duplicado → mensaje genérico", async () => {
    mockSignUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { status: 500, message: "Database error saving new user" },
    });
    const res = await POST(req("tercera@ejemplo.com"));
    const json = (await res.json()) as { error: string };
    expect(json.error).toBe("No pudimos crear la cuenta. Intenta de nuevo.");
  });
});
