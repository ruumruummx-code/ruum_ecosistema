/** @vitest-environment jsdom */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UserHeader } from "./UserHeader";
import { notificarFotoPerfilActualizada } from "../../lib/foto-perfil";
import { act } from "@testing-library/react";

const { fotoMock, perfilMock } = vi.hoisted(() => ({ fotoMock: vi.fn(), perfilMock: vi.fn() }));
vi.mock("@ruum/api/services", () => ({ obtenerUrlFotoPerfilUsuario: fotoMock, obtenerUsuarioActual: perfilMock }));

const { signOutMock } = vi.hoisted(() => ({ signOutMock: vi.fn() }));
vi.mock("../../lib/supabase-browser", () => ({ tieneSupabaseConfigurado: () => true, crearClienteNavegador: () => ({ auth: { signOut: signOutMock } }) }));
const pushMock = vi.fn();
const replaceMock = vi.fn();
const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock,
    refresh: refreshMock,
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

const alternarTemaMock = vi.fn();
let temaMock = "light";

vi.mock("../../app/TemaProvider", () => ({
  useTema: () => ({
    tema: temaMock,
    alternar: alternarTemaMock,
  }),
}));

describe("UserHeader — Componente de Barra Superior Reutilizable (RR-UI-001)", () => {
  it("recupera la fotografía autenticada cuando la pantalla solo proporciona el nombre", async () => {
    perfilMock.mockResolvedValue({ id: "u1", foto_url: "auth/perfil.png" });
    fotoMock.mockResolvedValue("https://foto.test/perfil.png?token=perfil");
    render(<UserHeader nombre="Laura" />);
    expect(await screen.findByRole("img", { name: "Laura" })).toHaveAttribute("src", "https://foto.test/perfil.png?token=perfil");
  });
  it("firma la foto persistida y sincroniza una sustitución del mismo usuario", async () => {
    fotoMock.mockResolvedValue("https://foto.test/perfil.png?token=inicial");
    render(<UserHeader usuario={{ id: "u1", nombre: "Laura", foto_url: "auth/perfil.png" }} />);
    expect(await screen.findByRole("img", { name: "Laura" })).toHaveAttribute("src", "https://foto.test/perfil.png?token=inicial");
    act(() => notificarFotoPerfilActualizada("otro", "https://foto.test/otro.png"));
    expect(screen.getByRole("img", { name: "Laura" })).toHaveAttribute("src", "https://foto.test/perfil.png?token=inicial");
    act(() => notificarFotoPerfilActualizada("u1", "https://foto.test/perfil.png?v=nueva"));
    expect(screen.getByRole("img", { name: "Laura" })).toHaveAttribute("src", "https://foto.test/perfil.png?v=nueva");
  });
  it("mantiene la sesión y avisa cuando signOut devuelve un error", async () => {
    signOutMock.mockResolvedValueOnce({ error: new Error("sin conexión") });
    render(<UserHeader nombre="Usuario" />);
    fireEvent.click(screen.getByRole("button", { name: /Menú de usuario/ }));
    fireEvent.click(screen.getByRole("menuitem", { name: /Cerrar sesión/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("No pudimos cerrar tu sesión");
    expect(replaceMock).not.toHaveBeenCalled();
  });
  it("redirige al login al confirmar el cierre de sesión", async () => {
    signOutMock.mockResolvedValueOnce({ error: null });
    render(<UserHeader nombre="Usuario" />);
    await userEvent.click(screen.getByRole("button", { name: /Menú de usuario/ }));
    await userEvent.click(screen.getByRole("menuitem", { name: /Cerrar sesión/ }));
    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/login"));
    expect(refreshMock).toHaveBeenCalled();
  });
  beforeEach(() => {
    vi.clearAllMocks();
    signOutMock.mockReset();
    perfilMock.mockResolvedValue(null);
    temaMock = "light";
  });

  it("renderiza el buscador global, atajo Ctrl+K, notificaciones y perfil del usuario", () => {
    render(
      <UserHeader
        nombre="Hector Manuel"
        rol="Usuario Premium"
        notificaciones={[{ id: "n1", mensaje: "Traslado en camino" }]}
      />
    );

    const header = screen.getByLabelText("Barra superior de usuario");
    expect(header).toBeInTheDocument();

    // Buscador
    const input = within(header).getByPlaceholderText("Buscar traslados, vehículos o documentos...");
    expect(input).toBeInTheDocument();
    expect(within(header).getByText("Ctrl K")).toBeInTheDocument();

    // Notificaciones con badge
    expect(within(header).getByLabelText(/Notificaciones \(1 pendientes\)/)).toBeInTheDocument();
    expect(within(header).getByText("1")).toBeInTheDocument();

    // Saludo y rol
    expect(within(header).getByText("Hola, Hector")).toBeInTheDocument();
    expect(within(header).getByText("Usuario Premium")).toBeInTheDocument();
  });

  it("abre el buscador con el atajo de teclado Ctrl+K", () => {
    render(<UserHeader nombre="Alex Ruiz" />);

    const input = screen.getByPlaceholderText("Buscar traslados, vehículos o documentos...");
    expect(input).not.toHaveFocus();

    fireEvent.keyDown(document, { key: "k", ctrlKey: true });
    expect(input).toHaveFocus();
    expect(screen.getByRole("dialog", { name: "Sugerencias de búsqueda" })).toBeInTheDocument();
  });

  it("permite buscar y navega a la URL canónica de mis traslados al enviar el formulario", async () => {
    const user = userEvent.setup();
    render(<UserHeader nombre="Alex Ruiz" />);

    const input = screen.getByPlaceholderText("Buscar traslados, vehículos o documentos...");
    await user.type(input, "Guadalajara{enter}");

    expect(pushMock).toHaveBeenCalledWith("/mis-viajes?buscar=Guadalajara");
  });

  it("permite alternar entre tema claro y oscuro", () => {
    render(<UserHeader nombre="Alex Ruiz" mostrarTema={true} />);

    const botonTema = screen.getByRole("button", { name: /Cambiar a modo oscuro/ });
    expect(botonTema).toBeInTheDocument();

    fireEvent.click(botonTema);
    expect(alternarTemaMock).toHaveBeenCalled();
  });

  it("abre y cierra el panel de notificaciones con la lista y enlace a traslados", () => {
    render(
      <UserHeader
        nombre="Hector Manuel"
        notificaciones={[
          { id: "1", mensaje: "Conductor asignado a tu traslado PEM709", href: "/viajes/123" },
          { id: "2", mensaje: "Factura disponible para descarga" },
        ]}
      />
    );

    const botonCampana = screen.getByRole("button", { name: /Notificaciones/ });
    fireEvent.click(botonCampana);

    const dialogNotificaciones = screen.getByRole("dialog", { name: "Notificaciones" });
    expect(dialogNotificaciones).toBeInTheDocument();
    expect(within(dialogNotificaciones).getByText("Conductor asignado a tu traslado PEM709")).toBeInTheDocument();
    expect(within(dialogNotificaciones).getByText("Factura disponible para descarga")).toBeInTheDocument();
    expect(within(dialogNotificaciones).getByRole("link", { name: /Ver mis traslados/ })).toHaveAttribute("href", "/mis-viajes");
  });

  it("abre el dropdown de perfil con las opciones Mi cuenta, Mi perfil, Mis vehículos, Mis preferencias y Cerrar sesión", async () => {
    const onLogoutMock = vi.fn();
    render(
      <UserHeader
        nombre="Hector Manuel"
        correo="hector@ruum.mx"
        rol="Usuario"
        totalVehiculos={3}
        onLogout={onLogoutMock}
      />
    );

    const botonPerfil = screen.getByRole("button", { name: /Menú de usuario Hector Manuel/ });
    fireEvent.click(botonPerfil);

    const menu = screen.getByRole("menu");
    expect(menu).toBeInTheDocument();

    expect(within(menu).getByRole("menuitem", { name: /Mi cuenta/ })).toHaveAttribute("href", "/cuenta");
    expect(within(menu).getByRole("menuitem", { name: /Mi perfil/ })).toHaveAttribute("href", "/cuenta?seccion=perfil");
    expect(within(menu).getByRole("menuitem", { name: /Mis vehículos/ })).toHaveAttribute("href", "/cuenta/vehiculos");
    expect(within(menu).getByRole("menuitem", { name: /Mis preferencias/ })).toHaveAttribute("href", "/cuenta/preferencias");

    const botonSalir = within(menu).getByRole("menuitem", { name: /Cerrar sesión/ });
    await userEvent.click(botonSalir);
    expect(onLogoutMock).toHaveBeenCalled();
  });

  it("muestra el botón de menú hamburguesa y ejecuta onMenuOpen en vista móvil", () => {
    const onMenuOpenMock = vi.fn();
    render(<UserHeader nombre="Hector Manuel" onMenuOpen={onMenuOpenMock} />);

    const botonHamburguesa = screen.getByRole("button", { name: "Abrir menú de navegación" });
    expect(botonHamburguesa).toBeInTheDocument();

    fireEvent.click(botonHamburguesa);
    expect(onMenuOpenMock).toHaveBeenCalled();
  });
});
