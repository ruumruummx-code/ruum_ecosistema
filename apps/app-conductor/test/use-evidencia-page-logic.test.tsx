// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  obtenerPasaporteDigital: vi.fn(),
  obtenerEvidenciaDeTraslado: vi.fn(),
  confirmarEvidenciaCompleta: vi.fn(),
  firmarUrlsEvidencia: vi.fn(),
  registrarEvento: vi.fn(),
  obtenerInspeccionTraslado: vi.fn(),
  guardarInspeccionTraslado: vi.fn(),
  crearClienteNavegador: vi.fn(() => ({}) as never),
  tieneSupabaseConfigurado: vi.fn(() => true),
  evaluarNitidez: vi.fn(),
  capturarFoto: vi.fn(),
  seleccionarFotoGaleria: vi.fn(),
  comprimirDataUrl: vi.fn(),
  esNativo: vi.fn(() => false),
  useLiveRegion: vi.fn(() => ({ alert: vi.fn(), announce: vi.fn() })),
  useEvidenceQueue: vi.fn(() => ({
    cargarPendientesLocales: vi.fn(async () => []),
    drenarColaPendiente: vi.fn(async () => 0),
    registrarFotoEnCola: vi.fn(async () => [])
  })),
  useRouter: vi.fn(() => ({ push: mocks.push }))
}));

vi.mock("next/navigation", () => ({
  useRouter: mocks.useRouter,
  useParams: () => ({ id: "traslado-1" })
}));
vi.mock("@/components/LiveRegionProvider", () => ({ useLiveRegion: mocks.useLiveRegion }));
vi.mock("@ruum/api/services", () => ({
  obtenerPasaporteDigital: mocks.obtenerPasaporteDigital,
  obtenerEvidenciaDeTraslado: mocks.obtenerEvidenciaDeTraslado,
  confirmarEvidenciaCompleta: mocks.confirmarEvidenciaCompleta,
  firmarUrlsEvidencia: mocks.firmarUrlsEvidencia,
  registrarEvento: mocks.registrarEvento
}));
vi.mock("@ruum/api/drivers", () => ({
  obtenerInspeccionTraslado: mocks.obtenerInspeccionTraslado,
  guardarInspeccionTraslado: mocks.guardarInspeccionTraslado
}));
vi.mock("@/lib/supabase-browser", () => ({
  crearClienteNavegador: mocks.crearClienteNavegador,
  tieneSupabaseConfigurado: mocks.tieneSupabaseConfigurado
}));
vi.mock("@/lib/camara", () => ({
  capturarFoto: mocks.capturarFoto,
  seleccionarFotoGaleria: mocks.seleccionarFotoGaleria,
  comprimirDataUrl: mocks.comprimirDataUrl,
  evaluarNitidez: mocks.evaluarNitidez
}));
vi.mock("@/lib/capacitor", () => ({ esNativo: mocks.esNativo }));
vi.mock("@/app/viajes/[id]/evidencia/useEvidenceQueue", () => ({
  useEvidenceQueue: mocks.useEvidenceQueue
}));
vi.mock("next/link", () => ({ default: ({ children }: { children?: unknown }) => children }));
vi.mock("@ruum/ui", () => ({ Aviso: () => null, MapaEstatico: () => null }));

import { useEvidenciaPageLogic, tipoEvidenciaPorEstado } from "../src/app/viajes/[id]/evidencia/useEvidenciaPageLogic";

const PASAPORTE = {
  traslado_id: "traslado-1",
  estado: "evidencia_inicial_en_proceso",
  origen_ciudad: "CDMX"
};

describe("useEvidenciaPageLogic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.tieneSupabaseConfigurado.mockReturnValue(true);
    mocks.obtenerPasaporteDigital.mockResolvedValue(PASAPORTE);
    mocks.obtenerEvidenciaDeTraslado.mockResolvedValue([]);
    mocks.firmarUrlsEvidencia.mockImplementation(async (_cliente, fotos: unknown[]) => fotos);
    mocks.obtenerInspeccionTraslado.mockResolvedValue(null);
    mocks.evaluarNitidez.mockResolvedValue({ nitida: true });
    mocks.useEvidenceQueue.mockReturnValue({
      cargarPendientesLocales: vi.fn(async () => []),
      drenarColaPendiente: vi.fn(async () => 0),
      registrarFotoEnCola: vi.fn(async () => [])
    } as never);
  });

  it("mapea el estado del traslado al tipo de evidencia", () => {
    expect(tipoEvidenciaPorEstado("evidencia_inicial_en_proceso")).toBe("inicial");
    expect(tipoEvidenciaPorEstado("llegada_a_destino")).toBe("final");
    expect(tipoEvidenciaPorEstado("traslado_en_curso")).toBeNull();
  });

  it("carga el pasaporte y deja de cargar al terminar", async () => {
    const { result } = renderHook(() => useEvidenciaPageLogic("traslado-1"));

    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(result.current.pasaporte).toMatchObject({ traslado_id: "traslado-1" });
    expect(result.current.estadoActual).toBe("evidencia_inicial_en_proceso");
    expect(result.current.tipo).toBe("inicial");
    expect(result.current.folio).toBe("TRASLADO");
    expect(result.current.origen).toBe("CDMX");
    expect(result.current.error).toBeNull();
  });

  it("avisa cuando Supabase no está configurado", async () => {
    mocks.tieneSupabaseConfigurado.mockReturnValue(false);

    const { result } = renderHook(() => useEvidenciaPageLogic("traslado-1"));

    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(result.current.aviso).toContain("Supabase");
  });

  it("carga la inspección guardada en el formulario", async () => {
    mocks.obtenerInspeccionTraslado.mockResolvedValue({
      kilometraje: 50000,
      llaves_recibidas: "3",
      tarjeta_circulacion: "si",
      talon_verificacion: "no",
      holograma_verificacion: true,
      placa_delantera: "ABC-123",
      placa_trasea: null,
      notas: "golpe leve",
      combustible: "3/4"
    });

    const { result } = renderHook(() => useEvidenciaPageLogic("traslado-1"));

    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(result.current.kilometraje).toContain("50");
    expect(result.current.llavesCount).toBe(3);
    expect(result.current.tarjetaCirculacion).toBe("si");
    expect(result.current.talonVerificacion).toBe("no");
    expect(result.current.hologramaVerificacion).toBe("si");
    expect(result.current.placaDelantera).toBe("ABC-123");
    expect(result.current.notas).toBe("golpe leve");
    expect(result.current.gasolinaSegments).toBe(6);
  });

  it("cuenta los requisitos capturados sobre el total declarado", async () => {
    const { result } = renderHook(() => useEvidenciaPageLogic("traslado-1"));
    await waitFor(() => expect(result.current.cargando).toBe(false));

    expect(result.current.fotosObligatorias).toBe(5);
    expect(result.current.totalRequisitos).toBe(11);
    expect(result.current.angulosObligatorios).toEqual([
      "frente",
      "lado_piloto",
      "lado_copiloto",
      "trasera",
      "tablero"
    ]);
    expect(result.current.fotosObligCapturadas).toBe(0);
    expect(result.current.docsCapturados).toBe(0);
    expect(result.current.totalCapturados).toBe(0);
  });

  it("rechaza una foto borrosa con un mensaje accionable", async () => {
    mocks.evaluarNitidez.mockResolvedValue({ nitida: false, motivo: "borrosa" });
    const { result } = renderHook(() => useEvidenciaPageLogic("traslado-1"));
    await waitFor(() => expect(result.current.cargando).toBe(false));

    await act(async () => {
      await result.current.registrarFotoLocal("frente", "data:image/jpeg;base64,AA");
    });

    expect(result.current.error).toContain("borrosa");
    expect(result.current.enviando).toBeNull();
  });

  it("rechaza una foto demasiado oscura con su mensaje específico", async () => {
    mocks.evaluarNitidez.mockResolvedValue({ nitida: false, motivo: "muy_oscura" });
    const { result } = renderHook(() => useEvidenciaPageLogic("traslado-1"));
    await waitFor(() => expect(result.current.cargando).toBe(false));

    await act(async () => {
      await result.current.registrarFotoLocal("frente", "data:image/jpeg;base64,AA");
    });

    expect(result.current.error).toContain("oscura");
  });

  it("registra la foto en la cola local cuando la captura es nítida", async () => {
    const registrarFotoEnCola = vi.fn(async () => []);
    mocks.useEvidenceQueue.mockReturnValue({
      cargarPendientesLocales: vi.fn(async () => []),
      drenarColaPendiente: vi.fn(async () => 0),
      registrarFotoEnCola
    } as never);
    const { result } = renderHook(() => useEvidenciaPageLogic("traslado-1"));
    await waitFor(() => expect(result.current.cargando).toBe(false));

    await act(async () => {
      await result.current.registrarFotoLocal("frente", "data:image/jpeg;base64,AA");
    });

    expect(registrarFotoEnCola).toHaveBeenCalledWith({
      angulo: "frente",
      dataUrl: "data:image/jpeg;base64,AA"
    });
    expect(result.current.error).toBeNull();
  });

  it("guarda el borrador de inspección con el estado del formulario", async () => {
    const { result } = renderHook(() => useEvidenciaPageLogic("traslado-1"));
    await waitFor(() => expect(result.current.cargando).toBe(false));

    act(() => {
      result.current.setKilometraje("50000");
      result.current.setNotas("sin novedad");
    });

    await act(async () => {
      await result.current.guardarBorrador();
    });

    expect(mocks.guardarInspeccionTraslado).toHaveBeenCalled();
  });

  it("no finaliza si faltan las fotos obligatorias", async () => {
    const { result } = renderHook(() => useEvidenciaPageLogic("traslado-1"));
    await waitFor(() => expect(result.current.cargando).toBe(false));

    await act(async () => {
      await result.current.finalizar();
    });

    expect(mocks.confirmarEvidenciaCompleta).not.toHaveBeenCalled();
    expect(result.current.error).toContain("Falta capturar");
  });

  it("finaliza la evidencia y avisa del éxito", async () => {
    mocks.obtenerEvidenciaDeTraslado.mockResolvedValue(
      ["frente", "lado_piloto", "lado_copiloto", "trasera", "tablero"].map((angulo) => ({
        id: `foto-${angulo}`,
        traslado_id: "traslado-1",
        tipo: "inicial",
        angulo,
        local_path: null,
        timestamp: new Date().toISOString(),
        sincronizada: true
      }))
    );
    mocks.confirmarEvidenciaCompleta.mockResolvedValue({ ok: true });
    const { result } = renderHook(() => useEvidenciaPageLogic("traslado-1"));
    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(result.current.fotosObligCapturadas).toBe(5);

    await act(async () => {
      await result.current.finalizar();
    });

    expect(mocks.confirmarEvidenciaCompleta).toHaveBeenCalled();
    expect(result.current.avisoExito).toContain("éxito");
  });

  it("reporta el error cuando la finalización falla", async () => {
    mocks.confirmarEvidenciaCompleta.mockRejectedValue(new Error("rechazado"));
    const { result } = renderHook(() => useEvidenciaPageLogic("traslado-1"));
    await waitFor(() => expect(result.current.cargando).toBe(false));

    await act(async () => {
      await result.current.finalizar();
    });

    expect(result.current.error).toBeTruthy();
  });
});
