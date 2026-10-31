/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PreferenciasCliente } from "./PreferenciasCliente";
import type { CuentaReal } from "../cuenta-ui";

// Mock seguro de localStorage
const mockStore: Record<string, string> = {};
const mockLocalStorage = {
  getItem: vi.fn((key: string) => mockStore[key] ?? null),
  setItem: vi.fn((key: string, val: string) => {
    mockStore[key] = val;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockStore[key];
  }),
  clear: vi.fn(() => {
    for (const key of Object.keys(mockStore)) delete mockStore[key];
  }),
};

Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
  writable: true,
});

// Mock de next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/cuenta/preferencias",
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

// Mock de Supabase browser client
vi.mock("../../../lib/supabase-browser", () => ({
  crearClienteNavegador: () => ({
    from: () => ({
      update: () => ({
        eq: () => Promise.resolve({ data: null, error: null }),
      }),
    }),
  }),
}));

// Mock de useTema
const alternarMock = vi.fn();
const fijarModoMock = vi.fn();
vi.mock("../../TemaProvider", () => ({
  useTema: () => ({
    tema: "light",
    modo: "light",
    alternar: alternarMock,
    fijar: vi.fn(),
    fijarModo: fijarModoMock,
  }),
  BotonTema: () => <button data-testid="boton-tema-mobile">BotonTemaMobile</button>,
}));

const mockCuenta: CuentaReal = {
  usuario: {
    id: "user-123",
    auth_user_id: "auth-123",
    nombre: "Hector Delgado",
    tipo_cuenta: "personal",
    rol: "personal",
    estado_verificacion: "verificado",
    foto_url: null,
    telefono: "+525512345678",
    correo_facturacion: "hector@ejemplo.com",
    alertas_pago: true,
    notificaciones_email: true,
    notificaciones_push: true,
    notificaciones_sms_whatsapp: false,
    notificaciones_promocionales: false,
    metodo_pago_registrado: true,
    traslados_completados_sin_incidencia: 5,
    creado_en: "2026-01-01T00:00:00Z",
    actualizado_en: "2026-01-01T00:00:00Z",
  } as unknown as CuentaReal["usuario"],
  fotoPerfilUrl: null,
  vehiculos: [],
  empresa: null,
  totalTraslados: 0,
};

describe("PreferenciasCliente", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
  });

  it("renderiza correctamente la vista móvil preservada (< 1024px)", () => {
    render(<PreferenciasCliente cuenta={mockCuenta} />);

    // El botón de tema móvil debe estar presente
    expect(screen.getByTestId("boton-tema-mobile")).toBeDefined();
    // Las opciones de la sección de preferencias móvil
    expect(screen.getByRole("button", { name: /Notificaciones y alertas/ })).toBeDefined();
  });

  it("renderiza la estructura completa de escritorio (>= 1024px)", () => {
    render(<PreferenciasCliente cuenta={mockCuenta} />);

    // Sidebar
    expect(screen.getByText("Tu traslado, en orden")).toBeDefined();
    expect(screen.getAllByText("Mis traslados").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Mis vehículos").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Mis ubicaciones").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Carga Masiva").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Mi cuenta").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Mi perfil").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Mis preferencias").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Ayuda").length).toBeGreaterThanOrEqual(1);

    // Promo Card en Sidebar
    expect(screen.getByText("Mueve tu auto sin salir de casa")).toBeDefined();
    expect(screen.getByText("Registrar traslado")).toBeDefined();

    // Top Navbar
    expect(screen.getByPlaceholderText("Buscar traslados, vehículos o ubicaciones...")).toBeDefined();
    expect(screen.getByText("Ctrl K")).toBeDefined();
    expect(screen.getByText("Hola, HECTOR")).toBeDefined();

    // Header y Breadcrumb
    expect(screen.getByText("Volver a mi cuenta")).toBeDefined();
    expect(screen.getByText("Configura notificaciones, apariencia, privacidad y preferencias de uso.")).toBeDefined();

    // 4 Summary cards
    expect(screen.getAllByText("Español").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Configurada")).toBeDefined();

    // 2x2 Grid de configuración
    expect(screen.getByText("Idioma y región")).toBeDefined();
    expect(screen.getByText("Aplicación")).toBeDefined();
    expect(screen.getByText("Privacidad y permisos")).toBeDefined();

    // Matrix de Notificaciones (Email y Web/Push)
    expect(screen.getByText("Email")).toBeDefined();
    expect(screen.getByText("Web / Push")).toBeDefined();
    expect(screen.getByText("Recordatorios de traslados")).toBeDefined();
    expect(screen.getByText("Cambios de estado")).toBeDefined();
    expect(screen.getByText("Pagos y facturación")).toBeDefined();
    expect(screen.getByText("Promociones y novedades")).toBeDefined();

    // Privacidad y Permisos items
    expect(screen.getByText("Se solicita cuando usas el mapa o servicios de traslado.")).toBeDefined();
    expect(screen.getByText("No disponible en web")).toBeDefined();
    expect(screen.getByText("Ver sesiones")).toBeDefined();

    // Bottom Sticky Bar
    expect(screen.getByText("Recuerda guardar tus cambios")).toBeDefined();
    expect(screen.getByText("Las modificaciones se aplicarán a tu cuenta de inmediato.")).toBeDefined();
    expect(screen.getByText("Restablecer")).toBeDefined();
    expect(screen.getByText("Guardar cambios")).toBeDefined();
  });

  it("permite interactuar con el selector de idioma y el selector de tema", () => {
    render(<PreferenciasCliente cuenta={mockCuenta} />);

    const botonEnglish = screen.getByRole("button", { name: "English" });
    fireEvent.click(botonEnglish);

    // Selección de tema
    const botonOscuro = screen.getByRole("button", { name: "Oscuro" });
    fireEvent.click(botonOscuro);
    expect(fijarModoMock).toHaveBeenCalledWith("dark");
  });

  it("abre el modal de sesiones activas al presionar 'Ver sesiones'", () => {
    render(<PreferenciasCliente cuenta={mockCuenta} />);

    const botonVerSesiones = screen.getByRole("button", { name: "Ver sesiones" });
    fireEvent.click(botonVerSesiones);

    expect(screen.getByText("Sesión activa en este equipo · Conectado ahora")).toBeDefined();

    const botonCerrar = screen.getByRole("button", { name: "Cerrar" });
    fireEvent.click(botonCerrar);
  });

  it("guarda las preferencias en localStorage y muestra feedback al presionar 'Guardar cambios'", async () => {
    render(<PreferenciasCliente cuenta={mockCuenta} />);

    const botonGuardar = screen.getByRole("button", { name: "Guardar cambios" });
    fireEvent.click(botonGuardar);

    expect(await screen.findByText("Cambios guardados con éxito")).toBeDefined();
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      "ruum-usuario-preferencias",
      expect.stringContaining('"idioma":"es"')
    );
  });
});
