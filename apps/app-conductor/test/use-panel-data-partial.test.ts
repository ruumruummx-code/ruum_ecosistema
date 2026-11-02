// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routerMock = { replace: vi.fn(), push: vi.fn() };

const mocks = vi.hoisted(() => ({
  crearClienteNavegador: vi.fn(),
  tieneSupabaseConfigurado: vi.fn(() => true),
  obtenerConductorActual: vi.fn(),
  obtenerSolicitudConductorActual: vi.fn(),
  listarTrasladosAceptados: vi.fn(),
  listarTrasladosDisponibles: vi.fn(),
  obtenerDisponibilidadConductor: vi.fn(),
  contarNotificacionesNoLeidas: vi.fn(),
  listarGananciasCerradasConductorDesde: vi.fn(),
  listarDocumentosConductor: vi.fn(),
  useRouter: vi.fn(() => routerMock),
}));

vi.mock("next/navigation", () => ({
  useRouter: mocks.useRouter,
}));

vi.mock("../src/lib/supabase-browser", () => ({
  crearClienteNavegador: mocks.crearClienteNavegador,
  tieneSupabaseConfigurado: mocks.tieneSupabaseConfigurado,
}));

vi.mock("@ruum/shared/utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@ruum/shared/utils")>();
  return {
    ...actual,
    suscribirCanalSeguro: vi.fn(() => vi.fn()),
    limpiarCanalesSeguros: vi.fn(),
  };
});

vi.mock("@ruum/api/services", () => ({
  guardarDisponibilidadConductor: vi.fn(),
  listarTrasladosAceptados: mocks.listarTrasladosAceptados,
  listarTrasladosDisponibles: mocks.listarTrasladosDisponibles,
  obtenerConductorActual: mocks.obtenerConductorActual,
  obtenerDisponibilidadConductor: mocks.obtenerDisponibilidadConductor,
  obtenerSolicitudConductorActual: mocks.obtenerSolicitudConductorActual,
}));

vi.mock("@ruum/api/drivers", () => ({
  contarNotificacionesNoLeidas: mocks.contarNotificacionesNoLeidas,
  listarDocumentosSolicitud: vi.fn(),
  listarDocumentosConductor: mocks.listarDocumentosConductor,
  listarGananciasCerradasConductorDesde: mocks.listarGananciasCerradasConductorDesde,
}));

import { usePanelData } from "../src/app/panel/usePanelData";

describe("usePanelData - Resiliencia ante fallos parciales (H09)", () => {
  const conductorFalso = {
    id: "conductor-1",
    nombre: "Test Conductor",
    estado: "activo",
    estado_expediente: "aprobado",
    documentos_vigentes: true,
  };

  const fakeCliente = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { email: "conductor@ruum.mx" } }, error: null }),
    },
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    }),
    removeChannel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.tieneSupabaseConfigurado.mockReturnValue(true);
    mocks.crearClienteNavegador.mockReturnValue(fakeCliente);
    mocks.obtenerConductorActual.mockResolvedValue(conductorFalso);
    mocks.listarTrasladosAceptados.mockResolvedValue([{ id: "viaje-1", estado: "traslado_en_curso" }]);
    mocks.listarTrasladosDisponibles.mockResolvedValue([]);
    mocks.obtenerDisponibilidadConductor.mockResolvedValue("disponible");
    mocks.contarNotificacionesNoLeidas.mockResolvedValue(2);
    mocks.listarGananciasCerradasConductorDesde.mockResolvedValue([
      { ganancia_conductor_congelada: 1200, precio_final: 1500, precio_cotizado: 1500 },
    ]);
    mocks.listarDocumentosConductor.mockResolvedValue([]);
  });

  it("conserva viaje activo y marca fallo parcial cuando falla listarTrasladosAceptados en recarga", async () => {
    const { result } = renderHook(() => usePanelData());
    await waitFor(() => expect(result.current.cargando).toBe(false));

    expect(result.current.viajeActivoPrincipal?.id).toBe("viaje-1");
    expect(result.current.disponibilidad).toBe("en_viaje");
    expect(result.current.fallosParciales.aceptados).toBeUndefined();

    // Simular que en la recarga, la consulta de traslados aceptados falla (red / 500)
    mocks.listarTrasladosAceptados.mockRejectedValueOnce(new Error("Timeout en aceptados"));

    await act(async () => {
      await result.current.recargar();
    });

    await waitFor(() => expect(result.current.fallosParciales.aceptados).toBe(true));

    // El viaje activo NO debe haber sido sustituido por lista vacía
    expect(result.current.viajeActivoPrincipal?.id).toBe("viaje-1");
    // errorDisponibilidad informa explícitamente qué falló en vez de borrarse
    expect(result.current.errorDisponibilidad).toContain("viajes activos");
  });

  it("marca ganancia como incompleta y no inventa 85% cuando falta ganancia_conductor_congelada (H09)", async () => {
    mocks.listarGananciasCerradasConductorDesde.mockResolvedValue([
      { ganancia_conductor_congelada: null, precio_final: 1000, precio_cotizado: 1000 },
    ]);

    const { result } = renderHook(() => usePanelData());
    await waitFor(() => expect(result.current.cargando).toBe(false));

    expect(result.current.gananciasHoy).toBeNull();
    expect(result.current.gananciasHoyIncompletas).toBe(true);
    expect(result.current.gananciasHoyEstimadas).toBe(false);
    expect(result.current.gananciasHoyDesconocidas).toBe(false);
  });

  it("actualiza fecha por módulo y no actualiza última actualización global ante fallos parciales (H09)", async () => {
    const { result } = renderHook(() => usePanelData());
    await waitFor(() => expect(result.current.cargando).toBe(false));

    const fechaGlobalInicial = result.current.ultimaActualizacion;
    expect(result.current.actualizacionesPorModulo.aceptados).toBeInstanceOf(Date);

    // Simular recarga donde aceptados falla
    mocks.listarTrasladosAceptados.mockRejectedValueOnce(new Error("Timeout"));

    await act(async () => {
      await result.current.recargar();
    });

    await waitFor(() => expect(result.current.fallosParciales.aceptados).toBe(true));
    // La fecha global no debió avanzar porque hubo un fallo parcial
    expect(result.current.ultimaActualizacion?.getTime()).toBe(fechaGlobalInicial?.getTime());
    // Módulos exitosos tienen su propia marca de tiempo
    expect(result.current.actualizacionesPorModulo.ganancias).toBeInstanceOf(Date);
  });

  it("marca ganancias como desconocidas cuando la consulta inicial de ganancias falla", async () => {
    mocks.listarGananciasCerradasConductorDesde.mockRejectedValue(new Error("Error consultando ganancias"));

    const { result } = renderHook(() => usePanelData());
    await waitFor(() => expect(result.current.cargando).toBe(false));

    await waitFor(() => expect(result.current.fallosParciales.ganancias).toBe(true));
    expect(result.current.errorDisponibilidad).toContain("ganancias de hoy");
  });
});
