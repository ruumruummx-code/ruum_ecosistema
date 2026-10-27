/** @vitest-environment jsdom */
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useCargaMasiva, fetchConReintento } from "./useCargaMasiva";
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
it("recupera un lote cobrado sin montar otro formulario de pago", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ id: "lote-cobrado", cobrado: true, cotizaciones: [], totalMXN: 500 }, { status: 202 })));
  const { result } = renderHook(() => useCargaMasiva());
  await act(async () => { expect(await result.current.reanudarCarga("lote-cobrado")).toBe(true); });
  expect(result.current.estado).toBe("checkout");
  expect(result.current.pagoEnConciliacion).toBe(true);
  expect(result.current.stripeClientSecret).toBeNull();
});
it("distingue una lista vacía de una consulta rechazada", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(Response.json({ pendientes: [] })).mockResolvedValueOnce(Response.json({ error: "Sesión expirada" }, { status: 401 })));
  const { result } = renderHook(() => useCargaMasiva());
  await expect(result.current.consultarCargasPendientes()).resolves.toEqual([]);
  await expect(result.current.consultarCargasPendientes()).rejects.toThrow("Sesión expirada");
});
it("no interpreta una respuesta inválida como una lista vacía", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ mensaje: "Sin lista" })));
  const { result } = renderHook(() => useCargaMasiva());
  await expect(result.current.consultarCargasPendientes()).rejects.toThrow("respuesta inválida");
});
it("guarda varios campos juntos y conserva el motivo del servidor si falla la revalidación", async () => {
  const datos = normalizarFilaPlantilla({ vehiculo_marca: "Nissan", vehiculo_modelo: "Versa", vehiculo_anio: "1800" });
  const fila = validarFila(datos, 0);
  const fetchMock = vi.fn().mockResolvedValueOnce(Response.json({ filas: [fila] })).mockResolvedValueOnce(Response.json({ error: "Catálogo vehicular temporalmente no disponible" }, { status: 503 }));
  vi.stubGlobal("fetch", fetchMock);
  const { result } = renderHook(() => useCargaMasiva());
  await act(async () => { await result.current.cargarArchivo({ name: "plantilla.xlsx", size: 100, arrayBuffer: async () => new ArrayBuffer(0) } as File); });
  act(() => result.current.corregirCampos(0, { anio: "2024", origen_calle: "Reforma" }));
  await waitFor(() => expect(result.current.filasVisibles[0]?.validando).toBe(false));
  expect(fetchMock).toHaveBeenCalledTimes(2);
  const enviados = JSON.parse(fetchMock.mock.calls[1]![1].body).filas[0];
  expect(enviados).toMatchObject({ anio: "2024", origen_calle: "Reforma" });
  const revisada = result.current.filasVisibles[0]!;
  expect(revisada.errorCotizacion).toBe("Catálogo vehicular temporalmente no disponible");
  expect(revisada.errores.vehiculo_placas).toBe("Captura placas o VIN");
  expect(revisada.errores.anio).toBeUndefined();
  expect(result.current.todasListas).toBe(false);
});

it("conserva el estado del lote si el servidor rechaza el descarte", async () => {
  const fetchMock = vi.fn().mockResolvedValueOnce(Response.json({ clientSecret: "cs_test", totalMXN: 500, cotizaciones: [] })).mockResolvedValueOnce(Response.json({ error: "No se puede descartar este lote" }, { status: 409 }));
  vi.stubGlobal("fetch", fetchMock);
  const { result } = renderHook(() => useCargaMasiva());
  await act(async () => { await result.current.reanudarCarga("lote-1"); });
  await act(async () => { await expect(result.current.descartarCargaPendiente("lote-1")).rejects.toThrow("No se puede descartar este lote"); });
  expect(result.current.cargaId).toBe("lote-1");
  expect(result.current.estado).toBe("checkout");
});

it("conserva los errores de cotización parcial y sus índices originales", async () => {
  const datos = normalizarFilaPlantilla({ vehiculo_marca: "Toyota", vehiculo_modelo: "Corolla" });
  const iniciales = [
    { ...validarFila(datos, 0), estado: "correcto", errores: {} },
    { ...validarFila(datos, 1), estado: "error", errores: { anio: "Año inválido" } },
    { ...validarFila(datos, 2), estado: "correcto", errores: {} },
  ];
  const fetchMock = vi.fn().mockResolvedValueOnce(Response.json({ filas: iniciales })).mockResolvedValueOnce(Response.json({ id: "parcial", clientSecret: "cs_test", totalMXN: 500, cotizaciones: [{ ...iniciales[2], indice: 1, tarifa: 500 }], filasConError: [{ ...iniciales[0], indice: 0, errorCotizacion: "No se encontró ruta para el origen" }] }));
  vi.stubGlobal("fetch", fetchMock);
  const { result } = renderHook(() => useCargaMasiva());
  await act(async () => { await result.current.cargarArchivo({ name: "plantilla.xlsx", size: 100, arrayBuffer: async () => new ArrayBuffer(0) } as File); });
  await act(async () => { await result.current.cotizarSoloValidas(); });
  expect(result.current.filasVisibles.find(f => f.tarifa === 500)?.indice).toBe(2);
  expect(result.current.filasConError.map(f => f.indice).sort()).toEqual([0, 1]);
  expect(result.current.filasConError.find(f => f.indice === 0)?.errorCotizacion).toBe("No se encontró ruta para el origen");
});

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
  await waitFor(() => expect(resolver).toBeTypeOf("function"));
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

it("fetchConReintento reintenta hasta 3 veces ante error 429 y tiene éxito", async () => {
  let intentos = 0;
  const fetchMock = vi.fn().mockImplementation(async () => {
    intentos++;
    if (intentos < 3) {
      return new Response(JSON.stringify({ error: "Rate limit" }), { status: 429 });
    }
    return Response.json({ pagado: true });
  });
  vi.stubGlobal("fetch", fetchMock);

  const res = await fetchConReintento("/api/test", {}, 3, 10);
  const data = await res.json();
  expect(intentos).toBe(3);
  expect(data.pagado).toBe(true);
});

it("consultarEstadoPago reintenta ante errores y devuelve estado pagado", async () => {
  let intentos = 0;
  const fetchMock = vi.fn().mockImplementation(async () => {
    intentos++;
    if (intentos === 1) {
      return new Response(JSON.stringify({ error: "Temporal" }), { status: 503 });
    }
    return Response.json({ pagado: true });
  });
  vi.stubGlobal("fetch", fetchMock);

  const { result } = renderHook(() => useCargaMasiva());
  let res: { pagado: boolean } | undefined;
  await act(async () => {
    res = await result.current.consultarEstadoPago("carga-123");
  });
  expect(intentos).toBe(2);
  expect(res?.pagado).toBe(true);
});

it("asigna estadoGranular 'pendiente' y 'error' y cotizarSoloValidas procesa únicamente las filas válidas", async () => {
  const datosValidos = normalizarFilaPlantilla({
    vehiculo_marca: "Toyota",
    vehiculo_modelo: "Corolla",
    vehiculo_anio: "2023",
    vehiculo_placas: "XYZ789",
    origen_codigo_postal: "06700",
    destino_codigo_postal: "04360",
    condicion: "seminueva",
    contacto_entrega_nombre: "Remitente",
    contacto_entrega_telefono: "5512345678",
    contacto_recepcion_nombre: "Destinatario",
    contacto_recepcion_telefono: "5512345679",
    origen_calle: "Insurgentes",
    origen_numero: "100",
    origen_colonia: "Roma Sur",
    destino_calle: "Universidad",
    destino_numero: "200",
    destino_colonia: "Copilco",
  });
  const filaValida = { ...validarFila(datosValidos, 0), estado: "correcto" as const };
  const filaInvalida = {
    ...validarFila(datosValidos, 1),
    estado: "error" as const,
    errores: { origen_codigo_postal: "Código postal inválido" },
  };

  const fetchMock = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
    if (url.includes("/api/viajes/masivos/validate")) {
      return Response.json({ filas: [filaValida, filaInvalida] });
    }
    if (url.includes("/api/viajes/masivos/cotizar")) {
      const body = JSON.parse(init?.body as string);
      expect(body.permitirParcial).toBe(true);
      expect(body.filas).toHaveLength(1);
      return Response.json({
        id: "carga-parcial-123",
        clientSecret: "pi_secret_parcial",
        totalMXN: 2400,
        cotizaciones: [{ indice: 0, tarifa: 2400, datos: datosValidos }],
        filasConError: [filaInvalida],
      });
    }
    return Response.json({});
  });
  vi.stubGlobal("fetch", fetchMock);

  const { result } = renderHook(() => useCargaMasiva());
  const archivo = { name: "mi_plantilla.xlsx", size: 100, arrayBuffer: async () => new ArrayBuffer(0) } as File;

  await act(async () => {
    await result.current.cargarArchivo(archivo);
  });

  expect(result.current.filasVisibles[0]?.estadoGranular).toBe("pendiente");
  expect(result.current.filasVisibles[1]?.estadoGranular).toBe("error");
  expect(result.current.filasCotizables).toHaveLength(1);
  expect(result.current.filasConError).toHaveLength(1);

  await act(async () => {
    await result.current.cotizarSoloValidas();
  });

  expect(result.current.estado).toBe("checkout");
  expect(result.current.totalMXN).toBe(2400);
  expect(result.current.cargaId).toBe("carga-parcial-123");
});


