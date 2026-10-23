/** @vitest-environment jsdom */
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const pushMock = vi.fn();
const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock, push: pushMock }),
}));

const subirDocumentoIdentidadMock = vi.fn();
const subirFotoPerfilMock = vi.fn();
const actualizarPerfilUsuarioMock = vi.fn();
const iniciarVerificacionDiditUsuarioMock = vi.fn();
const obtenerEstadoVerificacionDiditUsuarioMock = vi.fn();
const obtenerUsuarioActualMock = vi.fn();

vi.mock("@ruum/api/services", () => ({
  subirDocumentoIdentidad: (...args: unknown[]) => subirDocumentoIdentidadMock(...args),
  subirFotoPerfil: (...args: unknown[]) => subirFotoPerfilMock(...args),
  actualizarPerfilUsuario: (...args: unknown[]) => actualizarPerfilUsuarioMock(...args),
  iniciarVerificacionDiditUsuario: (...args: unknown[]) => iniciarVerificacionDiditUsuarioMock(...args),
  obtenerEstadoVerificacionDiditUsuario: (...args: unknown[]) => obtenerEstadoVerificacionDiditUsuarioMock(...args),
  obtenerUsuarioActual: (...args: unknown[]) => obtenerUsuarioActualMock(...args),
}));

const consultarCodigoPostalMxMock = vi.fn();
vi.mock("../../lib/codigos-postales", () => ({
  consultarCodigoPostalMx: (...args: unknown[]) => consultarCodigoPostalMxMock(...args),
}));

vi.mock("../../lib/supabase-browser", () => ({
  crearClienteNavegador: () => ({}),
}));

import { VerificacionForm } from "./VerificacionForm";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
});

describe("VerificacionForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    consultarCodigoPostalMxMock.mockResolvedValue({
      estado: "Ciudad de México",
      ciudades: ["Cuauhtémoc", "Benito Juárez"],
      colonias: ["Juárez", "Roma Norte"],
    });
  });

  it("en revisión muestra sólo la acción Didit y no duplica el formulario manual", () => {
    render(<VerificacionForm fotoPerfilInicial="https://cdn.example/foto.jpg" soloDidit />);

    expect(screen.getByRole("button", { name: /iniciar verificación con didit/i })).toBeInTheDocument();
    expect(screen.queryByText(/prefiero subir mis documentos manualmente/i)).not.toBeInTheDocument();
  });

  it("sin soloDidit ofrece la subida manual de documentos", async () => {
    const user = userEvent.setup();
    render(<VerificacionForm />);

    const resumen = screen.getByText(/prefiero subir mis documentos manualmente/i);
    expect(resumen).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(resumen);

    expect(screen.getByPlaceholderText("06600")).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Carga manual de documentos" })).toBeInTheDocument();
    expect(document.body.style.overflow).toBe("hidden");
    await user.click(screen.getByRole("button", { name: "Cerrar hoja inferior" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(resumen).toHaveFocus();
  });

  it("mantiene la acción Didit disponible, valida foto de perfil e inicia/finaliza sesión Didit", async () => {
    const user = userEvent.setup();
    subirFotoPerfilMock.mockResolvedValueOnce("https://cdn.example/avatar.jpg");
    iniciarVerificacionDiditUsuarioMock.mockResolvedValueOnce({
      url: "https://verify.didit.me/session/123",
      sessionId: "ses-123",
    });
    obtenerUsuarioActualMock.mockResolvedValueOnce({ estado_verificacion: "verificado" });
    obtenerEstadoVerificacionDiditUsuarioMock.mockResolvedValueOnce({
      session_id: "ses-123",
      estado: "aprobado",
    });

    const { container } = render(<VerificacionForm />);
    await user.click(screen.getByRole("button", { name: /iniciar verificación con didit/i }));
    expect(screen.getByRole("dialog", { name: "Fotografía de referencia" })).toBeInTheDocument();

    const fileInput = container.querySelector('input[type="file"][accept*="image/jpeg"]') as HTMLInputElement;
    // Archivo inválido (no imagen)
    fireEvent.change(fileInput, {
      target: { files: [new File(["x"], "doc.pdf", { type: "application/pdf" })] },
    });
    expect(await screen.findByText(/Selecciona una fotografía en formato JPG/i)).toBeInTheDocument();

    // Archivo válido
    fireEvent.change(fileInput, {
      target: { files: [new File(["img"], "rostro.jpg", { type: "image/jpeg" })] },
    });
    await waitFor(() => {
      expect(subirFotoPerfilMock).toHaveBeenCalled();
    });

    await user.click(screen.getByRole("button", { name: "Continuar con Didit" }));
    await waitFor(() => {
      expect(iniciarVerificacionDiditUsuarioMock).toHaveBeenCalled();
    });

    // Finalizar Didit cuando iframe notifica completado
    window.dispatchEvent(
      new MessageEvent("message", {
        origin: "https://verify.didit.me",
        data: { type: "didit:completed" },
      })
    );

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/viajes/nuevo");
    });
    expect(await screen.findByText("¡Identidad Verificada con Éxito!")).toBeInTheDocument();
  });

  it("rechaza archivo no soportado, acepta HEIC con aviso y completa envío manual de documentos", async () => {
    const user = userEvent.setup();
    actualizarPerfilUsuarioMock.mockResolvedValueOnce({});
    subirDocumentoIdentidadMock.mockResolvedValueOnce("docs/ine.jpg");

    render(<VerificacionForm />);
    await user.click(screen.getByText(/prefiero subir mis documentos manualmente/i));

    const input = screen.getByLabelText("Subir identificación oficial") as HTMLInputElement;

    // Extensión no aceptada
    fireEvent.change(input, {
      target: { files: [new File(["x"], "documento.exe", { type: "application/x-msdownload" })] },
    });
    expect(await screen.findByText(/Formato no soportado/i)).toBeInTheDocument();

    // Archivo HEIC
    fireEvent.change(input, {
      target: { files: [new File(["heic"], "foto.heic", { type: "image/heic" })] },
    });
    expect(await screen.findByText(/Detectamos formato HEIC/i)).toBeInTheDocument();

    // Archivo JPG válido y llenar domicilio
    fireEvent.change(input, {
      target: { files: [new File(["jpg"], "ine.jpg", { type: "image/jpeg" })] },
    });

    await user.type(screen.getByPlaceholderText("06600"), "06600");
    await waitFor(
      () => {
        expect(consultarCodigoPostalMxMock).toHaveBeenCalledWith("06600");
      },
      { timeout: 2000 }
    );

    await user.type(screen.getByPlaceholderText("Av. Insurgentes"), "Av. Reforma");
    await user.type(screen.getByPlaceholderText("123"), "222");
    await user.type(screen.getByLabelText("Referencias del domicilio"), "Torre Mayor");

    await user.click(screen.getByRole("button", { name: "Enviar para revisión manual" }));

    await waitFor(() => {
      expect(actualizarPerfilUsuarioMock).toHaveBeenCalled();
      expect(subirDocumentoIdentidadMock).toHaveBeenCalled();
    });
    expect(await screen.findByText("Documentación enviada")).toBeInTheDocument();
  });
});
