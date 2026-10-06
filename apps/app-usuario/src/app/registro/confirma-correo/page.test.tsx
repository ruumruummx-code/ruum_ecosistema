/** @vitest-environment jsdom */
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn()
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
  useSearchParams: () => new URLSearchParams("email=ana%40ejemplo.com")
}));

import PaginaConfirmaCorreo from "./page";

/**
 * La verificación del OTP y el reenvío ahora pasan por el servidor
 * (/api/auth/verify-otp y /api/auth/resend) para que el rate limit no sea
 * sorteable desde el navegador. Estos tests mockean fetch, no el cliente Supabase.
 */
function mockFetchOk() {
  return vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }));
}

function mockFetchError(cuerpo: unknown, status = 400) {
  return vi.fn(async () => new Response(JSON.stringify(cuerpo), { status }));
}

describe("pantalla de confirmación de correo", () => {
  beforeEach(() => {
    mocks.push.mockReset();
    mocks.refresh.mockReset();
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("muestra el código y verifica la cuenta con el correo registrado", async () => {
    const fetchMock = mockFetchOk();
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    render(<PaginaConfirmaCorreo />);

    expect(screen.getByRole("heading", { name: /confirma tu correo electrónico/i })).toBeInTheDocument();
    expect(screen.getByText("Código de verificación", { exact: true })).toBeInTheDocument();
    expect(screen.getByText(/ana@ejemplo.com/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/código de verificación/i), "406156");
    await user.click(screen.getByRole("button", { name: /verificar mi cuenta/i }));

    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/"));
    expect(mocks.refresh).toHaveBeenCalled();

    const llamada = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const [url, init] = llamada;
    expect(url).toBe("/api/auth/verify-otp");
    expect(JSON.parse(String(init.body))).toEqual({ email: "ana@ejemplo.com", codigo: "406156" });
  });

  it("muestra el mensaje del servidor cuando el código es rechazado", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetchError({ error: "No pudimos verificar el código. Revisa que esté escrito correctamente e inténtalo de nuevo." })
    );

    const user = userEvent.setup();
    render(<PaginaConfirmaCorreo />);

    await user.type(screen.getByLabelText(/código de verificación/i), "406156");
    await user.click(screen.getByRole("button", { name: /verificar mi cuenta/i }));

    expect(
      await screen.findByText(/No pudimos verificar el código/i)
    ).toBeInTheDocument();
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("propaga el rate limit del servidor sin pedir el código de nuevo", async () => {
    vi.stubGlobal("fetch", mockFetchError({ error: "Superaste los intentos disponibles para este código. Solicita uno nuevo." }, 429));

    const user = userEvent.setup();
    render(<PaginaConfirmaCorreo />);

    await user.type(screen.getByLabelText(/código de verificación/i), "406156");
    await user.click(screen.getByRole("button", { name: /verificar mi cuenta/i }));

    expect(await screen.findByText(/Superaste los intentos disponibles/i)).toBeInTheDocument();
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("limpia el marcador de storage tras confirmar", async () => {
    const fetchMock = mockFetchOk();
    vi.stubGlobal("fetch", fetchMock);

    window.sessionStorage.setItem("ruum:correo-confirmacion", "ana@ejemplo.com");
    window.localStorage.setItem("ruum:reenvio-confirmacion-hasta", String(Date.now() + 60_000));

    const user = userEvent.setup();
    render(<PaginaConfirmaCorreo />);

    await user.type(screen.getByLabelText(/código de verificación/i), "406156");
    await user.click(screen.getByRole("button", { name: /verificar mi cuenta/i }));

    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/"));
    expect(window.sessionStorage.getItem("ruum:correo-confirmacion")).toBeNull();
    expect(window.localStorage.getItem("ruum:reenvio-confirmacion-hasta")).toBeNull();
  });
});