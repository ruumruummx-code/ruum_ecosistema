// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

const capturarMock = vi.fn();
const guardarBorradorMock = vi.fn();
const finalizarMock = vi.fn();
const setSoporteAbiertoMock = vi.fn();
let mockTipo: "inicial" | "final" = "inicial";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
});

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "traslado-evidencia-001" }),
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/supabase-browser", () => ({
  crearClienteNavegador: () => ({}),
}));

vi.mock("@ruum/api/services", () => ({
  activarSoporteEmergenciaConductor: vi.fn(),
  registrarInteraccionPanelEmergenciaConductor: vi.fn(),
  reportarIncidencia: vi.fn(),
}));

vi.mock("../src/app/viajes/[id]/evidencia/useEvidenciaPageLogic", () => ({
  useEvidenciaPageLogic: () => ({
    pasaporte: {
      traslado_id: "traslado-evidencia-001",
      estado: "verificacion_vehiculo_en_proceso",
      vehiculo_marca: "Chrysler",
      vehiculo_modelo: "Stratus",
      vehiculo_placas: "POM365",
    },
    tipo: mockTipo,
    soporteAbierto: false,
    setSoporteAbierto: setSoporteAbiertoMock,
    cargando: false,
    error: null,
    aviso: null,
    avisoExito: null,
    kilometraje: "",
    setKilometraje: vi.fn(),
    gasolinaSegments: 4,
    setGasolinaSegments: vi.fn(),
    llavesCount: 2,
    setLlavesCount: vi.fn(),
    tarjetaCirculacion: "no",
    setTarjetaCirculacion: vi.fn(),
    talonVerificacion: "no",
    setTalonVerificacion: vi.fn(),
    hologramaVerificacion: "no",
    setHologramaVerificacion: vi.fn(),
    placaDelantera: "no",
    setPlacaDelantera: vi.fn(),
    placaTrasera: "no",
    setPlacaTrasera: vi.fn(),
    notas: "",
    setNotas: vi.fn(),
    presentaDanosNuevos: false,
    setPresentaDanosNuevos: vi.fn(),
    showCsatSheet: false,
    setShowCsatSheet: vi.fn(),
    csatValor: null,
    setCsatValor: vi.fn(),
    cesValor: null,
    setCesValor: vi.fn(),
    enviandoFeedback: false,
    setEnviandoFeedback: vi.fn(),
    enviando: null,
    fotosObligatorias: 5,
    totalRequisitos: 11,
    fotosObligCapturadas: 0,
    totalCapturados: 0,
    capturar: capturarMock,
    procesarArchivoSeleccionado: vi.fn(),
    guardarBorrador: guardarBorradorMock,
    finalizar: finalizarMock,
    enviarFeedback: vi.fn(),
    omitirFeedback: vi.fn(),
    obtenerFoto: () => undefined,
    inputArchivoRef: { current: null },
  }),
}));

vi.mock("../src/app/viajes/[id]/evidencia/EvidenciaCsatSheet", () => ({
  EvidenciaCsatSheet: () => <div data-testid="csat-sheet-mock" />,
}));

vi.mock("../src/app/viajes/[id]/evidencia/EvidenciaSoporteSheet", () => ({
  EvidenciaSoporteSheet: () => <div data-testid="soporte-sheet-mock" />,
}));

import PaginaEvidencia from "../src/app/viajes/[id]/evidencia/page";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("[UI/UX] Pantalla de Inspección y Evidencia Fotográfica Mobile-First", () => {
  it("renderiza layout 100vh no-scroll con data-inspeccion-evidencia", () => {
    const { container } = render(<PaginaEvidencia />);

    const root = container.querySelector("[data-inspeccion-evidencia]");
    expect(root).not.toBeNull();
    expect(root?.className).toContain("h-screen");
    expect(root?.className).toContain("overflow-hidden");
  });

  it("renderiza Header Técnico con botón Volver, Soporte y Emergencia en píldora roja suave", () => {
    render(<PaginaEvidencia />);

    const header = screen.getByLabelText("Encabezado técnico de evidencias");
    expect(within(header).getByRole("link", { name: "Volver al traslado" }).getAttribute("href")).toBe(
      "/viajes/traslado-evidencia-001"
    );

    const btnSoporte = within(header).getByRole("button", { name: /soporte/i });
    expect(btnSoporte).toBeTruthy();
    fireEvent.click(btnSoporte);
    expect(setSoporteAbiertoMock).toHaveBeenCalledWith(true);

    const btnEmerg = within(header).getByRole("button", { name: "Abrir emergencia" });
    expect(btnEmerg.textContent).toContain("Emerg.");
  });

  it("renderiza Indicador de Progreso General (0/11 requisitos y barra de progreso)", () => {
    render(<PaginaEvidencia />);

    const progressSection = screen.getByLabelText("Progreso general de requisitos");
    expect(within(progressSection).getByText("Progreso: 0/11 requisitos (0%)")).toBeTruthy();
    expect(within(progressSection).getByText("0%")).toBeTruthy();

    const progressbar = screen.getByRole("progressbar");
    expect(progressbar.getAttribute("aria-valuenow")).toBe("0");
    expect(progressbar.getAttribute("aria-valuemax")).toBe("100");
  });

  it("renderiza Menú de Control por Pestañas con 3 tabs: FOTOS (0/5), LLAVES y FORMULARIO", () => {
    render(<PaginaEvidencia />);

    const tabsNav = screen.getByRole("navigation", { name: "Pestañas de captura de evidencias" });
    const tabFotos = within(tabsNav).getByRole("button", { name: /FOTOS \(0\/5\)/i });
    const tabLlaves = within(tabsNav).getByRole("button", { name: /LLAVES/i });
    const tabFormulario = within(tabsNav).getByRole("button", { name: /FORMULARIO/i });

    expect(tabFotos.getAttribute("aria-current")).toBe("page");
    expect(tabLlaves.getAttribute("aria-current")).toBeNull();
    expect(tabFormulario.getAttribute("aria-current")).toBeNull();
  });

  it("renderiza Sección Contenedora de Capturas con los 5 slots y banner informativo", () => {
    render(<PaginaEvidencia />);

    const fotosSection = screen.getByRole("region", { name: "Fotos del vehículo" });
    expect(within(fotosSection).getByRole("heading", { name: "Fotos del vehículo" })).toBeTruthy();
    expect(
      within(fotosSection).getByText("Toma 5 fotos del vehículo según las indicaciones.")
    ).toBeTruthy();

    // 5 slots
    expect(within(fotosSection).getByRole("button", { name: /1\. Frontal/i })).toBeTruthy();
    expect(within(fotosSection).getByRole("button", { name: /2\. Trasera/i })).toBeTruthy();
    expect(within(fotosSection).getByRole("button", { name: /3\. Lateral izq\./i })).toBeTruthy();
    expect(within(fotosSection).getByRole("button", { name: /4\. Lateral der\./i })).toBeTruthy();
    expect(within(fotosSection).getByRole("button", { name: /5\. Tablero \/ Interior/i })).toBeTruthy();

    // Clic en slot 1 ejecuta capturar
    fireEvent.click(within(fotosSection).getByRole("button", { name: /1\. Frontal/i }));
    expect(capturarMock).toHaveBeenCalledWith("frente");

    // Banner informativo de calidad
    const banner = screen.getByRole("note");
    expect(banner.textContent).toContain(
      "Asegúrate de que las fotos sean claras, con buena iluminación y sin personas."
    );
  });

  it("interactúa con la Fila de Acciones Base y avanza modularmente entre pestañas", () => {
    render(<PaginaEvidencia />);

    const actionsSection = screen.getByRole("region", { name: "Acciones de evidencia" });
    const btnGuardar = within(actionsSection).getByRole("button", { name: "Guardar borrador" });
    const btnSiguiente = within(actionsSection).getByRole("button", { name: /Siguiente/i });

    // Guardar llama a guardarBorrador
    fireEvent.click(btnGuardar);
    expect(guardarBorradorMock).toHaveBeenCalled();

    // Siguiente en tab fotos avanza a tab llaves
    fireEvent.click(btnSiguiente);
    expect(screen.getByRole("region", { name: "Llaves del vehículo" })).toBeTruthy();

    // Siguiente en tab llaves avanza a tab formulario
    fireEvent.click(btnSiguiente);
    expect(screen.getByRole("region", { name: "Formulario de inspección" })).toBeTruthy();
  });

  it("renderiza Navegación Inferior Estándar con etiqueta Mi cuenta", () => {
    render(<PaginaEvidencia />);

    const nav = screen.getByRole("navigation", { name: "Navegación principal móvil" });
    const linkInicio = within(nav).getByRole("link", { name: /Inicio/i });
    const linkTraslados = within(nav).getByRole("link", { name: /Traslados/i });
    const linkMiCuenta = within(nav).getByRole("link", { name: /Mi cuenta/i });

    expect(linkInicio.getAttribute("href")).toBe("/panel");
    expect(linkTraslados.getAttribute("href")).toBe("/viajes");
    expect(linkTraslados.getAttribute("aria-current")).toBe("page");
    expect(linkMiCuenta.getAttribute("href")).toBe("/cuenta");
    expect(linkMiCuenta.textContent).toContain("Mi cuenta");
  });

  it("en evidencia final (destino), replica la pantalla con el botón 'Finalizar evidencias ➔'", () => {
    mockTipo = "final";
    render(<PaginaEvidencia />);

    const actionsSection = screen.getByRole("region", { name: "Acciones de evidencia" });
    const btnFinalizar = within(actionsSection).getByRole("button", {
      name: /Finalizar evidencias/i,
    });
    expect(btnFinalizar).toBeTruthy();
    expect(btnFinalizar.textContent).toContain("Finalizar evidencias");
    expect(btnFinalizar.textContent).toContain("➔");

    // Al hacer clic avanza de pestaña
    fireEvent.click(btnFinalizar);
    expect(screen.getByRole("region", { name: "Llaves del vehículo" })).toBeTruthy();
    mockTipo = "inicial";
  });
});
