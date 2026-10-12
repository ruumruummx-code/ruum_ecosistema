/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { VerificacionDocumentos } from "../VerificacionDocumentos";
import type { Database } from "@ruum/shared/types";

type Usuario = Database["public"]["Tables"]["usuarios"]["Row"];

const usuarioMock: Usuario = {
  id: "usr-123",
  auth_id: "auth-123",
  email: "carlos@ejemplo.com",
  nombre: "Carlos Martínez",
  telefono: "+52 55 1234 5678",
  tipo_usuario: "particular",
  estado_verificacion: "pendiente",
  rfc: "MART900515ABC",
  regimen_fiscal: "612",
  creado_en: "2026-01-01T00:00:00Z",
  actualizado_en: "2026-01-01T00:00:00Z",
  empresa_id: null,
  foto_url: null,
  preferencias_notificacion: {},
  perfil_completado: true,
  stripe_customer_id: null,
  terminos_aceptados: true,
  privacidad_aceptada: true,
  terminos_version: "2026.1",
  privacidad_version: "2026.1",
  fecha_aceptacion_terminos: "2026-01-01T00:00:00Z",
  fecha_aceptacion_privacidad: "2026-01-01T00:00:00Z",
};

describe("VerificacionDocumentos", () => {
  it("renderiza encabezado con navegación de regreso a /cuenta y títulos", () => {
    render(<VerificacionDocumentos usuario={usuarioMock} />);

    const linkVolver = screen.getByLabelText("Volver a mi cuenta");
    expect(linkVolver).toBeInTheDocument();
    expect(linkVolver).toHaveAttribute("href", "/cuenta");

    expect(screen.getByRole("heading", { name: "Verificación y documentos" })).toBeInTheDocument();
    expect(screen.getByText("Identidad y situación fiscal")).toBeInTheDocument();
  });

  it("muestra el banner de estado con advertencia cuando la verificación está en proceso", () => {
    render(<VerificacionDocumentos usuario={usuarioMock} />);

    expect(screen.getByText("Verificación en proceso")).toBeInTheDocument();
    expect(screen.getByText(/Tienes \d+ documentos? pendientes? por revisar/i)).toBeInTheDocument();
  });

  it("muestra el banner verde de cuenta verificada cuando el usuario está verificado", () => {
    const usuarioVerificado = { ...usuarioMock, estado_verificacion: "verificado" as const };
    render(<VerificacionDocumentos usuario={usuarioVerificado} />);

    expect(screen.getByText("Cuenta verificada")).toBeInTheDocument();
    expect(screen.getByText("Tu identidad y documentos están completos y aprobados.")).toBeInTheDocument();
  });

  it("renderiza la sección de progreso al 75% con sus 3 hitos", () => {
    render(<VerificacionDocumentos usuario={usuarioMock} />);

    expect(screen.getByText("Progreso de verificación")).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();
    expect(screen.getByText("Identidad")).toBeInTheDocument();
    expect(screen.getByText("Fiscal")).toBeInTheDocument();
    expect(screen.getByText("Listo")).toBeInTheDocument();
  });

  it("muestra los documentos de identidad y de información fiscal", () => {
    render(<VerificacionDocumentos usuario={usuarioMock} />);

    // Sección Identidad
    expect(screen.getByText("Verificación de identidad")).toBeInTheDocument();
    expect(screen.getByText("Identificación oficial (INE)")).toBeInTheDocument();
    expect(screen.getByText("Comprobante de domicilio")).toBeInTheDocument();
    expect(screen.getByText("Datos personales")).toBeInTheDocument();

    // Sección Fiscal
    expect(screen.getByText("Información fiscal")).toBeInTheDocument();
    expect(screen.getByText("Datos para facturación")).toBeInTheDocument();
    expect(screen.getByText("Constancia de Situación Fiscal")).toBeInTheDocument();
    expect(screen.getByText("Datos fiscales (RFC)")).toBeInTheDocument();
    expect(screen.getByText("Datos de facturación")).toBeInTheDocument();

    // Nota informativa SAT
    expect(screen.getByText(/La Constancia de Situación Fiscal es necesaria para emitir facturas/i)).toBeInTheDocument();
  });

  it("abre el modal de detalle al hacer clic en un documento y permite actualizarlo", async () => {
    vi.useFakeTimers();

    render(<VerificacionDocumentos usuario={usuarioMock} />);

    const tarjetaINE = screen.getByRole("button", { name: "Ver detalle de Identificación oficial (INE)" });
    fireEvent.click(tarjetaINE);

    // Modal abierto
    const modalDialog = screen.getByRole("dialog");
    expect(modalDialog).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Identificación oficial (INE)" })).toBeInTheDocument();
    expect(screen.getByText("Documento actual")).toBeInTheDocument();

    // Tocar el área interactiva de carga
    const areaCarga = screen.getByText("Actualizar documento");
    fireEvent.click(areaCarga);

    // Debe mostrar que el archivo fue seleccionado
    expect(screen.getByText("✓ Archivo seleccionado")).toBeInTheDocument();
    expect(screen.getAllByText("documento_actualizado.pdf").length).toBeGreaterThanOrEqual(1);

    // Confirmar actualización
    const btnConfirmar = screen.getByRole("button", { name: /Confirmar actualización/i });
    fireEvent.click(btnConfirmar);

    // Muestra mensaje de éxito
    expect(screen.getByText("Documento actualizado. Será revisado en menos de 24 horas.")).toBeInTheDocument();

    // Esperar temporizador de cierre
    act(() => {
      vi.advanceTimersByTime(2500);
    });

    // El modal debe haberse cerrado
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    vi.useRealTimers();
  });

  it("cierra el modal al presionar el botón Cerrar", () => {
    render(<VerificacionDocumentos usuario={usuarioMock} />);

    const tarjeta = screen.getByRole("button", { name: "Ver detalle de Comprobante de domicilio" });
    fireEvent.click(tarjeta);

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    const btnCerrar = screen.getByRole("button", { name: "Cerrar" });
    fireEvent.click(btnCerrar);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
