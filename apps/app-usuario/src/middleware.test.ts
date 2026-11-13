import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { esRutaProtegidaUsuario, middleware } from "./middleware";

const estado = vi.hoisted(() => ({ renovar: false }));

vi.mock("@ruum/api/supabase", () => ({
  crearClienteServidor: (_url: string, _clave: string, cookies: {
    setAll: (valores: { name: string; value: string; options: { path: string } }[]) => void;
  }) => ({
    auth: {
      getUser: async () => {
        if (estado.renovar) {
          cookies.setAll([{ name: "sesion", value: "renovada", options: { path: "/" } }]);
        }
        return { data: { user: null } };
      },
    },
  }),
}));

afterEach(() => {
  vi.unstubAllEnvs();
  estado.renovar = false;
});

describe("Middleware de App Usuario", () => {
  it("protege /inicio y mantiene /soporte accesible sin sesión", () => {
    expect(esRutaProtegidaUsuario("/inicio")).toBe(true);
    expect(esRutaProtegidaUsuario("/inicio/cualquier-seccion")).toBe(true);
    expect(esRutaProtegidaUsuario("/soporte")).toBe(false);
    expect(esRutaProtegidaUsuario("/soporte/faq")).toBe(false);
    expect(esRutaProtegidaUsuario("/cuenta")).toBe(true);
  });

  it.each([false, true])("envía a Next la CSP canónica con renovación=%s", async (renovar) => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://proyecto.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "clave-publica-prueba");
    estado.renovar = renovar;
    const request = new NextRequest("https://usuario.example.test/login", {
      headers: {
        "x-nonce": "externo",
        "content-security-policy": "script-src 'nonce-externo'",
        "content-security-policy-report-only": "script-src 'nonce-externo'",
        cookie: "sesion=original",
      },
    });
    const response = await middleware(request);
    const nonce = response.headers.get("x-nonce");
    const csp = response.headers.get("content-security-policy");
    expect(nonce).toBeTruthy();
    expect(csp).toContain(`'nonce-${nonce}' 'strict-dynamic'`);
    expect(csp).not.toContain("externo");
    expect(response.headers.get("x-middleware-request-content-security-policy")).toBe(csp);
    expect(response.headers.get("x-middleware-request-content-security-policy-report-only")).toBeNull();
    expect(response.headers.get("x-middleware-request-x-nonce")).toBe(nonce);
    expect(response.headers.get("x-middleware-request-cookie")).toContain(
      renovar ? "sesion=renovada" : "sesion=original",
    );
    if (renovar) expect(response.cookies.get("sesion")?.value).toBe("renovada");
  });
});
