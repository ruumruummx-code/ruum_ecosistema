// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  leerColaEvidenciaDeTraslado: vi.fn(),
  contarColaEvidencia: vi.fn(),
  encolarEvidencia: vi.fn(),
  sincronizarColaEvidencia: vi.fn(),
  calcularSha256: vi.fn(),
  hashBlob: vi.fn(),
  obtenerUbicacionActual: vi.fn(),
  crearClienteNavegador: vi.fn(),
  tieneSupabaseConfigurado: vi.fn(() => true)
}));

vi.mock("@/lib/cola-offline", () => ({
  leerColaEvidenciaDeTraslado: mocks.leerColaEvidenciaDeTraslado,
  contarColaEvidencia: mocks.contarColaEvidencia,
  encolarEvidencia: mocks.encolarEvidencia,
  sincronizarColaEvidencia: mocks.sincronizarColaEvidencia,
  calcularSha256: mocks.calcularSha256,
  hashBlob: mocks.hashBlob
}));

vi.mock("@/lib/ubicacion", () => ({ obtenerUbicacionActual: mocks.obtenerUbicacionActual }));
vi.mock("@/lib/supabase-browser", () => ({
  crearClienteNavegador: mocks.crearClienteNavegador,
  tieneSupabaseConfigurado: mocks.tieneSupabaseConfigurado
}));

import { useEvidenceQueue } from "../src/app/viajes/[id]/evidencia/useEvidenceQueue";

const PENDIENTE = {
  localId: "local-1",
  trasladoId: "traslado-1",
  tipo: "inicial" as const,
  angulo: "frente",
  dataUrl: "data:image/jpeg;base64,Zm90bw==",
  capturadaEn: "2026-07-17T12:00:00.000Z"
};

describe("useEvidenceQueue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.tieneSupabaseConfigurado.mockReturnValue(true);
    mocks.leerColaEvidenciaDeTraslado.mockResolvedValue([PENDIENTE]);
    mocks.contarColaEvidencia.mockResolvedValue(1);
    mocks.calcularSha256.mockResolvedValue("hash-1");
    mocks.hashBlob.mockResolvedValue("a".repeat(64));
    mocks.obtenerUbicacionActual.mockResolvedValue({ lat: 19.43, lng: -99.13 });
    mocks.crearClienteNavegador.mockReturnValue({
      auth: { getSession: vi.fn(async () => ({ data: { session: { user: { id: "user-1" } } } })) }
    });
  });

  it("carga los pendientes locales como fotos no sincronizadas", async () => {
    const { result } = renderHook(() => useEvidenceQueue({ trasladoId: "traslado-1", tipo: "inicial" }));

    let fotos: unknown[] = [];
    await act(async () => {
      fotos = await result.current.cargarPendientesLocales();
    });

    expect(fotos).toHaveLength(1);
    expect(fotos[0]).toMatchObject({ id: "local-1", sincronizada: false, local_path: PENDIENTE.dataUrl });
    expect(result.current.pendientesSubida).toBe(1);
  });

  it("encola la foto con su huella sha256 y sus coordenadas", async () => {
    const { result } = renderHook(() => useEvidenceQueue({ trasladoId: "traslado-1", tipo: "inicial" }));

    await act(async () => {
      await result.current.registrarFotoEnCola({ angulo: "frente", dataUrl: PENDIENTE.dataUrl });
    });

    expect(mocks.encolarEvidencia).toHaveBeenCalledTimes(1);
    const encolado = mocks.encolarEvidencia.mock.calls[0][0];
    expect(encolado).toMatchObject({
      usuarioId: "user-1",
      trasladoId: "traslado-1",
      tipo: "inicial",
      angulo: "frente",
      dataUrl: PENDIENTE.dataUrl,
      sha256: "hash-1",
      lat: 19.43,
      lng: -99.13
    });
    expect(encolado.localId).toEqual(expect.any(String));
    await act(async () => {
      await result.current.registrarFotoEnCola({ angulo: "frente", dataUrl: PENDIENTE.dataUrl });
    });
    expect(mocks.encolarEvidencia.mock.calls[1][0].localId).toBe(encolado.localId);
  });

  it("no encola nada si el tipo de evidencia todavía no está definido", async () => {
    const { result } = renderHook(() => useEvidenceQueue({ trasladoId: "traslado-1", tipo: null }));

    let resultado: unknown = "sin ejecutar";
    await act(async () => {
      resultado = await result.current.registrarFotoEnCola({ angulo: "frente", dataUrl: PENDIENTE.dataUrl });
    });

    expect(resultado).toEqual([]);
    expect(mocks.encolarEvidencia).not.toHaveBeenCalled();
  });

  it("falla si no hay sesión para asociar la evidencia", async () => {
    mocks.crearClienteNavegador.mockReturnValue({
      auth: { getSession: vi.fn(async () => ({ data: { session: null } })) }
    });
    const { result } = renderHook(() => useEvidenceQueue({ trasladoId: "traslado-1", tipo: "inicial" }));

    await expect(
      act(async () => {
        await result.current.registrarFotoEnCola({ angulo: "frente", dataUrl: PENDIENTE.dataUrl });
      })
    ).rejects.toThrow(/sesión/i);
  });

  it("drena la cola y actualiza el contador de pendientes", async () => {
    mocks.sincronizarColaEvidencia.mockImplementation(
      async (_cliente: unknown, opciones?: { onItemSincronizado?: () => Promise<void> | void }) => {
        mocks.contarColaEvidencia.mockResolvedValue(0);
        await opciones?.onItemSincronizado?.();
        return 1;
      }
    );
    const { result } = renderHook(() => useEvidenceQueue({ trasladoId: "traslado-1", tipo: "inicial" }));

    let subidas: unknown;
    await act(async () => {
      subidas = await result.current.drenarColaPendiente();
    });

    expect(subidas).toBe(1);
    expect(mocks.sincronizarColaEvidencia).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(result.current.pendientesSubida).toBe(0));
    expect(result.current.sincronizando).toBe(false);
  });

  it("no drena sin tipo de evidencia ni con la app sin red", async () => {
    const { result } = renderHook(() => useEvidenceQueue({ trasladoId: "traslado-1", tipo: null }));

    let resultado: unknown = "sin ejecutar";
    await act(async () => {
      resultado = await result.current.drenarColaPendiente();
    });

    expect(resultado).toBeNull();
    expect(mocks.sincronizarColaEvidencia).not.toHaveBeenCalled();
  });

  it("traduce el error de sincronización a un mensaje operable", async () => {
    mocks.sincronizarColaEvidencia.mockRejectedValue(new Error("sin red"));
    const { result } = renderHook(() => useEvidenceQueue({ trasladoId: "traslado-1", tipo: "inicial" }));

    await expect(
      act(async () => {
        await result.current.drenarColaPendiente();
      })
    ).rejects.toThrow();
    expect(result.current.sincronizando).toBe(false);
  });
});
