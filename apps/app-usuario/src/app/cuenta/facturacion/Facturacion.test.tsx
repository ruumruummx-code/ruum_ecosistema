/** @vitest-environment jsdom */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Facturacion, FACTURAS_EJEMPLO_TEST } from "../Facturacion";
import type { Database } from "@ruum/shared/types";

type Usuario = Database["public"]["Tables"]["usuarios"]["Row"];

const mockUsuario: Partial<Usuario> = {
  id: "user-123",
  nombre: "Laura Martínez Ruiz",
  rfc: "MART900515ABC",
  razon_social: "Laura Martínez Ruiz",
  regimen_fiscal: "612 · Personas Físicas con Actividades Empresariales y Profesionales",
  codigo_postal_fiscal: "06700",
  uso_cfdi: "G03 · Gastos en general",
  correo_facturacion: "laura.martinez@email.com",
};

vi.mock("@/lib/supabase-browser", () => ({
  tieneSupabaseConfigurado: () => false,
  crearClienteNavegador: () => ({}),
}));

describe("Facturación — Pantalla y flujos fiscales", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza encabezado, botón de regreso y hero fiscal con estadísticas", () => {
    render(<Facturacion usuario={mockUsuario as Usuario} facturasIniciales={FACTURAS_EJEMPLO_TEST} />);

    expect(screen.getByRole("heading", { name: "Facturación" })).toBeInTheDocument();
    expect(screen.getByText("Datos fiscales y comprobantes")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /volver a mi cuenta/i })).toHaveAttribute("href", "/cuenta");

    // Hero card
    expect(screen.getByText("Facturación electrónica")).toBeInTheDocument();
    expect(screen.getByText("Configurado")).toBeInTheDocument();
    expect(screen.getByText("Facturas")).toBeInTheDocument();
    expect(screen.getByText("Facturado")).toBeInTheDocument();
    expect(screen.getAllByText("Pendientes").length).toBeGreaterThan(0);
  });

  it("muestra la información fiscal actual del usuario", () => {
    render(<Facturacion usuario={mockUsuario as Usuario} facturasIniciales={FACTURAS_EJEMPLO_TEST} />);

    expect(screen.getByText("MART900515ABC")).toBeInTheDocument();
    expect(screen.getByText("Laura Martínez Ruiz")).toBeInTheDocument();
    expect(screen.getByText("06700")).toBeInTheDocument();
    expect(screen.getByText("laura.martinez@email.com")).toBeInTheDocument();
  });

  it("permite abrir el modal de edición de datos fiscales y guardar cambios", async () => {
    const user = userEvent.setup();
    render(<Facturacion usuario={mockUsuario as Usuario} facturasIniciales={FACTURAS_EJEMPLO_TEST} />);

    // Abrir modal
    const botonEditar = screen.getByRole("button", { name: /editar/i });
    await user.click(botonEditar);

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText("Editar datos fiscales")).toBeInTheDocument();

    // Modificar razón social y código postal
    const inputRazon = screen.getByLabelText(/razón social/i);
    await user.clear(inputRazon);
    await user.type(inputRazon, "Laura Martínez Transportes");

    const inputCp = screen.getByLabelText(/cp fiscal/i);
    await user.clear(inputCp);
    await user.type(inputCp, "06600");

    // Guardar
    const botonGuardar = screen.getByRole("button", { name: /guardar cambios/i });
    await user.click(botonGuardar);

    expect(await screen.findByText("Datos fiscales actualizados correctamente")).toBeInTheDocument();

    // Al cerrarse el modal, los nuevos valores deben verse reflejados
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    }, { timeout: 2500 });

    expect(screen.getByText("Laura Martínez Transportes")).toBeInTheDocument();
    expect(screen.getByText("06600")).toBeInTheDocument();
  });

  it("permite abrir el modal de Constancia Fiscal y confirmar archivo", async () => {
    const user = userEvent.setup();
    render(<Facturacion usuario={mockUsuario as Usuario} facturasIniciales={FACTURAS_EJEMPLO_TEST} />);

    // Abrir modal desde la alerta
    const alertaConstancia = screen.getByText(/constancia de situación fiscal/i);
    await user.click(alertaConstancia);

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText("Subir constancia")).toBeInTheDocument();

    // Simular subida de archivo
    const file = new File(["dummy pdf content"], "constancia_fiscal_2026.pdf", { type: "application/pdf" });
    const fileInput = screen.getByTestId("input-constancia-archivo");
    await user.upload(fileInput, file);

    expect(await screen.findByText(/✓ archivo seleccionado/i)).toBeInTheDocument();
    expect(screen.getByText("constancia_fiscal_2026.pdf")).toBeInTheDocument();

    // Confirmar y enviar
    const botonConfirmar = screen.getByRole("button", { name: /confirmar y enviar/i });
    await user.click(botonConfirmar);

    expect(await screen.findByText("Constancia enviada. Será verificada en menos de 24 horas.")).toBeInTheDocument();
  });

  it("filtra el historial de facturas por pestañas (Todas, Emitidas, Pendientes)", async () => {
    const user = userEvent.setup();
    render(<Facturacion usuario={mockUsuario as Usuario} facturasIniciales={FACTURAS_EJEMPLO_TEST} />);

    // Por defecto 'Todas' muestra tanto emitidas como pendientes
    expect(screen.getByText("Factura #FAC-2847")).toBeInTheDocument();
    expect(screen.getByText("Factura #FAC-2848")).toBeInTheDocument();

    // Pestaña Emitidas
    await user.click(screen.getByRole("button", { name: /^emitidas$/i }));
    expect(screen.getByText("Factura #FAC-2847")).toBeInTheDocument();
    expect(screen.queryByText("Factura #FAC-2848")).not.toBeInTheDocument();

    // Pestaña Pendientes
    await user.click(screen.getByRole("button", { name: /pendientes/i }));
    expect(screen.queryByText("Factura #FAC-2847")).not.toBeInTheDocument();
    expect(screen.getByText("Factura #FAC-2848")).toBeInTheDocument();
  });

  it("permite solicitar una factura pendiente y actualizar su estado a emitida", async () => {
    const user = userEvent.setup();
    render(<Facturacion usuario={mockUsuario as Usuario} facturasIniciales={FACTURAS_EJEMPLO_TEST} />);

    // Filtrar a pendientes
    await user.click(screen.getByRole("button", { name: /pendientes/i }));

    const botonSolicitar = screen.getByRole("button", { name: /solicitar factura/i });
    await user.click(botonSolicitar);

    // Debe mostrar toast de confirmación
    expect(await screen.findByText(/ha sido emitida exitosamente/i)).toBeInTheDocument();

    // La lista de pendientes ahora debe estar vacía
    expect(screen.getByText("Sin facturas disponibles")).toBeInTheDocument();
  });

  it("cierra los modales al presionar la tecla Escape", async () => {
    const user = userEvent.setup();
    render(<Facturacion usuario={mockUsuario as Usuario} facturasIniciales={FACTURAS_EJEMPLO_TEST} />);

    await user.click(screen.getByRole("button", { name: /editar/i }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});
