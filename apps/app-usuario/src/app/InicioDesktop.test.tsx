/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import type { Database } from "@ruum/shared/types";
import { InicioDesktop } from "./InicioDesktop";

vi.mock("next/image", () => ({
  default: ({ fill: _fill, priority: _priority, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; priority?: boolean }) => (
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    <img {...props} />
  ),
}));

type PasaporteRow = Database["public"]["Views"]["pasaporte_digital"]["Row"];
type UsuarioRow = Database["public"]["Tables"]["usuarios"]["Row"];
type VehiculoRow = Database["public"]["Tables"]["vehiculos"]["Row"];

describe("InicioDesktop", () => {
  const usuarioMock = {
    id: "usr-1",
    nombre: "Hector Manuel",
  } as UsuarioRow;

  const trasladoActivoMock = {
    traslado_id: "traslado-12345",
    estado: "traslado_en_curso",
    creado_en: "2026-10-23T08:00:00.000Z",
    vehiculo_marca: "Chrysler",
    vehiculo_modelo: "Cirrus",
    vehiculo_anio: 2024,
    vehiculo_placas: "PEM709",
    origen_ciudad: "San Mateo Atenco, Edo. Méx.",
    destino_ciudad: "Lerma de Villada, Edo. Méx.",
    conductor_nombre: "Marco Torres",
  } as unknown as PasaporteRow;

  it("renderiza la barra lateral fija con menú y tarjeta promocional", () => {
    render(<InicioDesktop usuario={usuarioMock} traslados={[trasladoActivoMock]} />);

    const sidebar = screen.getByLabelText("Menú principal de escritorio");
    expect(sidebar).toBeInTheDocument();

    // Verificación de accesos en el menú lateral
    expect(within(sidebar).getByText("Inicio")).toBeInTheDocument();
    expect(within(sidebar).getByText("Traslados")).toBeInTheDocument();
    expect(within(sidebar).getByText("Carga masiva")).toBeInTheDocument();
    expect(within(sidebar).getByText("Cuenta")).toBeInTheDocument();
    expect(within(sidebar).getByText("Perfil")).toBeInTheDocument();
    expect(within(sidebar).getByText("Preferencias")).toBeInTheDocument();

    // Verificación de la sección promocional inferior
    expect(within(sidebar).getByText("Mueve tu auto sin soltar el control")).toBeInTheDocument();
    expect(within(sidebar).getByText("Más simple.")).toBeInTheDocument();
    expect(within(sidebar).getByText("Más inteligente.")).toBeInTheDocument();
    expect(within(sidebar).getByText("Más cerca de ti.")).toBeInTheDocument();
  });

  it("renderiza la barra superior de búsqueda, campana de alertas y perfil", () => {
    render(<InicioDesktop usuario={usuarioMock} traslados={[trasladoActivoMock]} />);

    const header = screen.getByLabelText("Barra superior de usuario");
    expect(header).toBeInTheDocument();

    // Input de búsqueda
    expect(
      within(header).getByPlaceholderText("Buscar traslados, vehículos o documentos..."),
    ).toBeInTheDocument();

    // Notificaciones y alerta dinámica
    expect(within(header).getByLabelText(/Notificaciones/i)).toBeInTheDocument();
    expect(within(header).getByText("3")).toBeInTheDocument();

    // Menú de usuario con saludo
    expect(within(header).getByText("Hola, Hector")).toBeInTheDocument();
    expect(within(header).getByText("Usuario")).toBeInTheDocument();
  });

  it("permite abrir y cerrar el menú desplegable de perfil de usuario", () => {
    render(<InicioDesktop usuario={usuarioMock} traslados={[trasladoActivoMock]} />);

    const header = screen.getByLabelText("Barra superior de usuario");
    const botonPerfil = within(header).getByRole("button", { expanded: false });

    // Abrir menú
    fireEvent.click(botonPerfil);
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Mi perfil" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Preferencias" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Cerrar sesión" })).toBeInTheDocument();

    // Cerrar menú
    fireEvent.click(botonPerfil);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("renderiza el saludo dinámico y la tarjeta informativa de seguridad", () => {
    render(<InicioDesktop usuario={usuarioMock} traslados={[trasladoActivoMock]} />);

    expect(screen.getByText("BIENVENIDO DE NUEVO")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Hola, Hector/i })).toBeInTheDocument();
    expect(screen.getByText("Tu traslado, en orden.")).toBeInTheDocument();
    expect(
      screen.getByText("Seguridad, evidencia y trazabilidad en cada viaje."),
    ).toBeInTheDocument();
  });

  it("renderiza el módulo del traslado activo con stepper, tiempos y mapa", () => {
    render(<InicioDesktop usuario={usuarioMock} traslados={[trasladoActivoMock]} />);

    // Chip de estado y datos del auto
    expect(screen.getByText("TRASLADO ACTIVO")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Chrysler Cirrus 2024" })).toBeInTheDocument();
    expect(screen.getAllByText(/Placas: PEM709/i).length).toBeGreaterThan(0);
    expect(screen.getByText("San Mateo Atenco, Edo. Méx.")).toBeInTheDocument();
    expect(screen.getByText("Lerma de Villada, Edo. Méx.")).toBeInTheDocument();

    // Stepper de 3 pasos
    expect(screen.getByText("1. Recolección")).toBeInTheDocument();
    expect(screen.getByText("2. En tránsito")).toBeInTheDocument();
    expect(screen.getByText("3. Entrega")).toBeInTheDocument();

    // Submódulo ETA y botón ver en mapa
    expect(screen.getByText("Llegada estimada")).toBeInTheDocument();
    expect(screen.getAllByText(/12 min/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Ver en mapa/i)).toBeInTheDocument();

    // Submódulo de Ubicación en tiempo real
    expect(screen.getByText("Ubicación en tiempo real")).toBeInTheDocument();
    expect(screen.getByText("Seguir en mapa →")).toBeInTheDocument();
    expect(screen.getByText("Tu conductor")).toBeInTheDocument();
    expect(screen.getByText("Marco Torres")).toBeInTheDocument();
  });

  it("renderiza la fila de 4 acciones rápidas con sus respectivos destinos", () => {
    render(<InicioDesktop usuario={usuarioMock} traslados={[trasladoActivoMock]} />);

    expect(screen.getByRole("heading", { name: "Acciones rápidas" })).toBeInTheDocument();
    expect(
      screen.getByText("Gestiona tus traslados y documentos desde un solo lugar."),
    ).toBeInTheDocument();

    const enlaceNuevo = screen.getByRole("link", { name: /Registrar nuevo traslado/i });
    expect(enlaceNuevo).toHaveAttribute("href", "/viajes/nuevo");

    const enlaceMasivo = screen.getByRole("link", { name: /Carga masiva de traslados/i });
    expect(enlaceMasivo).toHaveAttribute("href", "/viajes/masivo");

    const enlaceVehiculos = screen.getByRole("link", { name: /Mis vehículos registrados/i });
    expect(enlaceVehiculos).toHaveAttribute("href", "/cuenta/vehiculos");

    const enlaceHistorial = screen.getByRole("link", { name: /Ver historial de traslados/i });
    expect(enlaceHistorial).toHaveAttribute("href", "/mis-viajes");
  });

  it("renderiza el panel inferior dividido con Últimos traslados, Soporte 24/7 y Tips", () => {
    render(<InicioDesktop usuario={usuarioMock} traslados={[trasladoActivoMock]} />);

    // Panel izquierdo: Últimos traslados
    expect(screen.getByRole("heading", { name: "Últimos traslados" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver todos →" })).toHaveAttribute("href", "/mis-viajes");
    expect(screen.getByText("Toyota RAV4 2023")).toBeInTheDocument();
    expect(screen.getByText("RAM 1500 2024")).toBeInTheDocument();

    // Panel derecho: Soporte al cliente 24/7
    expect(screen.getByRole("heading", { name: "¿Necesitas ayuda?" })).toBeInTheDocument();
    expect(screen.getByText("Estamos para ti 24/7")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir a soporte →" })).toHaveAttribute("href", "/soporte");
    expect(screen.getByText("Soporte en tiempo real, sin complicaciones.")).toBeInTheDocument();

    // Carrusel de Tips Ruum Ruum
    expect(screen.getByText("Tips Ruum Ruum")).toBeInTheDocument();
    expect(screen.getByText("Optimiza tus traslados")).toBeInTheDocument();
    expect(
      screen.getByText("Registra varios vehículos en una carga masiva y ahorra tiempo."),
    ).toBeInTheDocument();
  });

  it("permite navegar por los tips de Tips Ruum Ruum mediante controles y dots", () => {
    render(<InicioDesktop usuario={usuarioMock} traslados={[trasladoActivoMock]} />);

    expect(screen.getByText("Optimiza tus traslados")).toBeInTheDocument();

    // Botón siguiente tip
    const botonSiguiente = screen.getByRole("button", { name: "Tip siguiente" });
    fireEvent.click(botonSiguiente);

    expect(screen.getByText("Seguimiento en tiempo real")).toBeInTheDocument();

    // Botón anterior tip
    const botonAnterior = screen.getByRole("button", { name: "Tip anterior" });
    fireEvent.click(botonAnterior);

    expect(screen.getByText("Optimiza tus traslados")).toBeInTheDocument();

    // Click en dot
    const dot3 = screen.getByRole("button", { name: "Ver tip 3" });
    fireEvent.click(dot3);

    expect(screen.getByText("Conductores 100% certificados")).toBeInTheDocument();
  });
});
