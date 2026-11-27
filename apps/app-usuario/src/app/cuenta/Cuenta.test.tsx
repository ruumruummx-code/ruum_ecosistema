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
import { Cuenta } from "./Cuenta";
import { actividadCuenta, mesAltaCuenta } from "./cuenta-model";
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
/* jsdom no implementa <dialog> modal; Sheet lo usa. */
HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
  this.setAttribute("open", "");
};
HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
  this.removeAttribute("open");
};
function simularAncho(ancho: number) {
  window.matchMedia = vi.fn((query: string) => ({
    matches: Number(/min-width:\s*(\d+)px/.exec(query)?.[1] ?? 0) <= ancho,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}
beforeEach(() => {
  vi.clearAllMocks();
  simularAncho(1280);
  signOut.mockResolvedValue({ error: null });
});
afterEach(cleanup);
describe("Mi cuenta", () => {
  it("muestra la cuenta activa, el saludo y los accesos funcionales", () => {
    render(<Cuenta cuenta={cuenta} />);
    expect(
      screen.getByRole("heading", { name: /Hola, Carlos/ }),
    ).toBeInTheDocument();
    const nav = within(
      screen.getByRole("navigation", { name: "Categorías de mi cuenta" }),
    );
    expect(nav.getByRole("link", { name: /Datos personales/ })).toHaveAttribute(
      "href",
      "#informacion-personal-cuenta",
    );
    expect(nav.getByRole("link", { name: /^Seguridad/ })).toHaveAttribute("href", "#seguridad-de-la-cuenta");
    expect(nav.getByText("Sin método de pago registrado")).toBeVisible();
    expect(nav.getByRole("link", { name: /Preferencias/ })).toHaveAttribute(
      "href",
      "/cuenta/preferencias",
    );
    expect(nav.getByRole("link", { name: /Métodos de pago/ })).toHaveAttribute("href", "/cuenta/metodos-pago");
  });
  it.each(["pendiente", "en_revision", "rechazado", null])(
    "conserva el estado real de verificación: %s",
    (estado) => {
      render(
        <Cuenta
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
      <Cuenta
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
    expect(direccion.queryByRole("link", { name: "Completar datos fiscales" })).not.toBeInTheDocument();
    expect(direccion.getByText("RFC: EMP0••••••X1")).toBeInTheDocument();
    expect(direccion.getByRole("link", { name: "Editar" })).toHaveAttribute(
      "href",
      "/cuenta/facturacion",
    );
  });
  it("formatea el nombre de perfil y enlaza directamente los datos fiscales faltantes", () => {
    render(<Cuenta cuenta={{
      ...cuenta,
      usuario: { ...cuenta.usuario, nombre: "HÉCTOR MANUEL DE LA CRUZ", razon_social: "EMPRESA REAL", rfc: null },
    }} />);
    const perfil = within(screen.getByRole("region", { name: "Resumen de perfil" }));
    const personal = within(screen.getByRole("region", { name: "Información personal" }));
    const facturacion = within(screen.getByRole("region", { name: "Dirección y facturación" }));
    expect(perfil.getByRole("heading", { name: "Héctor Manuel de la Cruz" })).toBeVisible();
    expect(personal.getByText("Héctor Manuel de la Cruz")).toBeVisible();
    expect(screen.getByRole("heading", { name: /Hola, Héctor/ })).toBeVisible();
    expect(facturacion.getByText("EMPRESA REAL")).toBeVisible();
    expect(facturacion.getByRole("link", { name: "Completar datos fiscales" })).toHaveAttribute("href", "/cuenta/facturacion");
  });
  it("usa las ubicaciones existentes y no inventa dispositivos ni fechas de seguridad", () => {
    render(<Cuenta cuenta={cuenta} />);
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
    expect(perfil.getByRole("link", { name: "0 Traslados" })).toHaveAttribute("href", "/mis-viajes");
    expect(perfil.getByRole("link", { name: "0 Vehículos" })).toHaveAttribute("href", "/cuenta/vehiculos");
    expect(perfil.getByText("ene 2024")).toBeVisible();
    expect(mesAltaCuenta(undefined)).toBe("—");
  });
  it("muestra el banner accesible de solicitud de conductor pendiente cuando aplica", () => {
    render(
      <Cuenta
        cuenta={{
          ...cuenta,
          rolInfo: {
            rolBaseUsuario: "sin_rol",
            rolEfectivo: "sin_rol",
            esConductorAprobado: false,
            estadoConductor: "solicitud_pendiente",
            solicitudConductor: {
              id: "sol-1",
              estado: "en_revision",
              pasoActual: 3,
              enviadoEn: "2026-11-04T12:00:00Z",
              actualizadoEn: "2026-11-04T12:00:00Z",
              esPendiente: true,
            },
          },
        }}
      />,
    );
    expect(
      screen.getByRole("region", { name: "Estado de solicitud de conductor" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Solicitud de conductor en revisión"),
    ).toBeInTheDocument();
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
    render(<Cuenta cuenta={datos} />);
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
    render(<Cuenta cuenta={cuenta} />);
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
    render(<Cuenta cuenta={cuenta} />);
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
    render(<Cuenta cuenta={cuenta} />);
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
    render(<Cuenta cuenta={cuenta} />);
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
    render(<Cuenta cuenta={cuenta} seccionInicial="sesiones" />);
    const dialog = within(screen.getByRole("dialog"));
    fireEvent.click(dialog.getByRole("button", { name: "Cerrar sesión en este dispositivo" }));
    expect(await dialog.findByRole("alert")).toHaveTextContent(
      "No pudimos cerrar tu sesión",
    );
    fireEvent.click(dialog.getByRole("button", { name: "Cerrar sesión en este dispositivo" }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
  });
  it("muestra iniciales al fallar la foto y enfoca perfil sin desplazar la pantalla", () => {
    render(
      <Cuenta
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
      <Cuenta
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

  it("cierra sesión desde Más opciones con scope local y redirige al Login", async () => {
    render(<Cuenta cuenta={cuenta} />);
    fireEvent.click(within(screen.getByRole("region", { name: "Más opciones" })).getByRole("button", { name: "Cerrar sesión" }));
    await waitFor(() => expect(signOut).toHaveBeenCalledWith({ scope: "local" }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
    expect(refresh).toHaveBeenCalledTimes(1);
  });
  it("avisa si el cierre de sesión falla y permite reintentar sin redirigir", async () => {
    signOut.mockResolvedValueOnce({ error: new Error("sin red") });
    render(<Cuenta cuenta={cuenta} />);
    const opciones = within(screen.getByRole("region", { name: "Más opciones" }));
    fireEvent.click(opciones.getByRole("button", { name: "Cerrar sesión" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("No pudimos cerrar tu sesión");
    expect(replace).not.toHaveBeenCalled();
    expect(opciones.getByRole("button", { name: "Cerrar sesión" })).toBeEnabled();
  });
  it.each([
    ["Ayuda y soporte", "Ayuda de tu cuenta", [["Contactar soporte", "/soporte"], ["Centro de ayuda", "/preguntas-frecuentes"], ["Reportar problema", "/soporte?motivo=problema_traslado"], ["Ayuda con evidencia", "/soporte?motivo=ayuda_evidencia"]]],
    ["Legal y cuenta", "Legal y cuenta", [["Términos y condiciones", "/legal/terminos"], ["Aviso de privacidad", "/legal/privacidad"], ["Eliminar cuenta", "/soporte?motivo=eliminar_cuenta"]]],
  ] as const)("abre %s en un diálogo con sus enlaces y restaura el foco", async (boton, titulo, enlaces) => {
    render(<Cuenta cuenta={cuenta} />);
    const abrir = screen.getByRole("button", { name: new RegExp("^" + boton) });
    abrir.focus();
    fireEvent.click(abrir);
    const dialogo = within(screen.getByRole("dialog", { name: titulo }));
    for (const [nombre, href] of enlaces) expect(dialogo.getByRole("link", { name: new RegExp(nombre) })).toHaveAttribute("href", href);
    fireEvent.click(dialogo.getByRole("button", { name: "Cerrar diálogo de cuenta" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(abrir).toHaveFocus());
  });
  it("enlaza verificación con su estado y las cargas masivas pendientes", () => {
    render(<Cuenta cuenta={cuenta} />);
    const opciones = within(screen.getByRole("region", { name: "Más opciones" }));
    expect(opciones.getByRole("link", { name: /Verificación y documentos/ })).toHaveAttribute("href", "/cuenta/verificacion-documentos");
    expect(opciones.getByText("Verificado")).toBeInTheDocument();
    expect(opciones.getByRole("link", { name: /Cargas masivas pendientes/ })).toHaveAttribute("href", "/viajes/masivo");
  });
  it("abre la sección inicial solo en la copia del marco visible", () => {
    simularAncho(390);
    render(
      <>
        <Cuenta cuenta={cuenta} seccionInicial="legal" marco="movil" />
        <Cuenta cuenta={cuenta} seccionInicial="legal" marco="escritorio" />
      </>,
    );
    expect(screen.getAllByRole("dialog", { name: "Legal y cuenta" })).toHaveLength(1);
    const accesos = screen.getAllByRole("navigation", { name: "Categorías de mi cuenta" });
    expect(within(accesos[0]).getByRole("link", { name: /Datos personales/ })).toHaveAttribute("href", "#informacion-personal-cuenta-movil");
    expect(within(accesos[1]).getByRole("link", { name: /Datos personales/ })).toHaveAttribute("href", "#informacion-personal-cuenta");
    expect(document.getElementById("informacion-personal-cuenta-movil")).not.toBeNull();
  });
});
