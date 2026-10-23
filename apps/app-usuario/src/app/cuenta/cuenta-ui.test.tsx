/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const getUserMock = vi.fn();
const crearClienteServidorMock = vi.fn(async () => ({
  auth: { getUser: getUserMock },
}));
vi.mock("../../lib/supabase-server", () => ({
  crearClienteServidor: () => crearClienteServidorMock(),
}));

const tieneSupabaseMock = vi.fn(() => true);
vi.mock("../../lib/supabase-browser", () => ({
  tieneSupabaseConfigurado: () => tieneSupabaseMock(),
  crearClienteNavegador: () => ({}),
}));

const obtenerUsuarioActualMock = vi.fn();
const obtenerUrlFotoPerfilUsuarioMock = vi.fn();
const listarTrasladosDeUsuarioMock = vi.fn();
const actualizarPerfilUsuarioMock = vi.fn();
const subirFotoPerfilMock = vi.fn();
const solicitarRestablecimientoPasswordUsuarioMock = vi.fn();

vi.mock("@ruum/api/services", () => ({
  obtenerUsuarioActual: (...args: unknown[]) => obtenerUsuarioActualMock(...args),
  obtenerUrlFotoPerfilUsuario: (...args: unknown[]) => obtenerUrlFotoPerfilUsuarioMock(...args),
  listarTrasladosDeUsuario: (...args: unknown[]) => listarTrasladosDeUsuarioMock(...args),
  actualizarPerfilUsuario: (...args: unknown[]) => actualizarPerfilUsuarioMock(...args),
  subirFotoPerfil: (...args: unknown[]) => subirFotoPerfilMock(...args),
  solicitarRestablecimientoPasswordUsuario: (...args: unknown[]) => solicitarRestablecimientoPasswordUsuarioMock(...args),
}));

const listarVehiculosDeUsuarioMock = vi.fn();
vi.mock("@ruum/api/vehicles", () => ({
  listarVehiculosDeUsuario: (...args: unknown[]) => listarVehiculosDeUsuarioMock(...args),
}));

const obtenerEmpresaVisibleMock = vi.fn();
vi.mock("@ruum/api/organizations", () => ({
  obtenerEmpresaVisible: (...args: unknown[]) => obtenerEmpresaVisibleMock(...args),
}));

const consultarCodigoPostalMxMock = vi.fn();
vi.mock("../../lib/codigos-postales", () => ({
  consultarCodigoPostalMx: (...args: unknown[]) => consultarCodigoPostalMxMock(...args),
}));

vi.mock("../NavegacionUsuario", () => ({
  NavegacionUsuario: () => <nav>NavegacionUsuario</nav>,
}));

vi.mock("./FacturacionCuentaForm", () => ({
  FacturacionCuentaForm: () => <div>FacturacionCuentaFormMock</div>,
}));

import {
  AvisoErrorCuenta,
  AvisoSinSesion,
  Campo,
  HeaderCuenta,
  LayoutCuenta,
  NavegacionCuenta,
  SeccionFacturacion,
  SeccionLegal,
  SeccionPerfil,
  SeccionVehiculos,
  conCuenta,
  dato,
  obtenerCuenta,
  type CuentaReal,
  type Usuario,
  type Vehiculo,
} from "./cuenta-ui";
import { PerfilCuentaForm } from "./PerfilCuentaForm";
import { BotonResetPassword } from "./BotonResetPassword";

const usuarioBase: Usuario = {
  id: "u-1",
  auth_user_id: "auth-1",
  nombre: "Ana María López",
  telefono: "+525512345678",
  correo_facturacion: "ana@empresa.mx",
  tipo_cuenta: "empresa",
  empresa_id: "emp-1",
  estado_verificacion: "verificado",
  foto_url: "perfiles/u-1.jpg",
  doc_identidad_url: "docs/ine.pdf",
  pais: "México",
  estado: "Ciudad de México",
  codigo_postal: "06700",
  ciudad: "Cuauhtémoc",
  colonia: "Roma Norte",
  calle: "Álvaro Obregón",
  numero: "120",
  referencias: "Portón negro",
  notificaciones_push: true,
  notificaciones_email: true,
  notificaciones_sms_whatsapp: false,
} as unknown as Usuario;

const vehiculoBase: Vehiculo = {
  id: "veh-1",
  alias: "Auto ejecutivo",
  marca: "Toyota",
  modelo: "Camry",
  anio: 2024,
  tipo: "sedan",
  color: "Plata",
  placas: "XYZ-987",
  vin: "1HGCM82633A004352",
  transmision: "automatica",
  fotos_urls: ["https://example.com/auto.jpg"],
} as unknown as Vehiculo;

describe("cuenta-ui y carga de cuenta", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    tieneSupabaseMock.mockReturnValue(true);
    consultarCodigoPostalMxMock.mockResolvedValue({
      estado: "Ciudad de México",
      ciudades: ["Cuauhtémoc", "Benito Juárez"],
      colonias: ["Roma Norte", "Condesa"],
    });
  });

  it("resuelve obtenerCuenta y conCuenta en estados ok, sin_sesion y error", async () => {
    // Sin sesión por falta de usuario
    getUserMock.mockResolvedValue({ data: { user: null }, error: null });
    expect(await obtenerCuenta()).toEqual({ estado: "sin_sesion" });
    const nodoSinSesion = await conCuenta(() => <div>Contenido</div>);
    const { unmount: u1 } = render(<>{nodoSinSesion}</>);
    expect(screen.getByText(/Inicia sesión para consultar/i)).toBeInTheDocument();
    u1();

    // Error de servidor
    getUserMock.mockResolvedValueOnce({ data: { user: null }, error: new Error("DB down") });
    const nodoError = await conCuenta(() => <div>Contenido</div>);
    const { unmount: u2 } = render(<>{nodoError}</>);
    expect(screen.getByText(/No pudimos cargar tu cuenta/i)).toBeInTheDocument();
    u2();

    // OK completo
    getUserMock.mockResolvedValueOnce({
      data: { user: { id: "auth-1", email: "ana@empresa.mx" } },
      error: null,
    });
    obtenerUsuarioActualMock.mockResolvedValueOnce(usuarioBase);
    obtenerUrlFotoPerfilUsuarioMock.mockResolvedValueOnce("https://example.com/avatar.jpg");
    listarVehiculosDeUsuarioMock.mockResolvedValueOnce([vehiculoBase]);
    obtenerEmpresaVisibleMock.mockResolvedValueOnce({ id: "emp-1", razon_social: "Ruum Corp" });
    listarTrasladosDeUsuarioMock.mockResolvedValueOnce([{ incidencias_abiertas: 2 }]);

    const resOk = await obtenerCuenta();
    expect(resOk.estado).toBe("ok");
    if (resOk.estado === "ok") {
      expect(resOk.cuenta.totalTraslados).toBe(1);
      expect(resOk.cuenta.incidenciasAbiertas).toBe(2);
    }
  });

  it("renderiza LayoutCuenta, SeccionPerfil, SeccionVehiculos, SeccionFacturacion y SeccionLegal", () => {
    expect(dato(null)).toBe("Pendiente");
    expect(dato("Valor")).toBe("Valor");

    const cuenta: CuentaReal = {
      usuario: usuarioBase,
      correoRegistro: "ana@empresa.mx",
      fotoPerfilUrl: "https://example.com/avatar.jpg",
      vehiculos: [vehiculoBase],
      empresa: null,
      totalTraslados: 3,
      incidenciasAbiertas: 0,
    };

    render(
      <LayoutCuenta cuenta={cuenta}>
        <Campo etiqueta="RFC" valor={null} />
        <SeccionPerfil usuario={usuarioBase} fotoUrl={null} />
        <SeccionVehiculos vehiculos={[vehiculoBase]} />
        <SeccionVehiculos vehiculos={[]} />
        <SeccionFacturacion usuario={usuarioBase} empresa={null} />
        <SeccionLegal />
      </LayoutCuenta>
    );

    expect(screen.getByRole("heading", { name: "Cuenta" })).toBeInTheDocument();
    expect(screen.getByText("Información personal")).toBeInTheDocument();
    expect(screen.getByText("Toyota Camry 2024")).toBeInTheDocument();
    expect(screen.getByText("Aún no tienes vehículos frecuentes guardados.")).toBeInTheDocument();
    expect(screen.getByText("FacturacionCuentaFormMock")).toBeInTheDocument();
    expect(screen.getByLabelText("Descargar aviso de privacidad en Word")).toBeInTheDocument();
  });
});

describe("PerfilCuentaForm y BotonResetPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tieneSupabaseMock.mockReturnValue(true);
    consultarCodigoPostalMxMock.mockResolvedValue({
      estado: "Ciudad de México",
      ciudades: ["Cuauhtémoc", "Miguel Hidalgo"],
      colonias: ["Roma Norte", "Juárez"],
    });
  });

  it("valida teléfono, consulta CP, sube fotografía y guarda cambios del perfil", async () => {
    const user = userEvent.setup();
    actualizarPerfilUsuarioMock.mockResolvedValueOnce({});
    subirFotoPerfilMock.mockResolvedValueOnce("perfiles/nueva.png");
    obtenerUrlFotoPerfilUsuarioMock.mockResolvedValueOnce("https://example.com/nueva.png");

    const { container } = render(<PerfilCuentaForm usuario={usuarioBase} fotoUrlInicial={null} />);

    await waitFor(() => {
      expect(consultarCodigoPostalMxMock).toHaveBeenCalledWith("06700");
    });

    // Subir archivo no-imagen -> error
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const txtFile = new File(["hola"], "nota.txt", { type: "text/plain" });
    fireEvent.change(fileInput, { target: { files: [txtFile] } });
    expect(await screen.findByText(/Selecciona una imagen/i)).toBeInTheDocument();

    // Subir imagen válida
    const imgFile = new File(["img"], "avatar.png", { type: "image/png" });
    fireEvent.change(fileInput, { target: { files: [imgFile] } });
    await waitFor(() => {
      expect(subirFotoPerfilMock).toHaveBeenCalled();
    });
    expect(await screen.findByText("Fotografía actualizada.")).toBeInTheDocument();

    // Guardar perfil válido
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => {
      expect(actualizarPerfilUsuarioMock).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          nombre: "Ana María López",
          codigo_postal: "06700",
        })
      );
    });
    expect(await screen.findByText("Datos de cuenta actualizados.")).toBeInTheDocument();
  });

  it("envía correo de restablecimiento de contraseña y maneja errores", async () => {
    const user = userEvent.setup();
    solicitarRestablecimientoPasswordUsuarioMock
      .mockRejectedValueOnce(new Error("Fallo de red"))
      .mockResolvedValueOnce({ email: "ana@empresa.mx" });

    render(<BotonResetPassword />);

    await user.click(screen.getByRole("button", { name: "Enviar correo de cambio" }));
    expect(await screen.findByRole("status")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Enviar correo de cambio" }));
    expect(await screen.findByText(/ana@empresa.mx/)).toBeInTheDocument();
  });
});
