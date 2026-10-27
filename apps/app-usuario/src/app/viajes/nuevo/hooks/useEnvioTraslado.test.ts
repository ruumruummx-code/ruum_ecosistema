/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";

const crearTrasladoMock = vi.fn();
vi.mock("@ruum/api/services", () => ({
  crearTraslado: (...args: unknown[]) => crearTrasladoMock(...args),
}));

const tieneSupabaseMock = vi.fn(() => true);
vi.mock("@/lib/supabase-browser", () => ({
  tieneSupabaseConfigurado: () => tieneSupabaseMock(),
  crearClienteNavegador: () => ({}),
}));

vi.mock("@/lib/analytics", () => ({
  registrarEventoUx: vi.fn(),
}));

const tieneMapboxMock = vi.fn(() => true);
const esErrorConfigMapboxMock = vi.fn((..._args: unknown[]) => false);
vi.mock("@/lib/mapbox", () => ({
  tieneMapboxConfigurado: () => tieneMapboxMock(),
  esErrorConfiguracionMapbox: (...args: unknown[]) => esErrorConfigMapboxMock(...args),
  mensajeErrorMapbox: () => "Configuración de Mapbox incompleta",
}));

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
}));

import { useEnvioTraslado, type ParametrosEnvioTraslado } from "./useEnvioTraslado";
import { VALORES_INICIALES } from "../constants";
import { NextRequest } from "next/server";
import { validarCsrfRequest } from "@/lib/csrf";

function crearParams(overrides: Partial<ParametrosEnvioTraslado> = {}): ParametrosEnvioTraslado {
  return {
    paso: 4,
    datos: {
      ...VALORES_INICIALES,
      marca: "Toyota",
      modelo: "Corolla",
      anio: "2023",
      origenCalle: "Reforma",
      origenNumero: "100",
      origenColonia: "Juárez",
      origenCodigoPostal: "06600",
      origenCiudad: "CDMX",
      origenEstado: "CDMX",
      destinoCalle: "Constitución",
      destinoNumero: "200",
      destinoColonia: "Centro",
      destinoCodigoPostal: "64000",
      destinoCiudad: "Monterrey",
      destinoEstado: "Nuevo León",
      entregaNombre: "Luis",
      entregaApellido: "Pérez",
      entregaTelefono: "5511223344",
      recepcionNombre: "Ana",
      recepcionApellido: "Gómez",
      recepcionTelefono: "8111223344",
    },
    tarifaPreviaAceptada: true,
    aceptaPoliticasPagoCancelacion: true,
    cargandoSesion: false,
    sesionReal: true,
    vehiculoSeleccionadoId: "",
    vehiculosGuardados: [],
    rutaEstimacion: null,
    claveIdempotencia: "idem-123",
    resultadoValidacion: { success: true, data: {} } as never,
    geocodificarRuta: vi.fn().mockResolvedValue({
      origenLat: 19.43,
      origenLng: -99.13,
      destinoLat: 25.68,
      destinoLng: -100.31,
      distanciaKm: 900,
      duracionHoras: 10,
      incompletas: false,
    }),
    geocodificarRutaConParadas: vi.fn(),
    enfocarPrimerError: vi.fn(),
    router: { push: vi.fn(), replace: vi.fn(), refresh: vi.fn() } as never,
    formEnviadoRef: { current: false },
    setters: {
      setPaso: vi.fn(),
      setEnviando: vi.fn(),
      setResultado: vi.fn(),
      setErrorPaso: vi.fn(),
      setErrores: vi.fn(),
      setDetallesVehiculoExpandido: vi.fn(),
      setSubpasoRuta: vi.fn(),
      setRutaAviso: vi.fn(),
      setTrasladoCreado: vi.fn(),
    },
    ...overrides,
  };
}

describe("useEnvioTraslado", () => {
  afterEach(() => {
    window.history.replaceState(null, "", "/");
    document.cookie = "ruum_csrf_token=; Max-Age=0; path=/";
    vi.restoreAllMocks();
  });
  beforeEach(() => {
    vi.clearAllMocks();
    tieneSupabaseMock.mockReturnValue(true);
    tieneMapboxMock.mockReturnValue(true);
    esErrorConfigMapboxMock.mockReturnValue(false);
  });

  it("impide crear dos solicitudes ante llamadas simultáneas y reutiliza la creada", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ ok: true }));
    crearTrasladoMock.mockResolvedValue({ id: "unico", tipo_pago: "anticipado", precio_cotizado: 500 });
    const params = crearParams();
    const { result } = renderHook(() => useEnvioTraslado(params));
    await act(async () => { await Promise.all([result.current.enviarSolicitud(), result.current.enviarSolicitud()]); });
    expect(crearTrasladoMock).toHaveBeenCalledTimes(1);
    await act(async () => { await result.current.enviarSolicitud(); });
    expect(crearTrasladoMock).toHaveBeenCalledTimes(1);
    expect(params.setters.setPaso).toHaveBeenLastCalledWith(4);
  });

  it("avanza del paso 4 al 5 con cookie CSRF y mantiene la validación del servidor", async () => {
    const token = "a".repeat(64);
    document.cookie = `ruum_csrf_token=${token}; path=/`;
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (_input, init) => {
      const headers = new Headers(init?.headers);
      headers.set("cookie", `ruum_csrf_token=${token}`);
      const request = new NextRequest("https://usuario.example.com/api/viajes", {
        method: init?.method, body: init?.body, headers,
      });
      if (!validarCsrfRequest(request).valido) {
        return Response.json({ error: "Token CSRF inválido o ausente.", code: "CSRF_INVALID" }, { status: 403 });
      }
      return Response.json({ ok: true });
    });
    crearTrasladoMock.mockResolvedValueOnce({ id: "traslado-csrf", tipo_pago: "anticipado", precio_cotizado: 3200 });
    const params = crearParams({ paso: 3 });
    const { result } = renderHook(() => useEnvioTraslado(params));

    await act(async () => { await result.current.enviarSolicitud(); });

    expect(fetchMock).toHaveBeenCalledWith("/api/viajes", expect.objectContaining({
      headers: { "Content-Type": "application/json", "x-csrf-token": token },
    }));
    expect(crearTrasladoMock).toHaveBeenCalledOnce();
    expect(params.setters.setTrasladoCreado).toHaveBeenCalledWith({
      id: "traslado-csrf", tipoPago: "anticipado", precioCotizado: 3200,
    });
    expect(params.setters.setPaso).toHaveBeenCalledWith(4);
    expect(params.formEnviadoRef.current).toBe(true);
    expect(params.setters.setResultado).not.toHaveBeenCalledWith(expect.objectContaining({ ok: false }));
  });

  it("bloquea envío si tarifa no aceptada, formulario inválido, sin sesión, año inválido o paso < 3", async () => {
    // 1. Tarifa no aceptada
    const p1 = crearParams({ tarifaPreviaAceptada: false });
    const { result: r1 } = renderHook(() => useEnvioTraslado(p1));
    await act(async () => {
      await r1.current.enviarSolicitud();
    });
    expect(p1.setters.setPaso).toHaveBeenCalledWith(0);

    // 2. Formulario inválido
    const p2 = crearParams({
      resultadoValidacion: {
        success: false,
        error: { issues: [{ path: ["origenCalle"], message: "Requerido" }] },
      } as never,
    });
    const { result: r2 } = renderHook(() => useEnvioTraslado(p2));
    await act(async () => {
      await r2.current.enviarSolicitud();
    });
    expect(p2.setters.setSubpasoRuta).toHaveBeenCalledWith("origen");
    expect(p2.enfocarPrimerError).toHaveBeenCalledWith(["origenCalle"]);

    // 3. Sin sesión real -> redirige a /login
    window.history.replaceState(null, "", "/viajes/nuevo?vehiculo=auto-123&buscar_origen=Toluca#ruta");
    const p3 = crearParams({ sesionReal: false });
    const { result: r3 } = renderHook(() => useEnvioTraslado(p3));
    await act(async () => {
      await r3.current.enviarSolicitud();
    });
    const destinoLogin = new URL(vi.mocked(p3.router.push).mock.calls[0]![0], window.location.origin);
    expect(destinoLogin.pathname).toBe("/login");
    expect(destinoLogin.searchParams.get("next")).toBe("/viajes/nuevo?vehiculo=auto-123&buscar_origen=Toluca#ruta");

    // 4. Año inválido
    const p4 = crearParams({ datos: { ...crearParams().datos, anio: "1950" } });
    const { result: r4 } = renderHook(() => useEnvioTraslado(p4));
    await act(async () => {
      await r4.current.enviarSolicitud();
    });
    expect(p4.setters.setResultado).toHaveBeenCalledWith(
      expect.objectContaining({ ok: false, mensaje: expect.stringMatching(/entre 1980/) })
    );

    // 5. Paso < 3
    const p5 = crearParams({ paso: 2 });
    const { result: r5 } = renderHook(() => useEnvioTraslado(p5));
    await act(async () => {
      await r5.current.enviarSolicitud();
    });
    expect(p5.setters.setResultado).toHaveBeenCalledWith(
      expect.objectContaining({ ok: false, mensaje: expect.stringMatching(/todos los pasos/) })
    );
  });

  it("ejecuta validación servidor, geocodifica ruta y crea traslado exitosamente o captura errores", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
    } as Response);
    crearTrasladoMock.mockResolvedValueOnce({
      id: "traslado-999",
      tipo_pago: "anticipado",
      precio_cotizado: 3200,
    });

    const params = crearParams();
    const { result } = renderHook(() => useEnvioTraslado(params));

    await act(async () => {
      await result.current.enviarSolicitud();
    });

    expect(crearTrasladoMock).toHaveBeenCalled();
    expect(params.setters.setTrasladoCreado).toHaveBeenCalledWith({
      id: "traslado-999",
      tipoPago: "anticipado",
      precioCotizado: 3200,
    });
    expect(params.setters.setPaso).toHaveBeenCalledWith(4);

    // Fallo de validación servidor (fail-closed)
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: "Paso inválido en servidor" }),
    } as Response);

    const paramsFallidos = crearParams();
    const { result: fallido } = renderHook(() => useEnvioTraslado(paramsFallidos));
    await act(async () => {
      await fallido.current.enviarSolicitud();
    });
    expect(paramsFallidos.setters.setResultado).toHaveBeenCalledWith(
      expect.objectContaining({ ok: false })
    );
  });
});
