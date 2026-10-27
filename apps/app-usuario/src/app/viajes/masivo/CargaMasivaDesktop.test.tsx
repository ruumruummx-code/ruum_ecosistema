/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, fireEvent, within, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CargaMasivaDesktop } from "./CargaMasivaDesktop";
import {
  descargarReporteDetallado,
  descargarResumenLote,
  copiarResumenLote,
} from "./useCargaMasivaDesktop";

async function renderizarDesktop(nombre = "Alex") {
  let view!: ReturnType<typeof render>;
  await act(async () => {
    view = render(<CargaMasivaDesktop nombreUsuario={nombre} />);
  });
  return view;
}

const pushMock = vi.fn();
const backMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, back: backMock }),
  usePathname: () => "/viajes/masivo",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/app/PagoStripe", () => ({
  PagoStripe: ({
    onPagado,
    onEstadoPago,
    formId,
  }: {
    onPagado?: () => void;
    onEstadoPago?: (s: { listo: boolean; procesando: boolean }) => void;
    formId?: string;
  }) => (
    <form id={formId} data-testid="pago-stripe-mock" onSubmit={e => { e.preventDefault(); onPagado?.(); }}>
      <button type="button" onClick={() => onPagado?.()}>
        Simular Pago Stripe
      </button>
      <button
        type="button"
        onClick={() => onEstadoPago?.({ listo: true, procesando: false })}
      >
        Simular Formulario Listo
      </button>
    </form>
  ),
}));

const cargarArchivoMock = vi.fn();
const reanudarCargaMock = vi.fn();
const descartarCargaPendienteMock = vi.fn();
const corregirCampoMock = vi.fn();
const corregirCamposMock = vi.fn();
const eliminarFilaMock = vi.fn();
const geocodificarYCotizarMock = vi.fn();
const cotizarSoloValidasMock = vi.fn();
const confirmarPagoMock = vi.fn();
const consultarEstadoPagoMock = vi.fn().mockResolvedValue({ pagado: true, fuente: "webhook" });
const cancelarMock = vi.fn();

const cargasPendientesServidorDefault = [
  {
    id: "rec-1",
    totalMXN: 8500,
    cantidad_traslados: 85,
    creado_en: "2024-10-26T01:03:00Z",
    archivo: "traslados_octubre.xlsx",
    estado: "Completado",
  },
  {
    id: "rec-2",
    totalMXN: 10000,
    cantidad_traslados: 100,
    creado_en: "2024-10-24T11:42:00Z",
    archivo: "ruta_quincena.xlsx",
    estado: "En proceso",
  },
  {
    id: "rec-3",
    totalMXN: 4800,
    cantidad_traslados: 48,
    creado_en: "2024-10-22T15:18:00Z",
    archivo: "traslados_sucursal.xlsx",
    estado: "Con errores",
  },
];

const consultarCargasPendientesMock = vi.fn().mockResolvedValue(cargasPendientesServidorDefault);

const mockHookReturn = {
  estado: "idle" as any,
  error: null as string | null,
  filasVisibles: [] as any[],
  filasConError: [] as any[],
  filasCorrectas: [] as any[],
  totalMXN: 0,
  todasListas: false,
  progreso: 0,
  pagoConfirmado: false,
  cargaId: null as string | null,
  stripeClientSecret: null as string | null,
  cargarArchivo: cargarArchivoMock,
  corregirCampo: corregirCampoMock,
  corregirCampos: corregirCamposMock,
  eliminarFila: eliminarFilaMock,
  geocodificarYCotizar: geocodificarYCotizarMock,
  cotizarSoloValidas: cotizarSoloValidasMock,
  confirmarPago: confirmarPagoMock,
  consultarEstadoPago: consultarEstadoPagoMock,
  cancelar: cancelarMock,
  cargaPendienteStorage: null as any,
  reanudarCarga: reanudarCargaMock,
  descartarCargaPendiente: descartarCargaPendienteMock,
  consultarCargasPendientes: consultarCargasPendientesMock,
};

vi.mock("../nuevo/hooks/useCargaMasiva", () => ({
  useCargaMasiva: () => mockHookReturn,
}));

describe("CargaMasivaDesktop — Pantalla de Carga Masiva de Escritorio", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHookReturn.estado = "idle";
    mockHookReturn.error = null;
    mockHookReturn.filasVisibles = [];
    mockHookReturn.filasConError = [];
    mockHookReturn.filasCorrectas = [];
    mockHookReturn.totalMXN = 0;
    mockHookReturn.todasListas = false;
    mockHookReturn.progreso = 0;
    mockHookReturn.pagoConfirmado = false;
    mockHookReturn.cargaId = null;
    mockHookReturn.stripeClientSecret = null;
    mockHookReturn.cargaPendienteStorage = null;
    consultarCargasPendientesMock.mockResolvedValue(cargasPendientesServidorDefault);
  });

  it("renderiza el sidebar con la opción Carga Masiva activa y la tarjeta inferior Traslados sin límites", async () => {
    await renderizarDesktop("Alex");

    const navPanel = screen.getByRole("navigation", { name: "Navegación del panel" });
    const enlaceCarga = within(navPanel).getByRole("link", { name: /^Carga Masiva/ });
    expect(enlaceCarga).toHaveAttribute("aria-current", "page");
    expect(enlaceCarga).toHaveAttribute("href", "/viajes/masivo");

    expect(within(navPanel).getByRole("link", { name: /^Inicio/ })).toHaveAttribute("href", "/");
    expect(within(navPanel).getByRole("link", { name: /Mis traslados/ })).toHaveAttribute("href", "/mis-viajes");
    expect(within(navPanel).getByRole("link", { name: /Mi cuenta/ })).toHaveAttribute("href", "/cuenta");

    // Card inferior
    expect(screen.getByText("Mueve tu auto sin salir de casa")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Registrar traslado/ })).toBeInTheDocument();
  });

  it("renderiza la barra superior con migas de pan (Breadcrumbs), notificaciones y dropdown de usuario", async () => {
    const user = userEvent.setup();
    await renderizarDesktop("Alex");

    // Breadcrumbs
    const breadcrumbs = screen.getByRole("navigation", { name: "Migas de pan" });
    expect(within(breadcrumbs).getByRole("button", { name: /Volver/ })).toBeInTheDocument();
    expect(within(breadcrumbs).getByRole("link", { name: "Traslados" })).toHaveAttribute("href", "/mis-viajes");
    expect(within(breadcrumbs).getByText("Carga Masiva")).toBeInTheDocument();

    await user.click(within(breadcrumbs).getByRole("button", { name: /Volver/ }));
    expect(backMock).toHaveBeenCalledTimes(1);

    // Usuario
    expect(screen.getByText("Hola, Alex")).toBeInTheDocument();
    expect(screen.getByText("AL")).toBeInTheDocument();
  });

  it("renderiza el header de la sección con título, subtítulo y botón Mis viajes", async () => {
    await renderizarDesktop("Alex");

    expect(screen.getByRole("heading", { name: "Carga masiva de traslados" })).toBeInTheDocument();
    expect(screen.getByText(/Cotiza y procesa múltiples traslados desde un archivo/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Mis viajes/ })).toHaveAttribute("href", "/mis-viajes");
  });

  it("renderiza la zona de Dropzone con arrastrar y soltar y botón Seleccionar archivo", async () => {
    await renderizarDesktop("Alex");

    expect(screen.getByText("Arrastra y suelta tu archivo aquí")).toBeInTheDocument();
    expect(screen.getByText("o haz clic para seleccionar un archivo .xlsx")).toBeInTheDocument();
    expect(screen.getByText("Máximo 100 traslados · Hasta 5 MB")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Seleccionar archivo/ })).toBeInTheDocument();
  });

  it("valida y rechaza archivos que no sean .xlsx mostrando un toast de error", async () => {
    await renderizarDesktop("Alex");

    const input = screen.getByLabelText("Cargar archivo Excel .xlsx");
    const archivoInvalido = new File(["dummy content"], "traslados.pdf", { type: "application/pdf" });

    fireEvent.change(input, { target: { files: [archivoInvalido] } });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Formato no admitido. Selecciona un archivo con extensión .xlsx"
    );
    expect(cargarArchivoMock).not.toHaveBeenCalled();
  });

  it("valida y rechaza archivos mayores a 5 MB mostrando un toast de error", async () => {
    await renderizarDesktop("Alex");

    const input = screen.getByLabelText("Cargar archivo Excel .xlsx");
    // Archivo de 6 MB
    const archivoPesado = new File([new ArrayBuffer(6 * 1024 * 1024)], "archivo_enorme.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    fireEvent.change(input, { target: { files: [archivoPesado] } });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "El archivo excede el límite máximo permitido de 5 MB."
    );
    expect(cargarArchivoMock).not.toHaveBeenCalled();
  });

  it("acepta archivos .xlsx válidos y ejecuta la carga", async () => {
    cargarArchivoMock.mockResolvedValueOnce(undefined);
    await renderizarDesktop("Alex");

    const input = screen.getByLabelText("Cargar archivo Excel .xlsx");
    const archivoValido = new File(["contenido excel"], "flota_central.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    fireEvent.change(input, { target: { files: [archivoValido] } });

    await waitFor(() => {
      expect(cargarArchivoMock).toHaveBeenCalledWith(archivoValido);
    });
  });

  it("renderiza el panel instructivo con 4 pasos y botón de descarga de plantilla oficial", async () => {
    await renderizarDesktop("Alex");

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
    await renderizarDesktop("Alex");

    const botonGuia = screen.getByRole("button", { name: /Ver guía de uso/ });
    await user.click(botonGuia);

    const modal = screen.getByRole("dialog");
    expect(modal).toBeInTheDocument();
    expect(screen.getByText("Guía de uso para la plantilla oficial")).toBeInTheDocument();

    const botonesCerrar = screen.getAllByRole("button", { name: "Cerrar guía" });
    await user.click(botonesCerrar[0]!);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renderiza la cinta de 4 beneficios con iconos y descripciones", async () => {
    await renderizarDesktop("Alex");

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
    await renderizarDesktop("Alex");

    expect(screen.getByRole("heading", { name: "Cargas recientes" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Ver todas/ })).toHaveAttribute("href", "/mis-viajes");

    // Filas
    expect(await screen.findByText("traslados_octubre.xlsx")).toBeInTheDocument();
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
    await renderizarDesktop("Alex");

    const botonMenu = await screen.findByRole("button", { name: "Opciones de carga traslados_octubre.xlsx" });
    await user.click(botonMenu);

    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Descargar reporte" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Ver traslados" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Copiar resumen" })).toBeInTheDocument();

    await user.click(screen.getByRole("menuitem", { name: "Copiar resumen" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Resumen de carga copiado al portapapeles");
  });

  it("renderiza el banner de soporte inferior con enlace a contactar soporte", async () => {
    await renderizarDesktop("Alex");

    const footerSoporte = screen.getByRole("contentinfo", { name: "Ayuda de carga masiva" });
    expect(within(footerSoporte).getByRole("heading", { name: "¿Necesitas ayuda?" })).toBeInTheDocument();
    expect(within(footerSoporte).getByText(/Nuestro equipo está listo para ayudarte/)).toBeInTheDocument();
    expect(within(footerSoporte).getByRole("link", { name: /Contactar soporte/ })).toHaveAttribute("href", "/soporte");
  });

  const filaValidaMock: any = {
    indice: 0,
    estado: "correcto",
    datos: {
      marca: "Nissan",
      modelo: "Versa",
      anio: "2023",
      condicion: "seminueva",
      origenCodigoPostal: "01000",
      destinoCodigoPostal: "06600",
      origen_calle: "Av Insurgentes",
      origen_numero: "100",
      origen_colonia: "Roma",
      destino_calle: "Av Reforma",
      destino_numero: "200",
      destino_colonia: "Juárez",
      vehiculo_placas: "ABC1234",
      entregaNombre: "Juan Pérez",
      entregaTelefono: "5512345678",
      recepcionNombre: "María López",
      recepcionTelefono: "5587654321",
    },
    errores: {},
    tarifa: 650,
    distanciaKm: 12.5,
  };

  const filaInvalidaMock: any = {
    indice: 1,
    estado: "error",
    datos: {
      marca: "Ford",
      modelo: "Focus",
      anio: "2020",
      condicion: "seminueva",
      origenCodigoPostal: "99999",
      destinoCodigoPostal: "06600",
      origen_calle: "Calle Central",
      origen_numero: "50",
      origen_colonia: "Centro",
      destino_calle: "Av Hidalgo",
      destino_numero: "10",
      destino_colonia: "Centro",
      vehiculo_placas: "XYZ9876",
      entregaNombre: "Carlos Ruiz",
      entregaTelefono: "5522334455",
      recepcionNombre: "Ana Torres",
      recepcionTelefono: "5599887766",
    },
    errores: {
      origenCodigoPostal: "CP no encontrado o inválido",
    },
    errorCotizacion: "Error de geocodificación en CP origen",
    tarifa: null,
    distanciaKm: null,
  };

  it("muestra todos los motivos reales y permite corregir campos que antes estaban ocultos", async () => {
    const fila = { ...filaInvalidaMock, datos: { ...filaInvalidaMock.datos, __fila_excel: "17" }, errores: { modelo: "La combinación marca/modelo no está en catálogo", anio: "Año fuera del rango permitido", origen_calle: "Campo requerido", entregaNombre: "Nombre requerido" } };
    mockHookReturn.estado = "resultados";
    mockHookReturn.filasVisibles = [fila];
    mockHookReturn.filasConError = [fila];
    await renderizarDesktop();
    const motivos = screen.getByRole("list", { name: "Motivos de error del registro 2" });
    expect(within(motivos).getByText("Modelo: La combinación marca/modelo no está en catálogo")).toBeInTheDocument();
    expect(within(motivos).getByText("Año: Año fuera del rango permitido")).toBeInTheDocument();
    expect(within(motivos).getByText("Calle de origen: Campo requerido")).toBeInTheDocument();
    expect(within(motivos).getByText("Ruta o cotización: Error de geocodificación en CP origen")).toBeInTheDocument();
    expect(screen.getByText("Fila Excel 17")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Editar fila 2" }));
    fireEvent.change(screen.getByLabelText("Año fila 2"), { target: { value: "2025" } });
    fireEvent.change(screen.getByLabelText("Calle de origen fila 2"), { target: { value: "Reforma" } });
    await userEvent.click(screen.getByRole("button", { name: "Guardar fila 2" }));
    expect(corregirCamposMock).toHaveBeenCalledTimes(1);
    expect(corregirCamposMock).toHaveBeenCalledWith(1, { anio: "2025", origen_calle: "Reforma" });
  });

  it("renderiza la tabla de validación en estado 'resultados' con filtros, edición inline y cotización", async () => {
    const user = userEvent.setup();
    mockHookReturn.estado = "resultados";
    mockHookReturn.filasVisibles = [filaValidaMock, filaInvalidaMock];
    mockHookReturn.filasCorrectas = [filaValidaMock];
    mockHookReturn.filasConError = [filaInvalidaMock];

    await renderizarDesktop("Alex");

    expect(screen.getByRole("heading", { name: "Validación de archivo" })).toBeInTheDocument();
    expect(screen.getByText("Total de traslados")).toBeInTheDocument();
    expect(screen.getByText("Listos para cotizar")).toBeInTheDocument();
    expect(screen.getByText("Con incidencias")).toBeInTheDocument();

    // Banner de lote parcial
    const botonesCotizarValidas = screen.getAllByRole("button", { name: "Cotizar 1 válidas" });
    expect(botonesCotizarValidas.length).toBeGreaterThan(0);

    // Ambos autos en tabla
    expect(screen.getByText("Nissan Versa")).toBeInTheDocument();
    expect(screen.getByText("Ford Focus")).toBeInTheDocument();
    expect(screen.getByText("CP no encontrado o inválido")).toBeInTheDocument();

    // Filtros por tabs
    const tabErrores = screen.getByRole("button", { name: "Con incidencias (1)" });
    await user.click(tabErrores);
    expect(screen.getByText("Ford Focus")).toBeInTheDocument();
    expect(screen.queryByText("Nissan Versa")).not.toBeInTheDocument();

    const tabValidas = screen.getByRole("button", { name: "Válidas (1)" });
    await user.click(tabValidas);
    expect(screen.getByText("Nissan Versa")).toBeInTheDocument();
    expect(screen.queryByText("Ford Focus")).not.toBeInTheDocument();

    const tabTodas = screen.getByRole("button", { name: "Todas (2)" });
    await user.click(tabTodas);

    // Edición inline de una fila
    const botonEditar = screen.getByRole("button", { name: "Editar fila 2" });
    await user.click(botonEditar);

    const inputMarca = screen.getByLabelText("Marca fila 2");
    expect(inputMarca).toHaveValue("Ford");
    await user.clear(inputMarca);
    await user.type(inputMarca, "Chevrolet");

    await user.click(screen.getByRole("button", { name: "Guardar fila 2" }));
    expect(corregirCamposMock).toHaveBeenCalledWith(1, { marca: "Chevrolet" });

    // Eliminar fila
    const botonEliminar = screen.getByRole("button", { name: "Eliminar fila 2" });
    await user.click(botonEliminar);
    expect(eliminarFilaMock).toHaveBeenCalledWith(1);

    // Botón de cotizar válidas
    await user.click(botonesCotizarValidas[0]!);
    expect(cotizarSoloValidasMock).toHaveBeenCalledTimes(1);
  });

  it("renderiza la barra de progreso animada durante 'geocodificando' y 'cotizando'", async () => {
    mockHookReturn.estado = "geocodificando";
    mockHookReturn.progreso = 60;

    await renderizarDesktop("Alex");

    expect(
      screen.getByText("Calculando rutas y distancias...")
    ).toBeInTheDocument();
    const barraProgreso = screen.getByRole("progressbar");
    expect(barraProgreso).toHaveAttribute("aria-valuenow", "60");
  });

  it("renderiza la vista de checkout con resumen consolidado, desglose y formulario de pago", async () => {
    const user = userEvent.setup();
    mockHookReturn.estado = "checkout";
    mockHookReturn.cargaId = "carga-test-123";
    mockHookReturn.totalMXN = 1950;
    mockHookReturn.filasVisibles = [filaValidaMock];
    mockHookReturn.filasCorrectas = [filaValidaMock];
    mockHookReturn.filasConError = [filaInvalidaMock];
    mockHookReturn.stripeClientSecret = "pi_secret_test";

    await renderizarDesktop("Alex");

    expect(
      screen.getByRole("heading", { name: "Revisión consolidada y Checkout masivo" })
    ).toBeInTheDocument();
    expect(screen.getByText("Total consolidado a pagar")).toBeInTheDocument();
    expect(screen.getByText("$1,950.00")).toBeInTheDocument();

    // Aviso de pago parcial en checkout
    expect(screen.getByText("Pago parcial de traslados válidos")).toBeInTheDocument();
    expect(screen.getByText(/Estás procesando el pago de/)).toBeInTheDocument();

    // PagoStripe embebido
    expect(screen.getByTestId("pago-stripe-mock")).toBeInTheDocument();

    // Simula que el formulario de tarjeta queda listo
    const botonListo = screen.getByRole("button", { name: "Simular Formulario Listo" });
    await user.click(botonListo);

    // Botón de pago anti-doble clic ahora habilitado
    const botonPagar = screen.getByRole("button", { name: "Pagar $1,950.00 MXN" });
    expect(botonPagar).not.toBeDisabled();

    // La acción principal debe enviar el formulario embebido, no otro botón.
    expect((botonPagar as HTMLButtonElement).form).toBe(screen.getByTestId("pago-stripe-mock"));
    await user.click(botonPagar);

    await waitFor(() => expect(confirmarPagoMock).toHaveBeenCalledTimes(1));
  });

  it("renderiza la pantalla de confirmación hero cuando el pago fue exitoso", async () => {
    mockHookReturn.pagoConfirmado = true;
    mockHookReturn.totalMXN = 2600;
    mockHookReturn.filasCorrectas = [filaValidaMock, { ...filaValidaMock, indice: 1 }];

    await renderizarDesktop("Alex");

    expect(screen.getByText("¡Carga masiva procesada y confirmada!")).toBeInTheDocument();
    expect(screen.getByText("$2,600.00 MXN")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();

    const enlaceMisViajes = screen.getByRole("link", { name: /Ver mis traslados/ });
    expect(enlaceMisViajes).toHaveAttribute("href", "/mis-viajes");
  });

  it("muestra las cargas pendientes de pago en servidor y permite reanudarlas", async () => {
    const user = userEvent.setup();
    mockHookReturn.estado = "idle";
    const cargaPendiente = {
      id: "carga-pendiente-99",
      totalMXN: 3200,
      cantidad_traslados: 4,
      creado_en: "2024-10-27T08:00:00Z",
      archivo: "lote_urgente.xlsx",
      estado: "Pendiente de pago",
    };
    consultarCargasPendientesMock.mockResolvedValueOnce([cargaPendiente]);

    await renderizarDesktop("Alex");

    expect(
      await screen.findByRole("heading", { name: "Cargas pendientes de pago (1)" })
    ).toBeInTheDocument();
    expect(screen.getByText("$3,200.00 MXN")).toBeInTheDocument();

    const botonReanudar = screen.getByRole("button", { name: "Reanudar carga" });
    await user.click(botonReanudar);

    expect(reanudarCargaMock).toHaveBeenCalledWith("carga-pendiente-99");
  });

  describe("F01 — Exportación de detalle por traslado vs resumen del lote", () => {
    let originalCreateObjectURL: typeof URL.createObjectURL;
    let originalRevokeObjectURL: typeof URL.revokeObjectURL;

    beforeEach(() => {
      originalCreateObjectURL = URL.createObjectURL;
      originalRevokeObjectURL = URL.revokeObjectURL;
      URL.createObjectURL = vi.fn(() => "blob:mock-url");
      URL.revokeObjectURL = vi.fn();
    });

    afterEach(() => {
      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
      vi.restoreAllMocks();
    });

    it("genera reporte detallado con las 7 columnas completas de traslados", () => {
      const filasMock: Parameters<typeof descargarReporteDetallado>[0] = [
        {
          indice: 0,
          estado: "correcto",
          tarifa: 1450.5,
          datos: {
            marca: "Toyota",
            modelo: "Corolla",
            anio: "2023",
            origenCodigoPostal: "01000",
            destinoCodigoPostal: "06000",
            entregaNombre: "Juan",
            entregaTelefono: "5512345678",
            recepcionNombre: "Pedro",
            recepcionTelefono: "5587654321",
            condicion: "seminueva",
          },
          errores: {},
        },
        {
          indice: 1,
          estado: "error",
          errorCotizacion: "Dirección de destino fuera de cobertura",
          datos: {
            marca: "Nissan",
            modelo: "Versa",
            anio: "2022",
            origenCodigoPostal: "01000",
            destinoCodigoPostal: "99999",
            entregaNombre: "Ana",
            entregaTelefono: "5512345679",
            recepcionNombre: "Luis",
            recepcionTelefono: "5587654322",
            condicion: "seminueva",
          },
          errores: { destinoCodigoPostal: "Código postal inválido" },
        },
      ];

      const clickMock = vi.fn();
      let elementoA: HTMLAnchorElement | null = null;
      const origCreateElement = document.createElement.bind(document);
      vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
        const el = origCreateElement(tag);
        if (tag === "a") {
          elementoA = el as HTMLAnchorElement;
          elementoA.click = clickMock;
        }
        return el;
      });

      descargarReporteDetallado(filasMock, "mis_traslados.xlsx");

      expect(clickMock).toHaveBeenCalled();
      expect((elementoA as unknown as HTMLAnchorElement)?.download).toBe("reporte_detalle_mis_traslados.csv");
    });

    it("genera resumen del lote cuando se solicita sin detalle individual", () => {
      const clickMock = vi.fn();
      let elementoA: HTMLAnchorElement | null = null;
      const origCreateElement = document.createElement.bind(document);
      vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
        const el = origCreateElement(tag);
        if (tag === "a") {
          elementoA = el as HTMLAnchorElement;
          elementoA.click = clickMock;
        }
        return el;
      });

      descargarResumenLote({
        id: "lote-resumen-1",
        fechaHora: "27/10/2026, 09:00 a. m.",
        archivo: "lote_resumen.xlsx",
        traslados: 10,
        totalMXN: 15000,
        estado: "Completado",
        accion: "Ver resultado",
        esLocal: false,
      });

      expect(clickMock).toHaveBeenCalled();
      expect((elementoA as unknown as HTMLAnchorElement)?.download).toBe("resumen_lote_lote_resumen.csv");
    });
  });

  describe("F02 — Validación del resultado de copiado al portapapeles", () => {
    it("copiarResumenLote retorna true si navigator.clipboard tiene éxito", async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText: writeTextMock },
        configurable: true,
        writable: true,
      });

      const resultado = await copiarResumenLote({
        id: "lote-1",
        fechaHora: "27/10/2026, 09:00 a. m.",
        archivo: "lote_1.xlsx",
        traslados: 5,
        totalMXN: 7500,
        estado: "Completado",
        accion: "Ver resultado",
      });

      expect(resultado).toBe(true);
      expect(writeTextMock).toHaveBeenCalled();
    });

    it("copiarResumenLote retorna false si tanto clipboard como fallback fallan", async () => {
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText: vi.fn().mockRejectedValue(new Error("Acceso denegado")) },
        configurable: true,
        writable: true,
      });
      // Mock execCommand para fallar
      document.execCommand = vi.fn().mockReturnValue(false);

      const resultado = await copiarResumenLote({
        id: "lote-fallido",
        fechaHora: "27/10/2026, 09:00 a. m.",
        archivo: "lote_fallido.xlsx",
        traslados: 5,
        estado: "Con errores",
        accion: "Ver errores",
      });

      expect(resultado).toBe(false);
    });
  });
});
