/** @vitest-environment jsdom */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CuentaCliente } from "./CuentaCliente";
import type { Database } from "@ruum/shared/types";

type Usuario = Database["public"]["Tables"]["usuarios"]["Row"];
type Vehiculo = Database["public"]["Tables"]["vehiculos"]["Row"];

const mockPush = vi.fn();
const mockRefresh = vi.fn();
const mockSignOut = vi.fn().mockResolvedValue({ error: null });

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

vi.mock("../../lib/supabase-browser", () => ({
  crearClienteNavegador: () => ({
    auth: {
      signOut: mockSignOut,
    },
  }),
}));

const mockUsuario: Partial<Usuario> = {
  id: "user-cuenta-1",
  nombre: "Carlos Ramos",
  correo_facturacion: "carlos.ramos@empresa.com",
  telefono: "+52 55 1234 5678",
  estado_verificacion: "verificado",
  metodo_pago_registrado: true,
  rfc: "RAMC850101XYZ",
  traslados_completados_sin_incidencia: 12,
};

const mockVehiculos: Partial<Vehiculo>[] = [
  {
    id: "veh-1",
    marca: "BMW",
    modelo: "Serie 3",
    anio: 2023,
    placas: "XYZ-789",
    alias: "Auto personal",
  },
];

describe("CuentaCliente — Sistema móvil unificado", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza encabezado principal y héroe de perfil con estadísticas", () => {
    render(
      <CuentaCliente
        correoRegistro="registro@ruum.test"
        usuario={mockUsuario as Usuario}
        vehiculos={mockVehiculos as Vehiculo[]}
        totalTraslados={15}
      />
    );

    expect(screen.getByRole("heading", { level: 1, name: "Cuenta" })).toBeInTheDocument();
    expect(screen.getByText("Carlos Ramos")).toBeInTheDocument();
    expect(screen.getByText("registro@ruum.test")).toBeInTheDocument();
    expect(screen.queryByText("carlos.ramos@empresa.com")).not.toBeInTheDocument();
    expect(screen.getByText("+52 55 1234 5678")).toBeInTheDocument();

    // Estadísticas
    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText("Traslados")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("Vehículos")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("Sin incidencias")).toBeInTheDocument();
  });

  it("renderiza lista de vehículos y enlace para agregar vehículo", () => {
    render(
      <CuentaCliente
        usuario={mockUsuario as Usuario}
        vehiculos={mockVehiculos as Vehiculo[]}
        totalTraslados={15}
      />
    );

    expect(screen.getByText("BMW Serie 3 2023")).toBeInTheDocument();
    expect(screen.getByText("XYZ-789")).toBeInTheDocument();
    expect(screen.getByText("Auto personal")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /agregar vehículo/i })).toHaveAttribute(
      "href",
      "/cuenta/vehiculos"
    );
  });

  it("unifica verificación y facturación y elimina métodos de pago", () => {
    render(
      <CuentaCliente
        usuario={mockUsuario as Usuario}
        vehiculos={mockVehiculos as Vehiculo[]}
        totalTraslados={15}
      />
    );

    // Perfil
    expect(screen.getByRole("navigation", { name: "Perfil" })).toBeInTheDocument();
    expect(screen.getByText("Datos personales")).toBeInTheDocument();
    expect(screen.getByText("Contraseña")).toBeInTheDocument();
    expect(screen.getByText("Verificación y facturación")).toBeInTheDocument();
    expect(screen.getByText("Verificado")).toBeInTheDocument();
    expect(screen.getByText("Preferencias")).toBeInTheDocument();

    expect(screen.queryByRole("navigation", { name: "Pagos y facturación" })).not.toBeInTheDocument();
    expect(screen.queryByText("Métodos de pago")).not.toBeInTheDocument();
    expect(screen.queryByText("Facturación")).not.toBeInTheDocument();
    expect(screen.getByText("Verificación y facturación").closest("a")).toHaveAttribute("href", "/cuenta/verificacion-documentos");

    // Legal y cuenta
    expect(screen.getByRole("navigation", { name: "Legal y cuenta" })).toBeInTheDocument();
    expect(screen.getByText("Términos y condiciones")).toBeInTheDocument();
    expect(screen.getByText("Aviso de privacidad")).toBeInTheDocument();
    expect(screen.getByText("Eliminar cuenta")).toBeInTheDocument();
  });

  it("permite cerrar sesión y redirige a la raíz", async () => {
    const user = userEvent.setup();
    render(
      <CuentaCliente
        usuario={mockUsuario as Usuario}
        vehiculos={mockVehiculos as Vehiculo[]}
        totalTraslados={15}
      />
    );

    const botonCerrarSesion = screen.getByRole("button", { name: /cerrar sesión/i });
    await user.click(botonCerrarSesion);

    expect(mockSignOut).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/");
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("inicia con todos los acordeones cerrados por defecto manteniendo perfil y vehículos visibles", () => {
    render(
      <CuentaCliente
        correoRegistro="registro@ruum.test"
        usuario={mockUsuario as Usuario}
        vehiculos={mockVehiculos as Vehiculo[]}
        totalTraslados={15}
      />
    );

    // Héroe de perfil y vehículos visibles permanentemente
    expect(screen.getByRole("region", { name: "Perfil" })).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Mis vehículos" })).toBeInTheDocument();

    // 3 botones de acordeón cerrados por defecto (Notificaciones centralizado en Preferencias)
    const btnPerfil = screen.getByRole("button", { name: /perfil/i });
    const btnSoporte = screen.getByRole("button", { name: /soporte/i });
    const btnLegal = screen.getByRole("button", { name: /legal y cuenta/i });

    expect(btnPerfil).toHaveAttribute("aria-expanded", "false");
    expect(btnSoporte).toHaveAttribute("aria-expanded", "false");
    expect(btnLegal).toHaveAttribute("aria-expanded", "false");

    // Sin sección duplicada de Notificaciones en Cuenta
    expect(screen.queryByRole("button", { name: /^notificaciones$/i })).not.toBeInTheDocument();

    // Todos los chevrons con rotación inicial 0°
    const chevrons = screen.getAllByTestId("chevron-acordeon");
    expect(chevrons).toHaveLength(3);
    chevrons.forEach((chevron) => {
      expect(chevron).toHaveClass("rotate-0");
      expect(chevron).not.toHaveClass("rotate-90");
    });
  });

  it("expande y contrae acordeones al hacer clic rotando el chevron 90 grados", async () => {
    const user = userEvent.setup();
    render(
      <CuentaCliente
        usuario={mockUsuario as Usuario}
        vehiculos={mockVehiculos as Vehiculo[]}
        totalTraslados={15}
      />
    );

    const btnPerfil = screen.getByRole("button", { name: /perfil/i });
    const chevronPerfil = btnPerfil.querySelector('[data-testid="chevron-acordeon"]');

    expect(btnPerfil).toHaveAttribute("aria-expanded", "false");
    expect(chevronPerfil).toHaveClass("rotate-0");

    // Abrir Perfil
    await user.click(btnPerfil);
    expect(btnPerfil).toHaveAttribute("aria-expanded", "true");
    expect(chevronPerfil).toHaveClass("rotate-90");

    // Abrir Soporte independientemente
    const btnSoporte = screen.getByRole("button", { name: /soporte/i });
    const chevronSoporte = btnSoporte.querySelector('[data-testid="chevron-acordeon"]');
    await user.click(btnSoporte);
    expect(btnSoporte).toHaveAttribute("aria-expanded", "true");
    expect(chevronSoporte).toHaveClass("rotate-90");
    // Perfil permanece abierto
    expect(btnPerfil).toHaveAttribute("aria-expanded", "true");

    // Cerrar Perfil
    await user.click(btnPerfil);
    expect(btnPerfil).toHaveAttribute("aria-expanded", "false");
    expect(chevronPerfil).toHaveClass("rotate-0");
    // Soporte sigue abierto
    expect(btnSoporte).toHaveAttribute("aria-expanded", "true");
  });
});
