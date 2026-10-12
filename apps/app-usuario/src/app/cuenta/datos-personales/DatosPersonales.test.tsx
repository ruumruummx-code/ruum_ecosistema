/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { DatosPersonales } from "../DatosPersonales";
import type { Database } from "@ruum/shared/types";

type Usuario = Database["public"]["Tables"]["usuarios"]["Row"];

const usuarioMock: Usuario = {
  id: "usr-456",
  auth_id: "auth-456",
  email: "laura.martinez@email.com",
  nombre: "Laura Martínez Ruiz",
  telefono: "+52 55 1234 5678",
  tipo_usuario: "particular",
  estado_verificacion: "verificado",
  rfc: "MARL900515XYZ",
  regimen_fiscal: "605",
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
  pais: "México",
  estado: "Ciudad de México",
  ciudad: "Ciudad de México",
  colonia: "Roma Norte",
  codigo_postal: "06700",
  calle: "Av. Álvaro Obregón",
  numero: "145, Int. 3",
  referencias: "Edificio blanco frente al parque",
};

describe("DatosPersonales", () => {
  it("renderiza encabezado con navegación de regreso a /cuenta y títulos", () => {
    render(<DatosPersonales usuario={usuarioMock} />);

    const linkVolver = screen.getByLabelText("Volver a mi cuenta");
    expect(linkVolver).toBeInTheDocument();
    expect(linkVolver).toHaveAttribute("href", "/cuenta");

    expect(screen.getByRole("heading", { name: "Datos personales" })).toBeInTheDocument();
    expect(screen.getByText("Gestiona tu información de perfil")).toBeInTheDocument();
  });

  it("renderiza la sección de avatar con iniciales y botón de cambio de foto", () => {
    render(<DatosPersonales usuario={usuarioMock} />);

    expect(screen.getByText("LM")).toBeInTheDocument();
    expect(screen.getByLabelText("Cambiar foto de perfil")).toBeInTheDocument();
    expect(screen.getByText("Toca para cambiar tu foto")).toBeInTheDocument();
  });

  it("renderiza la sección de información personal con correo bloqueado y verificado", () => {
    render(<DatosPersonales usuario={usuarioMock} />);

    expect(screen.getByRole("heading", { name: "Información personal" })).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre(s)")).toHaveValue("Laura");
    expect(screen.getByLabelText("Apellidos")).toHaveValue("Martínez Ruiz");

    const inputEmail = screen.getByLabelText(/Correo electrónico/i);
    expect(inputEmail).toBeDisabled();
    expect(inputEmail).toHaveValue("laura.martinez@email.com");
    expect(screen.getByText("Verificado")).toBeInTheDocument();
    expect(screen.getByText(/Para cambiar tu correo, contacta a soporte/i)).toBeInTheDocument();

    expect(screen.getByLabelText("Teléfono")).toBeInTheDocument();
    expect(screen.getByLabelText("Fecha de nacimiento")).toBeInTheDocument();
  });

  it("renderiza la sección de dirección principal con campos prellenados", () => {
    render(<DatosPersonales usuario={usuarioMock} />);

    expect(screen.getByRole("heading", { name: "Dirección principal" })).toBeInTheDocument();
    expect(screen.getByLabelText("País")).toHaveValue("México");
    expect(screen.getByLabelText("Estado")).toHaveValue("Ciudad de México");
    expect(screen.getByLabelText("Ciudad")).toHaveValue("Ciudad de México");
    expect(screen.getByLabelText("Código postal")).toHaveValue("06700");
    expect(screen.getByLabelText("Colonia")).toHaveValue("Roma Norte");
    expect(screen.getByLabelText("Calle")).toHaveValue("Av. Álvaro Obregón");
    expect(screen.getByLabelText("Número")).toHaveValue("145, Int. 3");
    expect(screen.getByLabelText("Referencias")).toHaveValue("Edificio blanco frente al parque");
  });

  it("permite enviar el formulario y muestra mensaje de éxito", async () => {
    vi.useFakeTimers();

    render(<DatosPersonales usuario={usuarioMock} />);

    const btnGuardar = screen.getByRole("button", { name: /Guardar cambios/i });
    expect(btnGuardar).toBeInTheDocument();

    fireEvent.click(btnGuardar);

    // Mensaje de éxito
    expect(await screen.findByText("Tus datos se guardaron correctamente")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    vi.useRealTimers();
  });

  it("renderiza la zona de riesgo y permite abrir y cerrar el modal de eliminación de cuenta", () => {
    render(<DatosPersonales usuario={usuarioMock} />);

    expect(screen.getByRole("heading", { name: "Zona de riesgo" })).toBeInTheDocument();
    expect(screen.getByText(/Al eliminar tu cuenta, se borrarán todos tus datos/i)).toBeInTheDocument();

    const btnEliminar = screen.getByRole("button", { name: /Eliminar mi cuenta/i });
    expect(btnEliminar).toBeInTheDocument();

    // Abrir modal
    fireEvent.click(btnEliminar);

    const modal = screen.getByRole("dialog");
    expect(modal).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "¿Eliminar tu cuenta?" })).toBeInTheDocument();

    const linkSoporte = screen.getByRole("link", { name: /Continuar a soporte/i });
    expect(linkSoporte).toHaveAttribute("href", "/soporte?motivo=eliminar_cuenta");

    // Cerrar modal
    const btnCancelar = screen.getByRole("button", { name: "Cancelar" });
    fireEvent.click(btnCancelar);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
