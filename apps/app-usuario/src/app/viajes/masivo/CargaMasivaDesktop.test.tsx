/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CargaMasivaDesktop } from "./CargaMasivaDesktop";

const pushMock = vi.fn();
const backMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, back: backMock }),
}));

const cargarArchivoMock = vi.fn();
const reanudarCargaMock = vi.fn();
const descartarCargaPendienteMock = vi.fn();

vi.mock("../nuevo/hooks/useCargaMasiva", () => ({
  useCargaMasiva: () => ({
    estado: "idle",
    error: null,
    filasVisibles: [],
    filasConError: [],
    filasCorrectas: [],
    totalMXN: 0,
    todasListas: false,
    progreso: 0,
    pagoConfirmado: false,
    cargaId: null,
    stripeClientSecret: null,
    cargarArchivo: cargarArchivoMock,
    corregirCampo: vi.fn(),
    eliminarFila: vi.fn(),
    geocodificarYCotizar: vi.fn(),
    confirmarPago: vi.fn(),
    cancelar: vi.fn(),
    cargaPendienteStorage: null,
    reanudarCarga: reanudarCargaMock,
    descartarCargaPendiente: descartarCargaPendienteMock,
    consultarCargasPendientes: vi.fn().mockResolvedValue([]),
  }),
}));

describe("CargaMasivaDesktop — Pantalla de Carga Masiva de Escritorio", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza el sidebar con la opción Carga Masiva activa y la tarjeta inferior Traslados sin límites", () => {
    render(<CargaMasivaDesktop nombreUsuario="Alex" />);

    const navPanel = screen.getByRole("navigation", { name: "Navegación del panel" });
    const enlaceCarga = within(navPanel).getByRole("link", { name: /^Carga Masiva/ });
    expect(enlaceCarga).toHaveAttribute("aria-current", "page");
    expect(enlaceCarga).toHaveAttribute("href", "/viajes/masivo");

    expect(within(navPanel).getByRole("link", { name: /^Inicio/ })).toHaveAttribute("href", "/");
    expect(within(navPanel).getByRole("link", { name: /^Traslados/ })).toHaveAttribute("href", "/mis-viajes");
    expect(within(navPanel).getByRole("link", { name: /^Cuenta/ })).toHaveAttribute("href", "/cuenta");

    // Card inferior
    expect(screen.getByText("Traslados sin límites")).toBeInTheDocument();
    expect(screen.getByText("Más eficiencia para tu operación.")).toBeInTheDocument();
  });

  it("renderiza la barra superior con migas de pan (Breadcrumbs), notificaciones y dropdown de usuario", async () => {
    const user = userEvent.setup();
    render(<CargaMasivaDesktop nombreUsuario="Alex" />);

    // Breadcrumbs
    const breadcrumbs = screen.getByRole("navigation", { name: "Migas de pan" });
    expect(within(breadcrumbs).getByRole("button", { name: /Volver/ })).toBeInTheDocument();
    expect(within(breadcrumbs).getByRole("link", { name: "Traslados" })).toHaveAttribute("href", "/mis-viajes");
    expect(within(breadcrumbs).getByText("Carga Masiva")).toBeInTheDocument();

    await user.click(within(breadcrumbs).getByRole("button", { name: /Volver/ }));
    expect(backMock).toHaveBeenCalledTimes(1);

    // Usuario
    expect(screen.getByText("Hola, Alex")).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("renderiza el header de la sección con título, subtítulo y botón Mis viajes", () => {
    render(<CargaMasivaDesktop nombreUsuario="Alex" />);

    expect(screen.getByRole("heading", { name: "Carga masiva de traslados" })).toBeInTheDocument();
    expect(screen.getByText(/Cotiza y procesa múltiples traslados desde un archivo/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Mis viajes/ })).toHaveAttribute("href", "/mis-viajes");
  });

  it("renderiza la zona de Dropzone con arrastrar y soltar y botón Seleccionar archivo", () => {
    render(<CargaMasivaDesktop nombreUsuario="Alex" />);

    expect(screen.getByText("Arrastra y suelta tu archivo aquí")).toBeInTheDocument();
    expect(screen.getByText("o haz clic para seleccionar un archivo .xlsx")).toBeInTheDocument();
    expect(screen.getByText("Máximo 100 traslados · Hasta 25 MB")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Seleccionar archivo/ })).toBeInTheDocument();
  });

  it("valida y rechaza archivos que no sean .xlsx mostrando un toast de error", async () => {
    render(<CargaMasivaDesktop nombreUsuario="Alex" />);

    const input = screen.getByLabelText("Cargar archivo Excel .xlsx");
    const archivoInvalido = new File(["dummy content"], "traslados.pdf", { type: "application/pdf" });

    fireEvent.change(input, { target: { files: [archivoInvalido] } });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Formato no admitido. Selecciona un archivo con extensión .xlsx"
    );
    expect(cargarArchivoMock).not.toHaveBeenCalled();
  });

  it("valida y rechaza archivos mayores a 25 MB mostrando un toast de error", async () => {
    render(<CargaMasivaDesktop nombreUsuario="Alex" />);

    const input = screen.getByLabelText("Cargar archivo Excel .xlsx");
    // Archivo de 26 MB
    const archivoPesado = new File([new ArrayBuffer(26 * 1024 * 1024)], "archivo_enorme.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    fireEvent.change(input, { target: { files: [archivoPesado] } });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "El archivo excede el límite máximo permitido de 25 MB."
    );
    expect(cargarArchivoMock).not.toHaveBeenCalled();
  });

  it("acepta archivos .xlsx válidos y ejecuta la carga", async () => {
    cargarArchivoMock.mockResolvedValueOnce(undefined);
    render(<CargaMasivaDesktop nombreUsuario="Alex" />);

    const input = screen.getByLabelText("Cargar archivo Excel .xlsx");
    const archivoValido = new File(["contenido excel"], "flota_central.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    fireEvent.change(input, { target: { files: [archivoValido] } });

    await waitFor(() => {
      expect(cargarArchivoMock).toHaveBeenCalledWith(archivoValido);
    });
  });

  it("renderiza el panel instructivo con 4 pasos y botón de descarga de plantilla oficial", () => {
    render(<CargaMasivaDesktop nombreUsuario="Alex" />);

    expect(screen.getByRole("heading", { name: "¿Cómo funciona?" })).toBeInTheDocument();
    expect(screen.getByText("Descarga la plantilla oficial")).toBeInTheDocument();
    expect(screen.getByText("Llena la información de tus traslados")).toBeInTheDocument();
    expect(screen.getByText("Sube el archivo y nosotros lo procesamos")).toBeInTheDocument();
    expect(screen.getByText("Consulta el resultado y cotiza en segundos")).toBeInTheDocument();

    const botonDescarga = screen.getByRole("link", { name: /Descargar plantilla oficial/ });
    expect(botonDescarga).toHaveAttribute("href", "/docs-legales/plantilla-carga-masiva.xlsx");
    expect(botonDescarga).toHaveAttribute("download", "plantilla-carga-masiva.xlsx");
  });

  it("permite abrir y cerrar el modal de guía de uso", async () => {
    const user = userEvent.setup();
    render(<CargaMasivaDesktop nombreUsuario="Alex" />);

    const botonGuia = screen.getByRole("button", { name: /Ver guía de uso/ });
    await user.click(botonGuia);

    const modal = screen.getByRole("dialog");
    expect(modal).toBeInTheDocument();
    expect(screen.getByText("Guía de uso para la plantilla oficial")).toBeInTheDocument();

    const botonesCerrar = screen.getAllByRole("button", { name: "Cerrar guía" });
    await user.click(botonesCerrar[0]!);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renderiza la cinta de 4 beneficios con iconos y descripciones", () => {
    render(<CargaMasivaDesktop nombreUsuario="Alex" />);

    expect(screen.getByText("Rápido")).toBeInTheDocument();
    expect(screen.getByText("Procesa múltiples traslados en segundos")).toBeInTheDocument();

    expect(screen.getByText("Seguro")).toBeInTheDocument();
    expect(screen.getByText("Tus datos están protegidos")).toBeInTheDocument();

    expect(screen.getByText("Sin errores")).toBeInTheDocument();
    expect(screen.getByText("Validaciones automáticas del archivo")).toBeInTheDocument();

    expect(screen.getByText("Más control")).toBeInTheDocument();
    expect(screen.getByText("Consulta el historial de tus cargas")).toBeInTheDocument();
  });

  it("renderiza la tabla de cargas recientes con badges de estatus coloreados y acciones", async () => {
    const user = userEvent.setup();
    render(<CargaMasivaDesktop nombreUsuario="Alex" />);

    expect(screen.getByRole("heading", { name: "Cargas recientes" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Ver todas/ })).toHaveAttribute("href", "/mis-viajes");

    // Filas
    expect(screen.getByText("traslados_octubre.xlsx")).toBeInTheDocument();
    expect(screen.getByText("Completado")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ver resultado" })).toBeInTheDocument();

    expect(screen.getByText("ruta_quincena.xlsx")).toBeInTheDocument();
    expect(screen.getByText("En proceso")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ver detalle" })).toBeInTheDocument();

    expect(screen.getByText("traslados_sucursal.xlsx")).toBeInTheDocument();
    expect(screen.getByText("Con errores")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ver errores" })).toBeInTheDocument();

    // Abrir modal de detalle al hacer clic en Ver errores
    await user.click(screen.getByRole("button", { name: "Ver errores" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Detalle de errores del archivo")).toBeInTheDocument();
    expect(screen.getByText(/Incidencias encontradas en la plantilla/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Aceptar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("abre el menú contextual de tres puntos en una fila y ejecuta acciones", async () => {
    const user = userEvent.setup();
    render(<CargaMasivaDesktop nombreUsuario="Alex" />);

    const botonMenu = screen.getByRole("button", { name: "Opciones de carga traslados_octubre.xlsx" });
    await user.click(botonMenu);

    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Descargar reporte" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Ver traslados" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Copiar resumen" })).toBeInTheDocument();

    await user.click(screen.getByRole("menuitem", { name: "Copiar resumen" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Resumen de carga copiado al portapapeles");
  });

  it("renderiza el banner de soporte inferior con enlace a contactar soporte", () => {
    render(<CargaMasivaDesktop nombreUsuario="Alex" />);

    const footerSoporte = screen.getByRole("contentinfo", { name: "Ayuda de carga masiva" });
    expect(within(footerSoporte).getByRole("heading", { name: "¿Necesitas ayuda?" })).toBeInTheDocument();
    expect(within(footerSoporte).getByText(/Nuestro equipo está listo para ayudarte/)).toBeInTheDocument();
    expect(within(footerSoporte).getByRole("link", { name: /Contactar soporte/ })).toHaveAttribute("href", "/soporte");
  });
});
