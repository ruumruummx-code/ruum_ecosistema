/** @vitest-environment jsdom */
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  within,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { CuentaDesktop } from "./CuentaDesktop";
import { actividadCuenta, antiguedadCuenta } from "./cuenta-desktop-model";
import type { CuentaReal } from "./cuenta-ui";
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
  crearClienteNavegador: () => ({ auth: { signOut } }),
  tieneSupabaseConfigurado: () => true,
}));
const cuenta: CuentaReal = {
  usuario: {
    id: "usuario-1",
    nombre: "Carlos Mendoza",
    telefono: "+52 5512345678",
    pais: "México",
    estado_verificacion: "verificado",
    creado_en: "2024-01-01T12:00:00Z",
    calle: "Los Serranos",
    numero: "225",
    colonia: "La Magdalena",
    codigo_postal: "52104",
    ciudad: "San Mateo Atenco",
    estado: "Estado de México",
    rfc: "XAXX010101000",
    razon_social: "Carlos Mendoza",
    regimen_fiscal: "Persona Física",
    codigo_postal_fiscal: "52104",
    metodo_pago_registrado: false,
  } as CuentaReal["usuario"],
  correoRegistro: "carlos@ejemplo.com",
  fotoPerfilUrl: null,
  vehiculos: [],
  empresa: null,
  totalTraslados: 0,
  incidenciasAbiertas: 0,
  traslados: [],
};
beforeEach(() => {
  vi.clearAllMocks();
  signOut.mockResolvedValue({ error: null });
});
afterEach(cleanup);
describe("Mi cuenta desktop", () => {
  it("muestra la cuenta activa, el saludo y los accesos funcionales", () => {
    render(<CuentaDesktop cuenta={cuenta} />);
    expect(
      within(
        screen.getByRole("navigation", { name: "Navegación del panel" }),
      ).getByRole("link", { name: "Mi cuenta" }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      screen.getByRole("heading", { name: /Hola, Carlos/ }),
    ).toBeInTheDocument();
    const nav = within(
      screen.getByRole("navigation", { name: "Categorías de mi cuenta" }),
    );
    expect(nav.getByRole("link", { name: /Datos personales/ })).toHaveAttribute(
      "href",
      "/cuenta/datos-personales",
    );
    expect(nav.getByRole("link", { name: /Preferencias/ })).toHaveAttribute(
      "href",
      "/cuenta/preferencias",
    );
    fireEvent.click(nav.getByRole("button", { name: /Métodos de pago/ }));
    expect(
      within(screen.getByRole("dialog")).getByText(
        "Tu cuenta no tiene un método de pago registrado.",
      ),
    ).toBeInTheDocument();
  });
  it.each(["pendiente", "en_revision", "rechazado", null])(
    "conserva el estado real de verificación: %s",
    (estado) => {
      render(
        <CuentaDesktop
          cuenta={{
            ...cuenta,
            usuario: {
              ...cuenta.usuario,
              estado_verificacion: estado,
            } as CuentaReal["usuario"],
          }}
        />,
      );
      expect(
        screen.queryByText("Tu cuenta está verificada"),
      ).not.toBeInTheDocument();
      expect(screen.queryByText("Verificado")).not.toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "Revisar verificación" }),
      ).toHaveAttribute("href", "/cuenta/verificacion-documentos");
    },
  );
  it("muestra información y facturación reales, incluidos los datos de empresa", () => {
    render(
      <CuentaDesktop
        cuenta={{
          ...cuenta,
          empresa: {
            razon_social: "Empresa Real",
            rfc: "EMP010101XX1",
            regimen_fiscal: "601",
            codigo_postal_fiscal: "06000",
          } as CuentaReal["empresa"],
        }}
      />,
    );
    const personal = within(
      screen.getByRole("region", { name: "Información personal" }),
    );
    expect(personal.getByText("carlos@ejemplo.com")).toBeInTheDocument();
    expect(
      personal.getByText("(UTC-06:00) Ciudad de México"),
    ).toBeInTheDocument();
    const direccion = within(
      screen.getByRole("region", { name: "Dirección y facturación" }),
    );
    expect(direccion.getByText("Los Serranos 225")).toBeInTheDocument();
    expect(direccion.getByText("Empresa Real")).toBeInTheDocument();
    expect(direccion.getByText("RFC: EMP010101XX1")).toBeInTheDocument();
    expect(direccion.getByRole("link", { name: "Editar" })).toHaveAttribute(
      "href",
      "/cuenta/facturacion",
    );
  });
  it("usa las ubicaciones existentes y no inventa dispositivos ni fechas de seguridad", () => {
    render(<CuentaDesktop cuenta={cuenta} />);
    const perfil = within(screen.getByLabelText("Resumen de perfil"));
    expect(perfil.getByRole("link", { name: "1 Ubicaciones" })).toHaveAttribute(
      "href",
      "/ubicaciones",
    );
    expect(
      screen.queryByText("2 dispositivos con sesión iniciada"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Última actualización: 12 ago/),
    ).not.toBeInTheDocument();
    expect(
      antiguedadCuenta(
        "2024-01-01T12:00:00Z",
        new Date("2026-10-27T12:00:00Z"),
      ),
    ).toBe("2 años");
    expect(antiguedadCuenta(undefined)).toBe("—");
  });
  it("ordena actividad real de vehículos y traslados sin alterar las listas originales", () => {
    const datos = {
      ...cuenta,
      vehiculos: [
        {
          id: "auto-a",
          marca: "Honda",
          modelo: "Civic",
          creado_en: "2026-10-25T12:00:00Z",
        },
      ] as CuentaReal["vehiculos"],
      traslados: [
        {
          traslado_id: "viejo",
          creado_en: "2026-10-20T12:00:00Z",
          estado: "servicio_cancelado",
          vehiculo_marca: "Honda",
        },
        {
          traslado_id: "nuevo",
          creado_en: "2026-10-27T12:00:00Z",
          estado: "traslado_en_curso",
          vehiculo_marca: "Chrysler",
          vehiculo_modelo: "Cirrus",
          vehiculo_anio: 2024,
        },
      ] as CuentaReal["traslados"],
    };
    const orden = datos.traslados!.map((t) => t.traslado_id);
    render(<CuentaDesktop cuenta={datos} />);
    const actividad = within(
      screen.getByRole("region", { name: "Actividad reciente" }),
    );
    expect(actividad.getAllByRole("listitem")).toHaveLength(3);
    expect(
      within(actividad.getAllByRole("listitem")[0]).getByRole("link"),
    ).toHaveAttribute("href", "/viajes/nuevo");
    expect(actividad.getByText("En tránsito")).toBeInTheDocument();
    expect(
      actividad.getByRole("link", { name: /Vehículo registrado/ }),
    ).toHaveAttribute("href", "/cuenta/vehiculos/auto-a");
    expect(actividadCuenta(datos)[0].id).toBe("traslado-nuevo");
    expect(datos.traslados!.map((t) => t.traslado_id)).toEqual(orden);
  });
  it("abre consejos, cierra con Escape nativo y restaura el foco", async () => {
    render(<CuentaDesktop cuenta={cuenta} />);
    const abrir = screen.getByRole("button", {
      name: "Ver consejos de seguridad",
    });
    abrir.focus();
    fireEvent.click(abrir);
    const dialog = screen.getByRole("dialog", {
      name: "Consejos de seguridad",
    });
    expect(
      within(dialog).getByText("Evidencia fotográfica"),
    ).toBeInTheDocument();
    fireEvent(dialog, new Event("cancel", { bubbles: true, cancelable: true }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(abrir).toHaveFocus());
  });
  it("consulta la disponibilidad de dos pasos sin fingir una activación", () => {
    render(<CuentaDesktop cuenta={cuenta} />);
    fireEvent.click(screen.getByRole("button", { name: "Activar" }));
    const dialog = within(
      screen.getByRole("dialog", { name: "Verificación en dos pasos" }),
    );
    expect(dialog.getByText(/todavía no está disponible/)).toBeInTheDocument();
    expect(
      dialog.getByRole("link", { name: "Contactar soporte" }),
    ).toHaveAttribute("href", "/soporte?tema=verificacion-dos-pasos");
    expect(signOut).not.toHaveBeenCalled();
  });
  it("cierra otras sesiones únicamente tras confirmar y conserva la sesión actual", async () => {
    render(<CuentaDesktop cuenta={cuenta} />);
    fireEvent.click(screen.getByRole("button", { name: "Administrar" }));
    const dialog = within(
      screen.getByRole("dialog", { name: "Dispositivos y sesiones" }),
    );
    fireEvent.click(
      dialog.getByRole("button", { name: "Cerrar otras sesiones" }),
    );
    expect(signOut).not.toHaveBeenCalled();
    fireEvent.click(dialog.getByRole("button", { name: "Confirmar cierre" }));
    await waitFor(() =>
      expect(signOut).toHaveBeenCalledWith({ scope: "others" }),
    );
    expect(await dialog.findByRole("status")).toHaveTextContent(
      "Esta sesión permanece activa",
    );
    expect(replace).not.toHaveBeenCalled();
  });
  it("permite reintentar el cierre de otras sesiones después de un error", async () => {
    signOut.mockResolvedValueOnce({ error: new Error("sin red") });
    render(<CuentaDesktop cuenta={cuenta} />);
    fireEvent.click(screen.getByRole("button", { name: "Administrar" }));
    const dialog = within(screen.getByRole("dialog"));
    fireEvent.click(
      dialog.getByRole("button", { name: "Cerrar otras sesiones" }),
    );
    fireEvent.click(dialog.getByRole("button", { name: "Confirmar cierre" }));
    expect(await dialog.findByRole("alert")).toHaveTextContent(
      "No pudimos cerrar las otras sesiones",
    );
    fireEvent.click(dialog.getByRole("button", { name: "Confirmar cierre" }));
    expect(await dialog.findByRole("status")).toHaveTextContent(
      "Se cerraron las otras sesiones",
    );
  });
  it("muestra los fallos de cierre de cuenta dentro del diálogo y permite reintentar", async () => {
    signOut.mockResolvedValueOnce({ error: new Error("sin red") });
    render(<CuentaDesktop cuenta={cuenta} seccionInicial="sesiones" />);
    const dialog = within(screen.getByRole("dialog"));
    fireEvent.click(dialog.getByRole("button", { name: "Cerrar sesión" }));
    expect(await dialog.findByRole("alert")).toHaveTextContent(
      "No pudimos cerrar tu sesión",
    );
    fireEvent.click(dialog.getByRole("button", { name: "Cerrar sesión" }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
  });
  it("muestra iniciales al fallar la foto y enfoca perfil sin desplazar la pantalla", () => {
    render(
      <CuentaDesktop
        cuenta={{ ...cuenta, fotoPerfilUrl: "https://ejemplo.com/avatar.webp" }}
        seccionInicial="perfil"
      />,
    );
    fireEvent.error(screen.getByAltText("Fotografía de Carlos Mendoza"));
    expect(
      screen.getByLabelText("Iniciales de Carlos Mendoza"),
    ).toHaveTextContent("CM");
    expect(
      screen.getByRole("region", { name: "Información personal" }),
    ).toHaveFocus();
  });
  it("presenta estados vacíos con datos incompletos y sin identidad ficticia", () => {
    render(
      <CuentaDesktop
        cuenta={{
          ...cuenta,
          correoRegistro: null,
          usuario: {
            id: "sin-datos",
            nombre: " ",
            telefono: null,
            pais: null,
            estado_verificacion: "pendiente",
          } as CuentaReal["usuario"],
        }}
      />,
    );
    expect(screen.queryByText("Carlos Mendoza")).not.toBeInTheDocument();
    expect(screen.getAllByText("Sin correo registrado").length).toBeGreaterThan(
      0,
    );
    expect(screen.getByText("País no registrado")).toBeInTheDocument();
    expect(
      screen.getByText("Agrega tu dirección principal."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("No hay actividad registrada."),
    ).toBeInTheDocument();
  });
});
