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
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

// Mock de Supabase browser client
vi.mock("../../../lib/supabase-browser", () => ({
  crearClienteNavegador: () => ({}),
}));

const mockActualizarNotificaciones = vi.fn<(...args: unknown[]) => Promise<{ data: null; error: null }>>(() => Promise.resolve({ data: null, error: null }));
const mockActualizarGenerales = vi.fn<(...args: unknown[]) => Promise<void>>(() => Promise.resolve());

vi.mock("@ruum/api/services", () => ({
  actualizarPreferenciasNotificaciones: (...args: unknown[]) => mockActualizarNotificaciones(...args),
  actualizarPreferenciasGeneralesUsuario: (...args: unknown[]) => mockActualizarGenerales(...args),
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
    expect(screen.getAllByText("Mis preferencias").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Ayuda").length).toBeGreaterThanOrEqual(1);

    // Promo Card en Sidebar
    expect(screen.getByText("Mueve tu auto sin salir de casa")).toBeDefined();
    expect(screen.getByText("Registrar traslado")).toBeDefined();

    // Top Navbar
    expect(screen.getByPlaceholderText("Buscar traslados, vehículos o ubicaciones...")).toBeDefined();
    expect(screen.getByText("Ctrl K")).toBeDefined();
    expect(screen.getByText(/Hola,\s*Hector/i)).toBeDefined();

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

  it("deshabilita English con explicación y conserva el selector de tema", () => {
    render(<PreferenciasCliente cuenta={mockCuenta} />);

    const botonEnglish = screen.getByRole("button", { name: "English" });
    expect(botonEnglish).toBeDisabled();
    expect(botonEnglish).toHaveAccessibleDescription(/únicamente en español/);
    fireEvent.click(botonEnglish);
    expect(botonEnglish).toHaveAttribute("aria-pressed", "false");
    expect(document.documentElement.lang).toBe("es-MX");

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

  it("guarda las preferencias en localStorage aislado por usuario y muestra feedback de éxito al sincronizar", async () => {
    mockActualizarNotificaciones.mockResolvedValueOnce({ data: null, error: null });
    mockActualizarGenerales.mockResolvedValueOnce(undefined);

    render(<PreferenciasCliente cuenta={mockCuenta} />);

    const botonGuardar = screen.getByRole("button", { name: "Guardar cambios" });
    fireEvent.click(botonGuardar);

    expect(await screen.findByText("Cambios guardados con éxito")).toBeDefined();
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      "ruum:pref:usuario:user-123",
      expect.stringContaining('"idioma":"es"')
    );
  });

  it("RUUM-UX-011 AC-1: ante un fallo 503 remoto NO anuncia éxito y muestra estado de error con reintento", async () => {
    const error503 = new Error("fallo_controlado_auditoria (503 Service Unavailable)");
    (error503 as unknown as { status: number }).status = 503;
    mockActualizarNotificaciones.mockRejectedValueOnce(error503);

    render(<PreferenciasCliente cuenta={mockCuenta} />);

    const botonGuardar = screen.getByRole("button", { name: "Guardar cambios" });
    fireEvent.click(botonGuardar);

    // Debe mostrar alerta de error
    const alerta = await screen.findByRole("alert");
    expect(alerta).toHaveTextContent(/503|Servicio no disponible/i);

    // CRÍTICO: NUNCA debe decir "Cambios guardados con éxito"
    expect(screen.queryByText("Cambios guardados con éxito")).toBeNull();

    // Debe ofrecer botón de reintento
    const botonReintentar = screen.getByRole("button", { name: "Reintentar" });
    expect(botonReintentar).toBeDefined();

    // Al reintentar con éxito, ahora sí se limpia el error y se confirma
    mockActualizarNotificaciones.mockResolvedValueOnce({ data: null, error: null });
    mockActualizarGenerales.mockResolvedValueOnce(undefined);
    fireEvent.click(botonReintentar);

    expect(await screen.findByText("Cambios guardados con éxito")).toBeDefined();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("RUUM-UX-011 AC-2: ante error de red/offline NO anuncia éxito y muestra sincronización pendiente", async () => {
    mockActualizarNotificaciones.mockRejectedValueOnce(new Error("Failed to fetch (sin red)"));

    render(<PreferenciasCliente cuenta={mockCuenta} />);

    const botonGuardar = screen.getByRole("button", { name: "Guardar cambios" });
    fireEvent.click(botonGuardar);

    // Estado pendiente
    expect(await screen.findByText(/Sin conexión|sincronización pendiente/i)).toBeDefined();
    expect(screen.queryByText("Cambios guardados con éxito")).toBeNull();
  });

  it("RUUM-UX-011 AC-3: aísla las preferencias por usuario y evita fuga entre cuentas", () => {
    const cuentaA = {
      ...mockCuenta,
      usuario: { ...mockCuenta.usuario, id: "cuenta-aaa" },
    } as unknown as CuentaReal;

    const cuentaB = {
      ...mockCuenta,
      usuario: { ...mockCuenta.usuario, id: "cuenta-bbb" },
    } as unknown as CuentaReal;

    mockStore["ruum:pref:usuario:cuenta-aaa"] = JSON.stringify({ idioma: "en", unidades: "Imperial" });
    mockStore["ruum:pref:usuario:cuenta-bbb"] = JSON.stringify({ idioma: "es", unidades: "Métrico" });

    const { unmount } = render(<PreferenciasCliente cuenta={cuentaA} />);
    expect(screen.getByRole("button", { name: "English" })).toBeDisabled();
    expect(JSON.parse(mockStore["ruum:pref:usuario:cuenta-aaa"]).idioma).toBe("es");
    expect(screen.getByRole("button", { name: "Español" })).toHaveAttribute("aria-pressed", "true");
    unmount();

    render(<PreferenciasCliente cuenta={cuentaB} />);
    expect(screen.getByRole("button", { name: "Español" })).toHaveAttribute("aria-pressed", "true");
    expect(JSON.parse(mockStore["ruum:pref:usuario:cuenta-bbb"]).unidades).toBe("Métrico");
  });

  it("RUUM-UX-010 AC-1 & AC-3: los 9 interruptores tienen nombre accesible único con evento y canal", () => {
    render(<PreferenciasCliente cuenta={mockCuenta} />);

    // 1 general + 4 filas x 2 canales = 9 switches
    const switchNombresEsperados = [
      "Notificaciones y alertas generales",
      "Recordatorios de traslados · Email",
      "Recordatorios de traslados · Web y Push",
      "Cambios de estado de traslados · Email",
      "Cambios de estado de traslados · Web y Push",
      "Pagos y facturación · Email",
      "Pagos y facturación · Web y Push",
      "Promociones y novedades · Email",
      "Promociones y novedades · Web y Push",
    ];

    for (const nombre of switchNombresEsperados) {
      const sw = screen.getByRole("switch", { name: new RegExp(nombre, "i") });
      expect(sw).toBeInTheDocument();
      expect(sw).toHaveAttribute("aria-checked");
    }
  });

  it("RUUM-UX-010 AC-2: los 5 selectores tienen nombre accesible único y etiqueta asociada", () => {
    render(<PreferenciasCliente cuenta={mockCuenta} />);

    const selectNombresEsperados = [
      "Zona horaria para mostrar fechas y horarios de traslados",
      "Sistema de unidades para distancias, peso y consumo",
      "Ajustes de contraste, tamaño de letra y accesibilidad",
      "Sistema de unidades en la aplicación",
      "Configuración de uso de datos de la aplicación",
    ];

    for (const nombre of selectNombresEsperados) {
      const sel = screen.getByRole("combobox", { name: new RegExp(nombre, "i") });
      expect(sel).toBeInTheDocument();
      expect(sel.id).toBeTruthy();
    }
  });

  it("RUUM-UX-010 AC-4: los interruptores actualizan aria-checked y anuncian estado", () => {
    render(<PreferenciasCliente cuenta={mockCuenta} />);

    const sw = screen.getByRole("switch", { name: /Recordatorios de traslados · Email/i });
    const estadoInicial = sw.getAttribute("aria-checked");

    fireEvent.click(sw);
    const estadoNuevo = sw.getAttribute("aria-checked");
    expect(estadoNuevo).not.toBe(estadoInicial);
  });
});
