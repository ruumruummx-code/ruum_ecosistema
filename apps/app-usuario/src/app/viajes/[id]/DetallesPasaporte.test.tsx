/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: refreshMock,
  }),
}));

const reportarIncidenciaMock = vi.fn();
const cancelarTrasladoMock = vi.fn();
const usuarioPuedeCancelarMock = vi.fn();
const crearCalificacionMock = vi.fn();
const abrirDisputaMock = vi.fn();
const aceptarCotizacionUsuarioMock = vi.fn();

vi.mock("@ruum/api/services", () => ({
  reportarIncidencia: (...args: unknown[]) => reportarIncidenciaMock(...args),
  cancelarTraslado: (...args: unknown[]) => cancelarTrasladoMock(...args),
  usuarioPuedeCancelar: (...args: unknown[]) => usuarioPuedeCancelarMock(...args),
  crearCalificacion: (...args: unknown[]) => crearCalificacionMock(...args),
  abrirDisputa: (...args: unknown[]) => abrirDisputaMock(...args),
  aceptarCotizacionUsuario: (...args: unknown[]) => aceptarCotizacionUsuarioMock(...args),
}));

const tieneSupabaseMock = vi.fn(() => true);
vi.mock("@/lib/supabase-browser", () => ({
  tieneSupabaseConfigurado: () => tieneSupabaseMock(),
  crearClienteNavegador: () => ({}),
}));

vi.mock("../../PagoStripe", () => ({
  PagoStripe: ({ onPagado }: { onPagado: () => void }) => (
    <button type="button" onClick={onPagado}>
      Simular Pago Stripe
    </button>
  ),
}));

const actualizarRealtimeMock = vi.fn();
let estadoRealtimeMock = {
  aceptandoCotizacion: false,
  errorAceptacion: null as string | null,
  pagoConfirmado: false,
  actualizar: actualizarRealtimeMock,
};

vi.mock("@/state/AppStateProvider", () => ({
  useTrasladoRealtime: () => estadoRealtimeMock,
}));

import { DetallesPasaporte, type PasaporteDigitalSegmentadoProps } from "./DetallesPasaporte";
import { AccionesRapidasPasaporte } from "./AccionesRapidasPasaporte";
import {
  LineaTiempoVisual,
  estadoDePaso,
  formatoDuracion,
  formatoFecha,
  humanizar,
  IconoPersona,
} from "./piezas-pasaporte";

const baseProps: PasaporteDigitalSegmentadoProps = {
  pasaporte: {
    traslado_id: "t-100",
    estado: "servicio_cerrado",
    conductor_id: "cond-1",
    conductor_nombre: "Carlos Ruiz",
    conductor_calificacion: 4.9,
    vehiculo_marca: "Mazda",
    vehiculo_modelo: "3",
    vehiculo_anio: 2023,
    vehiculo_placas: "ABC-123",
    vehiculo_color: "Rojo",
    vehiculo_condicion: "funcional",
    vehiculo_tipo: "sedan",
    vehiculo_vin: "1HGCM82633A004352",
    origen_ciudad: "CDMX",
    destino_ciudad: "Querétaro",
    precio_cotizado: 2500,
    precio_final: 2500,
    tipo_pago: "anticipado",
    actualizado_en: new Date().toISOString(),
  } as unknown as PasaporteDigitalSegmentadoProps["pasaporte"],
  traslado: {
    id: "t-100",
    tipo_servicio: "traslado_estandar",
    motivo_servicio: "compra_venta",
    fecha_hora_programada: new Date(Date.now() + 5 * 3600_000).toISOString(),
    ventana_recoleccion: null,
    ventana_entrega: "14:00 - 18:00",
    origen_ciudad: "CDMX",
    destino_ciudad: "Querétaro",
    contacto_entrega_nombre: "Laura Gómez",
    contacto_entrega_telefono: "5511223344",
    contacto_recepcion_nombre: "Pedro Solís",
    contacto_recepcion_telefono: "5599887766",
    cotizacion_expira_en: null,
  } as unknown as PasaporteDigitalSegmentadoProps["traslado"],
  vehiculo: {
    color: "Rojo brillante",
    transmision: "automatica",
    condicion: "funcional",
    placas: "ABC-123",
    vin: "1HGCM82633A004352",
    tipo: "sedan",
  } as unknown as PasaporteDigitalSegmentadoProps["vehiculo"],
  conductor: {
    nombre: "Carlos Ruiz",
    calificacion_promedio: 4.85,
  } as unknown as PasaporteDigitalSegmentadoProps["conductor"],
  evidencia: [
    {
      id: "ev-1",
      tipo: "inicial",
      angulo: "frente",
      url_visual: "https://example.com/ini-frente.jpg",
      sincronizada: true,
      capturada_en: "2026-10-20T12:00:00Z",
    },
    {
      id: "ev-2",
      tipo: "final",
      angulo: "frente",
      url_visual: "https://example.com/fin-frente.jpg",
      sincronizada: false,
      capturada_en: "2026-10-20T16:00:00Z",
    },
    {
      id: "ev-3",
      tipo: "inicial",
      angulo: "tablero",
      url_visual: null,
      sincronizada: true,
      capturada_en: "2026-10-20T12:05:00Z",
    },
  ] as unknown as PasaporteDigitalSegmentadoProps["evidencia"],
  incidencias: [
    {
      id: "inc-1",
      tipo: "dano_previo_relevante",
      descripcion: "Rayón leve en facia delantera",
      momento: "recoleccion",
      resuelta: false,
      creada_en: "2026-10-20T12:10:00Z",
    },
    {
      id: "inc-2",
      tipo: "perdida_conectividad",
      descripcion: "Zona sin cobertura en autopista",
      momento: "durante_traslado",
      resuelta: true,
      creada_en: "2026-10-20T14:00:00Z",
    },
  ] as unknown as PasaporteDigitalSegmentadoProps["incidencias"],
  disputas: [
    {
      id: "disp-1",
      tipo: "cobro_incorrecto",
      estado: "en_revision",
      descripcion: "Cargo duplicado en tarjeta",
      resolucion: "reembolso_parcial",
      resolucion_detalle: "Bonificación aplicada",
    },
  ] as unknown as PasaporteDigitalSegmentadoProps["disputas"],
  reclamosSeguro: [
    {
      id: "rec-1",
      estado: "cerrado",
      abierto_en: "2026-10-20T15:00:00Z",
      resuelto_en: "2026-10-21T10:00:00Z",
    },
  ] as unknown as PasaporteDigitalSegmentadoProps["reclamosSeguro"],
  calificacion: null,
  pagos: [
    {
      id: "pago-1",
      monto: 2500,
      estado: "completado",
      metodo: "tarjeta_credito",
      momento: "anticipado",
    },
  ] as unknown as PasaporteDigitalSegmentadoProps["pagos"],
  ultimaUbicacion: null,
};

describe("Piezas de pasaporte y utilidades", () => {
  it("formatea fechas, duraciones, textos humanizados y estados de línea de tiempo", () => {
    expect(formatoFecha(null)).toBe("Pendiente");
    expect(formatoFecha("fecha-invalida")).toBe("Pendiente");
    expect(formatoFecha("2026-10-20T14:30:00Z")).toMatch(/2026/);

    expect(humanizar(null)).toBeNull();
    expect(humanizar("___")).toBeNull();
    expect(humanizar("traslado_estandar")).toBe("Traslado estandar");

    expect(formatoDuracion(null)).toBeNull();
    expect(formatoDuracion(Number.NaN)).toBeNull();
    expect(formatoDuracion(0.5)).toBe("30 min");
    expect(formatoDuracion(2)).toBe("2 h");
    expect(formatoDuracion(1.25)).toBe("1h 15m");

    expect(estadoDePaso("pago_completado", "solicitud_creada", true, false)).toBe("completado");
    expect(estadoDePaso("pago_completado", "conductor_asignado", true, false)).toBe("actual");
    expect(estadoDePaso("pago_completado", "traslado_en_curso", true, false)).toBe("pendiente");
    expect(estadoDePaso("traslado_en_curso", "solicitud_creada", false, true)).toBe("completado");
    expect(estadoDePaso("traslado_en_curso", "traslado_en_curso", false, true)).toBe("actual");
    expect(estadoDePaso("traslado_en_curso", "servicio_cerrado", false, true)).toBe("pendiente");

    const { container } = render(
      <div>
        <IconoPersona />
        <LineaTiempoVisual estadoActual="pago_completado" pagoRealizado={true} tieneConductor={false} />
      </div>
    );
    expect(container.querySelectorAll("li").length).toBeGreaterThan(5);
    expect(screen.getByText("Asignando conductor...")).toBeInTheDocument();
  });
});

describe("DetallesPasaporte y acciones operativas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tieneSupabaseMock.mockReturnValue(true);
    usuarioPuedeCancelarMock.mockReturnValue(true);
    estadoRealtimeMock = {
      aceptandoCotizacion: false,
      errorAceptacion: null,
      pagoConfirmado: false,
      actualizar: actualizarRealtimeMock,
    };
    vi.spyOn(window, "print").mockImplementation(() => {});
  });

  it("renderiza pestaña fotos con comparativa 360, calificación, reporte de incidencia y disputa", async () => {
    const user = userEvent.setup();
    reportarIncidenciaMock.mockResolvedValueOnce({ id: "inc-nueva" });
    crearCalificacionMock.mockResolvedValueOnce({});
    abrirDisputaMock.mockResolvedValueOnce({});

    render(<DetallesPasaporte {...baseProps} seccion="fotos" />);

    // CalificarTraslado visible por servicio_cerrado dentro de 72h
    await user.click(screen.getByRole("radio", { name: /4 estrellas/i }));
    await user.type(screen.getByLabelText("Comentario de calificación"), "Excelente trato");
    await user.click(screen.getByRole("button", { name: "Enviar calificación" }));
    await waitFor(() => {
      expect(crearCalificacionMock).toHaveBeenCalledWith(expect.anything(), "t-100", "cond-1", 4, "Excelente trato");
    });

    // EvidenciaComparativa toggle slider vs grid y descarga PDF
    await user.click(screen.getByRole("button", { name: "Slider interactivo" }));
    const slider = screen.getByRole("slider", { name: /Deslizar para comparar/i });
    fireEvent.change(slider, { target: { value: "75" } });
    await user.click(screen.getByRole("button", { name: /Tablero/i }));
    await user.click(screen.getByRole("button", { name: "Grid 2×2" }));
    await user.click(screen.getByRole("button", { name: /Descargar PDF evidencia/i }));
    expect(window.print).toHaveBeenCalled();

    // ReportarIncidenciaUsuario
    await user.selectOptions(screen.getByLabelText("Tipo de problema"), "dano_no_reportado");
    await user.selectOptions(screen.getByLabelText("Momento de la incidencia"), "entrega");
    await user.type(screen.getByPlaceholderText("Cuéntanos qué ocurrió"), "Golpe nuevo en puerta trasera");
    await user.click(screen.getByRole("button", { name: "Reportar incidencia" }));
    await waitFor(() => {
      expect(reportarIncidenciaMock).toHaveBeenCalledWith(
        expect.anything(),
        "t-100",
        "dano_no_reportado",
        "entrega",
        "Golpe nuevo en puerta trasera"
      );
    });
    expect(await screen.findByText(/Incidencia reportada/i)).toBeInTheDocument();

    // AbrirDisputa
    await user.selectOptions(screen.getByLabelText("Motivo de la disputa"), "dano_no_reconocido");
    await user.type(
      screen.getByLabelText("Descripción de la disputa"),
      "Solicito revisión del daño reportado al finalizar el traslado."
    );
    await user.click(screen.getByRole("button", { name: "Enviar disputa" }));
    await waitFor(() => {
      expect(abrirDisputaMock).toHaveBeenCalled();
    });
  });

  it("permite cancelar traslado con confirmación inline y muestra aviso cuando no es cancelable", async () => {
    const user = userEvent.setup();
    cancelarTrasladoMock.mockResolvedValueOnce({ monto_cargo: 250 });

    const propsActivos: PasaporteDigitalSegmentadoProps = {
      ...baseProps,
      pasaporte: { ...baseProps.pasaporte, estado: "conductor_asignado" },
      evidencia: [],
      incidencias: [],
      disputas: [],
      reclamosSeguro: [],
    };

    const { rerender } = render(<DetallesPasaporte {...propsActivos} seccion="fotos" />);
    expect(screen.getByText("Comparativa antes / después")).toBeInTheDocument();
    expect(screen.getByText("Sin incidencias reportadas")).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("Cuéntanos por qué necesitas cancelar"), "Cambio de planes");
    await user.click(screen.getByRole("button", { name: "Cancelar viaje" }));
    expect(screen.getByText("¿Confirmar cancelación?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "No, mantener" }));
    await user.click(screen.getByRole("button", { name: "Cancelar viaje" }));
    await user.click(screen.getByRole("button", { name: "Sí, cancelar el viaje" }));

    await waitFor(() => {
      expect(cancelarTrasladoMock).toHaveBeenCalledWith(expect.anything(), "t-100", "Cambio de planes");
    });

    // Cuando usuarioPuedeCancelar devuelve false
    usuarioPuedeCancelarMock.mockReturnValue(false);
    rerender(
      <DetallesPasaporte
        {...propsActivos}
        pasaporte={{ ...propsActivos.pasaporte, estado: "traslado_en_curso" }}
        seccion="fotos"
      />
    );
    expect(screen.getByText("Cancelación no disponible")).toBeInTheDocument();
  });

  it("renderiza pestaña unidad con datos del vehículo, parámetros y contactos", () => {
    render(<DetallesPasaporte {...baseProps} seccion="unidad" />);
    expect(screen.getByText(/Conductor: Carlos Ruiz/)).toBeInTheDocument();
    expect(screen.getByText("Mazda 3 2023")).toBeInTheDocument();
    expect(screen.getByText("Laura Gómez")).toBeInTheDocument();
    expect(screen.getByText("Pedro Solís")).toBeInTheDocument();
  });

  it("renderiza pestaña recibo en estados pagado, cotizacion_generada, cotizacion_aceptada y pago_pendiente", async () => {
    const user = userEvent.setup();
    aceptarCotizacionUsuarioMock.mockResolvedValueOnce({});

    const { rerender } = render(<DetallesPasaporte {...baseProps} seccion="recibo" />);
    expect(screen.getByText("Pago registrado con éxito")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Exportar PDF" }));
    expect(window.print).toHaveBeenCalled();

    // Estado: cotizacion_generada
    rerender(
      <DetallesPasaporte
        {...baseProps}
        pasaporte={{ ...baseProps.pasaporte, estado: "cotizacion_generada" }}
        pagos={[]}
        seccion="recibo"
      />
    );
    expect(screen.getByText("Cotización lista para confirmación")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Aceptar cotización" }));
    await waitFor(() => {
      expect(aceptarCotizacionUsuarioMock).toHaveBeenCalledWith(expect.anything(), "t-100");
    });

    // Estado: cotizacion_aceptada sin expiración -> PagoTraslado
    rerender(
      <DetallesPasaporte
        {...baseProps}
        pasaporte={{ ...baseProps.pasaporte, estado: "cotizacion_aceptada", tipo_pago: "anticipado" }}
        pagos={[]}
        seccion="recibo"
      />
    );
    await user.click(screen.getByRole("button", { name: "Simular Pago Stripe" }));
    expect(actualizarRealtimeMock).toHaveBeenCalledWith({ pagoConfirmado: true });

    // PagoTraslado confirmado
    estadoRealtimeMock = { ...estadoRealtimeMock, pagoConfirmado: true };
    rerender(
      <DetallesPasaporte
        {...baseProps}
        pasaporte={{ ...baseProps.pasaporte, estado: "pago_pendiente" }}
        pagos={[]}
        seccion="recibo"
      />
    );
    expect(screen.getByText("Pago procesado correctamente")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Actualizar estado ahora" }));
    expect(refreshMock).toHaveBeenCalled();
  });
});

describe("AccionesRapidasPasaporte", () => {
  it("adapta CTA primario según estado, navega con teclado y hace scroll a secciones", async () => {
    const user = userEvent.setup();
    Element.prototype.scrollIntoView = vi.fn();

    render(
      <div>
        <AccionesRapidasPasaporte trasladoId="t-100" estado="cotizacion_generada" />
        <details>
          <summary>Acordeón</summary>
          <div id="reportes">
            <button type="button">Botón destino</button>
          </div>
        </details>
      </div>
    );

    expect(screen.getByRole("link", { name: "Aceptar cotización" })).toBeInTheDocument();
    const botonMas = screen.getByRole("button", { name: /Más/i });
    await user.click(botonMas);

    const menu = screen.getByRole("menu");
    expect(menu).toBeInTheDocument();

    fireEvent.keyDown(menu, { key: "ArrowDown" });
    fireEvent.keyDown(menu, { key: "ArrowUp" });
    fireEvent.keyDown(menu, { key: "End" });
    fireEvent.keyDown(menu, { key: "Home" });

    await user.click(screen.getByRole("menuitem", { name: /Reportar incidencia/i }));
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();

    // Cerrar con Escape
    await user.click(botonMas);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});
