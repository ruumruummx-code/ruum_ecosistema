/** @vitest-environment jsdom */
import React from "react";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const entorno = vi.hoisted(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key-mock-integracion";
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test_mock_integracion";
  process.env.PHONE_VERIFY_SECRET =
    "secreto-hmac-mock-integracion-minimo-32-caracteres-2026";
  process.env.MAPBOX_SECRET_TOKEN = "mock-mapbox-token-integracion";
  delete process.env.PHONE_VERIFY_BYPASS;
  delete process.env.NEXT_PUBLIC_PHONE_VERIFY_BYPASS;
  process.env.PHONE_VERIFICATION_SUSPENDED = "false";
  process.env.NEXT_PUBLIC_PHONE_VERIFICATION_SUSPENDED = "false";
  delete process.env.TWILIO_ACCOUNT_SID;
  delete process.env.TWILIO_AUTH_TOKEN;
  delete process.env.TWILIO_VERIFY_SERVICE_SID;

  return {
    routerPush: vi.fn(),
    routerRefresh: vi.fn(),
    signUpServerMock: vi.fn(),
    getUserServerMock: vi.fn(),
    signInWithPasswordBrowserMock: vi.fn(),
    getSessionBrowserMock: vi.fn(),
    clasificarRolAppMock: vi.fn(),
    obtenerRutaMapboxMock: vi.fn(),
    aceptarCotizacionUsuarioMock: vi.fn(),
    obtenerUsuarioActualMock: vi.fn(),
    listarVehiculosDeUsuarioMock: vi.fn(),
    stripeConfirmPaymentMock: vi.fn(),
    stripeLoadMock: vi.fn(),
    redisStore: new Map<string, unknown>(),
    usarRedisMock: false,
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: entorno.routerPush,
    refresh: entorno.routerRefresh,
  }),
  usePathname: () => "/registro",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    getAll: () => [],
    set: vi.fn(),
  })),
}));

vi.mock("@ruum/api/supabase", () => ({
  crearClienteServidor: vi.fn(() => ({
    auth: {
      signUp: (...args: unknown[]) => entorno.signUpServerMock(...args),
      getUser: (...args: unknown[]) => entorno.getUserServerMock(...args),
    },
  })),
}));

vi.mock("@/lib/supabase-server", () => ({
  crearClienteServidor: vi.fn(async () => ({
    auth: {
      getUser: (...args: unknown[]) => entorno.getUserServerMock(...args),
    },
  })),
}));

vi.mock("@/lib/supabase-browser", () => ({
  tieneSupabaseConfigurado: () => true,
  crearClienteNavegador: vi.fn(() => ({
    auth: {
      signInWithPassword: (...args: unknown[]) =>
        entorno.signInWithPasswordBrowserMock(...args),
      getSession: (...args: unknown[]) =>
        entorno.getSessionBrowserMock(...args),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  })),
}));

vi.mock("@ruum/api/identity", () => ({
  clasificarRolApp: (...args: unknown[]) =>
    entorno.clasificarRolAppMock(...args),
}));

vi.mock("@ruum/shared/utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@ruum/shared/utils")>();
  return {
    ...actual,
    obtenerRutaDirectionsMapboxConParadas: (...args: unknown[]) =>
      entorno.obtenerRutaMapboxMock(...args),
  };
});

vi.mock("@ruum/api/services", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@ruum/api/services")>();
  return {
    ...actual,
    aceptarCotizacionUsuario: (...args: unknown[]) =>
      entorno.aceptarCotizacionUsuarioMock(...args),
    obtenerUsuarioActual: (...args: unknown[]) =>
      entorno.obtenerUsuarioActualMock(...args),
    listarVehiculosDeUsuario: (...args: unknown[]) =>
      entorno.listarVehiculosDeUsuarioMock(...args),
  };
});

vi.mock("@stripe/react-stripe-js", () => ({
  Elements: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="stripe-elements-provider">{children}</div>
  ),
  PaymentElement: ({ onReady }: { onReady?: () => void }) => {
    React.useEffect(() => {
      onReady?.();
    }, [onReady]);
    return <div data-testid="stripe-payment-element" />;
  },
  useStripe: () => ({
    confirmPayment: (...args: unknown[]) =>
      entorno.stripeConfirmPaymentMock(...args),
  }),
  useElements: () => ({}),
}));

vi.mock("@stripe/stripe-js", () => ({
  loadStripe: (...args: unknown[]) => entorno.stripeLoadMock(...args),
}));

import { __clearCspRateLimitForTest } from "@/lib/csp-rate-limit";
import { CLAVE_CORREO_CONFIRMACION } from "@/lib/registro-usuario";
import { generarTokenTelefono } from "@/lib/phone-verification";
import { POST as postPhoneSend } from "@/app/api/auth/phone-verify/send/route";
import { POST as postPhoneVerify } from "@/app/api/auth/phone-verify/verify/route";
import { POST as postSignup } from "@/app/api/auth/signup/route";
import { POST as postRuta } from "@/app/api/ruta/route";
import { POST as postViajes } from "@/app/api/viajes/route";
import { middleware } from "@/middleware";
import PaginaRegistro from "@/app/registro/page";
import PaginaLogin from "@/app/login/page";
import { VALORES_INICIALES } from "@/app/viajes/nuevo/constants";
import {
  codigoPostalCompleto,
  generarTarifaSnapshot,
  haCambiadoTarifa,
} from "@/app/viajes/nuevo/tarifa-gate";
import { PasoTarifa } from "@/app/viajes/nuevo/components/PasoTarifa";
import { PasoPago } from "@/app/viajes/nuevo/components/PasoPago";
import { AceptarCotizacion } from "@/app/viajes/[id]/AceptarCotizacion";
import { PagoTraslado } from "@/app/viajes/[id]/PagoTraslado";
import { PagoRecuperable } from "@/app/viajes/[id]/PagoRecuperable";
import { resumirPagoPasaporte } from "@/app/viajes/[id]/resumen-pago";
import {
  AppStateProvider,
  useTrasladoRealtime,
} from "@/state/AppStateProvider";

function crearFetchEnProceso(
  manejadorPaymentIntent?: (cuerpo: {
    traslado_id?: string;
  }) => { status?: number; body: Record<string, unknown> },
) {
  return vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const urlStr =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    const urlAbsoluta = urlStr.startsWith("http")
      ? urlStr
      : `http://localhost:3000${urlStr}`;

    const req = new NextRequest(urlAbsoluta, {
      method: init?.method ?? "POST",
      headers: {
        "content-type": "application/json",
        "x-real-ip": "198.51.100.42",
        ...(init?.headers as Record<string, string> | undefined),
      },
      body: typeof init?.body === "string" ? init.body : undefined,
    });

    if (urlAbsoluta.endsWith("/api/auth/phone-verify/send")) {
      return await postPhoneSend(req);
    }
    if (urlAbsoluta.endsWith("/api/auth/phone-verify/verify")) {
      return await postPhoneVerify(req);
    }
    if (urlAbsoluta.endsWith("/api/auth/signup")) {
      return await postSignup(req);
    }
    if (urlAbsoluta.endsWith("/api/ruta")) {
      return await postRuta(req);
    }
    if (urlAbsoluta.endsWith("/api/viajes")) {
      return await postViajes(req);
    }
    if (urlAbsoluta.endsWith("/functions/v1/crear-payment-intent")) {
      const payload = init?.body
        ? (JSON.parse(String(init.body)) as { traslado_id?: string })
        : {};
      const respuesta = manejadorPaymentIntent
        ? manejadorPaymentIntent(payload)
        : {
            status: 200,
            body: { clientSecret: `cs_live_${payload.traslado_id ?? "1"}` },
          };
      return new Response(JSON.stringify(respuesta.body), {
        status: respuesta.status ?? 200,
        headers: { "content-type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Ruta no encontrada" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  });
}

describe("Integración de flujos críticos en @ruum/app-usuario (signup, login, cotización, pago)", () => {
  beforeEach(() => {
    __clearCspRateLimitForTest();
    entorno.routerPush.mockReset();
    entorno.routerRefresh.mockReset();
    entorno.signUpServerMock.mockReset();
    entorno.getUserServerMock.mockReset();
    entorno.signInWithPasswordBrowserMock.mockReset();
    entorno.getSessionBrowserMock.mockReset();
    entorno.clasificarRolAppMock.mockReset();
    entorno.obtenerRutaMapboxMock.mockReset();
    entorno.aceptarCotizacionUsuarioMock.mockReset();
    entorno.obtenerUsuarioActualMock.mockReset();
    entorno.listarVehiculosDeUsuarioMock.mockReset();
    entorno.stripeConfirmPaymentMock.mockReset();
    entorno.stripeLoadMock.mockReset();
    entorno.redisStore.clear();
    entorno.usarRedisMock = false;

    entorno.signUpServerMock.mockResolvedValue({
      data: { user: { id: "usr-nuevo-001" }, session: null },
      error: null,
    });
    entorno.getUserServerMock.mockResolvedValue({
      data: { user: { id: "auth-uid-001", email: "cliente@ruum.mx" } },
      error: null,
    });
    entorno.signInWithPasswordBrowserMock.mockResolvedValue({
      data: {
        user: { id: "auth-uid-001", email: "cliente@ruum.mx" },
        session: { access_token: "jwt-sesion-activa" },
      },
      error: null,
    });
    entorno.getSessionBrowserMock.mockResolvedValue({
      data: { session: { access_token: "jwt-sesion-activa" } },
      error: null,
    });
    entorno.clasificarRolAppMock.mockResolvedValue("usuario");
    entorno.obtenerRutaMapboxMock.mockResolvedValue({
      distanciaKm: 18.4,
      tiempoHoras: 0.65,
    });
    entorno.aceptarCotizacionUsuarioMock.mockResolvedValue(undefined);
    entorno.obtenerUsuarioActualMock.mockResolvedValue({
      id: "perfil-interno-001",
    });
    entorno.listarVehiculosDeUsuarioMock.mockResolvedValue([
      { id: "11111111-1111-4111-8111-111111111111" },
    ]);
    entorno.stripeLoadMock.mockResolvedValue({ fakeStripe: true });
    entorno.stripeConfirmPaymentMock.mockResolvedValue({
      paymentIntent: { status: "succeeded" },
    });

    HTMLDialogElement.prototype.showModal = function () {
      this.setAttribute("open", "");
    };
    HTMLDialogElement.prototype.close = function () {
      this.removeAttribute("open");
    };
    HTMLElement.prototype.scrollIntoView = vi.fn();

    window.sessionStorage.clear();
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  describe("1. Flujo de integración de Signup (UI + OTP SMS + HMAC + Route Handlers)", () => {
    it("completa el alta de principio a fin: envía OTP, firma token HMAC real en verify, valida en signup y redirige a confirmación de correo", async () => {
      const fetchEnProceso = crearFetchEnProceso();
      vi.stubGlobal("fetch", fetchEnProceso);
      const user = userEvent.setup({ delay: null });

      render(<PaginaRegistro />);

      // Paso 1: Datos básicos
      await user.type(screen.getByLabelText(/^nombre$/i), "Valeria");
      await user.type(screen.getByLabelText(/^apellido$/i), "Castillo");
      await user.type(screen.getByLabelText(/teléfono celular/i), "5512345678");
      await user.click(screen.getByRole("button", { name: /continuar/i }));

      // Modal OTP se abre tras invocar POST /api/auth/phone-verify/send real
      const inputOtp = await screen.findByLabelText(
        /código de verificación sms/i,
      );
      await user.type(inputOtp, "123456");
      await user.click(
        screen.getByRole("button", { name: /verificar y continuar/i }),
      );

      // Paso 2: Credenciales tras recibir el token HMAC real firmado por POST /api/auth/phone-verify/verify
      const inputCorreo = await screen.findByLabelText(/correo electrónico/i);
      await user.type(inputCorreo, "  Valeria.Castillo@Ejemplo.com ");
      await user.type(screen.getByLabelText(/^contraseña$/i), "Segura2026A");
      await user.type(
        screen.getByLabelText(/confirmar contraseña/i),
        "Segura2026A",
      );
      await user.click(screen.getByRole("checkbox"));
      await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

      await waitFor(() => {
        expect(entorno.routerPush).toHaveBeenCalledWith(
          "/registro/confirma-correo",
        );
      });

      expect(entorno.signUpServerMock).toHaveBeenCalledTimes(1);
      expect(entorno.signUpServerMock).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "valeria.castillo@ejemplo.com",
          password: "Segura2026A",
          options: expect.objectContaining({
            data: expect.objectContaining({
              tipo_registro: "usuario",
              nombre: "Valeria Castillo",
              telefono: "+525512345678",
              telefono_verificado: true,
              tipo_cuenta: "personal",
            }),
          }),
        }),
      );

      expect(window.sessionStorage.getItem(CLAVE_CORREO_CONFIRMACION)).toBe(
        "valeria.castillo@ejemplo.com",
      );
    });

    it("rechaza código OTP inválido en el handler real y permite reintentar con el código correcto sin perder el progreso", async () => {
      vi.stubGlobal("fetch", crearFetchEnProceso());
      const user = userEvent.setup({ delay: null });

      render(<PaginaRegistro />);

      await user.type(screen.getByLabelText(/^nombre$/i), "Jorge");
      await user.type(screen.getByLabelText(/^apellido$/i), "Luna");
      await user.type(screen.getByLabelText(/teléfono celular/i), "5587654321");
      await user.click(screen.getByRole("button", { name: /continuar/i }));

      const inputOtp = await screen.findByLabelText(
        /código de verificación sms/i,
      );
      await user.type(inputOtp, "999999");
      await user.click(
        screen.getByRole("button", { name: /verificar y continuar/i }),
      );

      expect(
        await screen.findByText(/el código ingresado es incorrecto/i),
      ).toBeInTheDocument();

      // Corrige el código en el mismo modal y avanza al paso 2
      await user.clear(inputOtp);
      await user.type(inputOtp, "123456");
      await user.click(
        screen.getByRole("button", { name: /verificar y continuar/i }),
      );

      expect(
        await screen.findByLabelText(/correo electrónico/i),
      ).toBeInTheDocument();
    });

    it("bloquea en POST /api/auth/signup un token HMAC firmado para otro teléfono o alterado y protege contra enumeración de correos", async () => {
      const tokenDeOtroNumero = generarTokenTelefono("5511112222");

      const reqTokenAjeno = new NextRequest(
        "http://localhost:3000/api/auth/signup",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-real-ip": "198.51.100.50",
          },
          body: JSON.stringify({
            nombre: "Intruso",
            apellido: "Test",
            telefono: "5599998888",
            email: "intruso@ejemplo.com",
            password: "Password123",
            aceptaTerminos: true,
            tokenVerificacionTelefono: tokenDeOtroNumero,
          }),
        },
      );

      const resTokenAjeno = await postSignup(reqTokenAjeno);
      const bodyTokenAjeno = (await resTokenAjeno.json()) as { error?: string };
      expect(resTokenAjeno.status).toBe(400);
      expect(bodyTokenAjeno.error).toMatch(
        /no corresponde al teléfono proporcionado/i,
      );
      expect(entorno.signUpServerMock).not.toHaveBeenCalled();

      // Anti-enumeración cuando el correo ya está registrado (422 en Supabase Auth)
      entorno.signUpServerMock.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { status: 422, message: "User already registered" },
      });

      const tokenValido = generarTokenTelefono("5599998888");
      const reqDuplicado = new NextRequest(
        "http://localhost:3000/api/auth/signup",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-real-ip": "198.51.100.50",
          },
          body: JSON.stringify({
            nombre: "Usuario",
            apellido: "Existente",
            telefono: "5599998888",
            email: "existente@ejemplo.com",
            password: "Password123",
            aceptaTerminos: true,
            tokenVerificacionTelefono: tokenValido,
          }),
        },
      );

      const resDuplicado = await postSignup(reqDuplicado);
      const bodyDuplicado = (await resDuplicado.json()) as { error?: string };
      expect(resDuplicado.status).toBe(400);
      expect(bodyDuplicado.error).toBe(
        "No pudimos completar el registro. Si ya tienes una cuenta, inicia sesión o recupera tu contraseña.",
      );
    });
  });

  describe("2. Flujo de integración de Login (Middleware + PaginaLogin + LoginCliente + sanitización de redirección)", () => {
    it("redirige petición anónima desde el middleware a /login con next y reason, autentica con credenciales normalizadas y navega al destino protegido", async () => {
      entorno.getUserServerMock.mockResolvedValueOnce({
        data: { user: null },
        error: null,
      });

      const reqAnonima = new NextRequest(
        "http://localhost:3000/viajes/nuevo",
      );
      const resMiddleware = await middleware(reqAnonima);
      expect(resMiddleware.status).toBe(307);

      const location = new URL(resMiddleware.headers.get("location")!);
      expect(location.pathname).toBe("/login");
      expect(location.searchParams.get("next")).toBe("/viajes/nuevo");
      expect(location.searchParams.get("reason")).toBe(
        "authentication_required",
      );

      // Renderizar la página de login con los searchParams generados por el middleware
      const elementoPagina = await PaginaLogin({
        searchParams: Promise.resolve({
          next: location.searchParams.get("next") ?? undefined,
          reason: location.searchParams.get("reason") ?? undefined,
        }),
      });
      render(elementoPagina);

      expect(
        screen.getByText(/inicia sesión para solicitar un traslado/i),
      ).toBeInTheDocument();

      const user = userEvent.setup({ delay: null });
      await user.type(
        screen.getByLabelText(/correo electrónico/i),
        "  CLIENTE@RUUM.MX ",
      );
      await user.type(
        screen.getByLabelText(/^contraseña$/i),
        "MiClaveSegura123",
      );
      await user.click(
        screen.getByRole("button", { name: /iniciar sesión/i }),
      );

      await waitFor(() => {
        expect(entorno.signInWithPasswordBrowserMock).toHaveBeenCalledWith({
          email: "cliente@ruum.mx",
          password: "MiClaveSegura123",
        });
      });

      expect(entorno.routerPush).toHaveBeenCalledWith("/viajes/nuevo");
      expect(entorno.routerRefresh).toHaveBeenCalledTimes(1);
    });

    it("bloquea intentos de Open Redirect en ?next= y traduce errores de credenciales o correo no confirmado", async () => {
      entorno.signInWithPasswordBrowserMock.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: new Error("Invalid login credentials"),
      });

      const elementoPagina = await PaginaLogin({
        searchParams: Promise.resolve({
          next: "//atacante.ejemplo.com/phishing",
          contrasena: "actualizada",
        }),
      });
      render(elementoPagina);

      expect(
        screen.getByText(/tu contraseña fue actualizada/i),
      ).toBeInTheDocument();

      const user = userEvent.setup({ delay: null });
      await user.type(
        screen.getByLabelText(/correo electrónico/i),
        "cliente@ruum.mx",
      );
      await user.type(screen.getByLabelText(/^contraseña$/i), "Incorrecta123");
      await user.click(
        screen.getByRole("button", { name: /iniciar sesión/i }),
      );

      expect(
        await screen.findByText(/correo o contraseña incorrectos/i),
      ).toBeInTheDocument();
      expect(entorno.routerPush).not.toHaveBeenCalled();

      // Reintento exitoso redirige a "/" en vez del dominio externo malicioso
      await user.clear(screen.getByLabelText(/^contraseña$/i));
      await user.type(screen.getByLabelText(/^contraseña$/i), "Correcta123");
      await user.click(
        screen.getByRole("button", { name: /iniciar sesión/i }),
      );

      await waitFor(() => {
        expect(entorno.routerPush).toHaveBeenCalledWith("/");
      });
    });

    it("redirige en middleware a /403 cuando un conductor intenta usar rutas de usuario y a / cuando un usuario autenticado visita /login", async () => {
      entorno.clasificarRolAppMock.mockResolvedValueOnce("conductor");

      const reqConductor = new NextRequest(
        "http://localhost:3000/mis-viajes",
      );
      const resConductor = await middleware(reqConductor);
      expect(resConductor.status).toBe(307);
      const urlConductor = new URL(resConductor.headers.get("location")!);
      expect(urlConductor.pathname).toBe("/403");
      expect(urlConductor.searchParams.get("reason")).toBe("rol_conductor");

      const reqYaAutenticado = new NextRequest("http://localhost:3000/login");
      const resYaAutenticado = await middleware(reqYaAutenticado);
      expect(resYaAutenticado.status).toBe(307);
      expect(new URL(resYaAutenticado.headers.get("location")!).pathname).toBe(
        "/",
      );
    });
  });

  describe("3. Flujo de integración de Cotización (POST /api/ruta + tarifa-gate + PasoTarifa + POST /api/viajes + AceptarCotizacion)", () => {
    it("calcula ruta real en POST /api/ruta, detecta cambios de snapshot en el gate de tarifa y muestra flujo de cotización especial cuando aplica", async () => {
      const fetchEnProceso = crearFetchEnProceso();
      vi.stubGlobal("fetch", fetchEnProceso);

      const resRuta = await fetch("/api/ruta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origen: { lat: 19.39068, lng: -99.16362 },
          destino: { lat: 19.42702, lng: -99.16766 },
          paradas: [{ lat: 19.405, lng: -99.165 }],
        }),
      });

      expect(resRuta.status).toBe(200);
      expect(resRuta.headers.get("x-cache")).toBe("MISS");
      const estimacion = (await resRuta.json()) as {
        distanciaKm: number;
        tiempoEstimadoHoras: number;
      };
      expect(estimacion).toEqual({
        distanciaKm: 18.4,
        tiempoEstimadoHoras: 0.65,
      });
      expect(entorno.obtenerRutaMapboxMock).toHaveBeenCalledTimes(1);

      // Verificar reglas de gate de tarifa y snapshot ante cambios de CP o condición
      const datosBase = {
        ...VALORES_INICIALES,
        origenCodigoPostal: "03100",
        origenCiudad: "Benito Juárez",
        origenEstado: "CDMX",
        destinoCodigoPostal: "06600",
        destinoCiudad: "Cuauhtémoc",
        destinoEstado: "CDMX",
        marca: "Toyota",
        modelo: "Corolla",
        condicion: "funciona_correctamente" as const,
      };
      expect(codigoPostalCompleto(datosBase.origenCodigoPostal)).toBe(true);
      expect(codigoPostalCompleto("031")).toBe(false);

      const snapshotInicial = generarTarifaSnapshot(datosBase);
      expect(haCambiadoTarifa(snapshotInicial, datosBase)).toBe(false);
      expect(
        haCambiadoTarifa(snapshotInicial, {
          ...datosBase,
          condicion: "no_arranca",
        }),
      ).toBe(true);

      // Renderizar PasoTarifa cuando la cotización requiere atención especial
      const user = userEvent.setup({ delay: null });
      render(
        <PasoTarifa
          datos={datosBase}
          errores={{}}
          acciones={{
            claseControl: () => "",
            actualizar: vi.fn(),
            actualizarCodigoPostal: vi.fn(),
            actualizarMarcaCatalogo: vi.fn(),
            actualizarModeloCatalogo: vi.fn(),
            validarCampo: vi.fn(),
            onContinuar: vi.fn(),
          }}
          cpConsultando={null}
          modelosDisponibles={["Corolla", "Camry"]}
          previsualizacion={{
            disponible: false,
            precioBase: null,
            comisionPlataforma: null,
            gananciaConductor: null,
            reglaId: null,
            motivo:
              "Torre de Control debe validar maniobra para vehículo blindado.",
          }}
          previsualizando={false}
        />,
      );

      expect(screen.getByText(/Benito Juárez, CDMX/)).toBeInTheDocument();
      expect(screen.getByText(/Cuauhtémoc, CDMX/)).toBeInTheDocument();

      await user.click(
        screen.getByRole("button", {
          name: /este traslado requiere cotización especial/i,
        }),
      );
      expect(
        screen.getByText(
          /nuestro equipo debe validar maniobra para vehículo blindado/i,
        ),
      ).toBeInTheDocument();
    });

    it("valida en servidor POST /api/viajes que el wizard esté en el paso final y que el vehículo pertenezca al usuario autenticado", async () => {
      const payloadValido = {
        ...VALORES_INICIALES,
        marca: "Toyota",
        modelo: "Corolla",
        anio: "2024",
        color: "Blanco",
        placas: "ABC123A",
        vin: "1HGCM82633A004352",
        transmision: "automatica",
        condicion: "seminueva",
        estadoGeneral: "Excelente, sin daños visibles",
        tieneTarjeta: true,
        tieneVerificacion: true,
        tienePlacas: true,
        puedeCircular: true,
        aceptaPoliticas: true,
        tipoRuta: "local",
        origenCalle: "Av. Insurgentes Sur",
        origenNumero: "123",
        origenColonia: "Del Valle",
        origenCiudad: "Benito Juárez",
        origenEstado: "CDMX",
        origenCodigoPostal: "03100",
        destinoCalle: "Paseo de la Reforma",
        destinoNumero: "456",
        destinoColonia: "Juárez",
        destinoCiudad: "Cuauhtémoc",
        destinoEstado: "CDMX",
        destinoCodigoPostal: "06600",
        entregaNombre: "Luis",
        entregaApellido: "Pérez",
        entregaTelefono: "5511223344",
        recepcionNombre: "María",
        recepcionApellido: "Gómez",
        recepcionTelefono: "5512345678",
        modalidadProgramacion: "lo_antes_posible",
        fechaHoraProgramada: "",
        zonaHoraria: "America/Mexico_City",
        vehiculoSeleccionadoId: "11111111-1111-4111-8111-111111111111",
        vehiculosUsuarioIds: ["11111111-1111-4111-8111-111111111111"],
      };

      // Paso incompleto (paso: 2) es rechazado por el servidor con 400
      const reqIncompleto = new NextRequest(
        "http://localhost:3000/api/viajes",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ...payloadValido, paso: 2 }),
        },
      );
      const resIncompleto = await postViajes(reqIncompleto);
      expect(resIncompleto.status).toBe(400);

      // Paso completo (paso: 4) con vehículo propio se aprueba con 200
      const reqCompleto = new NextRequest("http://localhost:3000/api/viajes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...payloadValido, paso: 4 }),
      });
      const resCompleto = await postViajes(reqCompleto);
      expect(resCompleto.status).toBe(200);
      expect(await resCompleto.json()).toEqual({ ok: true, pasoValidado: 4 });

      // Vehículo ajeno en la BD es rechazado con 403 aunque venga en vehiculosUsuarioIds
      entorno.listarVehiculosDeUsuarioMock.mockResolvedValueOnce([
        { id: "22222222-2222-4222-8222-222222222222" },
      ]);
      const reqVehiculoAjeno = new NextRequest(
        "http://localhost:3000/api/viajes",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ...payloadValido, paso: 4 }),
        },
      );
      const resVehiculoAjeno = await postViajes(reqVehiculoAjeno);
      expect(resVehiculoAjeno.status).toBe(403);
    });

    it("sincroniza AceptarCotizacion con AppStateProvider al aceptar la tarifa y maneja fallos recuperables", async () => {
      function LectorEstadoCotizacion({ trasladoId }: { trasladoId: string }) {
        const estado = useTrasladoRealtime(trasladoId);
        return (
          <div data-testid="estado-cotizacion">
            {estado.cotizacionAceptada ? "ACEPTADA" : "PENDIENTE"}
          </div>
        );
      }

      entorno.aceptarCotizacionUsuarioMock
        .mockRejectedValueOnce(new Error("La tarifa expiró hace un minuto"))
        .mockResolvedValueOnce(undefined);

      const user = userEvent.setup({ delay: null });
      render(
        <AppStateProvider>
          <AceptarCotizacion trasladoId="traslado-cot-01" tipoPago="anticipado" />
          <LectorEstadoCotizacion trasladoId="traslado-cot-01" />
        </AppStateProvider>,
      );

      expect(screen.getByTestId("estado-cotizacion")).toHaveTextContent(
        "PENDIENTE",
      );

      // Primer intento falla y muestra alerta
      await user.click(
        screen.getByRole("button", { name: /aceptar cotización/i }),
      );
      expect(
        await screen.findByText(/la tarifa expiró hace un minuto/i),
      ).toBeInTheDocument();
      expect(screen.getByTestId("estado-cotizacion")).toHaveTextContent(
        "PENDIENTE",
      );

      // Segundo intento tiene éxito, actualiza AppStateProvider y refresca el router
      await user.click(
        screen.getByRole("button", { name: /aceptar cotización/i }),
      );
      await waitFor(() => {
        expect(screen.getByTestId("estado-cotizacion")).toHaveTextContent(
          "ACEPTADA",
        );
      });
      expect(entorno.routerRefresh).toHaveBeenCalledTimes(1);
    });
  });

  describe("4. Flujo de integración de Pago (PagoTraslado + PagoRecuperable + PasoPago + PagoStripe + AppStateProvider + resumen-pago)", () => {
    it("ejecuta el cobro completo en PagoTraslado + PagoStripe, actualiza el estado realtime y concilia el recibo del pasaporte", async () => {
      const fetchEnProceso = crearFetchEnProceso((payload) => ({
        status: 200,
        body: { clientSecret: `cs_test_${payload.traslado_id}` },
      }));
      vi.stubGlobal("fetch", fetchEnProceso);

      const user = userEvent.setup({ delay: null });
      render(
        <AppStateProvider>
          <PagoTraslado trasladoId="traslado-pago-100" monto={1850} />
        </AppStateProvider>,
      );

      expect(screen.getByText(/pago pendiente/i)).toBeInTheDocument();
      expect(
        await screen.findByTestId("stripe-payment-element"),
      ).toBeInTheDocument();

      // Confirmar pago con Stripe Elements
      await user.click(
        screen.getByRole("button", { name: /pagar y confirmar traslado/i }),
      );

      // PagoTraslado reacciona al cambio en AppStateProvider (pagoConfirmado: true)
      expect(
        await screen.findByText(/pago procesado correctamente/i),
      ).toBeInTheDocument();

      // El resumen de pasaporte refleja el estado pagado y saldo $0
      const resumen = resumirPagoPasaporte(
        {
          id: "pas-100",
          folio: "RR-100",
          estado: "servicio_confirmado",
          tipo_pago: "anticipado",
          monto_pagado: 1850,
        } as never,
        [
          {
            id: "pag-1",
            monto: 1850,
            estado: "completado",
            metodo: "tarjeta_credito",
          } as never,
        ],
        1850,
        "servicio_confirmado",
      );

      expect(resumen).toEqual({
        metodoPago: "Tarjeta credito",
        totalPagado: 1850,
        pagoRealizado: true,
        montoMostrado: 1850,
        saldoPendiente: 0,
        estadoPago: "Pagado",
      });
    });

    it("mantiene estado pendiente en métodos asíncronos (RC-06: status 'processing') sin marcar el traslado como pagado", async () => {
      vi.stubGlobal("fetch", crearFetchEnProceso());
      entorno.stripeConfirmPaymentMock.mockResolvedValueOnce({
        paymentIntent: { status: "processing" },
      });

      const user = userEvent.setup({ delay: null });
      render(
        <AppStateProvider>
          <PagoTraslado trasladoId="traslado-oxxo-200" monto={2400} />
        </AppStateProvider>,
      );

      await screen.findByTestId("stripe-payment-element");
      await user.click(
        screen.getByRole("button", { name: /pagar y confirmar traslado/i }),
      );

      expect(
        await screen.findByText(/tu pago está en proceso de confirmación/i),
      ).toBeInTheDocument();
      expect(
        screen.queryByText(/pago procesado correctamente/i),
      ).not.toBeInTheDocument();

      const resumenPendiente = resumirPagoPasaporte(
        {
          id: "pas-200",
          folio: "RR-200",
          estado: "pendiente_de_pago",
          tipo_pago: "anticipado",
          monto_pagado: 0,
        } as never,
        [
          {
            id: "pag-2",
            monto: 2400,
            estado: "pendiente",
            metodo: "oxxo",
          } as never,
        ],
        2400,
        "pendiente_de_pago",
      );

      expect(resumenPendiente.pagoRealizado).toBe(false);
      expect(resumenPendiente.estadoPago).toBe("Pendiente");
      expect(resumenPendiente.saldoPendiente).toBe(2400);
    });

    it("controla la vigencia en PagoRecuperable y permite recuperar un fallo de tarjeta en PasoPago hasta confirmar el traslado", async () => {
      vi.stubGlobal("fetch", crearFetchEnProceso());

      // 1. Cotización expirada no monta la pasarela
      const expirada = new Date(Date.now() - 60_000).toISOString();
      const { unmount } = render(
        <AppStateProvider>
          <PagoRecuperable
            trasladoId="traslado-expirado"
            monto={1500}
            cotizacionExpiraEn={expirada}
          />
        </AppStateProvider>,
      );
      expect(screen.queryByText(/pago pendiente/i)).not.toBeInTheDocument();
      unmount();

      // 2. En PasoPago (wizard), un rechazo de tarjeta muestra error y permite reintentar hasta confirmar
      entorno.stripeConfirmPaymentMock
        .mockResolvedValueOnce({
          error: { message: "Tarjeta declinada por fondos insuficientes." },
        })
        .mockResolvedValueOnce({
          paymentIntent: { status: "succeeded" },
        });

      function ContenedorPasoPagoWizard() {
        const [pagado, setPagado] = React.useState(false);
        return (
          <div>
            <PasoPago
              trasladoCreado={{
                id: "abcd1234-5678",
                tipoPago: "anticipado",
                precioCotizado: 1950,
              }}
              pagoConfirmado={pagado}
              verificandoPago={false}
              errorVerificacionPago={null}
              onPagoStripeConfirmado={() => setPagado(true)}
              onReintentarVerificacion={vi.fn()}
              errorAceptacion={null}
              onReintentarAceptacion={vi.fn()}
              aceptandoCotizacion={false}
              cotizacionAceptada={true}
              datos={{
                ...VALORES_INICIALES,
                marca: "Mazda",
                modelo: "3",
                anio: "2023",
                origenCiudad: "Monterrey",
                destinoCiudad: "Saltillo",
              }}
              rutaEstimacion={{ distanciaKm: 85.2, tiempoEstimadoHoras: 1.25 }}
              formId="form-checkout-wizard"
            />
            {!pagado && (
              <button type="submit" form="form-checkout-wizard">
                Confirmar pago ahora
              </button>
            )}
          </div>
        );
      }

      const user = userEvent.setup({ delay: null });
      render(<ContenedorPasoPagoWizard />);

      await screen.findByTestId("stripe-payment-element");
      expect(screen.getByText("Mazda 3 2023")).toBeInTheDocument();

      // Primer intento: tarjeta declinada
      await user.click(
        screen.getByRole("button", { name: /confirmar pago ahora/i }),
      );
      expect(
        await screen.findByText(
          /tarjeta declinada por fondos insuficientes/i,
        ),
      ).toBeInTheDocument();

      // Segundo intento: tarjeta aprobada -> ¡Traslado solicitado!
      await user.click(
        screen.getByRole("button", { name: /confirmar pago ahora/i }),
      );
      expect(
        await screen.findByText(/¡traslado solicitado!/i),
      ).toBeInTheDocument();
      expect(screen.getByText("#RR-ABCD")).toBeInTheDocument();
    });
  });
});
