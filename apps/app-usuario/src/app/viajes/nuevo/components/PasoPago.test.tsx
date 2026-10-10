/** @vitest-environment jsdom */
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PasoPago, type PasoPagoProps } from "./PasoPago";

vi.mock("@/app/PagoStripe", () => ({
  PagoStripe: ({ trasladoId, monto }: { trasladoId: string; monto: number }) => (
    <button type="button">Pagar {trasladoId} {monto}</button>
  )
}));

const propsBase: PasoPagoProps = {
  trasladoCreado: { id: "traslado-1", tipoPago: "al_cierre", precioCotizado: 1200 },
  pagoConfirmado: false,
  verificandoPago: false,
  errorVerificacionPago: null,
  onPagoStripeConfirmado: vi.fn(),
  onReintentarVerificacion: vi.fn(),
  errorAceptacion: null,
  onReintentarAceptacion: vi.fn(),
  aceptandoCotizacion: false,
  cotizacionAceptada: true,
  datos: {
    marca: "Nissan",
    modelo: "Versa",
    anio: "2022",
    origenCiudad: "CDMX",
    destinoCiudad: "Guadalajara",
    modalidadProgramacion: "lo_antes_posible",
    fechaHoraProgramada: "",
  } as PasoPagoProps["datos"],
  rutaEstimacion: null,
};

describe("PasoPago", () => {
  it("muestra Stripe al concluir una solicitud con tarifa, aunque el registro legado indique al_cierre", () => {
    render(<PasoPago {...propsBase} />);

    expect(screen.getByText(/Completa el pago seguro con Stripe/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Pagar traslado-1 1200/i })).toBeInTheDocument();
    expect(screen.queryByText(/pago al cierre/i)).not.toBeInTheDocument();
  });

  it("muestra el resumen y el total antes del pago", () => {
    render(<PasoPago {...propsBase} />);

    expect(screen.getByText("Nissan Versa 2022")).toBeInTheDocument();
    expect(screen.getByText("CDMX → Guadalajara")).toBeInTheDocument();
    expect(screen.getByLabelText(/Total a pagar/i)).toBeInTheDocument();
  });

  it("solo muestra éxito con pago verificado y folio real", () => {
    render(<PasoPago {...propsBase} pagoConfirmado />);

    expect(screen.getByText("¡Traslado solicitado!")).toBeInTheDocument();
    expect(screen.getByText("#RR-TRAS")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Ver pasaporte/i })).toHaveAttribute("href", "/viajes/traslado-1");
    expect(screen.queryByRole("button", { name: /Pagar traslado-1 1200/i })).not.toBeInTheDocument();
  });

  it("muestra estado de verificación y reintento ante error", () => {
    const { rerender } = render(<PasoPago {...propsBase} verificandoPago />);

    expect(screen.getByText(/Confirmando tu pago con Stripe/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Pagar traslado-1 1200/i })).not.toBeInTheDocument();

    rerender(<PasoPago {...propsBase} errorVerificacionPago="Aún no vemos tu pago confirmado." />);

    expect(screen.getByText("Aún no vemos tu pago confirmado.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Verificar pago/i })).toBeInTheDocument();
  });
});
