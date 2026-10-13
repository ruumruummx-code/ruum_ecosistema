/** @vitest-environment jsdom */
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  fetchMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
  usePathname: () => "/registro",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/supabase-browser", () => ({
  tieneSupabaseConfigurado: () => true,
}));

import PaginaRegistro from "./page";

describe("registro — accesibilidad de errores y flujo de verificación telefónica SMS", () => {
  beforeEach(() => {
    mocks.push.mockReset();
    mocks.refresh.mockReset();
    mocks.fetchMock.mockReset();

    // Mock por defecto de fetch para los endpoints involucrados
    mocks.fetchMock.mockImplementation(async (url: string | URL | Request) => {
      const urlStr = String(url);
      if (urlStr.includes("/api/auth/phone-verify/send")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ ok: true, status: "pending" }),
        };
      }
      if (urlStr.includes("/api/auth/phone-verify/verify")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ ok: true, status: "approved", token: "token-firmado-valido" }),
        };
      }
      if (urlStr.includes("/api/auth/signup")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ ok: true, requiereConfirmacion: false, correo: "ana@ejemplo.com" }),
        };
      }
      return { ok: true, status: 200, json: async () => ({}) };
    });

    vi.stubGlobal("fetch", mocks.fetchMock);
    window.sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  async function completarPaso1ConOtp(user: ReturnType<typeof userEvent.setup>) {
    await user.type(screen.getByLabelText(/^nombre$/i), "Carlos");
    await user.type(screen.getByLabelText(/^apellido$/i), "Mendoza");
    await user.type(screen.getByLabelText(/teléfono celular/i), "5512345678");
    await user.click(screen.getByRole("button", { name: /continuar/i }));

    const inputOtp = await screen.findByLabelText(/código de verificación sms/i);
    await user.type(inputOtp, "123456");
    await user.click(screen.getByRole("button", { name: /verificar y continuar/i }));
  }

  it("asocia el error al campo y mueve el foco cuando falta el nombre", async () => {
    const user = userEvent.setup();
    render(<PaginaRegistro />);

    await user.click(screen.getByRole("button", { name: /continuar/i }));

    const nombre = await screen.findByLabelText(/^nombre$/i);
    await waitFor(() => expect(nombre).toHaveAttribute("aria-invalid", "true"));
    expect(nombre).toHaveFocus();
    expect(screen.getByText("Escribe tu nombre.")).toHaveAttribute("role", "alert");
    expect(mocks.fetchMock).not.toHaveBeenCalled();
  });

  it("el mensaje de error queda enlazado al campo vía aria-describedby", async () => {
    const user = userEvent.setup();
    render(<PaginaRegistro />);

    await user.click(screen.getByRole("button", { name: /continuar/i }));

    const nombre = await screen.findByLabelText(/^nombre$/i);
    const descritoPor = nombre.getAttribute("aria-describedby");
    expect(descritoPor).toBeTruthy();
    const mensaje = document.getElementById(descritoPor as string);
    expect(mensaje).toHaveTextContent("Escribe tu nombre.");
  });

  it("valida el teléfono de 10 dígitos con mensaje en el campo", async () => {
    const user = userEvent.setup();
    render(<PaginaRegistro />);

    await user.type(screen.getByLabelText(/^nombre$/i), "Carlos");
    await user.type(screen.getByLabelText(/^apellido$/i), "Mendoza");
    await user.type(screen.getByLabelText(/teléfono celular/i), "5512");
    await user.click(screen.getByRole("button", { name: /continuar/i }));

    const telefono = screen.getByLabelText(/teléfono celular/i);
    await waitFor(() => expect(telefono).toHaveAttribute("aria-invalid", "true"));
    expect(screen.getByText("El teléfono debe tener 10 dígitos.")).toBeInTheDocument();
  });

  it("abre modal de verificación SMS al hacer clic en Continuar con datos válidos", async () => {
    const user = userEvent.setup();
    render(<PaginaRegistro />);

    await user.type(screen.getByLabelText(/^nombre$/i), "Carlos");
    await user.type(screen.getByLabelText(/^apellido$/i), "Mendoza");
    await user.type(screen.getByLabelText(/teléfono celular/i), "5512345678");
    await user.click(screen.getByRole("button", { name: /continuar/i }));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/verifica tu número celular/i)).toBeInTheDocument();
    expect(screen.getByText(/\+52 55 1234 5678/)).toBeInTheDocument();
  });

  it("muestra error en el modal de verificación si el código OTP falla", async () => {
    mocks.fetchMock.mockImplementation(async (url: string | URL | Request) => {
      const urlStr = String(url);
      if (urlStr.includes("/api/auth/phone-verify/send")) {
        return { ok: true, json: async () => ({ ok: true, status: "pending" }) };
      }
      if (urlStr.includes("/api/auth/phone-verify/verify")) {
        return {
          ok: false,
          status: 400,
          json: async () => ({ error: "El código ingresado es incorrecto." }),
        };
      }
      return { ok: true, json: async () => ({}) };
    });

    const user = userEvent.setup();
    render(<PaginaRegistro />);

    await user.type(screen.getByLabelText(/^nombre$/i), "Carlos");
    await user.type(screen.getByLabelText(/^apellido$/i), "Mendoza");
    await user.type(screen.getByLabelText(/teléfono celular/i), "5512345678");
    await user.click(screen.getByRole("button", { name: /continuar/i }));

    const inputOtp = await screen.findByLabelText(/código de verificación sms/i);
    await user.type(inputOtp, "000000");
    await user.click(screen.getByRole("button", { name: /verificar y continuar/i }));

    expect(await screen.findByText("El código ingresado es incorrecto.")).toBeInTheDocument();
  });

  it("avanza al paso 2 y lleva el foco al correo tras verificar exitosamente", async () => {
    const user = userEvent.setup();
    render(<PaginaRegistro />);

    await completarPaso1ConOtp(user);

    const correo = await screen.findByLabelText(/correo electrónico/i);
    await waitFor(() => expect(correo).toHaveFocus());
  });

  it("asocia el error de confirmación de contraseña al campo correcto", async () => {
    const user = userEvent.setup();
    render(<PaginaRegistro />);

    await completarPaso1ConOtp(user);

    await screen.findByLabelText(/correo electrónico/i);
    await user.type(screen.getByLabelText(/correo electrónico/i), "ana@ejemplo.com");
    await user.type(screen.getByLabelText(/^contraseña$/i), "Secreto123");
    await user.type(screen.getByLabelText(/confirmar contraseña/i), "Otra999");
    await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

    const confirmar = screen.getByLabelText(/confirmar contraseña/i);
    await waitFor(() => expect(confirmar).toHaveAttribute("aria-invalid", "true"));
    expect(confirmar).toHaveFocus();
  });

  it("exige aceptar términos y enfoca el checkbox", async () => {
    const user = userEvent.setup();
    render(<PaginaRegistro />);

    await completarPaso1ConOtp(user);

    await screen.findByLabelText(/correo electrónico/i);
    await user.type(screen.getByLabelText(/correo electrónico/i), "ana@ejemplo.com");
    await user.type(screen.getByLabelText(/^contraseña$/i), "Secreto123");
    await user.type(screen.getByLabelText(/confirmar contraseña/i), "Secreto123");
    await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

    const check = await screen.findByRole("checkbox");
    await waitFor(() => expect(check).toHaveAttribute("aria-invalid", "true"));
    expect(check).toHaveFocus();
    expect(screen.getByText("Acepta los términos para continuar.")).toBeInTheDocument();
  });

  it("envía el registro con tokenVerificacionTelefono cuando la validación pasa", async () => {
    const user = userEvent.setup();
    render(<PaginaRegistro />);

    await completarPaso1ConOtp(user);

    await screen.findByLabelText(/correo electrónico/i);
    await user.type(screen.getByLabelText(/correo electrónico/i), "ana@ejemplo.com");
    await user.type(screen.getByLabelText(/^contraseña$/i), "Secreto123");
    await user.type(screen.getByLabelText(/confirmar contraseña/i), "Secreto123");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

    await waitFor(() => {
      const signupCall = mocks.fetchMock.mock.calls.find(
        (call: any[]) => typeof call[0] === "string" && (call[0] as string).includes("/api/auth/signup")
      );
      expect(signupCall).toBeTruthy();
      const body = JSON.parse((signupCall?.[1]?.body as string) || "{}");
      expect(body.tokenVerificacionTelefono).toBe("token-firmado-valido");
      expect(body.telefono).toBe("5512345678");
    });

    expect(mocks.push).toHaveBeenCalledWith("/");
  });
});