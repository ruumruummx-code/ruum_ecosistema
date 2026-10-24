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
import { generarTokenTelefono } from "@/lib/phone-verification";

process.env.NEXT_PUBLIC_SUPABASE_URL ??= "http://localhost:54321";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "anon-test";

function req(correo: string, tokenTelefono = generarTokenTelefono("5512345678"), tipoCuenta: unknown = "personal"): NextRequest {
  return new NextRequest("http://localhost/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({
      nombre: "Ana",
      apellido: "López",
      telefono: "5512345678",
      email: correo,
      password: "Segura123",
      tipoCuenta,
      aceptaTerminos: true,
      tokenVerificacionTelefono: tokenTelefono,
    }),
    headers: { "content-type": "application/json" },
  });
}

/**
 * Anti-enumeración sin falsos positivos: el "uso" a secas clasificaba como
 * duplicado cualquier mensaje con esa subcadena.
 */
describe("POST /api/auth/signup — validaciones y duplicados", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("PHONE_VERIFICATION_SUSPENDED", "false");
  });

  it.each(["empresa", null, "personal"])("crea únicamente perfil personal aunque el cliente envíe %s", async (tipoCuenta) => {
    mockSignUp.mockResolvedValue({ data: { user: { id: "individual" }, session: null }, error: null });
    const res = await POST(req(`individual-${String(tipoCuenta)}@ejemplo.com`, generarTokenTelefono("5512345678"), tipoCuenta));
    expect(res.status).toBe(200);
    expect(mockSignUp).toHaveBeenCalledWith(expect.objectContaining({ options: expect.objectContaining({ data: expect.objectContaining({ tipo_registro: "usuario", tipo_cuenta: "personal" }) }) }));
  });

  it("rechaza registro sin token de verificación telefónica válido", async () => {
    const res = await POST(req("nuevo@ejemplo.com", "token-invalido"));
    expect(res.status).toBe(400);
    const json = (await res.json()) as { error: string };
    expect(json.error).toMatch(/token/i);
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("422 User already registered → mensaje neutro de duplicado", async () => {
    mockSignUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { status: 422, message: "User already registered" },
    });
    const res = await POST(req("duplicada@ejemplo.com"));
    expect(res.status).toBe(400);
    const json = (await res.json()) as { error: string };
    expect(json.error).toMatch(/inicia sesión o recupera tu contraseña/);
  });

  it("no envía a confirmar correo cuando Auth devuelve un registro repetido sin identidades", async () => {
    mockSignUp.mockResolvedValue({
      data: { user: { id: "usuario-oculto", identities: [] }, session: null }, error: null,
    });
    const res = await POST(req("repetida@ejemplo.com"));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/inicia sesión o recupera tu contraseña/);
    expect(json.requiereConfirmacion).toBeUndefined();
  });

  it("mantiene la confirmación para una cuenta nueva con identidad de correo", async () => {
    mockSignUp.mockResolvedValue({
      data: { user: { id: "nueva", identities: [{ provider: "email" }] }, session: null }, error: null,
    });
    const res = await POST(req("nueva-identidad@ejemplo.com"));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, requiereConfirmacion: true });
  });

  it("no confunde un 422 de correo no autorizado con cuenta duplicada", async () => {
    mockSignUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { status: 422, code: "email_address_not_authorized", message: "Email address not authorized" },
    });
    const res = await POST(req("no-autorizada@ejemplo.com"));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("No pudimos crear la cuenta. Intenta de nuevo.");
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

describe("POST /api/auth/signup — bypass OTP solo-dev", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("PHONE_VERIFICATION_SUSPENDED", "false");
  });

  it("con PHONE_VERIFY_BYPASS=true acepta sin token y marca telefono_verificado:false", async () => {
    vi.stubEnv("PHONE_VERIFY_BYPASS", "true");
    try {
      mockSignUp.mockResolvedValue({
        data: { user: { id: "u1" }, session: null },
        error: null,
      });
      const res = await POST(req("bypass@ejemplo.com", "token-invalido"));
      expect(res.status).toBe(200);
      expect(mockSignUp).toHaveBeenCalled();
      const llamada = mockSignUp.mock.calls[0]?.[0] as {
        options?: { data?: { telefono_verificado?: boolean } };
      };
      expect(llamada.options?.data?.telefono_verificado).toBe(false);
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("el bypass NO aplica en producción aunque la variable esté en true", async () => {
    vi.stubEnv("PHONE_VERIFY_BYPASS", "true");
    vi.stubEnv("NODE_ENV", "production");
    try {
      const res = await POST(req("bypass-prod@ejemplo.com", "token-invalido"));
      expect(res.status).toBe(400);
      expect(mockSignUp).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllEnvs();
    }
  });
});


describe("suspensión temporal de SMS en producción", () => {
  it("acepta sin token y conserva el teléfono sin verificar", async () => {
    vi.clearAllMocks();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("PHONE_VERIFICATION_SUSPENDED", "true");
    try {
      mockSignUp.mockResolvedValue({data:{user:{id:"prod-suspendido"},session:null},error:null});
      const res = await POST(req("suspendido@ejemplo.com", ""));
      expect(res.status).toBe(200);
      expect(mockSignUp.mock.calls[0][0].options.data).toMatchObject({telefono_verificado:false,telefono_verificado_en:null});
      vi.stubEnv("PHONE_VERIFICATION_SUSPENDED", "false");
      mockSignUp.mockClear();
      const reactivado = await POST(req("reactivado@ejemplo.com", ""));
      expect(reactivado.status).toBe(400);
      expect(mockSignUp).not.toHaveBeenCalled();
    } finally { vi.unstubAllEnvs(); }
  });
});
