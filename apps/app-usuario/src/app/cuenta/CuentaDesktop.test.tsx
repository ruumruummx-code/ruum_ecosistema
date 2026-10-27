/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CuentaDesktop } from "./CuentaDesktop";
import type { CuentaReal } from "./cuenta-ui";
import type { Database } from "@ruum/shared/types";

const { replace, refresh, signOut } = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh }),
  usePathname: () => "/cuenta",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("../../lib/supabase-browser", () => ({
  crearClienteNavegador: () => ({
    auth: { signOut },
  }),
}));

const usuarioMock = {
  id: "usr-123",
  nombre: "Hector Molina",
  telefono: "+52 5566522178",
  estado_verificacion: "verificado",
  pais: "México",
} as unknown as Database["public"]["Tables"]["usuarios"]["Row"];

const cuentaMock: CuentaReal = {
  usuario: usuarioMock,
  correoRegistro: "lomelinhectorm@gmail.com",
  fotoPerfilUrl: null,
  vehiculos: [
    { id: "veh-1", marca: "Mazda", modelo: "3", anio: 2022, placas: "ABC-123" } as CuentaReal["vehiculos"][number],
    { id: "veh-2", marca: "Volkswagen", modelo: "Jetta", anio: 2021, placas: "XYZ-789" } as CuentaReal["vehiculos"][number],
  ],
  empresa: null,
  totalTraslados: 2,
  incidenciasAbiertas: 0,
};

describe("CuentaDesktop — Pantalla de Cuenta para Escritorio", () => {
  it.each(["pendiente", "en_revision", "rechazado", null])("no acredita una cuenta con estado %s", (estado) => {
    render(<CuentaDesktop cuenta={{ ...cuentaMock, usuario: { ...usuarioMock, estado_verificacion: estado } as CuentaReal["usuario"] }} />);
    expect(screen.queryByText("Tu cuenta está verificada")).not.toBeInTheDocument();
    expect(screen.queryByText("Verificado")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Revisar verificación" })).toHaveAttribute("href", "/cuenta/verificacion-documentos");
  });
  it("no inventa datos personales, métricas ni verificación de contactos", () => {
    render(<CuentaDesktop cuenta={{ ...cuentaMock, usuario: { ...usuarioMock, nombre: " ", telefono: null, pais: null, estado_verificacion: "pendiente" }, correoRegistro: null, totalTraslados: 0, vehiculos: [] }} />);
    expect(screen.getAllByText("Sin correo registrado").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Sin teléfono registrado").length).toBeGreaterThan(0);
    expect(screen.queryByText("Hector Molina")).not.toBeInTheDocument();
    expect(screen.getByText("País no registrado")).toBeInTheDocument();
    expect(within(screen.getByLabelText("Resumen de perfil")).getAllByText("0")).toHaveLength(3);
  });
  it("muestra solo actividad real ordenada y abre el traslado correspondiente", () => {
    const traslados = [
      { traslado_id: "viejo", creado_en: "2026-10-20T12:00:00Z", estado: "servicio_cancelado", vehiculo_marca: "Honda", vehiculo_modelo: "Civic" },
      { traslado_id: "nuevo", creado_en: "2026-10-27T12:00:00Z", estado: "traslado_en_curso", vehiculo_marca: "Toyota", vehiculo_modelo: "Corolla" },
    ] as CuentaReal["traslados"];
    render(<CuentaDesktop cuenta={{ ...cuentaMock, traslados }} />);
    const actividad = screen.getByLabelText("Actividad reciente");
    const links = within(actividad).getAllByRole("link");
    expect(links[1]).toHaveAttribute("href", "/viajes/nuevo");
    expect(within(actividad).getByText("En camino a destino")).toBeInTheDocument();
    expect(within(actividad).getByText("Cancelado")).toBeInTheDocument();
  });
  it("muestra un fallo de cierre de sesión y permite volver a intentarlo", async () => {
    signOut.mockResolvedValueOnce({ error: new Error("sin red") });
    render(<CuentaDesktop cuenta={cuentaMock} />);
    await userEvent.click(screen.getByRole("button", { name: "Cerrar sesión" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("No pudimos cerrar tu sesión");
    expect(replace).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Cerrar sesión" }));
    expect(replace).toHaveBeenCalledWith("/login");
  });
  it("ofrece las opciones de perfil desde el enlace del menú", () => {
    render(<CuentaDesktop cuenta={cuentaMock} seccionInicial="perfil" />);
    const opciones = screen.getByLabelText("Opciones de perfil");
    expect(opciones).toHaveFocus();
    expect(within(opciones).getByRole("link", { name: "Cambiar contraseña" })).toHaveAttribute("href", "/cuenta/cambiar-contrasena");
    expect(within(opciones).getByRole("link", { name: "Facturación" })).toHaveAttribute("href", "/cuenta/facturacion");
  });
  it("cierra el diálogo con Escape nativo y restaura el foco", async () => {
    render(<CuentaDesktop cuenta={cuentaMock} />);
    const abrir = screen.getByRole("button", { name: /Ver consejos de seguridad/ });
    await userEvent.click(abrir);
    const dialog = screen.getByRole("dialog");
    fireEvent(dialog, new Event("cancel", { bubbles: true, cancelable: true }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(abrir).toHaveFocus();
  });
  beforeEach(() => {
    vi.clearAllMocks();
    signOut.mockResolvedValue({ error: null });
  });

  it("renderiza el sidebar con la opción Cuenta activa y la tarjeta promocional inferior", () => {
    render(<CuentaDesktop cuenta={cuentaMock} />);

    // Menú lateral scoped al nav del panel
    const navPanel = screen.getByRole("navigation", { name: "Navegación del panel" });
    const enlaceCuenta = within(navPanel).getByRole("link", { name: /Mi cuenta/ });
    expect(enlaceCuenta).toHaveAttribute("aria-current", "page");
    expect(enlaceCuenta).toHaveAttribute("href", "/cuenta");

    expect(within(navPanel).getByRole("link", { name: /Inicio/ })).toHaveAttribute("href", "/");
    expect(within(navPanel).getByRole("link", { name: /Mis traslados/ })).toHaveAttribute("href", "/mis-viajes");
    expect(within(navPanel).getByRole("link", { name: /Mis vehículos/ })).toHaveAttribute("href", "/cuenta/vehiculos");
    expect(within(navPanel).getByRole("link", { name: /Mis ubicaciones/ })).toHaveAttribute("href", "/ubicaciones");
    expect(within(navPanel).getByRole("link", { name: /Carga Masiva/ })).toHaveAttribute("href", "/viajes/masivo");
    expect(within(navPanel).getByRole("link", { name: /Mi perfil/ })).toHaveAttribute("href", "/cuenta?seccion=perfil");
    expect(within(navPanel).getByRole("link", { name: /Mis preferencias/ })).toHaveAttribute("href", "/cuenta/preferencias");
    expect(within(navPanel).getByRole("link", { name: /Ayuda/ })).toHaveAttribute("href", "/soporte");

    // Card promocional inferior
    expect(screen.getByText("Mueve tu auto sin salir de casa")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Registrar traslado/ })).toHaveAttribute("href", "/viajes/nuevo");
  });

  it("renderiza la barra superior con buscador contextual, campana y avatar dropdown", async () => {
    const user = userEvent.setup();
    render(<CuentaDesktop cuenta={cuentaMock} />);

    // Buscador
    const buscador = screen.getByPlaceholderText("Buscar traslados, vehículos o documentos...");
    expect(buscador).toBeInTheDocument();
    await user.type(buscador, "Mazda");
    expect(buscador).toHaveValue("Mazda");

    // Avatar y dropdown
    const botonUsuario = screen.getByRole("button", { name: /Menú de usuario Hector Molina/ });
    expect(botonUsuario).toBeInTheDocument();
    expect(screen.getAllByText("HM").length).toBeGreaterThanOrEqual(1);

    await user.click(botonUsuario);
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /Mi cuenta/ })).toHaveAttribute("href", "/cuenta");
    expect(screen.getByRole("menuitem", { name: /Mi perfil/ })).toHaveAttribute("href", "/cuenta?seccion=perfil");
    expect(screen.getByRole("menuitem", { name: /Mis vehículos/ })).toHaveAttribute("href", "/cuenta/vehiculos");
    expect(screen.getByRole("menuitem", { name: /Mis preferencias/ })).toHaveAttribute("href", "/cuenta/preferencias");
  });

  it("renderiza el header de cuenta con saludo dinámico y subtítulo", () => {
    render(<CuentaDesktop cuenta={cuentaMock} />);

    expect(screen.getByText("CUENTA")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /¡Hola, Hector!/ })).toBeInTheDocument();
    expect(screen.getByText("Aquí puedes gestionar tu información, seguridad y configuración.")).toBeInTheDocument();
    expect(screen.getByText(/Traslado vehicular con conductores certificados/)).toBeInTheDocument();
  });

  it("muestra la tarjeta de perfil con datos del usuario, badge de verificado y 3 contadores numéricos", () => {
    render(<CuentaDesktop cuenta={cuentaMock} />);

    // Nombre, correo, teléfono
    expect(screen.getAllByText("Hector Molina").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("lomelinhectorm@gmail.com").length).toBeGreaterThan(0);
    expect(screen.getAllByText("+52 5566522178").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Verificado").length).toBeGreaterThan(0);

    // Botón de editar perfil
    expect(screen.getByRole("link", { name: /Editar perfil/ })).toHaveAttribute("href", "/cuenta/datos-personales");

    // 3 contadores: Incidencias (0), Traslados (2), Vehículos (2)
    expect(screen.getByText("Incidencias")).toBeInTheDocument();
    expect(screen.getAllByText("Traslados").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Vehículos").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getAllByText("2").length).toBeGreaterThanOrEqual(2);
  });

  it("muestra la tarjeta de seguridad verificada y abre el modal de consejos", async () => {
    const user = userEvent.setup();
    render(<CuentaDesktop cuenta={cuentaMock} />);

    expect(screen.getByText("Tu cuenta está verificada")).toBeInTheDocument();
    expect(screen.getByText("Consulta tus datos y el estado de tus servicios.")).toBeInTheDocument();

    const botonConsejos = screen.getByRole("button", { name: /Ver consejos de seguridad/ });
    await user.click(botonConsejos);

    // Modal abierto
    const modal = screen.getByRole("dialog");
    expect(modal).toBeInTheDocument();
    expect(screen.getByText("Consejos de seguridad")).toBeInTheDocument();
    expect(screen.getByText(/Conductores certificados/)).toBeInTheDocument();
    expect(screen.getByText(/Evidencia fotográfica/)).toBeInTheDocument();

    // Cerrar modal
    const botonEntendido = screen.getByRole("button", { name: "Entendido" });
    await user.click(botonEntendido);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renderiza los 4 accesos rápidos (Perfil, Soporte, Legal y Cerrar sesión)", async () => {
    const user = userEvent.setup();
    render(<CuentaDesktop cuenta={cuentaMock} />);

    expect(screen.getByRole("link", { name: /Perfil Edita tu información personal/ })).toHaveAttribute("href", "/cuenta/datos-personales");
    expect(screen.getByRole("link", { name: /Soporte Obtén ayuda y contáctanos/ })).toHaveAttribute("href", "/soporte");
    expect(screen.getByRole("link", { name: /Legal y cuenta Términos, privacidad y seguridad/ })).toHaveAttribute("href", "#opciones-legales");

    const botonLogout = screen.getByRole("button", { name: "Cerrar sesión" });
    expect(botonLogout).toBeInTheDocument();

    await user.click(botonLogout);
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith("/login");
  });

  it("renderiza el bloque de información personal con México y Zona horaria", () => {
    render(<CuentaDesktop cuenta={cuentaMock} />);

    expect(screen.getByRole("heading", { name: "Información personal" })).toBeInTheDocument();
    expect(screen.getByText("Nombre completo")).toBeInTheDocument();
    expect(screen.getByText("Correo electrónico")).toBeInTheDocument();
    expect(screen.getByText("Teléfono")).toBeInTheDocument();
    expect(screen.getByText("País")).toBeInTheDocument();
    expect(screen.getByText("México")).toBeInTheDocument();
    expect(screen.getByText("Zona horaria del servicio")).toBeInTheDocument();
    expect(screen.getByText("(UTC-06:00) Ciudad de México")).toBeInTheDocument();
  });

  it("renderiza la actividad reciente con eventos y tags de estado", () => {
    render(<CuentaDesktop cuenta={cuentaMock} />);

    expect(screen.getByRole("heading", { name: "Actividad reciente" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver todo" })).toHaveAttribute("href", "/mis-viajes");
    expect(screen.getByText("No hay actividad de traslados registrada.")).toBeInTheDocument();
    expect(screen.queryByText("Inicio de sesión")).not.toBeInTheDocument();
    expect(screen.queryByText("Perfil actualizado")).not.toBeInTheDocument();
  });

  it("renderiza el panel de ayuda y el carrusel de tip de la semana", async () => {
    const user = userEvent.setup();
    render(<CuentaDesktop cuenta={cuentaMock} />);

    // Panel de ayuda
    expect(screen.getByRole("heading", { name: "¿Necesitas ayuda?" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Contactar soporte/ })).toHaveAttribute("href", "/soporte");
    expect(screen.getByRole("link", { name: /Centro de ayuda/ })).toHaveAttribute("href", "/preguntas-frecuentes");

    // Tip de la semana
    expect(screen.getByText("Tip de la semana")).toBeInTheDocument();
    expect(screen.getByText(/Mantén tu información actualizada/)).toBeInTheDocument();

    // Rotar al siguiente tip
    const botonSiguienteTip = screen.getByRole("button", { name: /Siguiente consejo de la semana/ });
    await user.click(botonSiguienteTip);
    expect(screen.getByText(/Revisa el Pasaporte Digital/)).toBeInTheDocument();
  });
});
