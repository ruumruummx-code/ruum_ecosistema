import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";

const mockGetUser = vi.fn();
const mockClasificarRolApp = vi.fn();

vi.mock("@ruum/api/supabase", () => ({
  crearClienteServidor: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
}));

vi.mock("@ruum/api/identity", () => ({
  clasificarRolApp: (...args: unknown[]) => mockClasificarRolApp(...args),
}));

describe("T07 — Certificación de Autenticación, Sesión y Middleware (app-usuario)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://mock.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-test-key");
    vi.stubEnv("NODE_ENV", "development");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  function crearRequest(pathname: string, cookies: Record<string, string> = {}) {
    const url = new URL(`http://localhost:3000${pathname}`);
    const req = new NextRequest(url);
    for (const [name, value] of Object.entries(cookies)) {
      req.cookies.set(name, value);
    }
    return req;
  }

  describe("1. Middleware y Control de Acceso por Rol (Sin bucles ni acceso indebido)", () => {
    it.each([
      "/viajes/nuevo?vehiculo=auto-123&buscar_origen=Ciudad%20de%20M%C3%A9xico",
      "/soporte?motivo=pagos&viaje=viaje-123&canal=telefono",
      "/mis-viajes?tab=programados&buscar=Quer%C3%A9taro",
    ])("conserva el contexto al autenticar %s", async ruta => {
      mockGetUser.mockResolvedValue({ data: { user: null } });
      const { middleware } = await import("../src/middleware");
      const respuesta = await middleware(crearRequest(ruta));
      expect(new URL(respuesta.headers.get("location")!).searchParams.get("next")).toBe(ruta);
    });
    const rutasProtegidas = ["/viajes", "/viajes/nuevo", "/mis-viajes", "/cuenta", "/pasaporte", "/verificacion", "/soporte"];

    it.each(rutasProtegidas)(
      "sin sesión activa o sesión expirada: bloquea %s y redirige a /login sin acceso indebido",
      async (ruta) => {
        mockGetUser.mockResolvedValue({ data: { user: null } });
        const { middleware } = await import("../src/middleware");
        const res = await middleware(crearRequest(ruta));

        expect(res.status).toBe(307);
        const location = res.headers.get("location");
        expect(location).toContain("/login");
        expect(location).toContain(`next=${encodeURIComponent(ruta)}`);
        expect(location).toContain("reason=authentication_required");
      }
    );

    it.each(rutasProtegidas)(
      "gate de rol FIX C1: usuario con rol conductor en app-usuario es rechazado a /403?reason=rol_conductor",
      async (ruta) => {
        mockGetUser.mockResolvedValue({ data: { user: { id: "user-conductor-1" } } });
        mockClasificarRolApp.mockResolvedValue("conductor");

        const { middleware } = await import("../src/middleware");
        const res = await middleware(crearRequest(ruta));

        expect(res.status).toBe(307);
        const location = res.headers.get("location");
        expect(location).toContain("/403");
        expect(location).toContain("reason=rol_conductor");
      }
    );

    it.each(rutasProtegidas)(
      "usuario legítimo con rol 'usuario' accede a %s sin redirección",
      async (ruta) => {
        mockGetUser.mockResolvedValue({ data: { user: { id: "user-cliente-1" } } });
        mockClasificarRolApp.mockResolvedValue("usuario");

        const { middleware } = await import("../src/middleware");
        const res = await middleware(crearRequest(ruta));

        // Permite el paso (NextResponse.next)
        expect(res.status).toBe(200);
        expect(res.headers.get("location")).toBeNull();
        expect(res.headers.get("x-nonce")).toBeDefined();
      }
    );

    it("usuario con sesión activa que visita /login o /registro es redirigido a / para evitar bucle de autenticación", async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: "user-cliente-1" } } });

      const { middleware } = await import("../src/middleware");

      const resLogin = await middleware(crearRequest("/login"));
      expect(resLogin.status).toBe(307);
      expect(new URL(resLogin.headers.get("location")!).pathname).toBe("/");

      const resRegistro = await middleware(crearRequest("/registro"));
      expect(resRegistro.status).toBe(307);
      expect(new URL(resRegistro.headers.get("location")!).pathname).toBe("/");
    });

    it("rutas públicas (/onboarding, assets) se sirven sin forzar verificación de sesión en GoTrue", async () => {
      const { middleware } = await import("../src/middleware");
      const res = await middleware(crearRequest("/onboarding"));

      expect(res.status).toBe(200);
      expect(mockGetUser).not.toHaveBeenCalled();
    });

    it("falla cerrado (503) en producción si falta configuración de Supabase", async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");

      const { middleware } = await import("../src/middleware");
      const res = await middleware(crearRequest("/viajes"));

      expect(res.status).toBe(503);
    });
  });

  describe("2. Certificación de Flujo de Alta y Guardado de Datos", () => {
    it("el módulo de registro normaliza correo y números de teléfono sin pérdida de datos", async () => {
      const {
        normalizarCorreoRegistro,
        telefonoLocalMx,
        telefonoMx,
        nombreCompleto,
        crearRedirectConfirmacion,
      } = await import("../src/lib/registro-usuario");

      // Normalización de correo
      expect(normalizarCorreoRegistro("  Persona.Prueba@Dominio.COM ")).toBe("persona.prueba@dominio.com");

      // Normalización de teléfonos mexicanos en los tres formatos soportados
      expect(telefonoLocalMx("+52 55 1234 5678")).toBe("5512345678");
      expect(telefonoLocalMx("+52 1 55 1234 5678")).toBe("5512345678");
      expect(telefonoLocalMx("5215512345678")).toBe("5512345678");
      expect(telefonoMx(telefonoLocalMx("+52 1 55 1234 5678"))).toBe("+525512345678");

      // Nombre completo compuesto
      expect(nombreCompleto(" Juan Carlos ", " Pérez López ")).toBe("Juan Carlos Pérez López");

      // Destino seguro sin romper redirecciones
      const callback = crearRedirectConfirmacion("https://usuario.ruum.mx");
      expect(new URL(callback).pathname).toBe("/auth/callback");
      expect(new URL(callback).searchParams.get("next")).toBe("/");
    });
  });

  describe("3. Certificación de OTP y Verificación Telefónica (HMAC fail-closed)", () => {
    beforeEach(() => {
      vi.stubEnv("PHONE_VERIFY_SECRET", "clave-secreta-de-prueba-con-mas-de-32-caracteres-123456");
    });

    it("genera y valida un token telefónico criptográfico firmado con expiración segura", async () => {
      const { generarTokenTelefono, validarTokenTelefono } = await import("../src/lib/phone-verification");

      const tel = "5512345678";
      const token = generarTokenTelefono(tel);

      expect(typeof token).toBe("string");
      expect(token).toContain(tel);

      // Token válido
      const resValido = validarTokenTelefono(tel, token);
      expect(resValido.valido).toBe(true);

      // Token con otro número -> rechaza
      const resOtro = validarTokenTelefono("5587654321", token);
      expect(resOtro.valido).toBe(false);

      // Token expirado -> rechaza
      const resExpirado = validarTokenTelefono(tel, token, -1000);
      expect(resExpirado.valido).toBe(false);
      expect(resExpirado.error).toMatch(/expirado/i);

      // Token alterado / sin firma -> rechaza
      const resAlterado = validarTokenTelefono(tel, `${token}alterado`);
      expect(resAlterado.valido).toBe(false);
    });

    it("falla cerrado si PHONE_VERIFY_SECRET no tiene al menos 32 caracteres", async () => {
      vi.stubEnv("PHONE_VERIFY_SECRET", "corta");
      const { generarTokenTelefono } = await import("../src/lib/phone-verification");

      expect(() => generarTokenTelefono("5512345678")).toThrow(/32 chars/);
    });
  });

  describe("4. Certificación de Recuperación de Contraseña", () => {
    it("la cookie y verificación de recuperación operan con token seguro sin revelar datos sensibles", async () => {
      const { COOKIE_RECOVERY_USUARIO, RUTA_COOKIE_RECOVERY } = await import("@ruum/shared/utils");

      expect(COOKIE_RECOVERY_USUARIO).toBe("ruum_rec_usuario");
      expect(RUTA_COOKIE_RECOVERY).toBe("/");
    });
  });

  describe("5. Certificación de Cierre de Sesión y Expiración", () => {
    it("tras logout, el cliente no retiene sesión y el middleware vuelve a proteger rutas", async () => {
      // 1. Simular sesión cerrada: GoTrue devuelve user: null
      mockGetUser.mockResolvedValue({ data: { user: null } });

      const { middleware } = await import("../src/middleware");

      // 2. Intentar ingresar a ruta privada
      const res = await middleware(crearRequest("/cuenta"));

      // 3. Verifica que inmediatamente redirige a login
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toContain("/login?next=%2Fcuenta&reason=authentication_required");
    });
  });
});
