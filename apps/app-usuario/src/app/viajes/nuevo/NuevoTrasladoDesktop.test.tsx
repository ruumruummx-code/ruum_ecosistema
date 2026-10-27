/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NuevoTrasladoDesktop } from "./NuevoTrasladoDesktop";
import { NuevoTrasladoForm } from "./NuevoTrasladoForm";
import { VALORES_INICIALES } from "./constants";
import type { useNuevoTraslado } from "./hooks/useNuevoTraslado";

const pushMock = vi.fn();
const backMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, back: backMock }),
  usePathname: () => "/viajes/nuevo",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("./components/CotizadorPortal", () => ({
  CotizadorPortal: () => <div data-testid="portal-movil">Cotizador Móvil</div>,
}));

const useNuevoTrasladoMock = vi.fn();
vi.mock("./hooks/useNuevoTraslado", () => ({
  useNuevoTraslado: () => useNuevoTrasladoMock(),
}));

type Estado = ReturnType<typeof useNuevoTraslado>;

function crearEstadoMock(overrides?: Partial<Estado>): Estado {
  const onContinuarMock = vi.fn();
  const actualizarCodigoPostalMock = vi.fn();
  const actualizarMock = vi.fn();

  return {
    paso: 0,
    datos: {
      ...VALORES_INICIALES,
      origenCodigoPostal: "52100",
      destinoCodigoPostal: "52000",
      marca: "Fiat",
      modelo: "Mobi",
      anio: 2026,
      condicion: "nueva",
    },
    usuario: {
      id: "usr-1",
      nombre: "Hector",
      email: "hector@ruum.mx",
      telefono: "5512345678",
      tipo_persona: "fisica",
    },
    estadoGuardado: "guardado",
    tiempoUltimoGuardado: null,
    previsualizacion: {
      disponible: true,
      tarifa: 870.52,
      subtotal: 750.0,
      iva: 40.52,
      total: 870.52,
      desglose: {
        base: 750.0,
        distancia: 80.0,
        iva: 40.52,
        total: 870.52,
      },
    },
    previsualizando: false,
    rutaEstimacion: {
      distanciaKm: 4.8,
      duracionMinutos: 13,
      polilinea: "",
    },
    rutaCalculando: false,
    origenGeoEtiqueta: "San Mateo Atenco, Estado de México",
    destinoGeoEtiqueta: "Lerma, Estado de México",
    origenEstadoSugerido: "Estado de México",
    origenMunicipioSugerido: "San Mateo Atenco",
    destinoEstadoSugerido: "Estado de México",
    destinoMunicipioSugerido: "Lerma",
    accionesTarifa: {
      onContinuar: onContinuarMock,
      puedeContinuar: true,
      camposIncompletos: [],
    },
    claseControl: () => "",
    actualizar: actualizarMock,
    actualizarCodigoPostal: actualizarCodigoPostalMock,
    actualizarMarcaCatalogo: vi.fn(),
    actualizarModeloCatalogo: vi.fn(),
    setAnio: vi.fn(),
    setPaso: vi.fn(),
    errores: {},
    errorPaso: null,
    cpConsultando: false,
    cpAviso: null,
    cpOpciones: [],
    placesOpciones: [],
    modelosDisponibles: ["Mobi", "Argo", "Pulse", "Fastback"],
    ...overrides,
  } as unknown as Estado;
}

describe("NuevoTrasladoDesktop — Paso 1: Conoce tu tarifa (Escritorio)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza el sidebar izquierdo con el logo oficial Ruum Ruum y la sección de navegación", () => {
    const t = crearEstadoMock();
    render(<NuevoTrasladoDesktop t={t} nombreUsuario="Hector" />);

    expect(screen.getAllByText("Ruum Ruum").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Tu traslado, en orden")).toBeInTheDocument();

    const sidebar = screen.getByRole("complementary", { name: /menú principal de escritorio/i });
    expect(within(sidebar).getByText("Inicio")).toBeInTheDocument();
    expect(within(sidebar).getByText("Mis traslados")).toBeInTheDocument();
    expect(within(sidebar).getByText("Mis vehículos")).toBeInTheDocument();
    expect(within(sidebar).getByText("Mis ubicaciones")).toBeInTheDocument();
    expect(within(sidebar).getByText("Carga Masiva")).toBeInTheDocument();
    expect(within(sidebar).getByText("Mi cuenta")).toBeInTheDocument();
    expect(within(sidebar).getByText("Mi perfil")).toBeInTheDocument();
    expect(within(sidebar).getByText("Mis preferencias")).toBeInTheDocument();
    expect(within(sidebar).getByText("Ayuda")).toBeInTheDocument();

    // Card inferior promocional
    expect(
      within(sidebar).getByText("Mueve tu auto sin salir de casa"),
    ).toBeInTheDocument();
  });

  it("renderiza la barra de navegación superior con buscador, alertas y perfil", () => {
    const t = crearEstadoMock();
    render(<NuevoTrasladoDesktop t={t} nombreUsuario="Hector" />);

    expect(
      screen.getByPlaceholderText("Buscar traslados, vehículos o documentos..."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Notificaciones")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Menú de usuario/ })).toBeInTheDocument();
    expect(screen.getByText("Hola, Hector")).toBeInTheDocument();
  });

  it("renderiza el encabezado del flujo con botón Volver, PASO 1 DE 5, título y Stepper de 5 pasos", () => {
    const t = crearEstadoMock();
    render(<NuevoTrasladoDesktop t={t} nombreUsuario="Hector" />);

    const volverBtn = screen.getByRole("link", { name: /volver/i });
    expect(volverBtn).toBeInTheDocument();
    expect(volverBtn).toHaveAttribute("href", "/");

    expect(screen.getByText("PASO 1 DE 5")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Crea un nuevo traslado" })).toBeInTheDocument();
    expect(screen.getByText("Completa la información del traslado y obtén tu tarifa al instante.")).toBeInTheDocument();

    // 5 pasos del stepper
    const stepper = screen.getByRole("region", { name: /progreso del traslado/i });
    expect(within(stepper).getByText("Tarifa")).toBeInTheDocument();
    expect(within(stepper).getByText("Vehículo")).toBeInTheDocument();
    expect(within(stepper).getByText("Origen/Destino")).toBeInTheDocument();
    expect(within(stepper).getByText("Servicio")).toBeInTheDocument();
    expect(within(stepper).getByText("Pago")).toBeInTheDocument();
  });

  it("renderiza los campos del formulario con iconos, etiquetas geolocalizadas y opciones", async () => {
    const user = userEvent.setup();
    const t = crearEstadoMock();
    render(<NuevoTrasladoDesktop t={t} nombreUsuario="Hector" />);

    expect(screen.getByText("¿A dónde trasladamos tu auto?")).toBeInTheDocument();

    const cpOrigenInput = screen.getByLabelText(/código postal de origen/i);
    const cpDestinoInput = screen.getByLabelText(/código postal de destino/i);

    expect(cpOrigenInput).toHaveValue("52100");
    expect(cpDestinoInput).toHaveValue("52000");

    // Etiquetas geolocalizadas dinámicas
    expect(screen.getByText("San Mateo Atenco, Estado de México")).toBeInTheDocument();
    expect(screen.getByText("Lerma, Estado de México")).toBeInTheDocument();

    // Modificar CP Origen
    fireEvent.change(cpOrigenInput, { target: { value: "06600" } });
    expect(t.actualizarCodigoPostal).toHaveBeenCalledWith("origen", "06600");

    // Selects de Marca, Modelo y Condición
    const marcaSelect = screen.getByLabelText(/marca del vehículo/i);
    const modeloSelect = screen.getByLabelText(/^modelo$/i);
    const condicionSelect = screen.getByLabelText(/condición del vehículo/i);

    expect(marcaSelect).toHaveValue("Fiat");
    expect(modeloSelect).toHaveValue("Mobi");
    expect(condicionSelect).toHaveValue("nueva");

    await user.selectOptions(condicionSelect, "usada");
    expect(t.actualizar).toHaveBeenCalledWith("condicion", "usada");

    // Banner de seguridad y privacidad
    expect(
      screen.getByText(/Tus datos están seguros/i),
    ).toBeInTheDocument();
  });

  it("renderiza la barra de acciones: botón Anterior deshabilitado y botón Continuar con tarifa dinámica", async () => {
    const user = userEvent.setup();
    const t = crearEstadoMock();
    render(<NuevoTrasladoDesktop t={t} nombreUsuario="Hector" />);

    const anteriorBtn = screen.getByRole("button", { name: /← anterior/i });
    expect(anteriorBtn).toBeDisabled();

    const continuarBtn = screen.getByRole("button", {
      name: /continuar - tarifa est\. \$870\.52 mxn/i,
    });
    expect(continuarBtn).toBeEnabled();

    await user.click(continuarBtn);
    expect(t.accionesTarifa.onContinuar).toHaveBeenCalledOnce();
  });

  it("renderiza las 4 tarjetas de beneficios en '¿Por qué elegir Ruum Ruum?'", () => {
    const t = crearEstadoMock();
    render(<NuevoTrasladoDesktop t={t} nombreUsuario="Hector" />);

    expect(screen.getByText("¿Por qué elegir Ruum Ruum?")).toBeInTheDocument();
    expect(screen.getByText("Cotización instantánea")).toBeInTheDocument();
    expect(screen.getByText("Transporte seguro")).toBeInTheDocument();
    expect(screen.getByText("Cobertura nacional")).toBeInTheDocument();
    expect(screen.getByText("Soporte humano")).toBeInTheDocument();
  });

  it("renderiza la columna derecha de resumen con mapa, vehículo, desglose y Stripe badge", () => {
    const t = crearEstadoMock();
    render(<NuevoTrasladoDesktop t={t} nombreUsuario="Hector" />);

    const aside = screen.getByRole("complementary", { name: /resumen persistente de tarifa/i });

    // Badge superior
    expect(within(aside).getByText("Cotización en segundos")).toBeInTheDocument();
    expect(within(aside).getByText(/Rápido · Seguro · Confiable/i)).toBeInTheDocument();

    // Tarjeta de ruta y mapa gráfico
    expect(within(aside).getByText("Resumen del traslado")).toBeInTheDocument();
    expect(within(aside).getByText("4.8 km (13 min)")).toBeInTheDocument();
    expect(within(aside).getByText("San Mateo Atenco")).toBeInTheDocument();
    expect(within(aside).getByText("Lerma")).toBeInTheDocument();

    // Tarjeta de vehículo
    expect(within(aside).getByText("Fiat Mobi 2026")).toBeInTheDocument();
    expect(within(aside).getByText("Nuevo")).toBeInTheDocument();
    expect(within(aside).getByText("San Mateo Atenco → Lerma")).toBeInTheDocument();

    // Desglose de tarifa
    expect(within(aside).getByText("Desglose de tarifa")).toBeInTheDocument();
    expect(within(aside).getByText("Tarifa base")).toBeInTheDocument();
    expect(within(aside).getByText(/Distancia \(4\.8 km\)/)).toBeInTheDocument();
    expect(within(aside).getByText("IVA (16%)")).toBeInTheDocument();
    expect(within(aside).getByText("Total a pagar")).toBeInTheDocument();
    expect(within(aside).getByText("$870.52 MXN")).toBeInTheDocument();

    // Badge de seguridad Stripe
    expect(within(aside).getByText("Proceso de pago cifrado 256-bit Stripe")).toBeInTheDocument();

    // Banner promocional inferior
    expect(within(aside).getByText("Mueve tu auto sin soltar el control.")).toBeInTheDocument();
    expect(within(aside).getByText("Conecta, traslada, avanza.")).toBeInTheDocument();
  });

  it("renderiza el pie de página global con enlaces legales", () => {
    const t = crearEstadoMock();
    render(<NuevoTrasladoDesktop t={t} nombreUsuario="Hector" />);

    expect(screen.getByText("© 2024 Todos los derechos reservados.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Términos" })).toHaveAttribute("href", "/legal/terminos");
    expect(screen.getByRole("link", { name: "Privacidad" })).toHaveAttribute("href", "/legal/privacidad");
    expect(screen.getByRole("link", { name: "Soporte" })).toHaveAttribute("href", "/soporte");
  });
});

describe("NuevoTrasladoForm — Convivencia Mobile-First y Desktop", () => {
  it("renderiza simultáneamente los contenedores responsive para móvil (lg:hidden) y escritorio (hidden lg:flex)", () => {
    useNuevoTrasladoMock.mockReturnValue(crearEstadoMock());

    const { container } = render(<NuevoTrasladoForm />);

    const contenedorMovil = container.querySelector(".lg\\:hidden");
    const contenedorDesktop = container.querySelector(".hidden.lg\\:flex");

    expect(contenedorMovil).toBeInTheDocument();
    expect(contenedorDesktop).toBeInTheDocument();
    expect(within(contenedorMovil as HTMLElement).getByTestId("portal-movil")).toBeInTheDocument();
  });
});
