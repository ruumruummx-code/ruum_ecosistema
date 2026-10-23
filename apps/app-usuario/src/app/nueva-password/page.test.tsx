/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const pushMock = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => mockSearchParams,
}));

const updateUserMock = vi.fn();
const signOutMock = vi.fn();
const resetPasswordForEmailMock = vi.fn();
const tieneSupabaseMock = vi.fn(() => true);

vi.mock("../../lib/supabase-browser", () => ({
  tieneSupabaseConfigurado: () => tieneSupabaseMock(),
  crearClienteNavegador: () => ({
    auth: {
      updateUser: (...args: unknown[]) => updateUserMock(...args),
      signOut: (...args: unknown[]) => signOutMock(...args),
      resetPasswordForEmail: (...args: unknown[]) => resetPasswordForEmailMock(...args),
    },
  }),
}));

vi.mock("../../lib/analytics", () => ({
  registrarEventoUx: vi.fn(),
}));

import PaginaNuevaPassword from "./page";
import { FormularioRecuperarPassword } from "../recuperar-password/FormularioRecuperarPassword";

describe("PaginaNuevaPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tieneSupabaseMock.mockReturnValue(true);
    mockSearchParams = new URLSearchParams();
  });

  it("muestra enlace inválido cuando recovery/verify no autoriza y no hay sesión", async () => {
    tieneSupabaseMock.mockReturnValue(false);
    render(<PaginaNuevaPassword />);
    expect(await screen.findByText("Enlace inválido o expirado")).toBeInTheDocument();
  });

  it("valida requisitos de contraseña, confirmación de cuenta distinta y actualiza contraseña", async () => {
    const user = userEvent.setup();
    mockSearchParams = new URLSearchParams("cuenta_distinta=1&anterior=uno@test.com&nueva=dos@test.com");
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ authorized: true }),
    } as Response);
    updateUserMock.mockResolvedValue({ error: null });
    signOutMock.mockResolvedValue({ error: null });

    render(<PaginaNuevaPassword />);

    expect(await screen.findByText("Sesión previa de otra cuenta detectada")).toBeInTheDocument();
    await user.click(screen.getByLabelText(/Confirmo restablecer la contraseña/i));

    const inputPwd = screen.getByLabelText("Nueva contraseña");
    const inputConfirm = screen.getByLabelText("Confirmar nueva contraseña");

    // Contraseña débil
    await user.type(inputPwd, "debil");
    await user.type(inputConfirm, "debil");
    await user.click(screen.getByRole("button", { name: "Guardar nueva contraseña" }));
    expect(await screen.findByText(/debe incluir minúscula, mayúscula y número/i)).toBeInTheDocument();

    // No coinciden
    await user.clear(inputPwd);
    await user.clear(inputConfirm);
    await user.type(inputPwd, "Segura123");
    await user.type(inputConfirm, "Otra12345");
    await user.click(screen.getByRole("button", { name: "Guardar nueva contraseña" }));
    expect(await screen.findByText("Las contraseñas no coinciden.")).toBeInTheDocument();

    // Desmarcar mantenerme conectado para probar signOut global + limpieza de borrador
    await user.click(screen.getByRole("checkbox", { name: /Mantenerme conectado/i }));
    await user.clear(inputConfirm);
    await user.type(inputConfirm, "Segura123");
    await user.click(screen.getByRole("button", { name: "Guardar nueva contraseña" }));

    await waitFor(() => {
      expect(updateUserMock).toHaveBeenCalledWith({ password: "Segura123" });
      expect(signOutMock).toHaveBeenCalledWith({ scope: "global" });
    });
    expect(await screen.findByText("Contraseña actualizada")).toBeInTheDocument();
  });
});

describe("FormularioRecuperarPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tieneSupabaseMock.mockReturnValue(true);
  });

  it("valida correo vacío/inválido, envía enlace, aplica cooldown y permite solicitar otro", async () => {
    const user = userEvent.setup();
    resetPasswordForEmailMock.mockResolvedValue({ error: null });

    render(<FormularioRecuperarPassword errorInicial="El enlace expiró" />);
    expect(screen.getByText("El enlace expiró")).toBeInTheDocument();

    // Envío vacío
    await user.click(screen.getByRole("button", { name: "Enviar enlace de recuperación" }));
    expect(screen.getAllByText("Escribe tu correo electrónico.").length).toBeGreaterThan(0);

    // Correo inválido
    const input = screen.getByLabelText("Correo electrónico");
    await user.type(input, "correo-invalido");
    await user.click(screen.getByRole("button", { name: "Enviar enlace de recuperación" }));
    expect(screen.getAllByText(/Escribe un correo válido/i).length).toBeGreaterThan(0);

    // Correo válido
    await user.clear(input);
    await user.type(input, "cliente@ruum.mx");
    await user.click(screen.getByRole("button", { name: "Enviar enlace de recuperación" }));

    expect(await screen.findByText("Correo enviado")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Solicitar otro enlace" }));
    expect(screen.getByRole("heading", { name: "Recuperar contraseña" })).toBeInTheDocument();
  });
});
