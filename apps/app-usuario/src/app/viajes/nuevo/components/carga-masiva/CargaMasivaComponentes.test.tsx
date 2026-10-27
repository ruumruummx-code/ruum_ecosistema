/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const pushMock = vi.fn();
const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

vi.mock("@/app/PagoStripe", () => ({
  PagoStripe: ({ onPagado, onEstadoPago }: { onPagado: () => void; onEstadoPago: (s: { listo: boolean; procesando: boolean }) => void }) => (
    <div>
      <button type="button" onClick={() => onEstadoPago({ listo: true, procesando: false })}>
        Marcar Listo
      </button>
      <button type="button" onClick={onPagado}>
        Confirmar Pago Masivo
      </button>
    </div>
  ),
}));

const cargarArchivoMock = vi.fn();
const corregirCampoMock = vi.fn();
const eliminarFilaMock = vi.fn();
const geocodificarYCotizarMock = vi.fn();
const confirmarPagoMock = vi.fn();
const cancelarMock = vi.fn();
const reanudarCargaMock = vi.fn();
const descartarCargaPendienteMock = vi.fn();
const consultarEstadoPagoMock = vi.fn();

let hookState = {
  estado: "idle" as "idle" | "parseando" | "resultados" | "geocodificando" | "cotizando" | "checkout",
  error: null as string | null,
  filasVisibles: [] as Array<{
    indice: number;
    estado: "correcto" | "error";
    datos: Record<string, string>;
    errores?: Record<string, string>;
    errorCotizacion?: string;
    tarifa?: number;
    distanciaKm?: number;
    eliminada?: boolean;
    validando?: boolean;
  }>,
  filasConError: [] as Array<{ indice: number }>,
  filasCorrectas: [] as Array<{ indice: number }>,
  totalMXN: 4500,
  todasListas: true,
  progreso: 50,
  pagoConfirmado: false,
  cargaId: "carga-1" as string | null,
  stripeClientSecret: "pi_secret_1" as string | null,
  cargarArchivo: cargarArchivoMock,
  corregirCampo: corregirCampoMock,
  eliminarFila: eliminarFilaMock,
  geocodificarYCotizar: geocodificarYCotizarMock,
  confirmarPago: confirmarPagoMock,
  cancelar: cancelarMock,
  cargaPendienteStorage: null as { id: string } | null,
  reanudarCarga: reanudarCargaMock,
  descartarCargaPendiente: descartarCargaPendienteMock,
  consultarEstadoPago: consultarEstadoPagoMock,
};

vi.mock("../../hooks/useCargaMasiva", () => ({
  useCargaMasiva: () => hookState,
}));

import { BottomSheetCargaMasiva, TablaCorreccionMasiva, CheckoutMasivo } from "./index";

describe("Módulo de Carga Masiva (BottomSheetCargaMasiva, TablaCorreccionMasiva, CheckoutMasivo)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hookState = {
      estado: "idle",
      error: "Formato previo no válido",
      filasVisibles: [
        {
          indice: 0,
          estado: "correcto",
          datos: {
            origenCodigoPostal: "06700",
            destinoCodigoPostal: "64000",
            marca: "Honda",
            modelo: "Civic",
            anio: "2023",
          },
          tarifa: 2500,
          distanciaKm: 910.4,
        },
        {
          indice: 1,
          estado: "error",
          datos: {
            origenCodigoPostal: "00000",
            destinoCodigoPostal: "64000",
            marca: "Nissan",
            modelo: "Versa",
          },
          errores: { origenCodigoPostal: "CP inválido" },
          errorCotizacion: "Ruta no disponible",
          validando: true,
        },
      ],
      filasConError: [{ indice: 1 }],
      filasCorrectas: [{ indice: 0 }],
      totalMXN: 2500,
      todasListas: true,
      progreso: 60,
      pagoConfirmado: false,
      cargaId: "carga-1",
      stripeClientSecret: "pi_secret_1",
      cargarArchivo: cargarArchivoMock,
      corregirCampo: corregirCampoMock,
      eliminarFila: eliminarFilaMock,
      geocodificarYCotizar: geocodificarYCotizarMock,
      confirmarPago: confirmarPagoMock,
      cancelar: cancelarMock,
      cargaPendienteStorage: { id: "pend-1" },
      reanudarCarga: reanudarCargaMock,
      descartarCargaPendiente: descartarCargaPendienteMock,
      consultarEstadoPago: consultarEstadoPagoMock,
    };
    consultarEstadoPagoMock.mockResolvedValue({ pagado: true });
  });

  it("maneja estado idle con archivo, carga pendiente y estados de progreso/resultados/checkout/confirmado", async () => {
    const user = userEvent.setup();
    const onCerrar = vi.fn();

    const { rerender, container } = render(<BottomSheetCargaMasiva onCerrar={onCerrar} />);

    // Reanudar y descartar carga pendiente
    await user.click(screen.getByRole("button", { name: "Reanudar carga pendiente" }));
    expect(reanudarCargaMock).toHaveBeenCalledWith({ id: "pend-1" });
    await user.click(screen.getByRole("button", { name: "Descartar y nueva carga" }));
    expect(descartarCargaPendienteMock).toHaveBeenCalledWith({ id: "pend-1" });

    // Subir archivo
    const input = container.querySelector("#masivo-file-input") as HTMLInputElement;
    const xlsx = new File(["datos"], "viajes.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    fireEvent.change(input, { target: { files: [xlsx] } });
    expect(cargarArchivoMock).toHaveBeenCalledWith(xlsx);

    // Estado: geocodificando
    hookState = { ...hookState, estado: "geocodificando" };
    rerender(<BottomSheetCargaMasiva onCerrar={onCerrar} />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();

    // Estado: resultados (TablaCorreccionMasiva)
    hookState = { ...hookState, estado: "resultados" };
    rerender(<BottomSheetCargaMasiva onCerrar={onCerrar} />);
    expect(screen.getByText(/Honda Civic/)).toBeInTheDocument();

    // Expandir fila 2, editar campo y omitir fila
    await user.click(screen.getByRole("button", { name: /#2 · Nissan Versa/i }));
    await user.click(screen.getByRole("button", { name: /Editar CP Origen/i }));
    const editInput = screen.getByLabelText("Editar CP Origen");
    await user.clear(editInput);
    await user.type(editInput, "06700{Enter}");
    expect(corregirCampoMock).toHaveBeenCalledWith(1, "origenCodigoPostal", "06700");

    await user.click(screen.getByRole("button", { name: "Omitir esta fila" }));
    expect(eliminarFilaMock).toHaveBeenCalledWith(1);

    await user.click(screen.getByRole("button", { name: /Continuar parcial/i }));
    await user.click(screen.getByRole("button", { name: /Cotizar 1 traslado/i }));
    expect(geocodificarYCotizarMock).toHaveBeenCalled();

    // Estado: checkout (CheckoutMasivo)
    hookState = { ...hookState, estado: "checkout" };
    rerender(<BottomSheetCargaMasiva onCerrar={onCerrar} />);
    await user.click(screen.getByRole("button", { name: "Marcar Listo" }));
    await user.click(screen.getByRole("button", { name: "Confirmar Pago Masivo" }));
    await waitFor(() => {
      expect(confirmarPagoMock).toHaveBeenCalled();
      expect(pushMock).toHaveBeenCalledWith("/mis-viajes");
    });

    // Estado: pagoConfirmado
    hookState = { ...hookState, pagoConfirmado: true };
    rerender(<BottomSheetCargaMasiva onCerrar={onCerrar} />);
    expect(screen.getByText("¡Carga masiva procesada!")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Ver mis traslados" }));
    expect(cancelarMock).toHaveBeenCalled();
    expect(onCerrar).toHaveBeenCalled();
  });

  it("renderiza TablaCorreccionMasiva vacía y CheckoutMasivo sin cargaId", () => {
    const { container } = render(
      <TablaCorreccionMasiva filas={[]} onCorregir={vi.fn()} onEliminar={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();

    render(
      <CheckoutMasivo
        filas={hookState.filasVisibles as never}
        totalMXN={2500}
        onEstadoPago={vi.fn()}
        onPagado={vi.fn()}
      />
    );
    expect(screen.getByText("Preparando el pago masivo…")).toBeInTheDocument();
  });
});
