/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const obtenerMensajesMock = vi.fn();
const enviarMensajeMock = vi.fn();
const suscribirseAMensajesMock = vi.fn();
const crearLlamadaEnmascaradaMock = vi.fn();
const obtenerEstadoTrasladoRealtimeMock = vi.fn();
const obtenerUltimaUbicacionTrasladoMock = vi.fn();
const suscribirEstadoTrasladoMock = vi.fn();
const suscribirUbicacionTrasladoMock = vi.fn();

vi.mock("@ruum/api/services", () => ({
  obtenerMensajes: (...args: unknown[]) => obtenerMensajesMock(...args),
  enviarMensaje: (...args: unknown[]) => enviarMensajeMock(...args),
  suscribirseAMensajes: (...args: unknown[]) => suscribirseAMensajesMock(...args),
  crearLlamadaEnmascarada: (...args: unknown[]) => crearLlamadaEnmascaradaMock(...args),
  obtenerEstadoTrasladoRealtime: (...args: unknown[]) => obtenerEstadoTrasladoRealtimeMock(...args),
  obtenerUltimaUbicacionTraslado: (...args: unknown[]) => obtenerUltimaUbicacionTrasladoMock(...args),
  suscribirEstadoTraslado: (...args: unknown[]) => suscribirEstadoTrasladoMock(...args),
  suscribirUbicacionTraslado: (...args: unknown[]) => suscribirUbicacionTrasladoMock(...args),
}));

const tieneSupabaseMock = vi.fn(() => true);
const removeChannelMock = vi.fn();
vi.mock("@/lib/supabase-browser", () => ({
  tieneSupabaseConfigurado: () => tieneSupabaseMock(),
  crearClienteNavegador: () => ({ removeChannel: removeChannelMock }),
}));

vi.mock("./MapaPasaporte", () => ({
  MapaPasaporte: ({ onEta }: { onEta?: (eta: number | null) => void }) => (
    <button type="button" onClick={() => onEta?.(18)}>
      Mapa Mock
    </button>
  ),
}));

const inicializarMock = vi.fn();
const actualizarMock = vi.fn();
const cargarMensajesMock = vi.fn();
const agregarMensajeMock = vi.fn();
const limpiarMock = vi.fn();

let estadoRealtime = {
  mensajes: [] as Array<{ id: string; remitente: "usuario" | "conductor"; contenido: string; enviado_en: string; pendiente?: boolean }>,
  errorChat: null as string | null,
  llamando: false,
  errorLlamada: null as string | null,
  ubicacion: null as { lat: number; lng: number; registrado_en: string } | null,
  estadoRealtime: null as string | null,
  estadoActualizadoEn: null as string | null,
  cargando: false,
  inicializar: inicializarMock,
  actualizar: actualizarMock,
  cargarMensajes: cargarMensajesMock,
  agregarMensaje: agregarMensajeMock,
  limpiar: limpiarMock,
};

vi.mock("@/state/AppStateProvider", () => ({
  useTrasladoRealtime: () => estadoRealtime,
}));

import { ChatTraslado } from "./ChatTraslado";
import { SeguimientoTrasladoTiempoReal } from "./SeguimientoTrasladoTiempoReal";

describe("ChatTraslado", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Element.prototype.scrollTo = vi.fn();
    tieneSupabaseMock.mockReturnValue(true);
    estadoRealtime = {
      mensajes: [],
      errorChat: null,
      llamando: false,
      errorLlamada: null,
      ubicacion: null,
      estadoRealtime: null,
      estadoActualizadoEn: null,
      cargando: false,
      inicializar: inicializarMock,
      actualizar: actualizarMock,
      cargarMensajes: cargarMensajesMock,
      agregarMensaje: agregarMensajeMock,
      limpiar: limpiarMock,
    };
    obtenerMensajesMock.mockResolvedValue([
      { id: "m1", remitente: "conductor", contenido: "En camino", enviado_en: "2026-10-20T12:00:00Z" },
    ]);
    suscribirseAMensajesMock.mockImplementation((_c, _id, cb, opts) => {
      cb({ id: "m2", remitente: "conductor", contenido: "Llegué", enviado_en: "2026-10-20T12:05:00Z" });
      opts?.onError?.(new Error("ws drop"));
      return { topic: "chat" };
    });
  });

  it("carga mensajes, maneja suscripción, envío de mensajes, dedupe y llamadas enmascaradas", async () => {
    const user = userEvent.setup();
    enviarMensajeMock.mockResolvedValueOnce({});
    crearLlamadaEnmascaradaMock.mockResolvedValueOnce("+525500001111");

    const { rerender, unmount } = render(<ChatTraslado trasladoId="t-1" estado="traslado_en_curso" />);

    await waitFor(() => {
      expect(cargarMensajesMock).toHaveBeenCalled();
      expect(agregarMensajeMock).toHaveBeenCalledWith(expect.objectContaining({ id: "m2" }));
    });

    // Enviar mensaje válido
    const input = screen.getByRole("textbox");
    await user.type(input, "Hola conductor{Enter}");
    await waitFor(() => {
      expect(enviarMensajeMock).toHaveBeenCalledWith(expect.anything(), "t-1", "Hola conductor");
    });

    // Rate limit inmediato (<1.5s)
    await user.type(input, "Segundo mensaje rápido{Enter}");
    expect(actualizarMock).toHaveBeenCalledWith({
      errorChat: "Envía un mensaje a la vez. Espera un segundo antes del siguiente.",
    });

    // Llamada enmascarada
    await user.click(screen.getByRole("button", { name: "Llamar" }));
    await waitFor(() => {
      expect(crearLlamadaEnmascaradaMock).toHaveBeenCalledWith(expect.anything(), "t-1");
    });

    // Dedupe de mensaje pendiente cuando llega el real
    const ahoraIso = new Date().toISOString();
    estadoRealtime = {
      ...estadoRealtime,
      mensajes: [
        { id: "optimistic-1", remitente: "usuario", contenido: "Hola", enviado_en: ahoraIso, pendiente: true },
        { id: "real-1", remitente: "usuario", contenido: "Hola", enviado_en: ahoraIso },
      ],
    };
    rerender(<ChatTraslado trasladoId="t-1" estado="traslado_en_curso" />);
    expect(actualizarMock).toHaveBeenCalledWith({
      mensajes: [{ id: "real-1", remitente: "usuario", contenido: "Hola", enviado_en: ahoraIso }],
    });

    unmount();
    expect(limpiarMock).toHaveBeenCalled();
  });

  it("muestra estado deshabilitado cuando el traslado está cerrado o sin Supabase", () => {
    tieneSupabaseMock.mockReturnValue(false);
    const { rerender } = render(<ChatTraslado trasladoId="t-1" estado="traslado_en_curso" />);
    expect(actualizarMock).toHaveBeenCalledWith({
      errorChat: "Supabase no está configurado. El chat no está disponible.",
    });

    rerender(<ChatTraslado trasladoId="t-1" estado="servicio_cerrado" />);
    expect(screen.queryByRole("button", { name: "Llamar" })).not.toBeInTheDocument();
  });
});

describe("SeguimientoTrasladoTiempoReal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tieneSupabaseMock.mockReturnValue(true);
    obtenerEstadoTrasladoRealtimeMock.mockResolvedValue({
      estado: "traslado_en_curso",
      actualizado_en: "2026-10-20T14:00:00Z",
    });
    obtenerUltimaUbicacionTrasladoMock.mockResolvedValue({
      lat: 19.43,
      lng: -99.13,
      registrado_en: "2026-10-20T14:01:00Z",
    });
    suscribirEstadoTrasladoMock.mockImplementation((_c, _id, cb) => {
      cb({ estado: "llegada_a_destino", actualizado_en: "2026-10-20T15:00:00Z" });
      return {};
    });
    suscribirUbicacionTrasladoMock.mockImplementation((_c, _id, cb) => {
      cb({ lat: 19.44, lng: -99.14, registrado_en: "2026-10-20T15:01:00Z" });
      // Segunda llamada inmediata para ejercitar throttle de 5s
      cb({ lat: 19.45, lng: -99.15, registrado_en: "2026-10-20T15:01:01Z" });
      return {};
    });
  });

  it("suscribe estado y ubicación en tiempo real, calcula ETA y permite refrescar manualmente", async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <SeguimientoTrasladoTiempoReal
        trasladoId="t-1"
        estado="traslado_en_curso"
        origen={{ lat: 19.4, lng: -99.1 }}
        destino={{ lat: 20.5, lng: -100.3 }}
        ubicacionInicial={null}
      />
    );

    await waitFor(() => {
      expect(suscribirEstadoTrasladoMock).toHaveBeenCalled();
      expect(suscribirUbicacionTrasladoMock).toHaveBeenCalled();
    });

    await user.click(screen.getByRole("button", { name: "Mapa Mock" }));
    expect(screen.getByText(/ETA: 18 min/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Actualizar/i }));
    await waitFor(() => {
      expect(obtenerUltimaUbicacionTrasladoMock).toHaveBeenCalledWith(expect.anything(), "t-1");
    });

    act(() => {
      unmount();
    });
    expect(limpiarMock).toHaveBeenCalled();
  });
});
