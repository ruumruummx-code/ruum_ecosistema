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

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

type PasaporteRow = Database["public"]["Views"]["pasaporte_digital"]["Row"];
type UsuarioRow = Database["public"]["Tables"]["usuarios"]["Row"];
type VehiculoRow = Database["public"]["Tables"]["vehiculos"]["Row"];

describe("InicioDesktop", () => {
  it("muestra el estado pendiente sin inventar un traslado en camino", () => {
    render(<InicioDesktop usuario={null} traslados={[{ traslado_id: "pendiente", estado: "solicitud_creada" } as PasaporteRow]} />);
    expect(screen.queryByText("En camino")).not.toBeInTheDocument();
    expect(screen.queryByText(/12 min/)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver detalle y seguimiento" })).toHaveAttribute("href", "/viajes/pendiente");
  });
  it("presenta un estado vacío sin servicios ni datos ficticios", () => {
    render(<InicioDesktop usuario={null} traslados={[]} />);
    expect(screen.getByText("No tienes traslados activos")).toBeInTheDocument();
    expect(screen.getByText("Aún no tienes traslados registrados.")).toBeInTheDocument();
    expect(screen.queryByText("TRASLADO ACTIVO")).not.toBeInTheDocument();
    expect(screen.queryByText(/PEM709/)).not.toBeInTheDocument();
  });
  it("conserva la identidad del historial cerrado y su enlace", () => {
    render(<InicioDesktop usuario={null} traslados={[{ traslado_id: "cerrado", estado: "servicio_cerrado", vehiculo_marca: "Honda", vehiculo_modelo: "Civic", vehiculo_placas: "ABC123" } as PasaporteRow]} />);
    expect(screen.getByText("No tienes traslados activos")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Honda Civic/ })).toHaveAttribute("href", "/viajes/cerrado");
  });
  it("distingue un fallo de vehículos y permite reintentar", () => {
    render(<InicioDesktop usuario={null} traslados={[]} errorVehiculos />);
    expect(screen.getByRole("alert")).toHaveTextContent("No pudimos cargar tus vehículos");
    expect(screen.getByRole("button", { name: "Reintentar carga de vehículos" })).toBeInTheDocument();
  });
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
    expect(within(sidebar).getByText("Mis traslados")).toBeInTheDocument();
    expect(within(sidebar).getByText("Mis vehículos")).toBeInTheDocument();
    expect(within(sidebar).getByText("Mis ubicaciones")).toBeInTheDocument();
    expect(within(sidebar).getByText("Carga Masiva")).toBeInTheDocument();
    expect(within(sidebar).getByText("Mi cuenta")).toBeInTheDocument();
    expect(within(sidebar).getByText("Mi perfil")).toBeInTheDocument();
    expect(within(sidebar).getByText("Mis preferencias")).toBeInTheDocument();
    expect(within(sidebar).getByText("Ayuda")).toBeInTheDocument();

    // Verificación de la sección promocional inferior
    expect(within(sidebar).getByText("Mueve tu auto sin salir de casa")).toBeInTheDocument();
    expect(within(sidebar).getByText("Un servicio confiable, seguro y en todo México.")).toBeInTheDocument();
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

    // Menú de usuario con saludo
    expect(within(header).getByText("Hola, Hector")).toBeInTheDocument();
    expect(within(header).getByText("Usuario")).toBeInTheDocument();
  });

  it("permite abrir y cerrar el menú desplegable de perfil de usuario", () => {
    render(<InicioDesktop usuario={usuarioMock} traslados={[trasladoActivoMock]} />);

    const header = screen.getByLabelText("Barra superior de usuario");
    const botonPerfil = within(header).getByRole("button", { name: /Menú de usuario/ });

    // Abrir menú
    fireEvent.click(botonPerfil);
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Mi perfil" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Mis preferencias" })).toBeInTheDocument();
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

  it("renderiza el traslado activo con accesos al seguimiento real", () => {
    render(<InicioDesktop usuario={usuarioMock} traslados={[trasladoActivoMock]} />);

    // Chip de estado y datos del auto
    expect(screen.getByText("TRASLADO ACTIVO")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Chrysler Cirrus 2024" })).toBeInTheDocument();
    expect(screen.getAllByText(/Placas: PEM709/i).length).toBeGreaterThan(0);
    expect(screen.getByText("San Mateo Atenco, Edo. Méx.")).toBeInTheDocument();
    expect(screen.getByText("Lerma de Villada, Edo. Méx.")).toBeInTheDocument();

    expect(screen.getByRole("link", { name: "Abrir seguimiento" })).toHaveAttribute("href", "/viajes/traslado-12345");
    expect(screen.queryByText(/12 min/i)).not.toBeInTheDocument();
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
    expect(screen.queryByText("Toyota RAV4 2023")).not.toBeInTheDocument();
    expect(screen.queryByText("RAM 1500 2024")).not.toBeInTheDocument();

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
