/** @vitest-environment jsdom */
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useCargaMasiva } from "./useCargaMasiva";
import { normalizarFilaPlantilla, validarFila } from "@/lib/carga-masiva";

vi.mock("exceljs", () => ({
  Workbook: class {
    xlsx = { load: async () => undefined };
    getWorksheet() {
      return {
        getRow: () => ({ eachCell: (cb: (cell: { value: string }, col: number) => void) => ["vehiculo_marca", "vehiculo_modelo", "origen_codigo_postal", "destino_codigo_postal"].forEach((value, i) => cb({ value }, i + 1)) }),
        eachRow: (cb: (row: unknown, n: number) => void) => cb({ eachCell: (cell: (c: { value: string; type: number }, col: number) => void) => cell({ value: "Nissan", type: 3 }, 1) }, 2),
      };
    }
  },
}));
afterEach(() => vi.unstubAllGlobals());
it("espera la revalidación del servidor y descarta su respuesta al cancelar", async () => {
  const datos = normalizarFilaPlantilla({ vehiculo_marca: "Nissan", vehiculo_modelo: "Versa", vehiculo_anio: "2024", vehiculo_placas: "ABC123", origen_codigo_postal: "06700", destino_codigo_postal: "04360", condicion: "seminueva", contacto_entrega_nombre: "Entrega", contacto_entrega_telefono: "5512345678", contacto_recepcion_nombre: "Recibe", contacto_recepcion_telefono: "5512345679", origen_calle: "Uno", origen_numero: "1", origen_colonia: "Roma", destino_calle: "Dos", destino_numero: "2", destino_colonia: "Centro" });
  const fila = validarFila(datos, 0);
  let resolver!: (r: Response) => void;
  const fetchMock = vi.fn().mockResolvedValueOnce(Response.json({ filas: [fila] })).mockImplementationOnce(() => new Promise<Response>(resolve => { resolver = resolve; }));
  vi.stubGlobal("fetch", fetchMock);
  const { result } = renderHook(() => useCargaMasiva());
  const archivo = { name: "plantilla.xlsx", size: 100, arrayBuffer: async () => new ArrayBuffer(0) } as File;
  await act(async () => { await result.current.cargarArchivo(archivo); });
  expect(result.current.todasListas).toBe(true);
  act(() => result.current.corregirCampo(0, "modelo", "Desconocido"));
  expect(result.current.todasListas).toBe(false);
  expect(result.current.filasVisibles[0]?.validando).toBe(true);
  act(() => result.current.cancelar());
  await act(async () => { resolver(Response.json({ filas: [fila] })); });
  await waitFor(() => expect(result.current.estado).toBe("idle"));
  expect(result.current.filasVisibles).toEqual([]);
});

it("reanuda una carga pendiente y actualiza el estado a checkout", async () => {
  const cargaId = "92200000-0000-4000-8000-000000000010";
  const fetchMock = vi.fn().mockResolvedValue(
    Response.json({
      id: cargaId,
      clientSecret: "cs_test_retome",
      totalMXN: 3500,
      cotizaciones: [{ indice: 0, tarifa: 3500, datos: {} }],
    })
  );
  vi.stubGlobal("fetch", fetchMock);

  const { result } = renderHook(() => useCargaMasiva());

  let ok = false;
  await act(async () => {
    ok = await result.current.reanudarCarga(cargaId);
  });

  expect(ok).toBe(true);
  expect(result.current.estado).toBe("checkout");
  expect(result.current.cargaId).toBe(cargaId);
  expect(result.current.stripeClientSecret).toBe("cs_test_retome");
  expect(result.current.totalMXN).toBe(3500);
});

it("descarta la carga pendiente y resetea el estado", async () => {
  const cargaId = "92200000-0000-4000-8000-000000000020";
  const fetchMock = vi.fn().mockResolvedValue(Response.json({ ok: true }));
  vi.stubGlobal("fetch", fetchMock);

  const { result } = renderHook(() => useCargaMasiva());

  await act(async () => {
    await result.current.descartarCargaPendiente(cargaId);
  });

  expect(fetchMock).toHaveBeenCalledWith(
    `/api/viajes/masivos/pendientes?id=${cargaId}`,
    expect.objectContaining({ method: "DELETE" })
  );
  expect(result.current.estado).toBe("idle");
  expect(result.current.cargaId).toBeNull();
});

