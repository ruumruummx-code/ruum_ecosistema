// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  obtenerConductorActual: vi.fn(),
  obtenerGananciasConductor: vi.fn(),
  crearClienteNavegador: vi.fn(() => ({}) as never),
  tieneSupabaseConfigurado: vi.fn(() => true)
}));

vi.mock("@/lib/supabase-browser", () => ({
  crearClienteNavegador: mocks.crearClienteNavegador,
  tieneSupabaseConfigurado: mocks.tieneSupabaseConfigurado
}));

vi.mock("@ruum/api/services", () => ({
  obtenerConductorActual: mocks.obtenerConductorActual,
  obtenerGananciasConductor: mocks.obtenerGananciasConductor
}));

vi.mock("next/link", () => ({ default: ({ children }: { children?: unknown }) => children }));
vi.mock("@ruum/ui", () => ({
  Aviso: () => null,
  Card: () => null,
  FinancialAmount: () => null,
  FinancialCard: () => null
}));
vi.mock("../src/app/panel/PanelSupportSheet", () => ({ PanelSupportSheet: () => null }));

import {
  etiquetaEstadoUnica,
  estatusPayout,
  estatusViaje,
  estaEnRango,
  formatearFecha,
  formatearFechaCorta,
  formatearMoneda,
  formatearRango,
  obtenerRangoPeriodo,
  toDateSafe,
  useEarningsLedger
} from "../src/app/ganancias/useEarningsLedger";

const TRASLADO = {
  id: "traslado-1",
  estado: "servicio_cerrado",
  precio_final: 2000,
  precio_cotizado: 2000,
  ganancia_conductor_congelada: 1700,
  payout_id: null,
  origen_ciudad: "CDMX",
  destino_ciudad: "Toluca",
  cerrado_en: new Date().toISOString(),
  actualizado_en: new Date().toISOString(),
  creado_en: new Date().toISOString(),
  vehiculos: { marca: "Nissan", modelo: "Versa", anio: 2022 }
};

describe("helpers puros de ganancias", () => {
  it("mapea el estado del payout", () => {
    expect(estatusPayout({ estado: "procesado" })).toBe("en_validacion");
    expect(estatusPayout({ estado: "procesado", pagado_en: "2026-10-30", referencia_externa_validada: "bank-verified" })).toBe("pagado");
    expect(estatusPayout({ estado: "pendiente" })).toBe("confirmado");
    expect(estatusPayout({ estado: "pendiente", fecha_prevista: "2026-11-01" } as never)).toBe("programado");
    expect(estatusPayout({ estado: "fallido" })).toBe("rechazado");
  });

  it("mapea el estado del viaje y prioriza el payout enlazado", () => {
    expect(estatusViaje(TRASLADO as never)).toBe("confirmado");
    expect(estatusViaje({ ...TRASLADO, estado: "entrega_confirmada" } as never)).toBe("en_validacion");
    expect(estatusViaje({ ...TRASLADO, estado: "traslado_en_curso" } as never)).toBe("estimado");
    expect(estatusViaje({ ...TRASLADO, estado: "servicio_cancelado" } as never)).toBe("rechazado");
    expect(estatusViaje({ ...TRASLADO, estado: "borrador" } as never)).toBe("sin_calcular");
    expect(
      estatusViaje({ ...TRASLADO, payout_id: "p1" } as never, {
        id: "p1",
        estado: "procesado", pagado_en: "2026-10-30", referencia_externa_validada: "bank-verified"
      } as never)
    ).toBe("pagado");
  });

  it("traduce cada estatus económico a una etiqueta legible", () => {
    expect(etiquetaEstadoUnica("pagado").texto).toBe("Pago transferido");
    expect(etiquetaEstadoUnica("programado").texto).toBe("Depósito programado");
    expect(etiquetaEstadoUnica("confirmado").texto).toBe("Viaje concluido");
    expect(etiquetaEstadoUnica("en_validacion").texto).toBe("En validación");
    expect(etiquetaEstadoUnica("estimado").texto).toBe("En curso / Estimado");
    expect(etiquetaEstadoUnica("rechazado").texto).toBe("En revisión / Retenido");
    expect(etiquetaEstadoUnica("retenido").texto).toBe("En revisión / Retenido");
    expect(etiquetaEstadoUnica("sin_calcular").texto).toBe("Sin calcular");
  });

  it("formatea fechas, moneda y rangos sin romperse con valores inválidos", () => {
    expect(formatearFecha("")).toBe("—");
    expect(formatearFecha("no-es-fecha")).toBe("no-es-fecha");
    expect(formatearFecha("2026-07-17")).toContain("2026");
    expect(formatearFechaCorta("2026-07-17")).toMatch(/jul/i);
    expect(formatearMoneda(1234.5)).toMatch(/1,234\.50/);
    expect(formatearMoneda(null)).toBe("Por calcular");
    expect(formatearMoneda(undefined)).toBe("Por calcular");
    expect(toDateSafe(null)).toBeNull();
    expect(toDateSafe("2026-07-17")?.getFullYear()).toBe(2026);
  });

  it("calcula el rango del periodo activo y su desplazamiento", () => {
    const referencia = new Date("2026-07-17T12:00:00Z");
    const semana = obtenerRangoPeriodo("semana", referencia, 0);
    expect(semana.inicio.getTime()).toBeLessThan(semana.fin.getTime());
    const semanaSiguiente = obtenerRangoPeriodo("semana", referencia, 1);
    expect(semanaSiguiente.inicio.getTime()).toBeGreaterThan(semana.inicio.getTime());
    const mes = obtenerRangoPeriodo("mes", referencia, 0);
    expect(mes.inicio.getDate()).toBe(1);
    const anio = obtenerRangoPeriodo("anio", referencia, 0);
    expect(anio.inicio.getMonth()).toBe(0);
    expect(formatearRango("semana", semana.inicio, semana.fin)).toContain("–");
    expect(formatearRango("mes", mes.inicio, mes.fin)).toBeTruthy();
    expect(formatearRango("anio", anio.inicio, anio.fin)).toBeTruthy();
  });

  it("filtra por rango temporal", () => {
    const inicio = new Date("2026-07-01T00:00:00Z");
    const fin = new Date("2026-07-31T23:59:59Z");
    expect(estaEnRango(new Date("2026-07-15T12:00:00Z"), inicio, fin)).toBe(true);
    expect(estaEnRango(new Date("2026-08-15T12:00:00Z"), inicio, fin)).toBe(false);
    expect(estaEnRango(null, inicio, fin)).toBe(false);
  });
});

describe("useEarningsLedger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.tieneSupabaseConfigurado.mockReturnValue(true);
    mocks.obtenerConductorActual.mockResolvedValue({ id: "conductor-1" });
    mocks.obtenerGananciasConductor.mockResolvedValue({
      datosBancarios: { id: "datos-1" },
      payouts: [],
      traslados: [TRASLADO]
    });
  });

  it("avisa cuando Supabase no está configurado", async () => {
    mocks.tieneSupabaseConfigurado.mockReturnValue(false);

    const { result } = renderHook(() => useEarningsLedger());

    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(result.current.error).toContain("Supabase no está configurado");
    expect(result.current.sinDatosTotales).toBe(false);
  });

  it("carga ganancias y calcula el resumen del periodo", async () => {
    const { result } = renderHook(() => useEarningsLedger());

    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(result.current.error).toBeNull();
    expect(result.current.traslados).toHaveLength(1);
    expect(result.current.registrosTraslados[0]).toMatchObject({
      id: "traslado-1",
      vehiculo: "Nissan Versa 2022",
      precioBase: 2000,
      montoGanado: 1700,
      comisionRuum: 300,
      estatusEconomico: "confirmado"
    });
    expect(result.current.resumen.totalTraslados).toBe(1);
    expect(result.current.resumen.precioBase).toBe(2000);
    expect(result.current.resumen.gananciaNeta).toBe(1700);
    expect(result.current.resumen.depositoAcumulado).toBe(1700);
    expect(result.current.sinDatosTotales).toBe(false);
  });

  it("no carga nada cuando el conductor no existe", async () => {
    mocks.obtenerConductorActual.mockResolvedValue(null);

    const { result } = renderHook(() => useEarningsLedger());

    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(result.current.traslados).toEqual([]);
    expect(result.current.sinDatosTotales).toBe(true);
  });

  it("expone el error cuando la carga falla", async () => {
    mocks.obtenerGananciasConductor.mockRejectedValue(new Error("boom"));

    const { result } = renderHook(() => useEarningsLedger());

    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(result.current.error).toBeTruthy();
  });

  it("cambiar de periodo reinicia el desplazamiento y el viaje expandido", async () => {
    const { result } = renderHook(() => useEarningsLedger());
    await waitFor(() => expect(result.current.cargando).toBe(false));

    act(() => {
      result.current.setViajeExpandido("traslado-1");
      result.current.cambiarPeriodo("mes");
    });

    expect(result.current.periodoActivo).toBe("mes");
    expect(result.current.offsetPeriodo).toBe(0);
    expect(result.current.viajeExpandido).toBeNull();
  });

  it("cuenta dos vehículos idénticos en modelo como 2 unidades distintas usando vehiculo_id (H10)", async () => {
    const ahora = new Date().toISOString();
    const t1 = {
      ...TRASLADO,
      id: "traslado-1",
      vehiculo_id: "auto-uuid-001",
      cerrado_en: ahora
    };
    const t2 = {
      ...TRASLADO,
      id: "traslado-2",
      vehiculo_id: "auto-uuid-002",
      cerrado_en: ahora
    };

    mocks.obtenerGananciasConductor.mockResolvedValue({
      datosBancarios: { id: "datos-1" },
      payouts: [],
      traslados: [t1, t2]
    });

    const { result } = renderHook(() => useEarningsLedger());
    await waitFor(() => expect(result.current.cargando).toBe(false));

    expect(result.current.resumen.totalTraslados).toBe(2);
    // Deben ser 2 vehículos distintos a pesar de tener mismo marca/modelo/año
    expect(result.current.resumen.totalVehiculos).toBe(2);
    // Desglose de viaje no itemizado es null y no cero falso
    expect(result.current.registrosTraslados[0].gastosAutorizados).toBeNull();
    expect(result.current.registrosTraslados[0].bonos).toBeNull();
    expect(result.current.registrosTraslados[0].ajuste).toBeNull();
    expect(result.current.resumen.bonos).toBeNull();
    expect(result.current.resumen.reembolsoGastos).toBeNull();
    expect(result.current.resumen.totalesIncompletos).toBe(true);
  });

  it("marca gananciaNeta y depositoAcumulado como null cuando falta ganancia congelada", async () => {
    const tSinCongelar = {
      ...TRASLADO,
      id: "traslado-sin-congelar",
      ganancia_conductor_congelada: null,
      precio_final: 1500,
      cerrado_en: new Date().toISOString()
    };

    mocks.obtenerGananciasConductor.mockResolvedValue({
      datosBancarios: { id: "datos-1" },
      payouts: [],
      traslados: [tSinCongelar]
    });

    const { result } = renderHook(() => useEarningsLedger());
    await waitFor(() => expect(result.current.cargando).toBe(false));

    expect(result.current.registrosTraslados[0].montoGanado).toBeNull();
    expect(result.current.resumen.totalesIncompletos).toBe(true);
    expect(result.current.resumen.gananciaNeta).toBeNull();
    expect(result.current.resumen.depositoAcumulado).toBeNull();
  });

  it("imputa ajustes de payout según su fecha de liquidación y no por solapamiento amplio (H10)", async () => {
    // Corte que abarca del 1 de octubre al 31 de octubre, pero liquidado el 5 de noviembre
    const payoutCorte = {
      id: "payout-corte-octubre",
      conductor_id: "conductor-1",
      periodo_inicio: "2026-10-01T00:00:00Z",
      periodo_fin: "2026-10-31T23:59:59Z",
      pagado_en: "2026-11-05T12:00:00Z",
      ajustes: 500,
      estado: "procesado"
    };

    mocks.obtenerGananciasConductor.mockResolvedValue({
      datosBancarios: { id: "datos-1" },
      payouts: [payoutCorte],
      traslados: []
    });

    const { result } = renderHook(() => useEarningsLedger());
    await waitFor(() => expect(result.current.cargando).toBe(false));

    // Si hoy es noviembre (o la fecha de imputación está en el rango activo), se incluye el ajuste
    // Al filtrar por un periodo que no incluye la fecha de liquidación (ej. semana anterior a noviembre),
    // el ajuste no se debe imputar solo por solapar el intervalo de trabajo
    const fechaNoviembre = new Date("2026-11-05T12:00:00Z");
    const rangoNov = obtenerRangoPeriodo("mes", fechaNoviembre, 0);
    expect(estaEnRango(new Date("2026-11-05T12:00:00Z"), rangoNov.inicio, rangoNov.fin)).toBe(true);

    const fechaOctubre = new Date("2026-10-15T12:00:00Z");
    const rangoOct = obtenerRangoPeriodo("mes", fechaOctubre, 0);
    // La fecha de liquidación del 5 de nov NO está en el mes de octubre
    expect(estaEnRango(new Date("2026-11-05T12:00:00Z"), rangoOct.inicio, rangoOct.fin)).toBe(false);
  });
});
