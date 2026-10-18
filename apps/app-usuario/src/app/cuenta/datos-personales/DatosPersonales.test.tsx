/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DatosPersonales } from "../DatosPersonales";
import type { Database } from "@ruum/shared/types";

type Usuario = Database["public"]["Tables"]["usuarios"]["Row"];

const usuarioMock: Usuario = {
  id: "usr-456",
  auth_user_id: "auth-456",
  correo_facturacion: "laura.martinez@email.com",
  nombre: "Laura Martínez Ruiz",
  telefono: "+52 55 1234 5678",
  tipo_cuenta: "particular",
  estado_verificacion: "verificado",
  rfc: "MARL900515XYZ",
  regimen_fiscal: "605",
  creado_en: "2026-01-01T00:00:00Z",
  actualizado_en: "2026-01-01T00:00:00Z",
  empresa_id: null,
  foto_url: null,
  alertas_evidencia: false,
  alertas_pago: false,
  alertas_viaje: false,
  notificaciones_email: false,
  notificaciones_promocionales: false,
  notificaciones_push: false,
  notificaciones_sms_whatsapp: false,
  metodo_pago_registrado: false,
  estado_cuenta: "activo",
  rol: "personal",
  traslados_completados_sin_incidencia: 0,
  uso_cfdi: null,
  codigo_postal_fiscal: null,
  doc_identidad_subido_en: null,
  doc_identidad_url: null,
  razon_social: null,
  terminos_aceptados_en: "2026-01-01T00:00:00Z",
  version_terminos_aceptada: 1,
  pais: "México",
  estado: "Ciudad de México",
  ciudad: "Ciudad de México",
  colonia: "Roma Norte",
  codigo_postal: "06700",
  calle: "Av. Álvaro Obregón",
  numero: "145, Int. 3",
  referencias: "Edificio blanco frente al parque",
  direccion_principal: "Av. Álvaro Obregón 145, Int. 3, Col. Roma Norte, CP 06700, Ciudad de México, Ciudad de México",
  fecha_nacimiento: null,
  preferencias: {},
};


const { guardar, guardarFecha } = vi.hoisted(() => ({ guardar: vi.fn(), guardarFecha: vi.fn() }));
vi.mock("@ruum/api/services", () => ({ actualizarPerfilUsuario: guardar, actualizarFechaNacimientoUsuario: guardarFecha, obtenerUrlFotoPerfilUsuario: vi.fn(), subirFotoPerfil: vi.fn() }));
vi.mock("../../../lib/supabase-browser", () => ({ tieneSupabaseConfigurado: () => true, crearClienteNavegador: () => ({}) }));
vi.mock("../../../lib/codigos-postales", () => ({ consultarCodigoPostalMx: vi.fn().mockResolvedValue(null) }));
beforeEach(() => { vi.clearAllMocks(); guardar.mockResolvedValue(undefined); guardarFecha.mockResolvedValue(undefined); });
describe("DatosPersonales — RR-2026-004", () => {
  it("presenta el App Bar secundario, foto y campos personales sin navegación principal", () => {
    render(<DatosPersonales correoRegistro="registro@ruum.test" usuario={usuarioMock} />);
    expect(screen.getByRole("heading", { name: "Editar Perfil", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Volver a mi cuenta" })).toHaveAttribute("href", "/cuenta?seccion=perfil");
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Cambiar foto de perfil")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Nombre(s)" })).toHaveValue("Laura");
    expect(screen.getByRole("textbox", { name: "Apellidos" })).toHaveValue("Martínez Ruiz");
    expect(screen.getByLabelText("Correo electrónico")).toBeDisabled();
    expect(screen.queryByText("Zona de riesgo")).not.toBeInTheDocument();
  });
  it("alterna paneles conservando los cambios de ambas pestañas y el mismo botón Guardar", async () => {
    render(<DatosPersonales usuario={usuarioMock} />);
    const boton = screen.getByRole("button", { name: "Guardar cambios" });
    fireEvent.change(screen.getByLabelText("Nombre(s)"), { target: { value: "Ana María" } });
    fireEvent.click(screen.getByRole("tab", { name: "Dirección" }));
    expect(screen.getByRole("tabpanel", { name: "Dirección" })).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Nombre(s)" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Calle")).toHaveValue("Av. Álvaro Obregón");
    fireEvent.change(screen.getByLabelText("Calle"), { target: { value: "Calle nueva" } });
    fireEvent.click(boton);
    await screen.findByRole("status");
    expect(guardar).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ nombre: "Ana María Martínez Ruiz", calle: "Calle nueva", telefono: "+525512345678" }));
    expect(screen.getByRole("tab", { name: "Dirección" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("button", { name: "Guardar cambios" })).toBe(boton);
    fireEvent.click(screen.getByRole("tab", { name: "Personal" }));
    expect(screen.getByLabelText("Nombre(s)")).toHaveValue("Ana María");
  });
  it("lleva al panel Personal si un campo oculto es inválido", async () => {
    render(<DatosPersonales usuario={usuarioMock} />);
    fireEvent.change(screen.getByLabelText("Nombre(s)"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("tab", { name: "Dirección" }));
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Ingresa tu nombre");
    expect(screen.getByRole("tab", { name: "Personal" })).toHaveAttribute("aria-selected", "true");
    expect(guardar).not.toHaveBeenCalled();
  });
  it("valida fecha y muestra fallos del guardado sin anunciar éxito", async () => {
    render(<DatosPersonales usuario={usuarioMock} />);
    fireEvent.change(screen.getByLabelText("Fecha de nacimiento"), { target: { value: "2099-01-01" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("no puede ser futura");
    fireEvent.change(screen.getByLabelText("Fecha de nacimiento"), { target: { value: "1990-01-01" } });
    guardar.mockRejectedValueOnce(new Error("No se pudo guardar"));
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("No se pudo guardar"));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
  it("permite cambiar pestañas con flechas y conserva su foco", () => {
    render(<DatosPersonales usuario={usuarioMock} />);
    const personal = screen.getByRole("tab", { name: "Personal" });
    personal.focus();
    fireEvent.keyDown(personal, { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: "Dirección" })).toHaveFocus();
    expect(screen.getByRole("tab", { name: "Dirección" })).toHaveAttribute("aria-selected", "true");
  });
});
