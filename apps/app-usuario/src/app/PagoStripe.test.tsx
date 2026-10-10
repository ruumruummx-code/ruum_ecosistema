/** @vitest-environment jsdom */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// P1 (SENTRY_ALERTS: fallos de pago Stripe): el cobro estaba 100% mockeado
// (PasoPago.test hace vi.mock("@/app/PagoStripe")). Estos tests ejercen el
// componente real con Stripe Elements mockeado en el borde.

const stripeMocks = vi.hoisted(() => ({
  confirmPayment: vi.fn(),
  loadStripe: vi.fn(),
  Elements: vi.fn(({ children }: { children: React.ReactNode }) => <>{children}</>),
  PaymentElement: vi.fn(() => <div data-testid="payment-element" />),
}));

vi.mock("@stripe/react-stripe-js", () => ({
  Elements: stripeMocks.Elements,
  PaymentElement: stripeMocks.PaymentElement,
  useStripe: () => ({ confirmPayment: stripeMocks.confirmPayment }),
  useElements: () => ({}),
}));

vi.mock("@stripe/stripe-js", () => ({
  loadStripe: (...args: unknown[]) => stripeMocks.loadStripe(...args),
}));

const supabaseMocks = vi.hoisted(() => ({
  sesion: { access_token: "tok-test" } as unknown,
  errorSesion: null as unknown,
}));

vi.mock("@/lib/supabase-browser", () => ({
  crearClienteNavegador: vi.fn(() => ({
    auth: {
      getSession: vi.fn(async () => ({
        data: { session: supabaseMocks.sesion },
        error: supabaseMocks.errorSesion,
      })),
    },
  })),
}));

function respuestaPaymentIntent(cuerpo: unknown, status = 200) {
  return vi.fn(async () => new Response(JSON.stringify(cuerpo), { status }));
}

async function importarPagoStripe() {
  const mod = await import("./PagoStripe");
  return mod.PagoStripe;
}

describe("PagoStripe — cobro real con Elements mockeado en el borde", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", "pk_test_123");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://mock.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-test");
    stripeMocks.confirmPayment.mockReset().mockResolvedValue({ paymentIntent: { status: "succeeded" } });
    stripeMocks.loadStripe.mockReset().mockResolvedValue({ fake: "stripe" });
    supabaseMocks.sesion = { access_token: "tok-test" } as unknown;
    supabaseMocks.errorSesion = null;
    vi.stubGlobal("fetch", respuestaPaymentIntent({ clientSecret: "cs_test_123" }));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("rechaza monto no positivo sin llamar a la función de pago", async () => {
    const PagoStripe = await importarPagoStripe();
    const fetchMock = vi.mocked(fetch);
    render(<PagoStripe trasladoId="t-1" monto={0} onPagado={vi.fn()} />);
    expect(await screen.findByText(/tarifa no válida/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("pide configurar la clave pública si falta", async () => {
    vi.stubEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", "");
    const PagoStripe = await importarPagoStripe();
    render(<PagoStripe trasladoId="t-1" monto={500} onPagado={vi.fn()} />);
    expect(await screen.findByText(/NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY/)).toBeInTheDocument();
  });

  it("reconcilia pago ya confirmado sin montar Elements y avisa una vez", async () => {
    vi.stubGlobal("fetch", respuestaPaymentIntent({ pagoConfirmado: true }));
    const PagoStripe = await importarPagoStripe();
    const onPagado = vi.fn();
    const vista = render(<PagoStripe trasladoId="t-1" monto={500} onPagado={onPagado} />);
    await waitFor(() => expect(onPagado).toHaveBeenCalledTimes(1));
    expect(screen.queryByTestId("payment-element")).toBeNull();
    vista.rerender(<PagoStripe trasladoId="t-1" monto={500} onPagado={onPagado} />);
    expect(onPagado).toHaveBeenCalledTimes(1);
  });

  it("monta Elements con el clientSecret devuelto", async () => {
    const PagoStripe = await importarPagoStripe();
    render(<PagoStripe trasladoId="t-1" monto={500} onPagado={vi.fn()} />);
    expect(await screen.findByTestId("payment-element")).toBeInTheDocument();
    expect(stripeMocks.loadStripe).toHaveBeenCalledWith("pk_test_123");
  });

  it("traduce 'Failed to load Stripe.js' a mensaje de adblocker/conexión", async () => {
    stripeMocks.loadStripe.mockRejectedValueOnce(new Error("Failed to load Stripe.js"));
    const PagoStripe = await importarPagoStripe();
    render(<PagoStripe trasladoId="t-1" monto={500} onPagado={vi.fn()} />);
    expect(await screen.findByText(/bloqueador de anuncios/i)).toBeInTheDocument();
  });

  it("falla si loadStripe resuelve null", async () => {
    stripeMocks.loadStripe.mockResolvedValueOnce(null);
    const PagoStripe = await importarPagoStripe();
    render(<PagoStripe trasladoId="t-1" monto={500} onPagado={vi.fn()} />);
    expect(await screen.findByText(/no fue posible inicializar stripe/i)).toBeInTheDocument();
  });

  it("sesión expirada bloquea antes de llamar a la función de pago", async () => {
    supabaseMocks.sesion = null;
    const PagoStripe = await importarPagoStripe();
    const fetchMock = vi.mocked(fetch);
    render(<PagoStripe trasladoId="t-1" monto={500} onPagado={vi.fn()} />);
    expect(await screen.findByText(/sesión expiró/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("confirmPayment succeeded llama onPagado", async () => {
    const PagoStripe = await importarPagoStripe();
    const onPagado = vi.fn();
    const user = userEvent.setup();
    render(<PagoStripe trasladoId="t-1" monto={500} onPagado={onPagado} />);
    await screen.findByTestId("payment-element");
    await user.click(screen.getByRole("button", { name: /pagar y confirmar traslado/i }));
    await waitFor(() => expect(onPagado).toHaveBeenCalledTimes(1));
    expect(stripeMocks.confirmPayment).toHaveBeenCalledWith(
      expect.objectContaining({ redirect: "if_required" })
    );
  });

  it("error de confirmPayment muestra el mensaje y libera el botón", async () => {
    stripeMocks.confirmPayment.mockResolvedValueOnce({ error: { message: "Tarjeta rechazada." } });
    const PagoStripe = await importarPagoStripe();
    const onPagado = vi.fn();
    const user = userEvent.setup();
    render(<PagoStripe trasladoId="t-1" monto={500} onPagado={onPagado} />);
    await screen.findByTestId("payment-element");
    const boton = screen.getByRole("button", { name: /pagar y confirmar traslado/i });
    await user.click(boton);
    expect(await screen.findByText(/tarjeta rechazada/i)).toBeInTheDocument();
    expect(onPagado).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /pagar y confirmar traslado/i })).toBeEnabled();
  });

  it("reintentar tras error vuelve a iniciar el cobro", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockRejectedValueOnce(new Error("caída de red"))
        .mockImplementation(respuestaPaymentIntent({ clientSecret: "cs_test_123" }).getMockImplementation()!)
    );
    const PagoStripe = await importarPagoStripe();
    const user = userEvent.setup();
    render(<PagoStripe trasladoId="t-1" monto={500} onPagado={vi.fn()} />);
    expect(await screen.findByText(/caída de red/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /reintentar/i }));
    expect(await screen.findByTestId("payment-element")).toBeInTheDocument();
  });
});
