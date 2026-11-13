/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { NuevoTrasladoDesktop } from "./NuevoTrasladoDesktop";
import { NuevoTrasladoForm } from "./NuevoTrasladoForm";
import { VALORES_INICIALES } from "./constants";
import type { useNuevoTraslado } from "./hooks/useNuevoTraslado";

const { controlador, pagoSubmit } = vi.hoisted(() => ({ controlador: vi.fn(), pagoSubmit: vi.fn() }));
vi.mock("./hooks/useNuevoTraslado", () => ({ useNuevoTraslado: controlador }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }), usePathname: () => "/viajes/nuevo", useSearchParams: () => new URLSearchParams() }));
vi.mock("./components/PasoTarifa", () => ({ PasoTarifa: () => <div>Formulario de tarifa</div> }));
vi.mock("./components/PasoVehiculo", () => ({ PasoVehiculo: () => <div>Formulario de vehículo</div> }));
vi.mock("./components/PasoRuta", () => ({ PasoRuta: () => <div>Formulario de ruta y contactos</div> }));
vi.mock("./components/PasoDetalles", () => ({ PasoDetalles: () => <div>Formulario de detalles</div> }));
vi.mock("./components/carga-masiva", () => ({ BottomSheetCargaMasiva: () => <div>Carga masiva</div> }));
vi.mock("./components/PasoPago", () => ({ PasoPago: ({ formId, onEstadoPago, pagoConfirmado }: { formId: string; onEstadoPago: (s: { listo: boolean; procesando: boolean }) => void; pagoConfirmado: boolean }) => {
  useEffect(() => onEstadoPago({ listo: true, procesando: false }), [onEstadoPago]);
  return pagoConfirmado ? <p>Pago confirmado por servidor</p> : <form id={formId} onSubmit={e => { e.preventDefault(); pagoSubmit(); }}><p>Formulario seguro de pago</p></form>;
} }));
type Estado = ReturnType<typeof useNuevoTraslado>;
function estado(cambios: Partial<Estado> = {}): Estado {
  return {
    paso: 0, datos: { ...VALORES_INICIALES, marca: "Toyota", modelo: "Corolla", condicion: "seminueva", origenCodigoPostal: "06700", destinoCodigoPostal: "11560" },
    estadoGuardado: "guardado", previsualizacion: { disponible: true, tarifa: 1250 }, previsualizando: false,
    rutaEstimacion: null, rutaCalculando: false, tarifaPreviaAceptada: true,
    accionesTarifa: { onContinuar: vi.fn() }, accionesDetalles: { enviarSolicitud: vi.fn() },
    setPaso: vi.fn(), setResultado: vi.fn(), setOrigenBusqueda: vi.fn(), setDestinoBusqueda: vi.fn(),
    avanzarPaso: vi.fn(), retrocederPaso: vi.fn(), reintentarCotizacion: vi.fn(),
    vehiculosGuardados: [], errores: {}, trasladoCreado: null, errorPaso: null, cargandoSesion: false,
    cotizacionAceptada: true, pagoConfirmado: false, verificandoPago: false, pagoEnProcesoConfirmacion: false,
    ...cambios,
  } as unknown as Estado;
}
afterEach(() => vi.unstubAllGlobals());
beforeEach(() => vi.clearAllMocks());

describe("Crear traslado desktop: flujo completo", () => {
  it.each([[0, "Conoce tu tarifa", "Formulario de tarifa"], [1, "Datos del vehículo", "Formulario de vehículo"], [2, "Origen y destino", "Formulario de ruta y contactos"], [3, "Detalles del servicio", "Formulario de detalles"]])("muestra el paso %s y sus controles reales", (paso, titulo, contenido) => {
    render(<NuevoTrasladoDesktop t={estado({ paso: paso as number })} />);
    expect(screen.getByRole("heading", { name: String(titulo) })).toBeInTheDocument();
    expect(screen.getByText(String(contenido))).toBeInTheDocument();
  });
  it("avanza por la aceptación de tarifa y bloquea importes inexistentes", () => {
    const t = estado();
    const { rerender } = render(<NuevoTrasladoDesktop t={t} />);
    fireEvent.click(screen.getByRole("button", { name: /Continuar.*1,250/ }));
    expect(t.accionesTarifa.onContinuar).toHaveBeenCalledTimes(1);
    rerender(<NuevoTrasladoDesktop t={{ ...t, previsualizacion: null }} />);
    expect(screen.getByRole("button", { name: "Tarifa pendiente" })).toBeDisabled();
    expect(screen.queryByText(/870.52|4.8 km|13 min|San Mateo Atenco/)).not.toBeInTheDocument();
  });
  it("reenvía al paso de tarifa cuando cambia la cotización aceptada", () => {
    const t = estado({ paso: 2, tarifaPreviaAceptada: false });
    render(<NuevoTrasladoDesktop t={t} />);
    fireEvent.click(screen.getByRole("button", { name: "Revisar tarifa" }));
    expect(t.setPaso).toHaveBeenCalledWith(0);
  });
  it("crea la solicitud desde detalles y bloquea dobles clics mientras envía", () => {
    const t = estado({ paso: 3 });
    const { rerender } = render(<NuevoTrasladoDesktop t={t} />);
    fireEvent.click(screen.getByRole("button", { name: /Continuar al pago/ }));
    expect(t.accionesDetalles.enviarSolicitud).toHaveBeenCalledTimes(1);
    rerender(<NuevoTrasladoDesktop t={{ ...t, enviando: true }} />);
    expect(screen.getByRole("button", { name: "Preparando pago…" })).toBeDisabled();
  });
  it("asocia el botón de pago al formulario de la solicitud creada", () => {
    render(<NuevoTrasladoDesktop t={estado({ paso: 4, trasladoCreado: { id: "traslado-1", precioCotizado: 1250, tipoPago: "anticipado" } })} />);
    const pagar = screen.getByRole("button", { name: /Pagar.*1,250/ });
    expect(pagar).toHaveAttribute("form", "pago-traslado-traslado-1");
    fireEvent.click(pagar);
    expect(pagoSubmit).toHaveBeenCalledTimes(1);
  });
  it("no ofrece otro cobro durante la confirmación del pago", () => {
    render(<NuevoTrasladoDesktop t={estado({ paso: 4, pagoEnProcesoConfirmacion: true, trasladoCreado: { id: "traslado-1", precioCotizado: 1250, tipoPago: "anticipado" } })} />);
    expect(screen.queryByRole("button", { name: /Pagar/ })).not.toBeInTheDocument();
  });
  it("permite reintentar una cotización fallida con su motivo visible", () => {
    const t = estado({ previsualizacion: { disponible: false, motivo: "Servicio temporalmente no disponible" } });
    render(<NuevoTrasladoDesktop t={t} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Servicio temporalmente no disponible");
    fireEvent.click(screen.getByRole("button", { name: "Reintentar cotización" }));
    expect(t.reintentarCotizacion).toHaveBeenCalledTimes(1);
  });
  it("monta una sola instancia del flujo al abrir desktop", () => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
    controlador.mockReturnValue(estado());
    render(<NuevoTrasladoForm />);
    expect(screen.getAllByText("Formulario de tarifa")).toHaveLength(1);
    expect(screen.getByLabelText("Barra superior de usuario")).toBeInTheDocument();
  });
});
